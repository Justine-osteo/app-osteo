export async function getGoogleEvents() {
    const res = await fetch('/api/google/events')
    const data = await res.json()

    if (!data.success) throw new Error(data.error || 'Erreur inconnue')

    return data.agendas || []
}
