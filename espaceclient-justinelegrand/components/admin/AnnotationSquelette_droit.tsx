'use client'

import { useEffect, useRef, useState } from 'react'
import { Undo, Trash2, Save } from 'lucide-react'

interface AnnotationProps {
    espece?: string
    initialDrawingUrl?: string | null
    onSave: (dataUrl: string) => void
}

export default function AnnotationSqueletteDroit({
    espece,
    initialDrawingUrl,
    onSave,
}: AnnotationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    // On garde un historique simple pour le Undo
    const [history, setHistory] = useState<ImageData[]>([])

    // --- LOGIQUE DE L'IMAGE DE FOND ---
    // C'est ici qu'on définit l'image "DROITE" en dur
    const getBackgroundImagePath = () => {
        const especeLower = espece?.toLowerCase() || 'chien'
        // Assurez-vous que ces fichiers existent dans votre dossier public !
        // Exemple : public/img/squelettes/chien_droit.png
        if (especeLower === 'chat') return '/img/squelettes/chat_droit.png'
        if (especeLower === 'cheval') return '/img/squelettes/cheval_droit.png'
        return '/img/squelettes/chien_droit.png' // Par défaut
    }

    // Initialisation du Canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 1. Charger l'image de fond (Squelette Droit)
        const bgImage = new Image()
        bgImage.src = getBackgroundImagePath()

        bgImage.onload = () => {
            // On efface tout
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // On dessine le squelette en fond
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)

            // 2. Si on a un dessin sauvegardé (le gribouillage rouge), on le superpose
            if (initialDrawingUrl) {
                const drawingImage = new Image()
                drawingImage.crossOrigin = 'anonymous' // Important pour éviter les erreurs de sécurité
                drawingImage.src = initialDrawingUrl
                drawingImage.onload = () => {
                    ctx.drawImage(drawingImage, 0, 0, canvas.width, canvas.height)
                    saveToHistory() // Sauvegarder l'état initial
                }
            } else {
                saveToHistory()
            }
        }
    }, [espece, initialDrawingUrl]) // Se relance si l'espèce ou l'url change

    const saveToHistory = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
            setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)])
        }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false)
            saveToHistory() // Sauvegarder le trait fini
            const canvas = canvasRef.current
            // Sauvegarde automatique vers le parent
            if (canvas) onSave(canvas.toDataURL())
        }
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) ctx.beginPath() // Reset path
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = (e as React.MouseEvent).clientX - rect.left
            y = (e as React.MouseEvent).clientY - rect.top
        }

        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#ef4444' // ROUGE

        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const handleUndo = () => {
        if (history.length <= 1) return // On garde toujours l'état initial
        const newHistory = [...history]
        newHistory.pop() // Enlever l'état actuel
        const previousState = newHistory[newHistory.length - 1]

        setHistory(newHistory)

        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx && previousState) {
            ctx.putImageData(previousState, 0, 0)
            onSave(canvas.toDataURL())
        }
    }

    const handleClear = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        // On recharge juste l'image de fond propre
        const bgImage = new Image()
        bgImage.src = getBackgroundImagePath()
        bgImage.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height)
            saveToHistory()
            onSave(canvas.toDataURL())
        }
    }

    return (
        <div className="flex flex-col gap-2 select-none">
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-crosshair touch-none bg-white">
                <canvas
                    ref={canvasRef}
                    width={500} // Adaptez la taille selon vos images
                    height={350}
                    className="w-full h-auto block"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
            </div>

            <div className="flex justify-between items-center text-sm">
                <button
                    onClick={handleUndo}
                    className="flex items-center gap-1 text-gray-600 hover:text-black px-2 py-1 rounded bg-gray-100"
                >
                    <Undo size={14} /> Annuler
                </button>
                <span className="text-gray-400 text-xs italic">Dessinez directement sur l'image</span>
                <button
                    onClick={handleClear}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 px-2 py-1 rounded bg-red-50"
                >
                    <Trash2 size={14} /> Effacer
                </button>
            </div>
        </div>
    )
}