'use client'

import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'

interface EcranDeChargementProps {
    texte?: string
}

export default function EcranDeChargement({ texte = 'Chargement...' }: EcranDeChargementProps) {
    const [animationData, setAnimationData] = useState<any>(null)

    useEffect(() => {
        fetch('/lottie/chien-chargement.json')
            .then((res) => res.json())
            .then(setAnimationData)
    }, [])

    if (!animationData) {
        // Affiche un loader simple le temps que l'animation charge
        return (
            <main className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-[#f3d8dd] p-4 text-[#6E4B42]">
                <p className="font-charm text-xl font-semibold">{texte}</p>
            </main>
        )
    }

    return (
        <main
            style={{
                height: '100vh',
                backgroundColor: '#f3d8dd',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                color: '#6E4B42',
                fontFamily: 'Charm, cursive',
            }}
        >
            <div style={{ width: 300, height: 300 }}>
                <Lottie animationData={animationData} loop autoplay />
            </div>
            <p style={{ fontWeight: '600' }}>{texte}</p>
        </main>
    )
}