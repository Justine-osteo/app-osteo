'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { CheckCircle } from 'lucide-react'
import AnnotationSquelette from '@/components/admin/AnnotationSquelette'
import Modal from '@/components/ui/Modal'

type Seance = Database['public']['Tables']['seances']['Row']
type Animal = Database['public']['Tables']['animaux']['Row']

type SeanceAvecAnimal = Seance & {
    animaux: Animal
}

type SectionKey =
    | 'motif'
    | 'observations'
    | 'mesures'
    | 'annotation'
    | 'observations_osteo'
    | 'recommandations'
    | 'suivi'
    | 'notes_admin'

type EditableSeanceKey = Extract<SectionKey, keyof Seance>

export default function RemplissageOsteo() {
    const { seanceId } = useParams()
    const router = useRouter()
    const [animal, setAnimal] = useState<Animal | null>(null)
    const [seance, setSeance] = useState<Seance | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentSection, setCurrentSection] = useState<SectionKey>('motif')
    const [date, setDate] = useState<string>('')
    const [showAntecedentsModal, setShowAntecedentsModal] = useState(false)

    // NOUVEAU : État pour l'URL signée
    const [signedAnnotationUrl, setSignedAnnotationUrl] = useState<string | null>(null)

    const [localFields, setLocalFields] = useState<Partial<Record<EditableSeanceKey, string>>>({})

    useEffect(() => {
        const fetchSeance = async () => {
            if (typeof seanceId !== 'string') return

            const { data, error } = await (supabase
                .from('seances') as any)
                .select('*, animaux(*)')
                .eq('id', seanceId)
                .maybeSingle()

            if (error || !data) {
                console.error('Erreur chargement séance :', error)
                setLoading(false)
                return
            }

            const typedData = data as SeanceAvecAnimal
            setSeance(typedData)
            setAnimal(typedData.animaux)
            setDate(typedData.date)
            setLocalFields({
                motif: typedData.motif ?? '',
                observations: typedData.observations ?? '',
                recommandations: typedData.recommandations ?? '',
                observations_osteo: typedData.observations_osteo ?? '',
                suivi: typedData.suivi ?? '',
                notes_admin: typedData.notes_admin ?? '',
            })

            // --- NOUVEAU : Charger l'URL signée si l'image existe ---
            if (typedData.annotation_squelette_url) {
                const filePath = `${seanceId}/annotation.png`
                const { data: signedData } = await supabase.storage
                    .from('annotations')
                    .createSignedUrl(filePath, 3600) // Valide 1 heure

                if (signedData) {
                    setSignedAnnotationUrl(signedData.signedUrl)
                }
            }

            setLoading(false)
        }

        fetchSeance()
    }, [seanceId])

    const handleUpdate = async (champ: keyof Seance, valeur: string | number | null) => {
        if (!seanceId || typeof seanceId !== 'string') return false

        const { error } = await (supabase
            .from('seances') as any)
            .update({ [champ]: valeur })
            .eq('id', seanceId)

        if (error) {
            console.error('Erreur update :', error)
            return false
        }

        setSeance((prev) => (prev ? { ...prev, [champ]: valeur } : prev))
        if (typeof valeur === 'string' && champ in localFields) {
            setLocalFields((prev) => ({ ...prev, [champ as EditableSeanceKey]: valeur }))
        }
        return true
    }

    const handleSaveAnnotation = async (dataUrl: string) => {
        if (!seanceId || typeof seanceId !== 'string') return

        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], `annotation_${seanceId}.png`, { type: 'image/png' })

        const filePath = `${seanceId}/annotation.png`

        const { error: uploadError } = await supabase.storage
            .from('annotations')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            console.error("Erreur d'upload de l'annotation:", uploadError)
            return
        }

        // --- NOUVEAU : Mettre à jour l'URL signée après sauvegarde ---
        const { data: signedData } = await supabase.storage
            .from('annotations')
            .createSignedUrl(filePath, 3600)

        if (signedData) {
            setSignedAnnotationUrl(signedData.signedUrl)
        }

        const { data: publicUrlData } = supabase.storage.from('annotations').getPublicUrl(filePath)
        const publicUrl = publicUrlData.publicUrl

        await handleUpdate('annotation_squelette_url', publicUrl)
    }

    if (loading) return <p className="text-center mt-8">Chargement de la séance...</p>
    if (!seance || !animal) return <p className="text-center mt-8">Animal introuvable</p>

    function SectionEditable({
        title,
        champ,
        rows = 4,
    }: {
        title: string
        champ: EditableSeanceKey
        rows?: number
    }) {
        const [valeur, setValeur] = useState(localFields[champ] ?? '')
        const [saving, setSaving] = useState(false)
        const [saved, setSaved] = useState(false)

        useEffect(() => {
            setValeur(localFields[champ] ?? '')
        }, [localFields, champ])

        const save = async () => {
            setSaving(true)
            const ok = await handleUpdate(champ, valeur)
            setSaving(false)
            if (ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        }

        return (
            <section className={currentSection === champ ? '' : 'hidden'}>
                <TitrePrincipal>{title}</TitrePrincipal>
                <textarea
                    value={valeur}
                    onChange={(e) => setValeur(e.target.value)}
                    className="w-full mt-2 border rounded p-3"
                    rows={rows}
                />
                <button
                    onClick={save}
                    disabled={saving}
                    className="mt-2 px-4 py-2 bg-[#B05F63] text-white rounded shadow hover:bg-[#6E4B42] flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? 'Enregistrement...' : saved ? (
                        <>
                            Enregistré <CheckCircle className="w-5 h-5" />
                        </>
                    ) : 'Enregistrer'}
                </button>
            </section>
        )
    }

    return (
        <main className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="bg-[#B05F63] p-4 rounded-lg text-white shadow grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h2 className="font-charm text-2xl text-white">{animal.nom}</h2>
                    <p>Espèce : {animal.espece ?? 'N/A'}</p>
                    <p>Race : {animal.race ?? 'N/A'}</p>
                    <p>Sexe : {animal.sexe ?? 'N/A'}</p>
                </div>
                <div>
                    <p>Activité : {animal.activite ?? 'N/A'}</p>
                    <p>Poids : {animal.poids ? `${animal.poids} kg` : 'N/A'}</p>
                    <p>Stérilisé : {animal.sterilise ? 'Oui' : 'Non'}</p>
                    <p>Naissance : {animal.date_naissance ? new Date(animal.date_naissance).toLocaleDateString('fr-FR') : 'N/A'}</p>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between">
                    <button
                        onClick={() => setShowAntecedentsModal(true)}
                        className="text-white underline hover:text-gray-200 transition mb-2"
                    >
                        Voir les antécédents
                    </button>
                    <div>
                        <label className="text-sm block">Date de séance :</label>
                        <input
                            type="date"
                            value={date.split('T')[0]}
                            onChange={(e) => {
                                setDate(e.target.value)
                                handleUpdate('date', e.target.value)
                            }}
                            className="bg-white text-[#6E4B42] rounded p-1"
                        />
                    </div>
                    <button
                        onClick={() => router.push(`/admin/animaux/${animal.id}/modifier`)}
                        className="mt-4 bg-white text-[#B05F63] px-3 py-2 rounded shadow hover:bg-[#F3D8DD] transition text-sm"
                    >
                        Modifier la fiche de l'animal
                    </button>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'motif', label: 'Motif' },
                    { key: 'observations', label: 'Observations' },
                    { key: 'mesures', label: 'Mesures' },
                    { key: 'annotation', label: 'Annotation Squelette' },
                    { key: 'observations_osteo', label: 'Observations ostéo' },
                    { key: 'recommandations', label: 'Recommandations' },
                    { key: 'suivi', label: 'Suivi' },
                    { key: 'notes_admin', label: 'Notes internes' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setCurrentSection(key as SectionKey)}
                        className={`px-3 py-2 text-sm rounded ${currentSection === key ? 'bg-[#B05F63] text-white' : 'bg-white text-[#6E4B42]'} border border-[#B05F63] transition`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <SectionEditable champ="motif" title="Motif de séance" />
            <SectionEditable champ="observations" title="Observations générales" rows={6} />
            <SectionEditable champ="observations_osteo" title="Observations ostéopathiques" rows={6} />
            <SectionEditable champ="recommandations" title="Recommandations" />
            <SectionEditable champ="suivi" title="Suivi" />
            <SectionEditable champ="notes_admin" title="Notes internes (admin)" />

            <section className={currentSection === 'annotation' ? '' : 'hidden'}>
                <TitrePrincipal>Annotation du squelette</TitrePrincipal>
                <p className="mb-4 text-sm text-gray-600">Dessinez directement sur le schéma pour indiquer les zones à traiter.</p>
                <AnnotationSquelette
                    espece={animal?.espece}
                    // MODIFIÉ : Utiliser l'URL signée en priorité
                    initialDrawingUrl={signedAnnotationUrl || seance.annotation_squelette_url}
                    onSave={handleSaveAnnotation}
                />
            </section>

            <section className={currentSection === 'mesures' ? '' : 'hidden'}>
                <TitrePrincipal>Mesures musculaires</TitrePrincipal>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["ant_droite", "ant_gauche", "post_droite", "post_gauche"].map((zone) => (
                        <div key={zone} className="space-y-2 bg-white p-3 rounded-md border">
                            <label className="block text-[#6E4B42] font-semibold capitalize">
                                {zone.replace('_', ' ')}
                            </label>
                            <input
                                type="number"
                                placeholder="Avant"
                                defaultValue={(seance as any)[`mesure_${zone}_avant`] ?? ''}
                                onBlur={(e) =>
                                    handleUpdate(
                                        `mesure_${zone}_avant` as keyof Seance,
                                        e.target.value ? parseFloat(e.target.value) : null
                                    )
                                }
                                className="w-full border p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Après"
                                defaultValue={(seance as any)[`mesure_${zone}_apres`] ?? ''}
                                onBlur={(e) =>
                                    handleUpdate(
                                        `mesure_${zone}_apres` as keyof Seance,
                                        e.target.value ? parseFloat(e.target.value) : null
                                    )
                                }
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    ))}
                </div>
            </section>

            {showAntecedentsModal && (
                <Modal onClose={() => setShowAntecedentsModal(false)}>
                    <h2 className="text-2xl font-charm text-[#6E4B42] mb-4">Antécédents de {animal.nom}</h2>
                    <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                        {animal.antecedents || 'Aucun antécédent renseigné.'}
                    </div>
                </Modal>
            )}
        </main>
    )
}