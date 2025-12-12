'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import type { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { Calendar, FileText, Mail, MapPin, Phone, User, Activity } from 'lucide-react'

type AnimalBase = Database['public']['Tables']['animaux']['Row']

type Animal = AnimalBase & {
    clients: {
        nom: string
        email: string
        telephone?: string | null
        adresse?: string | null
    }
}

export default function FicheAnimalAdmin() {
    const router = useRouter()
    const params = useParams()
    const id = Array.isArray(params.id) ? params.id[0] : params.id

    const [animal, setAnimal] = useState<Animal | null>(null)
    const [loading, setLoading] = useState(true)
    const [remarques, setRemarques] = useState<string>('')

    const supabaseTyped = supabase as unknown as SupabaseClient<Database>

    useEffect(() => {
        const fetchAnimal = async () => {
            const { data, error } = await supabaseTyped
                .from('animaux')
                .select('*, clients (nom, email, telephone, adresse)')
                .eq('id', id!)
                .single()

            if (error) {
                console.error('Erreur chargement animal :', error)
            } else {
                setAnimal(data as unknown as Animal)
                setRemarques(data?.remarques ?? '')
            }
            setLoading(false)
        }

        if (id) fetchAnimal()
    }, [id, supabaseTyped])

    const handleRemarquesUpdate = async () => {
        if (!id) return

        const { error } = await supabaseTyped
            .from('animaux')
            .update({ remarques })
            .eq('id', id)

        if (error) console.error('Erreur lors de la mise à jour des remarques :', error)
    }

    // Fonction utilitaire pour formater la date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Date inconnue'
        return new Date(dateString).toLocaleDateString('fr-FR')
    }

    if (loading) return <div className="p-10 text-center text-[#B05F63] animate-pulse">Chargement de la fiche...</div>
    if (!animal) return <div className="p-10 text-center text-red-500">Animal introuvable</div>

    return (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto">

            {/* --- BARRE D'ACTIONS --- */}
            <div className="md:col-span-3 flex flex-wrap justify-end gap-3 mb-2">
                <button
                    onClick={() => router.push(`/admin/animaux/${id}/osteopathie/liste`)}
                    className="px-4 py-2 rounded-lg bg-white border border-[#B05F63] text-[#B05F63] hover:bg-[#FBEAEC] transition flex items-center gap-2 font-medium"
                >
                    🦴 Ostéopathie
                </button>
                <button
                    onClick={() => router.push(`/admin/animaux/${id}/nutrition`)}
                    className="px-4 py-2 rounded-lg bg-white border border-[#B05F63] text-[#B05F63] hover:bg-[#FBEAEC] transition flex items-center gap-2 font-medium"
                >
                    🍗 Nutrition
                </button>
                <button
                    onClick={() => router.push(`/admin/animaux/${id}/modifier`)}
                    className="px-4 py-2 rounded-lg bg-[#B05F63] text-white hover:bg-[#6E4B42] transition flex items-center gap-2 shadow-sm font-medium"
                >
                    ✏️ Modifier la fiche
                </button>
            </div>

            {/* --- COLONNE PRINCIPALE (ANIMAL) --- */}
            <div className="md:col-span-2 space-y-6">

                {/* Carte Identité */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">

                        {/* Photo */}
                        <div className="shrink-0 mx-auto sm:mx-0">
                            {animal.photo_url ? (
                                <div className="w-32 h-32 rounded-full p-1 border-4 border-[#B05F63] shadow-md bg-white">
                                    <img
                                        src={animal.photo_url}
                                        alt={animal.nom}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-[#B05F63] bg-[#FBEAEC] flex items-center justify-center text-[#B05F63] font-bold text-4xl shadow-md">
                                    {animal.nom.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 w-full text-center sm:text-left">
                            <TitrePrincipal>{animal.nom}</TitrePrincipal>

                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Espèce / Race</p>
                                    <p className="font-semibold">{animal.espece} - {animal.race}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Sexe</p>
                                    <p className="font-semibold">
                                        {animal.sexe === 'M' ? '♂ Mâle' : animal.sexe === 'F' ? '♀ Femelle' : animal.sexe}
                                        {animal.sterilise && ' (Stérilisé)'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Date de naissance</p>
                                    <div className="flex items-center justify-center sm:justify-start gap-1 font-semibold">
                                        <Calendar className="w-3 h-3 text-[#B05F63]" />
                                        {formatDate(animal.date_naissance)}
                                    </div>
                                </div>
                                {animal.activite && (
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Activité</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-1 font-semibold">
                                            <Activity className="w-3 h-3 text-[#B05F63]" />
                                            {animal.activite}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bloc Antécédents Médicaux */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#6E4B42] text-lg mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Antécédents Médicaux
                    </h3>
                    {animal.antecedents ? (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                            {animal.antecedents}
                        </div>
                    ) : (
                        <p className="text-gray-400 italic text-sm">Aucun antécédent noté.</p>
                    )}
                </div>

                {/* Bloc Remarques Internes */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <label htmlFor="remarques" className="block font-bold text-[#6E4B42] text-lg mb-3">
                        🔒 Remarques internes (Admin)
                    </label>
                    <textarea
                        id="remarques"
                        value={remarques}
                        onChange={(e) => setRemarques(e.target.value)}
                        onBlur={handleRemarquesUpdate}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#B05F63] focus:border-transparent outline-none transition"
                        placeholder="Notes visibles uniquement par les administrateurs..."
                    />
                </div>
            </div>

            {/* --- COLONNE CLIENT --- */}
            <div className="md:col-span-1">
                <div className="bg-[#F3D8DD] p-6 rounded-2xl shadow-sm text-[#6E4B42] sticky top-6">
                    <h2 className="font-charm text-2xl mb-4 flex items-center gap-2 border-b border-[#dcb0b6] pb-2">
                        <User className="w-6 h-6" />
                        Propriétaire
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase opacity-70 mb-1">Nom complet</p>
                            <p className="font-bold text-lg">{animal.clients.nom}</p>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase opacity-70 mb-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </p>
                            <a href={`mailto:${animal.clients.email}`} className="hover:underline break-all">
                                {animal.clients.email}
                            </a>
                        </div>

                        {animal.clients.telephone && (
                            <div>
                                <p className="text-xs font-semibold uppercase opacity-70 mb-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Téléphone
                                </p>
                                <a href={`tel:${animal.clients.telephone}`} className="hover:underline">
                                    {animal.clients.telephone}
                                </a>
                            </div>
                        )}

                        {animal.clients.adresse && (
                            <div>
                                <p className="text-xs font-semibold uppercase opacity-70 mb-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Adresse
                                </p>
                                <p>{animal.clients.adresse}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}