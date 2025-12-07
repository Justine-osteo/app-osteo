import { createServerSupabase } from '@/lib/supabase/server'
import ListeAnimauxClient from '@/components/admin/ListeAnimauxClient'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import Link from 'next/link'
import { Archive } from 'lucide-react'

// Cette page est un composant serveur. Elle récupère les données initiales.
export default async function ListeAnimauxPage() {
    const supabase = await createServerSupabase()

    // On récupère tous les animaux non archivés avec les informations de leur client
    const { data: animaux, error: animauxError } = await supabase
        .from('animaux')
        .select('*, clients(nom)')
        .eq('archive', false) // Ne charge que les animaux non archivés
        .order('nom', { ascending: true })

    // On récupère tous les clients non archivés pour le menu déroulant
    const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, nom')
        .eq('archive', false) // Ne charge que les clients non archivés
        .order('nom', { ascending: true })

    if (animauxError || clientsError) {
        return <p className="p-6 text-red-500">Erreur lors du chargement des données.</p>
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <TitrePrincipal>Liste des animaux</TitrePrincipal>
                {/* --- LIEN AJOUTÉ ICI --- */}
                <Link
                    href="/admin/archives"
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-gray-200 transition text-sm"
                >
                    <Archive className="w-4 h-4" />
                    Voir les archives
                </Link>
            </div>
            <ListeAnimauxClient
                initialAnimaux={animaux || []}
                initialClients={clients || []}
            />
        </div>
    )
}