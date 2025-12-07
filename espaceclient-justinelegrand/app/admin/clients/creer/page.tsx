'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TitrePrincipal from '@/components/ui/TitrePrincipal'
import { ArrowLeft } from 'lucide-react'

export default function CreerClientPage() {
    const router = useRouter()

    // États pour les champs du formulaire
    const [nom, setNom] = useState('')
    const [email, setEmail] = useState('')
    const [telephone, setTelephone] = useState('')
    const [adresse, setAdresse] = useState('')

    // États pour l'UI
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nom || !email) {
            setError('Le nom et l\'email du client sont obligatoires.')
            return
        }
        setSaving(true)
        setError(null)
        setSuccessMessage(null)

        const response = await fetch('/api/clients/creer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nom, email, telephone, adresse }),
        })

        const result = await response.json()
        setSaving(false)

        if (!response.ok) {
            setError(result.error || 'Une erreur est survenue.')
        } else {
            setSuccessMessage('Client créé avec succès ! Redirection...')
            setTimeout(() => {
                router.push('/admin/creer-rdv/creer')
            }, 2000)
        }
    }

    return (
        <main className="max-w-2xl mx-auto p-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-[#6E4B42] hover:underline mb-4 font-semibold"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
            </button>

            <TitrePrincipal>Créer un nouveau client</TitrePrincipal>

            <form onSubmit={handleSubmit} className="mt-6 bg-[#FBEAEC] p-8 rounded-lg shadow-md space-y-4">
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Nom complet</label>
                    <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Email (pour la connexion)</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Téléphone</label>
                    <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>
                <div>
                    <label className="block font-semibold text-[#6E4B42] mb-1">Adresse</label>
                    <textarea value={adresse} onChange={(e) => setAdresse(e.target.value)} rows={3} className="w-full p-2 border border-[#B05F63] rounded" />
                </div>

                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-[#B05F63] text-white font-semibold px-6 py-2 rounded hover:bg-[#6E4B42] transition disabled:bg-gray-400">
                        {saving ? 'Création en cours...' : 'Enregistrer le client'}
                    </button>
                </div>

                {error && <p className="text-red-600 text-center font-semibold mt-4">{error}</p>}
                {successMessage && <p className="text-green-600 text-center font-semibold mt-4">{successMessage}</p>}
            </form>
        </main>
    )
}

