'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import EcranDeChargement from '@/components/ui/EcranDeChargement'
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type ModificationAnimauxInsert = Database['public']['Tables']['modifications_animaux']['Insert']

export default function ModifierFicheAnimalPage() {
    const params = useParams()
    const router = useRouter()

    const id = useMemo(() => {
        const value = Array.isArray(params?.id) ? params.id[0] : params?.id
        return value ?? null
    }, [params])

    // --- États du formulaire ---
    const [nom, setNom] = useState('')
    const [race, setRace] = useState('')
    const [dateNaissance, setDateNaissance] = useState('')
    const [sexe, setSexe] = useState('')
    const [sterilise, setSterilise] = useState(false)
    const [poids, setPoids] = useState<number | ''>('')
    const [activite, setActivite] = useState('')
    const [antecedents, setAntecedents] = useState('')
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)

    // État pour savoir si l'utilisateur a modifié la photo manuellement
    // Cela empêche la BDD d'écraser la nouvelle photo si le composant se rafraîchit
    const [photoDirty, setPhotoDirty] = useState(false)

    // --- États de l'interface ---
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        if (!id) {
            setLoading(false)
            setError('ID de l’animal manquant.')
            return
        }

        const fetchAnimal = async () => {
            setLoading(true)
            console.log("📥 [FETCH] Chargement des données depuis la BDD...")

            const { data, error } = await supabaseTyped
                .from('animaux')
                .select('nom, race, date_naissance, sexe, sterilise, poids, activite, antecedents, photo_url')
                .eq('id', id)
                .single()

            if (error || !data) {
                console.error("Erreur fetch:", error)
                setError('Impossible de charger les informations de l’animal.')
            } else {
                setNom(data.nom)
                setRace(data.race ?? '')
                setDateNaissance(data.date_naissance ?? '')
                setSexe(data.sexe ?? '')
                setSterilise(data.sterilise ?? false)
                setPoids(data.poids ?? '')
                setActivite(data.activite ?? '')
                setAntecedents(data.antecedents ?? '')

                // SÉCURITÉ : On n'écrase la photo avec celle de la BDD que si 
                // l'utilisateur n'a pas déjà uploadé une nouvelle photo (photoDirty)
                if (!photoDirty) {
                    setPhotoUrl(data.photo_url ?? null)
                    console.log("🔄 [FETCH] Photo initialisée depuis BDD :", data.photo_url)
                } else {
                    console.log("🛡️ [FETCH] Photo BDD ignorée car l'utilisateur a déjà uploadé une image.")
                }
            }
            setLoading(false)
        }

        fetchAnimal()
        // Dépendance unique sur ID pour éviter les boucles
    }, [id])

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !id) return

        setUploading(true)
        setError(null)

        const fileExt = file.name.split('.').pop()
        const fileName = `${id}/${Date.now()}.${fileExt}`

        console.log("📤 [UPLOAD] Début upload vers 'photosanimaux':", fileName)

        const { error: uploadError } = await supabase.storage
            .from('photosanimaux')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            console.error("❌ [UPLOAD] Erreur:", uploadError)
            setError(`Erreur lors de l’upload: ${uploadError.message}`)
            setUploading(false)
            return
        }

        const { data } = supabase.storage
            .from('photosanimaux')
            .getPublicUrl(fileName)

        console.log("🔗 [UPLOAD] URL générée avec succès:", data?.publicUrl)

        if (data?.publicUrl) {
            setPhotoUrl(data.publicUrl)
            setPhotoDirty(true) // Marque la photo comme "modifiée par l'utilisateur"
        }

        setUploading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccessMessage(null)

        console.log("💾 [SUBMIT] Envoi des données. URL Photo finale :", photoUrl)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('Vous devez être connecté pour effectuer cette action.')
            setSaving(false)
            return
        }

        const { data: client, error: clientError } = await supabaseTyped
            .from('clients')
            .select('id')
            .eq('auth_id', user.id)
            .single()

        if (clientError || !client?.id) {
            setError("Erreur lors de l'identification du client.")
            setSaving(false)
            return
        }

        const modification: ModificationAnimauxInsert = {
            animal_id: id!,
            client_id: client.id,
            donnees: {
                nom,
                race,
                date_naissance: dateNaissance || null,
                sexe,
                sterilise,
                poids: poids === '' ? null : poids,
                activite,
                antecedents,
                photo_url: photoUrl,
            },
        }

        const { error: insertError } = await supabaseTyped
            .from('modifications_animaux')
            .insert(modification)

        setSaving(false)

        if (insertError) {
            console.error("Erreur insertion:", insertError)
            setError(`Erreur lors de l’envoi: ${insertError.message}`)
        } else {
            setSuccessMessage('Modification envoyée ! Elle sera examinée par votre ostéopathe.')
            setTimeout(() => {
                router.push(`/mon-espace/avec-menu/animal/${id}`)
            }, 3000)
        }
    }

    if (loading) {
        return <EcranDeChargement texte="Chargement du formulaire..." />
    }

    return (
        <div className="min-h-screen bg-[#FFF0F3]">
            <main className="max-w-2xl mx-auto p-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                </button>
                <TitrePrincipal>Modifier la fiche de {nom}</TitrePrincipal>

                <form onSubmit={handleSubmit} className="bg-[#FBEAEC] p-6 rounded shadow space-y-4 mt-4 border border-[#B05F63]/20">
                    {error && <p className="bg-red-200 text-red-800 p-3 rounded flex items-center gap-2">⚠️ {error}</p>}
                    {successMessage && <p className="bg-green-200 text-green-800 p-3 rounded flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {successMessage}</p>}

                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Nom</label>
                        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">Date de naissance</label>
                            <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                        </div>
                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">Sexe</label>
                            <select value={sexe} onChange={(e) => setSexe(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded">
                                <option value="">-- Sélectionnez --</option>
                                <option value="mâle">Mâle</option>
                                <option value="femelle">Femelle</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">Race</label>
                            <input type="text" value={race} onChange={(e) => setRace(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                        </div>
                        <div>
                            <label className="block font-semibold text-[#6E4B42] mb-1">Poids (kg)</label>
                            <input type="number" step="0.1" min="0" value={poids} onChange={(e) => { const value = e.target.value; setPoids(value === '' ? '' : Number(value)) }} className="w-full p-2 border border-[#B05F63] rounded" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={sterilise} onChange={(e) => setSterilise(e.target.checked)} className="h-5 w-5 accent-[#B05F63]" id="sterilise-checkbox" />
                        <label htmlFor="sterilise-checkbox" className="font-semibold text-[#6E4B42]">Stérilisé</label>
                    </div>

                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Activité</label>
                        <textarea value={activite} onChange={(e) => setActivite(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" placeholder="Ex: Sportif, promenades quotidiennes..." rows={2} />
                    </div>

                    <div>
                        <label className="block font-semibold text-[#6E4B42] mb-1">Antécédents</label>
                        <textarea value={antecedents} onChange={(e) => setAntecedents(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" rows={3} />
                    </div>

                    {/* Section Photo Améliorée */}
                    <div className="bg-white p-4 rounded border border-[#dcb0b6]">
                        <label className="block font-semibold text-[#6E4B42] mb-2">Photo de l’animal</label>

                        <div className="flex items-start gap-4">
                            {/* Prévisualisation */}
                            <div className="shrink-0 flex flex-col items-center gap-2">
                                {photoUrl ? (
                                    <>
                                        <img src={photoUrl} alt="Aperçu" className="h-24 w-24 object-cover rounded-lg shadow-sm border border-gray-200" />
                                        {photoDirty && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                Nouvelle
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                        <span className="text-xs text-center px-1">Aucune photo</span>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="flex-1">
                                <label className={`cursor-pointer inline-flex items-center gap-2 border px-4 py-2 rounded transition font-medium text-sm ${uploading
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white border-[#B05F63] text-[#B05F63] hover:bg-[#FBEAEC]'
                                    }`}>
                                    <Upload className="w-4 h-4" />
                                    {uploading ? 'Chargement en cours...' : 'Choisir une photo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadPhoto}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>

                                {/* Confirmation visuelle pour le testeur */}
                                {photoUrl && photoDirty && !uploading && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1 font-medium animate-pulse">
                                        <CheckCircle className="w-4 h-4" />
                                        Photo chargée et prête à l'envoi !
                                    </p>
                                )}

                                <p className="text-xs text-gray-500 mt-2">
                                    Formats acceptés : JPG, PNG.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end items-center pt-4">
                        <button
                            type="submit"
                            className="bg-[#B05F63] text-white font-semibold px-6 py-3 rounded hover:bg-[#6E4B42] disabled:bg-gray-400 transition shadow-sm flex items-center gap-2"
                            disabled={saving || uploading}
                        >
                            {saving ? 'Envoi en cours...' : 'Envoyer pour validation'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}