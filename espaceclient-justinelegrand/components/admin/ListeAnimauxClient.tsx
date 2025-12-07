'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/supabase'
import { Search } from 'lucide-react'

type Animal = Database['public']['Tables']['animaux']['Row'] & {
    clients: { nom: string } | null
}
type ClientOption = { id: string; nom: string }

export default function ListeAnimauxClient({
    initialAnimaux,
    initialClients,
}: {
    initialAnimaux: Animal[]
    initialClients: ClientOption[]
}) {
    const [animaux] = useState<Animal[]>(initialAnimaux)
    const [clients] = useState<ClientOption[]>(initialClients)
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState<string>('')

    const router = useRouter()

    // On utilise useMemo pour ne recalculer la liste filtrée que si nécessaire
    const animauxFiltres = useMemo(() => {
        return animaux.filter((animal) => {
            const animalNom = animal.nom?.toLowerCase() || ''
            const clientNom = animal.clients?.nom?.toLowerCase() || ''
            const filtre = searchTerm.toLowerCase()
            return (
                (!selectedClientId || animal.client_id === selectedClientId) &&
                (animalNom.includes(filtre) || clientNom.includes(filtre))
            )
        })
    }, [animaux, selectedClientId, searchTerm])

    return (
        <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label htmlFor="client-filter" className="block font-semibold text-[#6E4B42] mb-2">Filtrer par client</label>
                    <select
                        id="client-filter"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full p-2 border border-[#B05F63] rounded bg-white"
                    >
                        <option value="">Tous les clients</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>{client.nom}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="search-term" className="block font-semibold text-[#6E4B42] mb-2">Rechercher</label>
                    <div className="relative">
                        <input
                            id="search-term"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Nom de l'animal ou du client..."
                            className="w-full p-2 pl-10 border border-[#B05F63] rounded"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>

            {animauxFiltres.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">Aucun animal trouvé pour cette recherche.</p>
            ) : (
                <ul className="space-y-3">
                    {animauxFiltres.map((animal) => (
                        <li
                            key={animal.id}
                            className="border p-4 rounded-lg bg-white shadow-sm hover:bg-[#FBEAEC] hover:shadow-md transition cursor-pointer"
                            // --- MODIFICATION APPLIQUÉE ICI ---
                            // On redirige vers la nouvelle page "fiche"
                            onClick={() => router.push(`/admin/animaux/${animal.id}/fiche`)}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-[#6E4B42]">{animal.nom}</p>
                                    <p className="text-sm text-gray-600">{animal.espece} - {animal.race}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">{animal.clients?.nom}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}