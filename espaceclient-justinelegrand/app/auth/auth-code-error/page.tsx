'use client'

import Link from 'next/link'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export default function AuthCodeErrorPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white border border-[#B05F63] rounded-xl shadow-lg p-8 text-center">

                <div className="flex justify-center mb-6">
                    <div className="bg-[#FBEAEC] p-4 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-[#B05F63]" />
                    </div>
                </div>

                <TitrePrincipal>Lien invalide ou expiré</TitrePrincipal>

                <div className="space-y-4 text-gray-600 mt-4">
                    <p>
                        Pour des raisons de sécurité, les liens de connexion ont une durée de vie très courte (quelques minutes) et ne sont utilisables qu'une seule fois.
                    </p>
                    <p className="text-sm">
                        Si vous avez attendu trop longtemps avant de cliquer, ou si vous avez cliqué plusieurs fois, le lien est désactivé.
                    </p>
                </div>

                <div className="mt-8">
                    <Link
                        href="/connexion"
                        className="inline-flex items-center gap-2 bg-[#B05F63] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#8E3E42] transition shadow-md w-full justify-center"
                    >
                        Demander un nouveau lien
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <p className="mt-6 text-xs text-gray-400">
                    Besoin d'aide ? Contactez directement votre ostéopathe.
                </p>
            </div>
        </main>
    )
}