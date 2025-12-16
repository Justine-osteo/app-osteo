'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// On utilise ton joli composant de chargement qu'on a utilisé ailleurs
import EcranDeChargement from '@/components/ui/EcranDeChargement'

export default function Home() {
    const router = useRouter()

    useEffect(() => {
        // Redirection automatique dès que la page se charge
        // On envoie vers '/mon-espace'. 
        // Si l'utilisateur n'est pas connecté, la protection de '/mon-espace' le renverra vers '/connexion'
        router.replace('/mon-espace')
    }, [router])

    return <EcranDeChargement texte="Lancement de l'application..." />
}