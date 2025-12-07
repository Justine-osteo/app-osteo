'use client'

import Link from 'next/link'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { CheckCircle } from 'lucide-react'

export default function EmailConfirmedPage() {
    return (
        <main className="max-w-xl mx-auto p-6 mt-20 text-center">
            <div className="bg-white border border-green-300 p-8 rounded-lg shadow-md">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <TitrePrincipal>Changement d'email confirmé !</TitrePrincipal>
                <p className="text-gray-600 mt-4 mb-6">
                    Votre nouvelle adresse email a été validée avec succès. Vous pouvez maintenant vous connecter en l'utilisant.
                </p>
                <Link href="/connexion">
                    <span className="inline-block bg-[#B05F63] text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-[#6E4B42] transition cursor-pointer">
                        Se connecter
                    </span>
                </Link>
            </div>
        </main>
    )
}