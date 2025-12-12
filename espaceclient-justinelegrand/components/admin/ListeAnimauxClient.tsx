'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/supabase'
import { Search, Calendar, User, FileText } from 'lucide-react'

// On s'assure que le type inclut bien les champs qu'on va utiliser
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

    // Calcul des animaux filtrés
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

    // Fonction utilitaire pour formater la date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Date inconnue'
        return new Date(dateString).toLocaleDateString('fr-FR')
    }

    return (
        <div className="mt-6">
            {/* --- FILTRES --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-[#F3D8DD] p-4 rounded-lg">
                <div>
                    <label htmlFor="client-filter" className="block font-semibold text-[#6E4B42] mb-2">Filtrer par client</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                            id="client-filter"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full p-2 pl-9 border border-[#B05F63] rounded bg-white focus:ring-2 focus:ring-[#B05F63] outline-none"
                        >
                            <option value="">Tous les clients</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>{client.nom}</option>
                            ))}
                        </select>
                    </div>
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
                            className="w-full p-2 pl-10 border border-[#B05F63] rounded focus:ring-2 focus:ring-[#B05F63] outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* --- LISTE DES ANIMAUX --- */}
            {animauxFiltres.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">Aucun animal trouvé pour cette recherche.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {animauxFiltres.map((animal) => (
                        <li
                            key={animal.id}
                            className="group border border-gray-100 p-4 rounded-xl bg-white shadow-sm hover:border-[#B05F63] hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => router.push(`/admin/animaux/${animal.id}`)}
                        >
                            <div className="flex items-start gap-4">
                                {/* 1. Joli Encadré Photo */}
                                <div className="shrink-0 pt-1">
                                    {animal.photo_url ? (
                                        <div className="w-16 h-16 rounded-full p-1 border-2 border-[#B05F63] shadow-sm bg-white">
                                            <img
                                                src={animal.photo_url}
                                                alt={animal.nom}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-full border-2 border-[#B05F63] bg-[#FBEAEC] flex items-center justify-center text-[#B05F63] font-bold text-xl shadow-sm">
                                            {animal.nom.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* 2. Informations Principales */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-lg text-[#6E4B42]">{animal.nom}</p>

                                        {/* Badge Sexe */}
                                        {animal.sexe && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${animal.sexe === 'M' ? 'bg-blue-100 text-blue-700' :
                                                    animal.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {animal.sexe === 'M' ? '♂ Mâle' : animal.sexe === 'F' ? '♀ Femelle' : animal.sexe}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 font-medium">
                                        {animal.espece} {animal.race && `• ${animal.race}`}
                                    </p>

                                    {/* Infos supplémentaires (Date naissance) */}
                                    <div className="flex items-center text-xs text-gray-500 mt-1 mb-2">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        <span>Né(e) le : {formatDate(animal.date_naissance)}</span>
                                    </div>

                                    {/* AJOUT : Antécédents COMPLETS */}
                                    {animal.antecedents && (
                                        <div className="flex items-start text-sm text-gray-700 mt-2 bg-red-50 p-3 rounded-md border border-red-100">
                                            <FileText className="w-4 h-4 mr-2 mt-0.5 text-[#B05F63] shrink-0" />
                                            {/* whitespace-pre-wrap permet de conserver les sauts de ligne */}
                                            <span className="italic whitespace-pre-wrap">
                                                {animal.antecedents}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Informations Propriétaire (Aligné à droite sur desktop) */}
                                <div className="hidden sm:block text-right border-l border-gray-100 pl-4 min-w-[140px] pt-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Propriétaire</p>
                                    <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-[#B05F63] transition-colors">
                                        {animal.clients?.nom || 'Sans client'}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}