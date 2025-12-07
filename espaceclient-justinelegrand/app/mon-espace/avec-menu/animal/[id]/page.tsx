'use client'

import AnimalClient from '@/app/mon-espace/avec-menu/animal/AnimalClient'
import { useParams } from 'next/navigation'
import { AnimalIdSchema } from '@/zod/params'

export default function AnimalPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id

    const parseResult = AnimalIdSchema.safeParse(rawId)

    if (!parseResult.success) {
        return (
            <p className="text-center mt-20 text-red-500 font-semibold">
                Paramètre ID invalide
            </p>
        )
    }

    return <AnimalClient id={parseResult.data} />
}
