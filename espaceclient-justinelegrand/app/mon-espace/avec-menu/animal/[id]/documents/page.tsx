'use client'

import { useParams, useRouter } from 'next/navigation'
import DocumentsManager from '@/components/DocumentsManager'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { ArrowLeft } from 'lucide-react'

export default function DocumentsPage() {
    const params = useParams()
    const router = useRouter()
    let animalId = params.id

    if (Array.isArray(animalId)) {
        animalId = animalId[0]
    }

    if (!animalId) {
        return <p className="text-center mt-8 text-red-600">Animal non trouvé.</p>
    }

    return (
        <main className="max-w-3xl mx-auto p-6">
            <button
                onClick={() => router.push(`/mon-espace/avec-menu/animal/${animalId}`)}
                className="flex items-center text-[#6E4B42] hover:underline mb-4"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la fiche de l’animal
            </button>

            <TitrePrincipal>Documents complémentaires</TitrePrincipal>

            <div className="mt-6">
                <DocumentsManager animalId={animalId} />
            </div>
        </main>
    )
}
