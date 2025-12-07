'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import type { Database } from '@/types/supabase'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import Modal from '@/components/ui/Modal'
import { ArrowLeft, Camera, RotateCw } from 'lucide-react'
// AJOUT POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'

type Animal = Database['public']['Tables']['animaux']['Row']

export default function AdminModifierAnimalPage() {
    const params = useParams()
    const animalId = Array.isArray(params.id) ? params.id[0] : params.id as string;
    const router = useRouter()

    const [animal, setAnimal] = useState<Partial<Animal>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

    // CORRECTION : On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const fetchAnimal = async () => {
            if (!animalId) {
                setError("L'identifiant de l'animal est manquant dans l'URL.");
                setLoading(false);
                return;
            }
            setLoading(true)

            // Utilisation du client typé
            const { data, error } = await supabaseTyped
                .from('animaux')
                .select('*')
                .eq('id', animalId)
                .single()

            if (error || !data) {
                setError("Impossible de charger les informations de l'animal.")
                console.error(error)
            } else {
                const animalData = { ...data, date_naissance: data.date_naissance ? data.date_naissance.split('T')[0] : '' };
                setAnimal(animalData)
            }
            setLoading(false)
        }
        fetchAnimal()
    }, [animalId, supabaseTyped])

    useEffect(() => {
        let currentStream: MediaStream;
        const startStream = async () => {
            if (isCameraOpen && videoRef.current) {
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { exact: facingMode } }
                    });
                    setStream(currentStream);
                    videoRef.current.srcObject = currentStream;
                } catch (err) {
                    console.error("Erreur d'accès à la caméra:", err);
                    if (facingMode === 'environment') {
                        setFacingMode('user'); // Essayer l'autre caméra
                    } else {
                        setError("Impossible d'accéder à la caméra.");
                    }
                }
            }
        };
        startStream();
        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOpen, facingMode]);

    const handleChange = (field: keyof Animal, value: string | number | boolean | null) => {
        setAnimal(prev => ({ ...prev, [field]: value }))
    }

    const uploadPhoto = async (file: File) => {
        if (!animalId) return;
        setUploading(true);
        const filePath = `${animalId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage.from('photos_animaux').upload(filePath, file, { upsert: true });

        if (uploadError) {
            setError('Erreur lors du téléversement de la photo.');
            console.error(uploadError);
        } else {
            const { data } = supabase.storage.from('photos_animaux').getPublicUrl(filePath);
            const newPhotoUrl = data?.publicUrl;
            setAnimal(prev => ({ ...prev, photo_url: newPhotoUrl }));
            setSuccessMessage("Photo mise à jour !");
            setTimeout(() => setSuccessMessage(null), 2000);
        }
        setUploading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadPhoto(file);
        }
    };

    const openCamera = () => {
        setFacingMode('environment');
        setIsCameraOpen(true);
    };
    const closeCamera = () => setIsCameraOpen(false);
    const handleSwitchCamera = () => setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                await uploadPhoto(file);
            }
        }, 'image/png');
        closeCamera();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccessMessage(null)
        const updateData = { ...animal };
        if (updateData.date_naissance === '') { updateData.date_naissance = null; }
        delete updateData.id; // On ne met pas à jour l'ID

        // Utilisation du client typé pour l'update
        const { error: updateError } = await supabaseTyped
            .from('animaux')
            .update(updateData)
            .eq('id', animalId)

        setSaving(false)
        if (updateError) {
            setError("Erreur lors de la sauvegarde : " + updateError.message)
        } else {
            setSuccessMessage("Fiche de l'animal mise à jour avec succès !")
            setTimeout(() => { setSuccessMessage(null) }, 3000)
        }
    }

    if (loading) { return <EcranDeChargement texte="Chargement de la fiche..." /> }
    if (error && !animal.id) { return <p className="text-center mt-20 text-red-600">{error}</p> }

    return (
        <main className="max-w-2xl mx-auto p-6">
            <button onClick={() => router.back()} className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
            </button>
            <TitrePrincipal>Modifier la fiche de {animal.nom}</TitrePrincipal>

            <form onSubmit={handleSubmit} className="bg-[#FBEAEC] p-6 rounded shadow space-y-4 mt-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Nom</label>
                        <input type="text" value={animal.nom ?? ''} onChange={(e) => handleChange('nom', e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Espèce</label>
                        <select value={animal.espece ?? ''} onChange={(e) => handleChange('espece', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded bg-white">
                            <option value="">Sélectionnez une espèce</option>
                            <option value="chien">Chien</option>
                            <option value="chat">Chat</option>
                            <option value="cheval">Cheval</option>
                            <option value="vache">Vache</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Race</label>
                        <input type="text" value={animal.race ?? ''} onChange={(e) => handleChange('race', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Sexe</label>
                        <select value={animal.sexe ?? ''} onChange={(e) => handleChange('sexe', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded bg-white">
                            <option value="">Non défini</option>
                            <option value="mâle">Mâle</option>
                            <option value="femelle">Femelle</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Date de naissance</label>
                        <input type="date" value={animal.date_naissance ?? ''} onChange={(e) => handleChange('date_naissance', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                    </div>
                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Poids (kg)</label>
                        <input type="number" step="0.1" value={animal.poids ?? ''} onChange={(e) => handleChange('poids', e.target.value === '' ? null : parseFloat(e.target.value))} className="w-full p-2 border border-[#B05F63] rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="font-semibold text-[#6E4B42]">Stérilisé</label>
                        <input type="checkbox" checked={animal.sterilise ?? false} onChange={(e) => handleChange('sterilise', e.target.checked)} className="h-5 w-5 accent-[#B05F63]" />
                    </div>
                </div>

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Activité</label>
                    <input type="text" value={animal.activite ?? ''} onChange={(e) => handleChange('activite', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Photo</label>
                    <div className="flex flex-wrap gap-4 items-center">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B05F63] file:text-white hover:file:bg-[#6E4B42]" />
                        <button type="button" onClick={openCamera} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full text-sm font-semibold hover:bg-gray-700">
                            <Camera className="w-4 h-4" />
                            Prendre une photo
                        </button>
                    </div>
                    {uploading && <p className="text-sm text-gray-600 mt-2">Téléversement...</p>}
                    {animal.photo_url && (
                        <div className="mt-4">
                            <img src={animal.photo_url} alt="Photo de l'animal" className="h-32 rounded shadow object-cover" />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Antécédents</label>
                    <textarea value={animal.antecedents ?? ''} onChange={(e) => handleChange('antecedents', e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" rows={4} />
                </div>


                {error && <p className="text-red-600 bg-red-100 p-3 rounded">{error}</p>}
                {successMessage && <p className="text-green-800 bg-green-100 p-3 rounded">{successMessage}</p>}

                <div className="flex justify-end">
                    <button type="submit" disabled={saving || uploading} className="bg-[#B05F63] text-white font-semibold px-4 py-2 rounded hover:bg-[#6E4B42] disabled:bg-gray-400">
                        {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>

            {isCameraOpen && (
                <Modal onClose={closeCamera}>
                    <h2 className="text-lg font-bold mb-4">Prendre une photo</h2>
                    <div className="relative bg-black">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="mt-4 flex justify-center items-center gap-8">
                        <button onClick={handleSwitchCamera} className="p-3 bg-gray-500 text-white rounded-full shadow-lg" aria-label="Changer de caméra">
                            <RotateCw className="w-6 h-6" />
                        </button>
                        <button onClick={handleCapture} className="p-4 bg-red-500 rounded-full shadow-lg border-4 border-white" aria-label="Prendre la photo">
                            <Camera className="w-8 h-8 text-white" />
                        </button>
                        <div className="w-12 h-12"></div>
                    </div>
                </Modal>
            )}
        </main>
    )
}