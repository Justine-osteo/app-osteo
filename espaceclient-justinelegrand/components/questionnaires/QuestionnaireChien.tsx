'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Camera, UploadCloud, Loader, RefreshCcw, VideoOff, CheckCircle2, RotateCw, AlertCircle, Home } from 'lucide-react'

// --- Simulation de l'Environnement (pour la compilabilité) ---
const useRouter = () => ({
    push: (path: string) => { console.log(`[NAVIGATION] Vers ${path}`); }
});

const TitrePrincipal = ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-3xl font-extrabold text-[#B05F63] mb-6 text-center font-serif">{children}</h1>
);

const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50 backdrop-blur-sm transition-opacity duration-300">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative transform transition-all scale-100 overflow-y-auto max-h-[90vh]">
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            {children}
        </div>
    </div>
);

const MockImage = ({ alt }: { alt: string }) => (
    <div className="w-full bg-gray-100 border border-gray-300 rounded-lg p-4 text-center text-gray-500 italic text-sm">
        {alt} [Image of Score corporel chien]
        <div className="h-32 bg-gray-200 mt-2 rounded"></div>
    </div>
);

const supabase = {
    storage: {
        from: (bucketName: string) => ({
            upload: async (filePath: string, file: File, options: any) => {
                console.log(`[SUPABASE MOCK] Upload de ${file.name} vers ${bucketName}/${filePath}`);
                await new Promise(resolve => setTimeout(resolve, 500));
                return { error: null };
            },
            getPublicUrl: (filePath: string) => {
                const simulatedUrl = `https://fake-storage.com/${filePath}`;
                return { data: { publicUrl: simulatedUrl } };
            }
        })
    },
    from: (tableName: string) => ({
        upsert: async (data: any, options: any) => {
            console.log(`[SUPABASE MOCK] Upsert dans ${tableName}:`, data);
            return { error: null };
        },
        insert: async (data: any) => {
            console.log(`[SUPABASE MOCK] Insert dans modifications_en_attente:`, data);
            return { error: null, data: data };
        }
    })
};

// --- Types ---
type Reponses = Record<string, any>
type PreviewUrls = Record<string, string>

interface AnimalInfo {
    animal_id: string;
    nom?: string;
    race?: string | null;
    sexe?: string | null;
    date_naissance?: string | null;
    sterilise?: boolean | null;
    poids?: number | null;
}
interface Props {
    seanceId: string;
    animalNom: string;
    initialReponses: Reponses;
    animalInfo: AnimalInfo;
}
interface ComponentProps {
    children: React.ReactNode;
}
interface RenderInputProps {
    name: string;
    label: string;
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    type?: string;
    step?: string;
    rows?: number;
}

export default function QuestionnaireChien({ seanceId = "test-seance", animalNom = "Médor", initialReponses = {}, animalInfo }: Props) {
    const router = useRouter()

    // Initialisation
    const [reponses, setReponses] = useState<Reponses>(() => {
        const defaults = { ...initialReponses };

        // Pré-remplissage
        if (!defaults['nom']) defaults['nom'] = animalInfo?.nom || animalNom;
        if (animalInfo) {
            if (!defaults['race'] && animalInfo.race) defaults['race'] = animalInfo.race;
            if (!defaults['sexe'] && animalInfo.sexe) defaults['sexe'] = animalInfo.sexe.toLowerCase();
            if (!defaults['date_naissance'] && animalInfo.date_naissance) defaults['date_naissance'] = animalInfo.date_naissance;
            if (defaults['sterilise'] === undefined && animalInfo.sterilise !== undefined && animalInfo.sterilise !== null) defaults['sterilise'] = animalInfo.sterilise ? 'oui' : 'non';
            if (!defaults['poids_actuel'] && animalInfo.poids) defaults['poids_actuel'] = animalInfo.poids;
        }

        if (!defaults['activite']) defaults['activite'] = [];
        if (!defaults['mode_distribution']) defaults['mode_distribution'] = [];

        return defaults;
    })

    const [saving, setSaving] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)

    // --- NOUVEAU STATE POUR L'APERCU LOCAL ---
    const [localPreviews, setLocalPreviews] = useState<PreviewUrls>({});

    // --- GESTION AVANCÉE DE LA CAMÉRA ---
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false)
    const [currentPhotoField, setCurrentPhotoField] = useState<string | null>(null)
    const [uploadingField, setUploadingField] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');

    // 1. Énumérer les caméras
    useEffect(() => {
        if (isCameraOpen) {
            const getCameras = async () => {
                try {
                    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
                    setDevices(videoDevices);

                    if (videoDevices.length > 0) {
                        const backCamera = videoDevices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('arrière'));
                        setCurrentDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
                    } else {
                        setCameraError("Aucune caméra trouvée.");
                    }
                } catch (err) {
                    console.error("Erreur énumération caméras:", err);
                    setCameraError("Impossible de lister les caméras.");
                }
            };
            getCameras();
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    }, [isCameraOpen]);

    // 2. Démarrer le flux
    useEffect(() => {
        if (currentDeviceId && isCameraOpen) {
            const startStream = async () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
                setCameraError(null);

                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        video: { deviceId: { exact: currentDeviceId } }
                    });

                    setStream(newStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = newStream;
                        videoRef.current.play().catch(e => console.error("Erreur lecture vidéo:", e));
                    }
                } catch (err: any) {
                    console.error("Erreur accès caméra:", err);
                    setCameraError("Erreur d'accès à la caméra sélectionnée.");
                }
            };
            startStream();
        }
    }, [currentDeviceId, isCameraOpen]);

    // 3. Basculer de caméra
    const toggleCamera = () => {
        if (devices.length > 1) {
            const currentIndex = devices.findIndex((d: MediaDeviceInfo) => d.deviceId === currentDeviceId);
            const nextIndex = (currentIndex + 1) % devices.length;
            setCurrentDeviceId(devices[nextIndex].deviceId);
        }
    };

    // 4. Capturer
    const handleCapture = () => {
        if (!videoRef.current || !currentPhotoField) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob && currentPhotoField) {
                    const file = new File([blob], `capture-${currentPhotoField}-${Date.now()}.png`, { type: 'image/png' });
                    const localUrl = URL.createObjectURL(file);
                    setLocalPreviews(prev => ({ ...prev, [currentPhotoField]: localUrl }));
                    handleUploadAndSetPermanentUrl(file, currentPhotoField);
                } else {
                    setError("Erreur de conversion de l'image.");
                }
            }, 'image/png');
        }
        setIsCameraOpen(false);
    };

    const isFrontCamera = useMemo(() => {
        const device = devices.find((d: MediaDeviceInfo) => d.deviceId === currentDeviceId);
        if (!device) return false;
        const label = device.label.toLowerCase();
        return !label.includes('back') && !label.includes('arrière');
    }, [currentDeviceId, devices]);


    // Gestion des champs simples
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            const { checked } = (e.target as HTMLInputElement)
            if (name !== 'activite' && name !== 'mode_distribution') {
                setReponses(prev => ({ ...prev, [name]: checked ? 'oui' : 'non' }))
            }
        } else if (type === 'radio') {
            setReponses(prev => ({ ...prev, [name]: value }))
        } else if (type === 'number') {
            setReponses(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }))
        } else {
            setReponses(prev => ({ ...prev, [name]: value }))
        }
    }

    // Gestion des choix multiples (Activité et Distribution)
    const handleMultiCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const { value, checked } = e.target
        const currentValues = Array.isArray(reponses[field]) ? reponses[field] : []
        let newValues: string[]
        if (checked) {
            newValues = [...currentValues, value]
        } else {
            newValues = currentValues.filter((v: string) => v !== value)
        }
        setReponses(prev => ({ ...prev, [field]: newValues }))
    }

    // Gestion de l'upload de photos
    const handleUploadAndSetPermanentUrl = async (file: File, fieldName: string) => {
        setUploadingField(fieldName);
        setError(null);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${seanceId}_${fieldName}_${Date.now()}.${fileExtension}`;
        const filePath = `questionnaires/${seanceId}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('photos_animaux').upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error(uploadError);
                // Correction erreur TS : 'any' pour message
                setError("Erreur lors de l'envoi de la photo (Simulé). Détails: " + ((uploadError as any)?.message || "Erreur inconnue"));
            } else {
                const { data } = supabase.storage.from('photos_animaux').getPublicUrl(filePath);
                if (data?.publicUrl) {
                    setReponses(prev => ({ ...prev, [fieldName]: data.publicUrl }));
                } else {
                    setError("Erreur : URL publique non récupérée (Simulée).");
                }
            }
        } catch (e) {
            console.error("Exception upload:", e);
            setError("Erreur inattendue lors de l'upload.");
        } finally {
            setUploadingField(null);
            // Nettoyer l'URL locale après l'upload
            if (localPreviews[fieldName]) {
                URL.revokeObjectURL(localPreviews[fieldName]);
                setLocalPreviews(prev => {
                    const { [fieldName]: _, ...rest } = prev;
                    return rest;
                });
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);
            setLocalPreviews(prev => ({ ...prev, [fieldName]: localUrl }));
            handleUploadAndSetPermanentUrl(file, fieldName);
        }
    };

    // Fonction de retour
    const handleReturn = () => {
        router.push('/mon-espace');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true); setError(null); setSuccess(false);

        try {
            // Sauvegarde unique du questionnaire
            const dataToSave = {
                seance_id: seanceId,
                type: 'pre',
                reponses: reponses
            };

            const { error: upsertError } = await supabase.from('questionnaires').upsert(dataToSave, { onConflict: 'seance_id, type' })

            setSaving(false)
            if (upsertError) {
                setError("Erreur lors de la sauvegarde du questionnaire (Simulée).")
            } else {
                setSuccess(true)
                // Retour automatique après 2.5 secondes
                setTimeout(handleReturn, 2500)
            }
        } catch (err: any) {
            setSaving(false);
            const errorMessage = err.message || "Une erreur inconnue est survenue.";
            setError("Erreur inattendue lors de l'envoi : " + errorMessage);
            console.error("Erreur lors de l'envoi:", err);
        }
    }

    // Options pour l'activité (Chien)
    const ACTIVITE_OPTIONS = [
        "Moins d'une heure de balade par jour",
        "Plus d'une heure de balade par jour, sans laisse ou en longe",
        "Activité sportive : moins de 7h par semaine",
        "Activité sportive : plus de 7h par semaine",
        "Vie avec d'autres animaux : sessions de jeux quotidiennes"
    ];

    const DISTRIBUTION_OPTIONS = [
        "Gamelle",
        "Gamelle antiglouton",
        "Jeux / Plateau de recherche",
        "Tapis de fouille",
        "Jeté de croquettes"
    ];

    return (
        <main className="max-w-3xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
            <TitrePrincipal>Questionnaire Nutrition pour {reponses['nom'] || animalNom}</TitrePrincipal>
            <p className="text-gray-600 mb-8 text-center max-w-2xl mx-auto">Merci de remplir ce formulaire avec précision pour que je puisse établir le meilleur plan nutritionnel pour votre chien.</p>

            <form onSubmit={handleSubmit} className="bg-[#FBEAEC] p-6 sm:p-8 rounded-2xl shadow-xl space-y-10 border-t-4 border-[#B05F63]">

                {/* --- Généralités --- */}
                <section>
                    <SectionTitre>Généralités</SectionTitre>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RenderInput name="nom" label="Nom de l'animal" value={reponses['nom'] || animalNom} onChange={handleChange} />
                        <RenderInput name="race" label="Race" value={reponses['race']} onChange={handleChange} />

                        <RenderSelect name="sexe" label="Sexe" value={reponses['sexe']} onChange={handleChange}>
                            <option value="">-- Sélectionner --</option>
                            <option value="male">Mâle</option>
                            <option value="femelle">Femelle</option>
                        </RenderSelect>

                        <RenderInput name="date_naissance" label="Date de naissance" type="date" value={reponses['date_naissance']} onChange={handleChange} />

                        <div className="md:col-span-2 flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-[#F3D8DD] shadow-sm">
                            <span className="font-semibold text-[#6E4B42]">Stérilisé / Castré ?</span>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 text-[#6E4B42]"><input type="radio" name="sterilise" value="oui" onChange={handleChange} checked={reponses['sterilise'] === 'oui'} className="accent-[#B05F63]" /> Oui</label>
                                <label className="flex items-center gap-2 text-[#6E4B42]"><input type="radio" name="sterilise" value="non" onChange={handleChange} checked={reponses['sterilise'] === 'non'} className="accent-[#B05F63]" /> Non</label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Poids et État Corporel --- */}
                <section>
                    <SectionTitre>Poids et État Corporel</SectionTitre>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <RenderInput name="poids_actuel" label="Poids actuel (kg)" type="number" step="0.1" value={reponses['poids_actuel']} onChange={handleChange} />
                            <p className="text-xs text-gray-500 mt-1 italic pl-1">(Indispensable si chien croisé dont on ne connait pas le poids de fin de croissance)</p>
                        </div>
                        <div>
                            <RenderInput name="poids_fin_croissance" label="Son poids de fin de croissance" type="number" value={reponses['poids_fin_croissance']} onChange={handleChange} />
                            <p className="text-xs text-gray-500 mt-1 italic pl-1">Voir carnet - 1 an pour les races de -15 kg et 18 mois pour les +15kg</p>
                        </div>
                    </div>

                    <div className="mt-8 bg-white p-4 rounded-xl border border-[#F3D8DD] shadow-sm">
                        <label className="block font-semibold text-[#6E4B42] mb-2 text-lg">Palpation des côtes</label>
                        <p className="text-sm text-gray-600 mb-3">En passant les mains sur les côtes sans appuyer, sentez-vous les côtes ?</p>
                        <RenderSelect name="palpation_cotes" label="" value={reponses['palpation_cotes']} onChange={handleChange}>
                            <option value="">-- Précisez --</option>
                            <option value="pas_du_tout">Pas du tout</option>
                            <option value="un_peu">Un peu</option>
                            <option value="beaucoup">Beaucoup</option>
                        </RenderSelect>
                        <div className="flex justify-center mt-4">
                            <MockImage alt="Score corporel du chien" />
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { key: 'photo_profil', label: 'Photo de profil (debout)' },
                            { key: 'photo_dessus', label: 'Photo de dessus (debout)' }
                        ].map((photo) => {
                            const imageUrl = localPreviews[photo.key] || reponses[photo.key];
                            return (
                                <div key={photo.key} className="bg-white p-4 rounded-xl border border-[#F3D8DD] shadow-sm flex flex-col h-full">
                                    <label className="block font-semibold text-[#6E4B42] mb-3 text-center">{photo.label}</label>
                                    <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[150px] mb-4 overflow-hidden relative">
                                        {uploadingField === photo.key ? (
                                            <div className="flex flex-col items-center justify-center text-[#B05F63] p-4"><Loader className="animate-spin w-8 h-8 mb-2" /><span className="text-sm font-medium">Envoi en cours...</span></div>
                                        ) : imageUrl ? (
                                            <img src={imageUrl} alt={photo.label} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-400 flex flex-col items-center"><Camera className="w-8 h-8 mb-2 opacity-50" /><span className="text-xs">Aucune photo</span></div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, photo.key)} className="hidden" id={`file-${photo.key}`} disabled={uploadingField === photo.key} />
                                        <label htmlFor={`file-${photo.key}`} className={`cursor-pointer text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition duration-200 text-sm font-medium shadow-sm ${uploadingField === photo.key ? 'bg-gray-400' : 'bg-[#F3D8DD] text-[#6E4B42] hover:bg-[#E9C3C9]'}`}><UploadCloud className="w-4 h-4" /> Importer</label>
                                        <button type="button" onClick={() => { setCurrentPhotoField(photo.key); setIsCameraOpen(true); }} className="bg-[#B05F63] text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#8E3E42] transition duration-200 text-sm font-medium shadow-sm"><Camera className="w-4 h-4" /> Caméra</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* --- Niveau d'activité (Choix Multiples) --- */}
                <section>
                    <SectionTitre>Niveau d'activité</SectionTitre>
                    <p className="text-sm text-gray-600 mb-3 italic">Plusieurs choix possibles :</p>
                    <div className="space-y-2 bg-white p-5 rounded-xl border border-[#F3D8DD] shadow-sm">
                        {ACTIVITE_OPTIONS.map(option => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer py-2 px-2 hover:bg-gray-50 rounded-lg transition">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={(Array.isArray(reponses['activite']) ? reponses['activite'] : []).includes(option)}
                                    onChange={(e) => handleMultiCheckboxChange(e, 'activite')}
                                    className="accent-[#B05F63] w-5 h-5"
                                />
                                <span className="text-[#6E4B42]">{option}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-4">
                        <RenderInput name="type_activite_sportive" label="Précisions sur le type d'activité :" value={reponses['type_activite_sportive']} onChange={handleChange} />
                    </div>
                </section>

                {/* --- Pathologies --- */}
                <section>
                    <SectionTitre>Pathologies</SectionTitre>
                    <div className="space-y-6">
                        <RenderTextarea name="pathologies_actuelles" label="Pathologies actuelles ou passées" value={reponses['pathologies_actuelles']} onChange={handleChange} />
                        <RenderTextarea name="traitements_en_cours" label="Traitements en cours (médicaments, compléments)" value={reponses['traitements_en_cours']} onChange={handleChange} />
                    </div>
                </section>

                {/* --- Alimentation Actuelle --- */}
                <section>
                    <SectionTitre>Alimentation Actuelle</SectionTitre>
                    <div className="space-y-6">
                        <RenderSelect name="type_alimentation" label="Type d'alimentation principal" value={reponses['type_alimentation']} onChange={handleChange}>
                            <option value="">Sélectionnez...</option>
                            <option value="croquettes">Croquettes</option>
                            <option value="patee">Pâtée / Humide</option>
                            <option value="mixte">Mixte (croquettes + pâtée)</option>
                            <option value="ration_menagere">Ration ménagère</option>
                            <option value="barf">BARF</option>
                            <option value="autre">Autre</option>
                        </RenderSelect>

                        <RenderTextarea name="details_alimentation" label="Détails (Marque, Gamme, Quantité en g/jour)" value={reponses['details_alimentation']} onChange={handleChange} />
                        <RenderTextarea name="friandises" label="Friandises et à-côtés (lesquels et fréquence)" value={reponses['friandises']} onChange={handleChange} />
                        <RenderTextarea name="gouts_alimentaires" label="Goûts alimentaires (ce qu'il aime / ce qu'il n'aime pas)" value={reponses['gouts_alimentaires']} onChange={handleChange} />

                        {/* Changement récent */}
                        <div className="p-5 bg-white rounded-xl border border-[#F3D8DD] shadow-sm">
                            <label className="block font-semibold text-[#6E4B42] mb-3 text-lg">Avez-vous changé l'alimentation de votre chien récemment (moins d'un an) ?</label>
                            <div className="flex gap-6 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"><input type="radio" name="changement_recent" value="oui" onChange={handleChange} checked={reponses['changement_recent'] === 'oui'} className="accent-[#B05F63] w-5 h-5" /> <span className="font-medium">Oui</span></label>
                                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"><input type="radio" name="changement_recent" value="non" onChange={handleChange} checked={reponses['changement_recent'] === 'non'} className="accent-[#B05F63] w-5 h-5" /> <span className="font-medium">Non</span></label>
                            </div>
                            {reponses['changement_recent'] === 'oui' && (
                                <div className="space-y-4 mt-4 pl-4 border-l-4 border-[#B05F63] animate-fadeIn">
                                    <RenderTextarea name="raison_changement" label="Pourquoi ?" value={reponses['raison_changement']} onChange={handleChange} rows={2} />
                                    <RenderTextarea name="reussite_changement" label="Est-ce que le changement a été une réussite ?" value={reponses['reussite_changement']} onChange={handleChange} rows={2} />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* --- Mode de distribution (CORRECTION : CHOIX MULTIPLES & NOUVELLES OPTIONS) --- */}
                <section>
                    <SectionTitre>Mode de distribution</SectionTitre>
                    <p className="text-sm text-gray-600 mb-3 italic">Plusieurs choix possibles :</p>
                    <div className="space-y-2 bg-white p-5 rounded-xl border border-[#F3D8DD] shadow-sm">
                        {DISTRIBUTION_OPTIONS.map(option => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer py-2 px-2 hover:bg-gray-50 rounded-lg transition">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={(Array.isArray(reponses['mode_distribution']) ? reponses['mode_distribution'] : []).includes(option)}
                                    onChange={(e) => handleMultiCheckboxChange(e, 'mode_distribution')}
                                    className="accent-[#B05F63] w-5 h-5 cursor-pointer"
                                />
                                <span className="text-[#6E4B42]">{option}</span>
                            </label>
                        ))}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer py-1 hover:bg-gray-50 rounded transition">
                                <input
                                    type="checkbox"
                                    value="Autre"
                                    checked={(Array.isArray(reponses['mode_distribution']) ? reponses['mode_distribution'] : []).includes('Autre')}
                                    onChange={(e) => handleMultiCheckboxChange(e, 'mode_distribution')}
                                    className="accent-[#B05F63] w-5 h-5 cursor-pointer"
                                />
                                <span className="text-[#6E4B42]"><span className="font-semibold">Autre</span>, précisez :</span>
                            </label>
                            {(Array.isArray(reponses['mode_distribution']) ? reponses['mode_distribution'] : []).includes('Autre') && (
                                <div className="mt-2 pl-8 animate-fadeIn">
                                    <input type="text" name="distribution_autre" value={reponses['distribution_autre'] || ''} onChange={handleChange} className="w-full p-3 border border-[#B05F63] rounded-lg focus:ring-2 focus:ring-[#B05F63] focus:border-transparent outline-none transition" />
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Troubles digestifs */}
                <section>
                    <SectionTitre>Troubles Digestifs</SectionTitre>
                    <div className="space-y-6">
                        <RenderInput name="frequence_selles" label="Fréquence des selles (par jour)" value={reponses['frequence_selles']} onChange={handleChange} />
                        <RenderInput name="aspect_selles" label="Aspect des selles (normales, molles, dures, couleur...)" value={reponses['aspect_selles']} onChange={handleChange} />
                        <RenderInput name="frequence_vomissements" label="Fréquence des vomissements (par semaine/mois)" value={reponses['frequence_vomissements']} onChange={handleChange} />
                        <RenderInput name="flatulences" label="Flatulences" value={reponses['flatulences']} onChange={handleChange} />
                    </div>
                </section>

                {/* --- Vos Attentes --- */}
                <section>
                    <SectionTitre>Vos Attentes</SectionTitre>
                    <div className="bg-white p-5 rounded-xl border border-[#F3D8DD] shadow-sm space-y-6">
                        <RenderTextarea name="attentes_particulieres" label="Attentes particulières" value={reponses['attentes_particulieres']} onChange={handleChange} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RenderInput name="budget_mensuel" label="Budget mensuel approximatif (€)" type="number" value={reponses['budget_mensuel']} onChange={handleChange} />
                            <RenderSelect name="mode_achat" label="Mode d'achat préféré" value={reponses['mode_achat']} onChange={handleChange}>
                                <option value="">Sélectionnez...</option>
                                <option value="veterinaire">Chez le vétérinaire</option>
                                <option value="animalerie">En animalerie</option>
                                <option value="internet">Sur internet</option>
                                <option value="supermarche">En supermarché</option>
                            </RenderSelect>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md animate-pulse flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-md space-y-3">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="text-green-700 font-bold text-lg">Merci ! Vos réponses ont bien été enregistrées.</p>
                                <p className="text-green-600 text-sm">Redirection automatique dans quelques instants...</p>
                            </div>
                        </div>
                        {/* Bouton de retour immédiat */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={handleReturn}
                                className="bg-green-600 text-white font-medium px-6 py-2 rounded-full shadow-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" /> Retour au Tableau de Bord
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-center pt-8 pb-4">
                    <button
                        type="submit"
                        disabled={saving || !!uploadingField || success} // Désactiver si l'upload est en cours ou succès
                        className="bg-[#B05F63] text-white font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:bg-[#8E3E42] hover:scale-105 active:scale-95 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
                    >
                        {(saving || !!uploadingField) && <Loader className="animate-spin w-5 h-5" />}
                        {(saving || !!uploadingField) ? 'Enregistrement...' : 'Envoyer mes réponses'}
                    </button>
                </div>
            </form>

            {/* Modal Caméra */}
            {isCameraOpen && (
                <Modal onClose={() => { setIsCameraOpen(false); setCameraError(null); }}>
                    <div className="text-center">
                        <h3 className="text-xl font-bold mb-4 text-[#6E4B42]">Prendre une photo</h3>
                        <div className="relative mb-4 rounded-lg overflow-hidden border-4 border-[#B05F63] aspect-video bg-black flex items-center justify-center">
                            {/* Ajout d'une transformation CSS pour retourner la vidéo si c'est la caméra avant */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                style={{ transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                            />
                            {/* Retrait du canvas car on le crée à la volée dans handleCapture */}

                            {!stream && !cameraError && <Loader className="animate-spin w-10 h-10 text-white/70" />}
                            {stream && <div className="absolute inset-0 border-4 border-white/50 rounded-lg pointer-events-none"></div>}
                        </div>
                        {cameraError && <div className="text-red-500 mb-4 font-medium flex items-center justify-center gap-2"><AlertCircle className='w-5 h-5' /> {cameraError}</div>}

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={toggleCamera}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full shadow hover:bg-gray-300 transition flex items-center gap-2 disabled:opacity-50"
                                title="Changer de caméra"
                                disabled={devices.length <= 1 || !!cameraError || !stream}
                            >
                                <RotateCw className="w-5 h-5" />
                                Changer ({devices.length})
                            </button>
                            <button
                                onClick={handleCapture}
                                className="bg-[#B05F63] text-white px-8 py-2 rounded-full font-bold shadow-md hover:bg-[#8E3E42] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={!stream || !!cameraError}
                            >
                                <Camera className="w-5 h-5" /> Déclencher
                            </button>
                        </div>
                        <p className='mt-2 text-xs text-gray-500'>Caméra actuelle : {currentFacingMode === 'environment' ? 'Arrière' : 'Avant'}</p>
                    </div>
                </Modal>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Charm:wght@400;700;bold&display=swap');
                
                body {
                  font-family: 'Inter', sans-serif;
                }
                
                .font-charm {
                    font-family: 'Charm', cursive;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </main>
    )
}

// --- Composants d'aide (Typage Corrigé) ---
const SectionTitre = ({ children }: ComponentProps) => ( // Correction du type 'children'
    <div className="mb-6 mt-8">
        <h2 className="text-2xl font-charm font-bold text-[#B05F63] inline-block border-b-4 border-[#F3D8DD] pb-1 px-2">{children}</h2>
    </div>
)

const RenderInput = ({ name, label, type = 'text', value, onChange, step }: RenderInputProps) => ( // Correction des types des props
    <div className="mb-4">
        <label htmlFor={name} className="block font-semibold text-[#6E4B42] mb-2 text-sm uppercase tracking-wide">{label}</label>
        <input type={type} name={name} id={name} value={value ?? ''} onChange={onChange} step={step} className="w-full p-3 border-2 border-[#F3D8DD] rounded-lg focus:ring-0 focus:border-[#B05F63] transition-colors duration-200 bg-white text-gray-800" />
    </div>
)

const RenderTextarea = ({ name, label, value, onChange, rows = 4 }: RenderInputProps) => ( // Utilisation du type RenderInputProps
    <div className="mb-4">
        <label htmlFor={name} className="block font-semibold text-[#6E4B42] mb-2 text-sm uppercase tracking-wide">{label}</label>
        <textarea name={name} id={name} value={value ?? ''} onChange={onChange} className="w-full p-3 border-2 border-[#F3D8DD] rounded-lg focus:ring-0 focus:border-[#B05F63] transition-colors duration-200 bg-white text-gray-800 resize-y" rows={rows} />
    </div>
)

const RenderSelect = ({ name, label, value, onChange, children }: RenderInputProps & ComponentProps) => ( // Ajout de ComponentProps pour 'children'
    <div className="mb-4">
        <label htmlFor={name} className="block font-semibold text-[#6E4B42] mb-2 text-sm uppercase tracking-wide">{label}</label>
        <div className="relative">
            <select name={name} id={name} value={value ?? ''} onChange={onChange} className="w-full p-3 border-2 border-[#F3D8DD] rounded-lg bg-white appearance-none focus:ring-0 focus:border-[#B05F63] transition-colors duration-200 cursor-pointer text-gray-800">
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#B05F63]">
                <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
        </div>
    </div>
)