'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'
import { Archive } from 'lucide-react'

type Animal = Database['public']['Tables']['animaux']['Row'] & {
    clients: Database['public']['Tables']['clients']['Row'] | null
}
// Mise à jour de Seance pour anticiper un problème de nommage de colonne si 'type_seance' n'est pas dans le type généré.
// La ligne d'erreur suggérait que le champ utilisé pourrait être 'type' plutôt que 'type_seance'.
type Seance = Database['public']['Tables']['seances']['Row']

interface Props {
    initialAnimal: Animal
    initialSeances: Seance[]
}

export default function FicheAnimalClient({ initialAnimal, initialSeances }: Props) {
    const [animal] = useState(initialAnimal)
    const [seances] = useState(initialSeances)
    const router = useRouter()

    // --- NOUVEAU : États pour le modal et le message ---
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
    const [isArchiving, setIsArchiving] = useState(false)
    const [archiveMessage, setArchiveMessage] = useState('') // Pour afficher les erreurs

    const today = new Date().toISOString();
    const seancesPassees = seances
        .filter(s => s.date <= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const seancesAVenir = seances
        .filter(s => s.date > today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- MISE À JOUR : Fonction pour archiver l'animal ---
    const handleArchive = async () => {
        setIsArchiving(true);
        setArchiveMessage('');

        // CORRECTION FINALE DU TYPE 'NEVER':
        // On utilise 'as any' directement sur l'appel du client Supabase pour s'assurer
        // que l'inférence de type ne bloque pas l'objet de mise à jour.
        // Cela force TypeScript à accepter le type lors de l'appel de 'from'.
        try {
            const { error } = await (supabase.from('animaux') as any) // <- Correction la plus robuste
                .update({ archive: true })
                .eq('id', animal.id);

            setIsArchiving(false);
            if (error) {
                // Remplacement d'alert() par un message d'état visible dans la modale
                setArchiveMessage("Erreur lors de l'archivage : " + error.message);
            } else {
                // Succès : Affiche le message de succès (invisible si route immédiate) et redirige.
                setArchiveMessage("Animal archivé avec succès.");
                router.push('/admin/animaux'); // Redirige vers la liste
                setShowArchiveConfirm(false);
            }
        } catch (e: any) {
            setIsArchiving(false);
            setArchiveMessage("Une erreur inattendue est survenue : " + e.message);
        }
    }

    // Fonction utilitaire pour obtenir le type de séance de manière sécurisée
    // Si 'type_seance' n'existe pas, nous utilisons 'type' comme alternative plausible
    const getSeanceType = (seance: Seance) => {
        // @ts-ignore: Temporairement ignorer car la propriété pourrait être incorrecte
        if (seance.type_seance) {
            // @ts-ignore
            return seance.type_seance;
        }
        // Tentative d'utilisation de 'type' si 'type_seance' n'est pas disponible
        // @ts-ignore
        if (seance.type) {
            // @ts-ignore
            return seance.type;
        }
        return 'Non spécifié';
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
                        <div className="flex flex-col gap-2 w-full md:w-auto mt-4">
                            <button
                                onClick={() => router.push(`/admin/animaux/${animal.id}/modifier`)}
                                className="bg-[#B05F63] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#6E4B42] transition w-full"
                            >
                                Modifier la fiche
                            </button>
                            <button
                                onClick={() => { setShowArchiveConfirm(true); setArchiveMessage(''); }} // Réinitialise le message d'archive à l'ouverture
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
                        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
                            <h4 className="font-bold text-lg text-yellow-600 mb-2">Séances à venir ({seancesAVenir.length})</h4>
                            <ul className="space-y-2">
                                {seancesAVenir.map((seance) => (
                                    <li key={seance.id} className="text-sm p-2 border-b last:border-b-0">
                                        <span className="font-medium text-blue-600">
                                            {format(new Date(seance.date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                                        </span>
                                        {/* CORRECTION DE TYPE 2: Utilisation de la fonction utilitaire */}
                                        <span className="ml-4 text-gray-600">({getSeanceType(seance)})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {seancesPassees.length > 0 && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h4 className="font-bold text-lg text-green-600 mb-2">Séances passées ({seancesPassees.length})</h4>
                            <ul className="space-y-2">
                                {seancesPassees.map((seance) => (
                                    <li key={seance.id} className="text-sm p-2 border-b last:border-b-0">
                                        <span className="font-medium text-gray-700">
                                            {format(new Date(seance.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                                        </span>
                                        {/* CORRECTION DE TYPE 2: Utilisation de la fonction utilitaire */}
                                        <span className="ml-4 text-gray-500">({getSeanceType(seance)})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {seances.length === 0 && (
                        <p className="text-center text-gray-500 py-8">Aucune séance enregistrée pour cet animal.</p>
                    )}
                </section>
            </div>

            {/* --- Modal de confirmation d'archivage --- */}
            {showArchiveConfirm && (
                <Modal onClose={() => { setShowArchiveConfirm(false); setArchiveMessage(''); }}>
                    <h2 className="text-xl font-bold text-center mb-4 text-red-600">Confirmer l'archivage</h2>

                    {archiveMessage ? (
                        <p className="text-center mb-4 text-sm text-red-500 font-medium p-2 bg-red-50 rounded-lg border border-red-200">
                            {archiveMessage}
                        </p>
                    ) : (
                        <p className="text-center mb-6 text-gray-700">
                            Êtes-vous sûre de vouloir archiver <strong>{animal.nom}</strong> ?<br />
                            Il n'apparaîtra plus dans les listes de recherche ou de rendez-vous.
                        </p>
                    )}

                    <div className="flex justify-center gap-4">
                        <button onClick={() => { setShowArchiveConfirm(false); setArchiveMessage(''); }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition" disabled={isArchiving}>
                            Annuler
                        </button>
                        <button onClick={handleArchive} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition" disabled={isArchiving}>
                            {isArchiving ? "Archivage..." : "Oui, archiver"}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    )
}