'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import ProchainsRDV from '@/components/admin/ProchainsRDV'
import SousTitre from '@/components/ui/SousTitre'
import { supabase } from '@/lib/supabase/client'
import { PlusCircle, FileText, UserCheck, LogOut } from 'lucide-react'
import DashboardNotes from '@/components/admin/DashboardNotes'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ animaux: 0, satisfaction: 0 })
  const [prestationStats, setPrestationStats] = useState([
    { name: 'Ostéo', total: 0 },
    { name: 'Nutri', total: 0 },
  ])
  const [loadingStats, setLoadingStats] = useState(true)

  const supabaseTyped = supabase as unknown as SupabaseClient<Database>

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)

      const [animauxCountRes, avisDataRes, osteoCountRes, nutriCountRes] = await Promise.all([
        supabaseTyped
          .from('animaux')
          .select('*', { count: 'exact', head: true })
          .eq('archive', false),
        supabaseTyped
          .from('avis')
          .select('note'),
        supabaseTyped
          .from('seances')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'osteopathie'),
        supabaseTyped
          .from('seances')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'nutrition')
      ])

      let satisfaction = 0
      if (avisDataRes.data && avisDataRes.data.length > 0) {
        const totalNotes = avisDataRes.data.reduce((acc, avis) => acc + (avis.note ?? 0), 0)
        satisfaction = Math.round((totalNotes / (avisDataRes.data.length * 5)) * 100)
      }
      setStats({
        animaux: animauxCountRes.count ?? 0,
        satisfaction: satisfaction
      })

      setPrestationStats([
        { name: 'Ostéo', total: osteoCountRes.count ?? 0 },
        { name: 'Nutri', total: nutriCountRes.count ?? 0 },
      ])

      if (animauxCountRes.error || avisDataRes.error || osteoCountRes.error || nutriCountRes.error) {
        console.error("Erreur de chargement des statistiques")
      }

      setLoadingStats(false)
    }
    fetchStats()
  }, [supabaseTyped])

  return (
    <div className="p-6">
      <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
        <TitrePrincipal>Espace admin - Justine Legrand Ostéopathe animalier</TitrePrincipal>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/creer-rdv/creer"
            className="inline-flex items-center gap-2 bg-[#B05F63] text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-[#6E4B42] transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Nouveau RDV</span>
          </Link>
          <Link
            href="/admin/factures"
            className="inline-flex items-center gap-2 bg-white text-[#B05F63] border border-[#B05F63] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-[#FBEAEC] transition"
          >
            <FileText className="w-5 h-5" />
            <span className="hidden sm:inline">Factures</span>
          </Link>
          <Link
            href="/admin/validations"
            className="inline-flex items-center gap-2 bg-white text-[#B05F63] border border-[#B05F63] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-[#FBEAEC] transition"
          >
            <UserCheck className="w-5 h-5" />
            <span className="hidden sm:inline">Validations</span>
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-stone-500 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-stone-600 transition ml-2"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#FBEAEC] p-6 rounded shadow-md lg:col-span-2">
          <SousTitre>Prochains rendez-vous</SousTitre>
          <ProchainsRDV />
        </div>

        <div className="space-y-6">
          <div className="bg-[#FBEAEC] p-6 rounded shadow-md">
            <SousTitre>Pense-bête</SousTitre>
            <DashboardNotes />
          </div>

          <div className="bg-[#FBEAEC] p-6 rounded shadow-md">
            <SousTitre>Aperçu</SousTitre>
            {loadingStats ? (
              <p className="text-sm text-gray-600">Chargement des statistiques...</p>
            ) : (
              <ul className="space-y-2 text-[#6E4B42] text-lg">
                <li>{stats.animaux} animaux suivis</li>
                <li>Taux de satisfaction : {stats.satisfaction}%</li>
              </ul>
            )}
          </div>

          <div className="bg-[#FBEAEC] p-6 rounded shadow-md">
            <SousTitre>Répartition des prestations</SousTitre>
            {loadingStats ? (
              <p className="text-sm text-gray-600">Chargement...</p>
            ) : (
              <div style={{ width: '100%', height: 200 }} className="mt-4 text-sm">
                <ResponsiveContainer>
                  <BarChart data={prestationStats} layout="vertical" margin={{ right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D1A0A9" />
                    <XAxis type="number" stroke="#6E4B42" />
                    <YAxis dataKey="name" type="category" stroke="#6E4B42" width={50} />
                    <Tooltip
                      cursor={{ fill: '#F3D8DD' }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #B05F63', borderRadius: '8px' }}
                    />
                    <Bar dataKey="total" name="Total" fill="#B05F63" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}