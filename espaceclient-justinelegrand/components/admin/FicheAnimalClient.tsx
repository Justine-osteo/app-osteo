'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client' // Import pour l'archivage
import Modal from '@/components/ui/Modal' // Import pour la confirmation
import { Archive } from 'lucide-react' // Import de l'icône

type Animal = Database['public']['Tables']['animaux']['Row'] & {
    clients: Database['public']['Tables']['clients']['Row'] | null
}
type Seance = Database['public']['Tables']['seances']['Row']

interface Props {
    initialAnimal: Animal
    initialSeances: Seance[]
}

export default function FicheAnimalClient({ initialAnimal, initialSeances }: Props) {
    const [animal] = useState(initialAnimal)
    const [seances] = useState(initialSeances)
    const router = useRouter()

    // --- NOUVEAU : États pour le modal d'archivage ---
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)

    const today = new Date().toISOString();
    const seancesPassees = seances
        .filter(s => s.date <= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const seancesAVenir = seances
        .filter(s => s.date > today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- NOUVEAU : Fonction pour archiver l'animal ---
    const handleArchive = async () => {
        setIsArchiving(true);
        const { error } = await supabase
            .from('animaux')
            .update({ archive: true })
            .eq('id', animal.id);

        setIsArchiving(false);
        if (error) {
            alert("Erreur lors de l'archivage : " + error.message);
        } else {
            alert("Animal archivé avec succès.");
            router.push('/admin/animaux'); // Retourne à la liste des animaux
        }
        setShowArchiveConfirm(false);
    }

    return (
        <>
            <div className="space-y-8 mt-6">
                {/* Carte d'informations principales */}
                <section className="bg-white p-6 rounded-lg shadow-md border grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold text-[#6E4B42]">{animal.nom}</h2>
                        <p className="text-gray-600">
                            Propriétaire : <span className="font-semibold">{animal.clients?.nom || 'N/A'}</span>
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <p><strong>Espèce:</strong> {animal.espece || 'N/A'}</p>
                            <p><strong>Race:</strong> {animal.race || 'N/A'}</p>
                            <p><strong>Sexe:</strong> {animal.sexe || 'N/A'}</p>
                            <p><strong>Stérilisé:</strong> {animal.sterilise ? 'Oui' : 'Non'}</p>
                            <p><strong>Naissance:</strong> {animal.date_naissance ? format(new Date(animal.date_naissance), 'dd/MM/yyyy') : 'N/A'}</p>
                            <p><strong>Poids:</strong> {animal.poids ? `${animal.poids} kg` : 'N/A'}</p>
                            <p className="col-span-2"><strong>Activité:</strong> {animal.activite || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-between">
                        {animal.photo_url ? (
                            <img src={animal.photo_url} alt={`Photo de ${animal.nom}`} className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200" />
                        ) : (
                            <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                <span>Pas de photo</span>
                            </div>
                        )}
                        {/* --- MODIFICATION : Ajout d'un conteneur pour les boutons --- */}
                        <div className="flex flex-col gap-2 w-full md:w-auto mt-4">
                            <button
                                onClick={() => router.push(`/admin/animaux/${animal.id}/modifier`)}
                                className="bg-[#B05F63] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#6E4B42] transition w-full"
                            >
                                Modifier la fiche
                            </button>
                            {/* --- NOUVEAU : Bouton d'archivage --- */}
                            <button
                                onClick={() => setShowArchiveConfirm(true)}
                                className="flex items-center justify-center gap-2 bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition w-full"
                            >
                                <Archive className="w-4 h-4" />
                                Archiver
                            </button>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-lg shadow-md border">
                    <h3 className="text-xl font-bold text-[#6E4B42] mb-2">Antécédents & Remarques</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {animal.antecedents || 'Aucun antécédent renseigné.'}
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-[#6E4B42] mb-4">Historique des séances</h3>
                    {seancesAVenir.length > 0 && (
                        <div className="mb-6">
                            {/* ... (code des séances à venir inchangé) ... */}
                        </div>
                    )}
                    {seancesPassees.length > 0 && (
                        <div>
                            {/* ... (code des séances passées inchangé) ... */}
                        </div>
                    )}
                    {seances.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Aucune séance enregistrée pour cet animal.</p>
                    )}
                </section>
            </div>

            {/* --- NOUVEAU : Modal de confirmation d'archivage --- */}
            {showArchiveConfirm && (
                <Modal onClose={() => setShowArchiveConfirm(false)}>
                    <h2 className="text-xl font-bold text-center mb-4">Confirmer l'archivage</h2>
                    <p className="text-center mb-6">
                        Êtes-vous sûre de vouloir archiver <strong>{animal.nom}</strong> ?<br />
                        Il n'apparaîtra plus dans les listes de recherche ou de rendez-vous.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setShowArchiveConfirm(false)} className="bg-gray-300 px-4 py-2 rounded" disabled={isArchiving}>
                            Annuler
                        </button>
                        <button onClick={handleArchive} className="bg-red-600 text-white px-4 py-2 rounded" disabled={isArchiving}>
                            {isArchiving ? "Archivage..." : "Oui, archiver"}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    )
}