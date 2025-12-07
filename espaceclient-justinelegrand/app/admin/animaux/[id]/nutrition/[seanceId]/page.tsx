'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'
import EcranDeChargement from '@/components/ui/EcranDeChargement'

// --- Définition des Types ---

type Seance = Database['public']['Tables']['seances']['Row']
type Animal = Database['public']['Tables']['animaux']['Row']
type Analyse = Database['public']['Tables']['nutrition_analyses']['Row']
type Recommandation = Database['public']['Tables']['nutrition_recommandations']['Row']
type Questionnaire = Database['public']['Tables']['questionnaires']['Row']
type SeanceAvecAnimal = Seance & { animaux: Animal }

// Types pour les champs JSONB
type Besoins = {
    be?: string;
    proteines?: string;
    calcium?: string;
    phosphore?: string;
    ca_p?: string;
    lipides?: string;
    densite?: string;
}
type AnalyseData = {
    em?: string;
    rpc?: string;
    ca?: string;
    p?: string;
    epa_dha?: string;
    ca_p?: string;
    rpp?: string;
}
type RationData = {
    croquettes?: string;
    patee?: string;
}

// Clés pour la navigation par onglets
type SectionKey = 'questionnaire' | 'besoins' | 'actuelle' | 'recommandations' | 'notes_admin'

// --- Props pour les composants éditables ---
interface ChampJsonProps {
    data: any
    setData: (data: any) => void
    structure: Record<string, any>
    onSave: (dataToSave: any) => Promise<boolean>
    title: string
}
interface ChampTexteProps {
    title: string
    value: string
    setValue: (value: string) => void
    onSave: () => Promise<boolean>
    rows?: number
}

// --- COMPOSANT PRINCIPAL ---
export default function RemplissageNutrition() {
    // --- CORRECTION APPLIQUÉE ICI ---
    // On s'assure que seanceId est bien un string
    const params = useParams()
    const seanceId = Array.isArray(params.seanceId) ? params.seanceId[0] : params.seanceId as string;

    const router = useRouter()
    const [animal, setAnimal] = useState<Animal | null>(null)
    const [seance, setSeance] = useState<Seance | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentSection, setCurrentSection] = useState<SectionKey>('questionnaire')

    // --- États locaux pour les champs ---
    const [date, setDate] = useState<string>('')
    const [besoins, setBesoins] = useState<Besoins>({})
    const [objectifs, setObjectifs] = useState<string>('')
    const [notesAdmin, setNotesAdmin] = useState<string>('')

    // --- États pour les listes dynamiques ---
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
    const [analyses, setAnalyses] = useState<Analyse[]>([])
    const [recommandations, setRecommandations] = useState<Recommandation[]>([])

    // --- Structures de données pour les formulaires JSON ---
    const structureBesoins: Besoins = { be: "", proteines: "", calcium: "", phosphore: "", ca_p: "", lipides: "", densite: "" }
    const structureAnalyseData: AnalyseData = { em: "", rpc: "", ca: "", p: "", epa_dha: "", ca_p: "", rpp: "" }
    const structureRationData: RationData = { croquettes: "", patee: "" }

    // --- Chargement des données ---
    useEffect(() => {
        const fetchSeanceData = async () => {
            if (typeof seanceId !== 'string') return
            setLoading(true)

            // 1. Récupérer la séance et l'animal
            const { data: seanceData, error: seanceError } = await supabase
                .from('seances')
                .select('*, animaux(*)')
                .eq('id', seanceId)
                .single<SeanceAvecAnimal>()

            if (seanceError || !seanceData) {
                console.error('Erreur chargement séance :', seanceError)
                setLoading(false)
                return
            }
            setSeance(seanceData)
            setAnimal(seanceData.animaux)
            setDate(seanceData.date)
            setBesoins(seanceData.nutrition_besoins as Besoins || {})
            setObjectifs(seanceData.nutrition_objectifs || '')
            setNotesAdmin(seanceData.notes_admin || '')

            // 2. Récupérer les analyses, recommandations et le questionnaire
            const [analysesRes, recommandationsRes, questionnaireRes] = await Promise.all([
                supabase.from('nutrition_analyses').select('*').eq('seance_id', seanceId),
                supabase.from('nutrition_recommandations').select('*').eq('seance_id', seanceId),
                supabase.from('questionnaires').select('*').eq('seance_id', seanceId).eq('type', 'pre').maybeSingle()
            ])

            if (analysesRes.data) setAnalyses(analysesRes.data)
            if (recommandationsRes.data) setRecommandations(recommandationsRes.data)
            if (questionnaireRes.data) setQuestionnaire(questionnaireRes.data)

            setLoading(false)
        }
        fetchSeanceData()
    }, [seanceId])

    // --- Fonctions de sauvegarde ---
    const handleUpdateSeance = async (champ: keyof Seance, valeur: any) => {
        if (!seanceId) return false
        const { error } = await supabase.from('seances').update({ [champ]: valeur }).eq('id', seanceId)
        if (error) {
            console.error('Erreur update seance:', error)
            return false
        }
        return true
    }

    // --- Fonctions pour les listes dynamiques ---
    const addAnalyse = async () => {
        if (!seanceId) return; // --- CORRECTION : Ajout d'un garde
        const { data, error } = await supabase
            .from('nutrition_analyses')
            .insert({ seance_id: seanceId, type_aliment: 'Nouveau', analyse_data: structureAnalyseData })
            .select()
            .single()
        if (data) setAnalyses([...analyses, data])
    }
    const deleteAnalyse = async (id: string) => {
        await supabase.from('nutrition_analyses').delete().eq('id', id)
        setAnalyses(analyses.filter(a => a.id !== id))
    }

    const addRecommandation = async () => {
        if (!seanceId) return; // --- CORRECTION : Ajout d'un garde
        const { data, error } = await supabase
            .from('nutrition_recommandations')
            .insert({ seance_id: seanceId, titre: `Option ${recommandations.length + 1}`, analyse_data: structureAnalyseData, ration_data: structureRationData })
            .select()
            .single()
        if (data) setRecommandations([...recommandations, data])
    }
    const deleteRecommandation = async (id: string) => {
        await supabase.from('nutrition_recommandations').delete().eq('id', id)
        setRecommandations(recommandations.filter(r => r.id !== id))
    }

    // --- Rendu ---
    if (loading) return <EcranDeChargement texte="Chargement de la séance de nutrition..." />
    if (!seance || !animal) return <p className="text-center mt-8">Séance ou animal introuvable.</p>

    return (
        <main className="p-6 max-w-6xl mx-auto space-y-6">
            {/* En-tête (inchangé) */}
            <div className="bg-[#B05F63] p-4 rounded-lg text-white shadow grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <h2 className="font-charm text-2xl text-white">{animal.nom}</h2>
                    <p>Espèce : {animal.espece ?? 'N/A'}</p>
                    <p>Race : {animal.race ?? 'N/A'}</p>
                </div>
                <div>
                    <p>Sexe : {animal.sexe ?? 'N/A'}</p>
                    <p>Stérilisé : {animal.sterilise ? 'Oui' : 'Non'}</p>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between">
                    <div>
                        <label className="text-sm block">Date de séance :</label>
                        <input type="date" value={date.split('T')[0]}
                            onChange={(e) => {
                                setDate(e.target.value);
                                handleUpdateSeance('date', e.target.value);
                            }}
                            className="bg-white text-[#6E4B42] rounded p-1"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation (inchangée) */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: 'questionnaire', label: 'Questionnaire' },
                    { key: 'besoins', label: 'Besoins' },
                    { key: 'actuelle', label: 'Alim. Actuelle' },
                    { key: 'recommandations', label: 'Recommandations' },
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

            {/* --- Nouvelles Sections Dynamiques --- */}

            <section className={currentSection === 'questionnaire' ? '' : 'hidden'}>
                <TitrePrincipal>Réponses au Questionnaire Pré-Séance</TitrePrincipal>
                {!questionnaire ? (
                    <p className="text-gray-600">Aucun questionnaire n'a été trouvé pour cette séance.</p>
                ) : !questionnaire.reponses ? (
                    <p className="text-gray-600">Le client n'a pas encore rempli le questionnaire.</p>
                ) : (
                    <div className="bg-white p-4 rounded-md border space-y-3">
                        {Object.entries(questionnaire.reponses as Record<string, any>).map(([key, value]) => (
                            <div key={key} className="text-sm">
                                <p className="font-semibold text-gray-500">{key}</p>
                                <p className="text-gray-800 whitespace-pre-wrap">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className={currentSection === 'besoins' ? '' : 'hidden'}>
                <ChampJsonEditable
                    title="Besoins de l'animal"
                    data={besoins}
                    setData={setBesoins}
                    structure={structureBesoins}
                    onSave={(dataToSave) => handleUpdateSeance('nutrition_besoins', dataToSave)}
                />
            </section>

            <section className={currentSection === 'actuelle' ? '' : 'hidden'}>
                <TitrePrincipal>Analyse de l'alimentation actuelle</TitrePrincipal>
                {analyses.map((analyse, index) => (
                    <FormAnalyse
                        key={analyse.id}
                        analyse={analyse}
                        onSave={async (data) => {
                            const { error } = await supabase.from('nutrition_analyses').update(data).eq('id', analyse.id);
                            if (!error) {
                                setAnalyses(analyses.map(a => a.id === analyse.id ? data : a));
                                return true;
                            }
                            return false;
                        }}
                        onDelete={() => deleteAnalyse(analyse.id)}
                        structure={structureAnalyseData}
                    />
                ))}
                <button
                    onClick={addAnalyse}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-[#B05F63] border border-[#B05F63] rounded shadow hover:bg-[#FBEAEC] transition"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter un aliment à analyser
                </button>
            </section>

            <section className={currentSection === 'recommandations' ? '' : 'hidden'}>
                <ChampTexteEditable
                    title="Objectifs de la recommandation"
                    value={objectifs}
                    setValue={setObjectifs}
                    onSave={() => handleUpdateSeance('nutrition_objectifs', objectifs)}
                    rows={6}
                />
                {recommandations.map((reco, index) => (
                    <FormRecommandation
                        key={reco.id}
                        recommandation={reco}
                        onSave={async (data) => {
                            const { error } = await supabase.from('nutrition_recommandations').update(data).eq('id', reco.id);
                            if (!error) {
                                setRecommandations(recommandations.map(r => r.id === reco.id ? data : r));
                                return true;
                            }
                            return false;
                        }}
                        onDelete={() => deleteRecommandation(reco.id)}
                        structureAnalyse={structureAnalyseData}
                        structureRation={structureRationData}
                    />
                ))}
                <button
                    onClick={addRecommandation}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-[#B05F63] border border-[#B05F63] rounded shadow hover:bg-[#FBEAEC] transition"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter une option de recommandation
                </button>
            </section>

            <section className={currentSection === 'notes_admin' ? '' : 'hidden'}>
                <ChampTexteEditable
                    title="Notes internes (admin)"
                    value={notesAdmin}
                    setValue={setNotesAdmin}
                    onSave={() => handleUpdateSeance('notes_admin', notesAdmin)}
                    rows={10}
                />
            </section>

        </main>
    )
}

// --- SOUS-COMPOSANTS POUR LES FORMULAIRES ---
// (Ils restent inchangés mais sont nécessaires)

function FormAnalyse({ analyse, onSave, onDelete, structure }: { analyse: Analyse, onSave: (data: Analyse) => Promise<boolean>, onDelete: () => void, structure: AnalyseData }) {
    const [localAnalyse, setLocalAnalyse] = useState(analyse)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleChange = (field: keyof Analyse, value: any) => {
        setLocalAnalyse(prev => ({ ...prev, [field]: value }))
    }
    const handleJsonChange = (field: keyof AnalyseData, value: string) => {
        setLocalAnalyse(prev => ({
            ...prev,
            analyse_data: { ...(prev.analyse_data as AnalyseData), [field]: value }
        }))
    }

    const save = async () => {
        setSaving(true)
        const ok = await onSave(localAnalyse)
        setSaving(false)
        if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    }

    return (
        <div className="my-4 p-4 border rounded bg-white shadow-md relative">
            <button onClick={onDelete} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>

            <input type="text" placeholder="Type (ex: Croquettes)" value={localAnalyse.type_aliment || ''} onChange={(e) => handleChange('type_aliment', e.target.value)} className="w-full p-2 border rounded font-semibold text-lg mb-2" />
            <input type="text" placeholder="Nom de l'aliment" value={localAnalyse.nom_aliment || ''} onChange={(e) => handleChange('nom_aliment', e.target.value)} className="w-full p-2 border rounded mb-4" />

            <h4 className="font-semibold text-[#6E4B42]">Analyse des constituants</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {Object.keys(structure).map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                        <input
                            type="text"
                            value={(localAnalyse.analyse_data as AnalyseData)?.[key as keyof AnalyseData] || ''}
                            onChange={(e) => handleJsonChange(key as keyof AnalyseData, e.target.value)}
                            className="w-full mt-1 border rounded p-2"
                        />
                    </div>
                ))}
            </div>

            <h4 className="font-semibold text-[#6E4B42] mt-4">Conclusion</h4>
            <textarea
                value={localAnalyse.conclusion || ''}
                onChange={(e) => handleChange('conclusion', e.target.value)}
                className="w-full mt-2 border rounded p-3"
                rows={3}
            />

            <button onClick={save} disabled={saving} className="mt-4 px-4 py-2 bg-[#B05F63] text-white rounded shadow hover:bg-[#6E4B42] flex items-center gap-2 disabled:opacity-50">
                {saving ? '...' : saved ? (<>Enregistré <CheckCircle className="w-5 h-5" /></>) : 'Enregistrer'}
            </button>
        </div>
    )
}

function FormRecommandation({ recommandation, onSave, onDelete, structureAnalyse, structureRation }: { recommandation: Recommandation, onSave: (data: Recommandation) => Promise<boolean>, onDelete: () => void, structureAnalyse: AnalyseData, structureRation: RationData }) {
    const [localReco, setLocalReco] = useState(recommandation)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleChange = (field: keyof Recommandation, value: any) => {
        setLocalReco(prev => ({ ...prev, [field]: value }))
    }
    const handleAnalyseChange = (field: keyof AnalyseData, value: string) => {
        setLocalReco(prev => ({ ...prev, analyse_data: { ...(prev.analyse_data as AnalyseData), [field]: value } }))
    }
    const handleRationChange = (field: keyof RationData, value: string) => {
        setLocalReco(prev => ({ ...prev, ration_data: { ...(prev.ration_data as RationData), [field]: value } }))
    }

    const save = async () => {
        setSaving(true)
        const ok = await onSave(localReco)
        setSaving(false)
        if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    }

    return (
        <div className="my-6 p-4 border-2 border-[#B05F63] rounded-lg bg-white shadow-lg relative">
            <button onClick={onDelete} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>

            <input type="text" placeholder="Titre (ex: Option 1: ...)" value={localReco.titre || ''} onChange={(e) => handleChange('titre', e.target.value)} className="w-full p-2 border rounded font-semibold text-xl mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Les + (Avantages)</label>
                    <textarea value={localReco.avantages || ''} onChange={(e) => handleChange('avantages', e.target.value)} className="w-full mt-1 border rounded p-2" rows={4} />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Les - (Inconvénients)</label>
                    <textarea value={localReco.inconvenients || ''} onChange={(e) => handleChange('inconvenients', e.target.value)} className="w-full mt-1 border rounded p-2" rows={4} />
                </div>
            </div>

            <h4 className="font-semibold text-[#6E4B42] mt-4">Analyse des constituants (recommandés)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {Object.keys(structureAnalyse).map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                        <input
                            type="text"
                            value={(localReco.analyse_data as AnalyseData)?.[key as keyof AnalyseData] || ''}
                            onChange={(e) => handleAnalyseChange(key as keyof AnalyseData, e.target.value)}
                            className="w-full mt-1 border rounded p-2"
                        />
                    </div>
                ))}
            </div>

            <h4 className="font-semibold text-[#6E4B42] mt-4">Ration journalière</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {Object.keys(structureRation).map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">{key}</label>
                        <input
                            type="text"
                            value={(localReco.ration_data as RationData)?.[key as keyof RationData] || ''}
                            onChange={(e) => handleRationChange(key as keyof RationData, e.target.value)}
                            className="w-full mt-1 border rounded p-2"
                        />
                    </div>
                ))}
            </div>

            <label className="block font-semibold text-[#6E4B42] mb-1 mt-4">Budget mensuel</label>
            <input type="text" value={localReco.budget_mensuel || ''} onChange={(e) => handleChange('budget_mensuel', e.target.value)} className="w-full p-2 border rounded" />

            <label className="block font-semibold text-[#6E4B42] mb-1 mt-4">Mon avis</label>
            <textarea value={localReco.mon_avis || ''} onChange={(e) => handleChange('mon_avis', e.target.value)} className="w-full mt-1 border rounded p-2" rows={5} />

            <button onClick={save} disabled={saving} className="mt-4 px-4 py-2 bg-[#B05F63] text-white rounded shadow hover:bg-[#6E4B42] flex items-center gap-2 disabled:opacity-50">
                {saving ? '...' : saved ? (<>Enregistré <CheckCircle className="w-5 h-5" /></>) : 'Enregistrer cette option'}
            </button>
        </div>
    )
}

function ChampTexteEditable({ title, value, setValue, onSave, rows = 4 }: ChampTexteProps) {
    const [localValue, setLocalValue] = useState(value)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { setLocalValue(value) }, [value])

    const save = async () => {
        setSaving(true)
        const ok = await onSave()
        setSaving(false)
        if (ok) {
            setValue(localValue)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    return (
        <div>
            <TitrePrincipal>{title}</TitrePrincipal>
            <textarea
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="w-full mt-2 border rounded p-3"
                rows={rows}
            />
            <button
                onClick={save}
                disabled={saving}
                className="mt-2 px-4 py-2 bg-[#B05F63] text-white rounded shadow hover:bg-[#6E4B42] flex items-center gap-2 disabled:opacity-50"
            >
                {saving ? 'Enregistrement...' : saved ? (<>Enregistré <CheckCircle className="w-5 h-5" /></>) : 'Enregistrer'}
            </button>
        </div>
    )
}

function ChampJsonEditable({ data, setData, structure, onSave, title }: ChampJsonProps & { title: string }) {
    const [localData, setLocalData] = useState(data)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { setLocalData(data) }, [data])

    const handleChange = (path: string[], value: string | number) => {
        let newData = { ...localData }
        let current = newData
        path.forEach((key, index) => {
            if (index === path.length - 1) {
                current[key] = value
            } else {
                current[key] = { ...current[key] }
                current = current[key]
            }
        })
        setLocalData(newData)
    }

    const save = async () => {
        setSaving(true)
        const ok = await onSave(localData)
        setSaving(false)
        if (ok) {
            setData(localData)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    const renderForm = (obj: Record<string, any>, path: string[] = []) => {
        return Object.keys(obj).map(key => {
            const currentPath = [...path, key]
            const label = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
            const value = path.reduce((acc, k) => acc?.[k], localData)?.[key] ?? ''

            if (typeof obj[key] === 'object' && obj[key] !== null) {
                return (
                    <div key={key} className="my-4 p-4 border rounded bg-white/50">
                        <h4 className="font-semibold text-lg text-[#6E4B42] capitalize">{label}</h4>
                        {renderForm(obj[key], currentPath)}
                    </div>
                )
            }
            return (
                <div key={key} className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 capitalize">{label}</label>
                    <input
                        type={typeof obj[key] === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => handleChange(currentPath, e.target.value)}
                        className="w-full mt-1 border rounded p-2"
                    />
                </div>
            )
        })
    }

    return (
        <div>
            <TitrePrincipal>{title}</TitrePrincipal>
            {renderForm(structure)}
            <button
                onClick={save}
                disabled={saving}
                className="mt-4 px-4 py-2 bg-[#B05F63] text-white rounded shadow hover:bg-[#6E4B42] flex items-center gap-2 disabled:opacity-50"
            >
                {saving ? 'Enregistrement...' : saved ? (<>Enregistré <CheckCircle className="w-5 h-5" /></>) : 'Enregistrer la section'}
            </button>
        </div>
    )
}