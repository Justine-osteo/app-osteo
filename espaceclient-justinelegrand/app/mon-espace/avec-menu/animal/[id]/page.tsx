'use client'

import AnimalClient from '@/app/mon-espace/avec-menu/animal/AnimalClient'
import { useParams } from 'next/navigation'
import { AnimalIdSchema } from '@/zod/params'
import { AlertCircle } from 'lucide-react'

export default function AnimalPage() {
    const params = useParams()
    // Gestion sécurisée de l'ID (tableau ou string)
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id

    // Validation de l'ID avec Zod
    const parseResult = AnimalIdSchema.safeParse(rawId)

    if (!parseResult.success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF0F3] text-[#6E4B42]">
                <AlertCircle className="w-12 h-12 text-[#B05F63] mb-4" />
                <p className="text-lg font-semibold">Paramètre d'URL invalide.</p>
                <button
                    onClick={() => window.history.back()}
                    className="mt-4 text-sm underline hover:text-[#B05F63]"
                >
                    Retourner en arrière
                </button>
            </div>
        )
    }

    return <AnimalClient id={parseResult.data} />
}