import { redirect } from 'next/navigation'

export default function Home() {
    // Redirige automatiquement vers la page de connexion
    redirect('/connexion')
}
