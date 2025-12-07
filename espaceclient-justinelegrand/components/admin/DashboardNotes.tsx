'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle, Save, Loader2 } from 'lucide-react'

export default function DashboardNotes() {
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Charger la note au démarrage
    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true)

            // CORRECTION ULTIME : On caste 'supabase' en 'any' directement
            // Cela désactive toute vérification stricte dès le début de la chaîne
            const { data, error } = await (supabase as any)
                .from('dashboard_notes')
                .select('content')
                .eq('id', 1)
                .maybeSingle()

            if (error) {
                console.error("Erreur chargement note:", error.message)
            } else if (data) {
                setNote(data.content || '')
            }

            setLoading(false)
        }
        fetchNote()
    }, [])

    // Sauvegarder la note
    const handleSave = async () => {
        setSaving(true)

        // CORRECTION ULTIME : Idem ici, (supabase as any)
        const { error } = await (supabase as any)
            .from('dashboard_notes')
            .upsert({
                id: 1,
                content: note,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })

        if (error) {
            console.error("Erreur sauvegarde:", error)
            alert("Erreur lors de la sauvegarde de la note.")
        } else {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-md border border-gray-200">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full shadow-sm">
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Votre pense-bête ici... (ex: Rappeler Mme Michu pour son chien)"
                className="w-full flex-1 p-4 border border-[#B05F63]/30 rounded-t-lg bg-[#FFFDFC] text-[#6E4B42] focus:outline-none focus:ring-2 focus:ring-[#B05F63] focus:border-transparent resize-none text-sm leading-relaxed"
            />
            <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full font-semibold px-4 py-3 rounded-b-lg transition flex items-center justify-center gap-2 text-sm
                    ${saving ? 'bg-gray-100 text-gray-500' : 'bg-[#B05F63] text-white hover:bg-[#8E3E42] shadow-md'}
                `}
            >
                {saving ? (
                    <>Enregistrement...</>
                ) : saved ? (
                    <span className="flex items-center gap-2 animate-pulse text-white">
                        Enregistré <CheckCircle className="w-4 h-4" />
                    </span>
                ) : (
                    <>
                        <Save className="w-4 h-4" /> Enregistrer le pense-bête
                    </>
                )}
            </button>
        </div>
    )
}