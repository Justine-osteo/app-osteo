'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AnimalResume = {
    id: string
    nom: string
}

type MenuLateralProps = {
    animaux: AnimalResume[]
    animalActifId?: string // L'ID de l'animal est optionnel
}

export default function MenuLateralClient({ animaux, animalActifId }: MenuLateralProps) {
    const router = useRouter()

    return (
        <aside className="w-full md:w-1/4 bg-[#F3D8DD] text-[#6E4B42] rounded-lg p-4 space-y-4 shadow-md h-fit">
            <button
                onClick={() => router.push('/mon-espace')}
                className="text-sm text-[#6E4B42] underline hover:text-[#B05F63] font-semibold"
            >
                ← Retour à l'accueil
            </button>
            <h2 className="text-xl font-charm mt-2">Mes animaux</h2>
            <ul className="space-y-2">
                {animaux.map((animal) => (
                    <li key={animal.id} className={animal.id === animalActifId ? 'font-bold' : ''}>
                        <Link
                            href={`/mon-espace/avec-menu/animal/${animal.id}`}
                            className="hover:underline block"
                        >
                            {animal.nom}
                        </Link>
                    </li>
                ))}
            </ul>
            <hr className="my-4 border-[#B05F63]/50" />
            <ul className="space-y-2">
                <li>
                    <Link href="/mon-espace/avec-menu/factures" className="block hover:underline font-charm">
                        Mes factures
                    </Link>
                </li>
                <li>
                    <Link href="/mon-espace/avec-menu/avis" className="block hover:underline font-charm">
                        Laisser un avis
                    </Link>
                </li>
            </ul>
        </aside>
    )
}