'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Construction } from 'lucide-react'
import TitrePrincipal from '@/components/ui/TitrePrincipal'

export default function NutritionEnConstruction() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#FFF0F3]">
            <main className="max-w-3xl mx-auto p-6 text-center">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-[#6E4B42] hover:underline mb-8 font-semibold"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                </button>

                <div className="bg-[#FBEAEC] border border-[#B05F63] rounded-xl p-10 shadow-md">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-full shadow-inner">
                            <Construction className="w-16 h-16 text-[#B05F63]" />
                        </div>
                    </div>

                    <TitrePrincipal>Service Nutrition</TitrePrincipal>

                    <h2 className="text-xl font-bold text-[#6E4B42] mb-4 mt-2">
                        Bientôt disponible !
                    </h2>

                    <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                        Je travaille actuellement à la mise en place d'un suivi nutritionnel complet et personnalisé pour vos animaux.
                    </p>

                    <p className="text-gray-500 mt-6 italic">
                        Cette fonctionnalité sera accessible très prochainement.
                    </p>
                </div>
            </main>
        </div>
    )
}