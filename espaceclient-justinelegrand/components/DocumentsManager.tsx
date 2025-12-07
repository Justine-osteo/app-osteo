'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import TitrePrincipal from '@/components/ui/TitrePrincipal'

type DocumentType = {
  id: string
  nom: string
  seance_id: null
  url: string
  animal_id: string | null
  client_id: string | null
}

type Props = {
  animalId: string
  seanceId?: string | null
}

export default function UploadDocumentForm({ animalId, seanceId = null }: Props) {
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUserAndClient() {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        setError('Utilisateur non connecté ou erreur de récupération')
        setLoadingUser(false)
        return
      }

      const userId = userData.user.id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('auth_id', userId)
        .single()

      if (clientError || !clientData) {
        setError("Aucun client associé à cet utilisateur.")
      } else {
        setClientId(clientData.id)
      }

      setLoadingUser(false)
    }

    fetchUserAndClient()
  }, [])

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('animal_id', animalId)
      .order('nom')

    if (error) {
      setError('Erreur lors du chargement des documents')
    } else {
      setDocuments(data || [])
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [animalId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file || !animalId || !clientId) {
      setError('Fichier, identifiant animal ou client manquant')
      return
    }

    const filePath = `${animalId}/${Date.now()}_${file.name}`
    setUploading(true)

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      setError('Erreur upload : ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)
    const publicUrl = urlData?.publicUrl

    if (!publicUrl) {
      setError("Impossible d'obtenir l'URL du document")
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('documents').insert([
      {
        nom: file.name,
        seance_id: null,
        url: publicUrl,
        animal_id: animalId,
        client_id: clientId,
      },
    ])

    if (insertError) {
      setError('Erreur insertion BDD : ' + insertError.message)
    } else {
      fetchDocuments()
    }

    setUploading(false)
    e.target.value = ''
  }

  if (loadingUser) return <p className="text-center mt-8">Chargement de l’utilisateur...</p>
  if (!clientId) return <p className="text-center mt-8">Utilisateur non connecté. Veuillez vous connecter.</p>

  return (
    <main className="max-w-3xl mx-auto p-6">

      <div className="mt-6 p-4 border border-[#B05F63] rounded bg-[#FBEAEC] text-[#6E4B42]">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="mb-3 w-full"
        />

        {uploading && <p>Chargement...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {documents.length === 0 ? (
          <p>Aucun document pour cet animal.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#B05F63] underline"
                >
                  {doc.nom}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
