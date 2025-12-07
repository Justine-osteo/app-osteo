'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import TitrePrincipal from '../ui/TitrePrincipal'

export default function LayoutClient({ children }: { children: ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#FAEEF0] font-['Open_Sans']">
            {/* Menu mobile (burger) */}
            <div className="md:hidden flex items-center justify-between bg-[#F3D8DD] px-4 py-3 shadow-md">
                <TitrePrincipal>Espace admin</TitrePrincipal>
                <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Ouvrir le menu">
                    {menuOpen ? <X className="text-[#6E4B42]" /> : <Menu className="text-[#6E4B42]" />}
                </button>
            </div>

            {/* Menu latéral */}
            <aside
                className={`${menuOpen ? 'block' : 'hidden'
                    } md:block w-full md:w-64 bg-[#F3D8DD] text-[#6E4B42] p-6 md:rounded-r-2xl shadow-md space-y-6`}
            >
                <h2 className="text-3xl font-charm hidden md:block">Admin</h2>
                <nav className="space-y-3 font-charm text-lg">
                    <Link href="/admin/dashboard" className="block hover:underline">
                        Tableau de bord
                    </Link>
                    <Link href="/admin/rdv" className="block hover:underline">
                        Rendez-vous
                    </Link>
                    <Link href="/admin/animaux" className="block hover:underline">
                        Animaux
                    </Link>
                    <Link href="/admin/suivis" className="block hover:underline">
                        Suivis
                    </Link>
                    <Link href="/admin/statistiques" className="block hover:underline">
                        Statistiques
                    </Link>
                    <Link href="/admin/archives" className="block hover:underline">
                        Archives
                    </Link>
                </nav>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
    )
}
