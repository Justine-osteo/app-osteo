'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
    Calendar,
    dateFnsLocalizer,
    SlotInfo,
    Event as RbcEvent,
    Views,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import Modal from '@/components/ui/Modal'
import type { Database } from '@/types/supabase'
import { Loader, X } from 'lucide-react'
// AJOUT POUR LE TYPAGE
import { SupabaseClient } from '@supabase/supabase-js'

const locales = { fr }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

type Animal = {
    id: string
    nom: string
    espece: string | null
}

type Seance = Database['public']['Tables']['seances']['Row'] & {
    animaux: {
        nom: string
        espece: string | null
        clients: { nom: string } | null
    } | null
}

type EventWithResource = RbcEvent & {
    id: string;
    resource: Seance
}

export default function PageRendezVousAdmin() {
    const [events, setEvents] = useState<EventWithResource[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState<{ open: boolean; slot?: SlotInfo; sel?: Seance }>({ open: false })
    const [animaux, setAnimaux] = useState<Animal[]>([])
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(Views.WEEK);

    // CORRECTION : On force le typage du client
    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        // Utilisation du client typé
        const { data } = await supabaseTyped
            .from('seances')
            .select('*, animaux!inner(*, clients(nom))')
            .eq('animaux.archive', false);

        if (data) {
            setEvents(
                data.map((r) => ({
                    id: r.id,
                    start: new Date(r.date),
                    end: addHours(new Date(r.date), 1),
                    allDay: false,
                    title: r.animaux?.nom || 'Sans animal',
                    resource: r as unknown as Seance, // Double cast pour assurer la compatibilité avec le type étendu
                }))
            );
        }
        setLoading(false);
    }, [supabaseTyped]);

    useEffect(() => {
        async function loadInitialData() {
            await fetchEvents();
            // Utilisation du client typé
            const { data: animauxData } = await supabaseTyped
                .from('animaux')
                .select('id, nom, espece')
                .eq('archive', false)
                .order('nom');

            if (animauxData) {
                // Casting manuel car le select partiel ne correspond pas exactement au Row complet
                setAnimaux(animauxData as unknown as Animal[])
            }
        }
        loadInitialData()
    }, [fetchEvents, supabaseTyped])

    const searchedEvents = useMemo(() => {
        if (!searchTerm) return [];
        const searchLower = searchTerm.toLowerCase();
        return events.filter(event => {
            const seance = event.resource as Seance;
            const animalNom = (seance.animaux?.nom || '').toLowerCase();
            const clientNom = (seance.animaux?.clients?.nom || '').toLowerCase();
            return animalNom.includes(searchLower) || clientNom.includes(searchLower);
        }).sort((a, b) => new Date(b.start!).getTime() - new Date(a.start!).getTime());
    }, [events, searchTerm]);

    const openNew = (slot: SlotInfo) => setModal({ open: true, slot, sel: undefined })
    const openEdit = (evt: RbcEvent) => setModal({ open: true, sel: (evt as EventWithResource).resource, slot: undefined })

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const date = formData.get('date') as string;
        const type = formData.get('type') as Database['public']['Enums']['type_seance'];
        const animal_id = formData.get('animal_id') as string;
        const motif = formData.get('motif') as string;
        const dataToSave = { date, type, animal_id, motif };

        if (modal.sel?.id) {
            await supabaseTyped.from('seances').update(dataToSave).eq('id', modal.sel.id)
        } else {
            await supabaseTyped.from('seances').insert(dataToSave)
        }

        setModal({ open: false })
        await fetchEvents();
    }

    const handleDelete = async () => {
        if (modal.sel?.id) {
            await supabaseTyped.from('seances').delete().eq('id', modal.sel.id);
            setModal({ open: false });
            setShowDeleteConfirm(false);
            await fetchEvents();
        }
    }

    const eventStyleGetter = (event: RbcEvent) => {
        const espece = ((event as EventWithResource).resource as Seance)?.animaux?.espece?.toLowerCase();
        return { style: { backgroundColor: espece === 'chien' ? '#F3D8DD' : espece === 'chat' ? '#D1A0A9' : '#B05F63', color: '#6E4B42', border: '1px solid #6E4B42' } }
    }

    const CustomEvent = ({ event }: { event: RbcEvent }) => {
        const seance = (event as EventWithResource).resource as Seance;
        const nom = seance.animaux?.nom ?? 'Animal inconnu'
        const heure = event.start ? format(new Date(event.start), 'HH:mm') : ''
        const type = seance.type === 'osteopathie' ? 'Ostéo' : 'Nutri'
        return (
            <div style={{ lineHeight: 1.2, fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 'bold' }}>{nom}</div>
                <div>{heure} - <span style={{ fontStyle: 'italic' }}>{type}</span></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <TitrePrincipal>Gestion des rendez-vous</TitrePrincipal>

            <div className="my-4">
                <input
                    type="text"
                    placeholder="Rechercher par nom d'animal ou de client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md p-2 border border-gray-300 rounded-md"
                />
            </div>

            {loading && <div className="flex justify-center items-center h-[75vh]"><Loader className="w-8 h-8 animate-spin text-[#B05F63]" /></div>}

            {!loading && searchTerm ? (
                <div>
                    <button onClick={() => setSearchTerm('')} className="flex items-center gap-2 text-sm text-[#B05F63] font-semibold mb-4 hover:underline">
                        <X className="w-4 h-4" />
                        Effacer la recherche et retourner au calendrier
                    </button>
                    <div className="space-y-3">
                        {searchedEvents.length > 0 ? searchedEvents.map(event => (
                            <button key={event.id} onClick={() => openEdit(event)} className="w-full text-left bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center gap-4 hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-[#6E4B42]">{(event.resource as Seance).animaux?.nom}</p>
                                    <p className="text-sm text-gray-500">Client: {(event.resource as Seance).animaux?.clients?.nom || 'N/A'}</p>
                                </div>
                                <p className="text-sm font-semibold">{format(new Date(event.start!), 'dd MMM yyyy, HH:mm', { locale: fr })}</p>
                            </button>
                        )) : <p>Aucun rendez-vous trouvé pour "{searchTerm}".</p>}
                    </div>
                </div>
            ) : !loading && (
                <div style={{ height: '75vh' }}>
                    <Calendar
                        localizer={localizer}
                        culture="fr"
                        events={events}
                        date={date}
                        view={view}
                        onNavigate={setDate}
                        onView={setView as any}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        step={30}
                        timeslots={2}
                        selectable
                        onSelectSlot={openNew}
                        onSelectEvent={openEdit}
                        eventPropGetter={eventStyleGetter}
                        components={{ event: CustomEvent }}
                        messages={{ next: "Suivant", previous: "Précédent", today: "Aujourd'hui", month: "Mois", week: "Semaine", day: "Jour" }}
                    />
                </div>
            )}

            {modal.open && (
                <Modal onClose={() => setModal({ open: false })}>
                    <form onSubmit={handleSave}>
                        <h2 className="text-xl font-charm font-bold text-[#6E4B42] mb-4">{modal.sel ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h2>
                        <label className="block mb-2 font-semibold text-sm">Animal :</label>
                        <select name="animal_id" defaultValue={modal.sel?.animal_id ?? ''} required className="border rounded w-full p-2 mb-4">
                            <option value="" disabled>Sélectionnez un animal</option>
                            {animaux.map((a) => (<option key={a.id} value={a.id}>{a.nom}</option>))}
                        </select>
                        <label className="block mb-2 font-semibold text-sm">Date & heure :</label>
                        <input name="date" type="datetime-local" defaultValue={format(modal.sel?.date ? new Date(modal.sel.date) : modal.slot?.start ?? new Date(), "yyyy-MM-dd'T'HH:mm")} required className="border rounded w-full p-2 mb-4" />
                        <label className="block mb-2 font-semibold text-sm">Type :</label>
                        <select name="type" defaultValue={modal.sel?.type || 'osteopathie'} required className="border rounded w-full p-2 mb-4">
                            <option value="osteopathie">Ostéopathie</option>
                            <option value="nutrition">Nutrition</option>
                        </select>
                        <label className="block mb-2 font-semibold text-sm">Motif :</label>
                        <textarea name="motif" defaultValue={modal.sel?.motif ?? ''} className="border rounded w-full p-2 mb-4" rows={2}></textarea>
                        <div className="flex justify-between items-center">
                            <button type="submit" className="bg-[#B05F63] text-white px-4 py-2 rounded hover:bg-[#6E4B42]">Enregistrer</button>
                            {modal.sel && (<button type="button" onClick={() => setShowDeleteConfirm(true)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800">Supprimer</button>)}
                        </div>
                    </form>
                </Modal>
            )}
            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(false)}>
                    <h2 className="text-xl font-bold text-center mb-4">Confirmer la suppression</h2>
                    <p className="text-center mb-6">Êtes-vous sûre de vouloir supprimer ce rendez-vous ? Cette action est irréversible.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setShowDeleteConfirm(false)} className="bg-gray-300 px-4 py-2 rounded">Annuler</button>
                        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">Oui, supprimer</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}