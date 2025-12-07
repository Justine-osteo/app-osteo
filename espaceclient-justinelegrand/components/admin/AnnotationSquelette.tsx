'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Eraser, Pencil } from 'lucide-react'

const SKELETON_MAP: Record<string, string> = {
    chien: '/images/squelette-chien.png',
    chat: '/images/squelette-chat.png',
    cheval: '/images/squelette-cheval.png',
    vache: '/images/squelette-vache.png',
}

const COLORS = ['#E53E3E', '#ED8936', '#ECC94B', '#4299E1']

interface Props {
    espece: string | null | undefined
    initialDrawingUrl?: string | null
    onSave: (dataUrl: string) => Promise<void>
}

export default function AnnotationSquelette({ espece, initialDrawingUrl, onSave }: Props) {
    // --- CORRECTION : On utilise maintenant deux canevas superposés ---
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null) // Calque du dessus (dessin)
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null) // Calque du dessous (squelette)

    const [isDrawing, setIsDrawing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen')
    const [currentColor, setCurrentColor] = useState<string>(COLORS[0])

    const backgroundImageUrl = SKELETON_MAP[espece?.toLowerCase() ?? ''] || SKELETON_MAP.chien;

    // Fonction pour dessiner une image sur un canevas donné
    const drawImageOnCanvas = (url: string, ctx: CanvasRenderingContext2D) => {
        return new Promise<void>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = "anonymous";
            img.src = url
            img.onload = () => {
                ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height)
                resolve()
            }
            img.onerror = (err) => {
                console.error("Failed to load image:", url, err);
                setError(`Impossible de charger l'image: ${url}. Vérifiez qu'elle existe bien dans /public/images/`);
                reject(err);
            }
        })
    }

    // Initialisation des deux canevas
    useEffect(() => {
        const initializeCanvas = async () => {
            const backgroundCanvas = backgroundCanvasRef.current
            const drawingCanvas = drawingCanvasRef.current
            if (!backgroundCanvas || !drawingCanvas) return

            const backgroundCtx = backgroundCanvas.getContext('2d')
            const drawingCtx = drawingCanvas.getContext('2d')
            if (!backgroundCtx || !drawingCtx) return

            try {
                // On dessine le squelette UNIQUEMENT sur le calque du dessous
                await drawImageOnCanvas(backgroundImageUrl, backgroundCtx)

                // On dessine l'annotation existante UNIQUEMENT sur le calque du dessus
                if (initialDrawingUrl) {
                    await drawImageOnCanvas(initialDrawingUrl, drawingCtx)
                }
            } catch (e) { }
        }

        initializeCanvas()
    }, [backgroundImageUrl, initialDrawingUrl])

    const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number, y: number } => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // On configure le crayon (la gomme est gérée dans la fonction `draw`)
        ctx.strokeStyle = currentColor
        ctx.lineWidth = 3
        ctx.lineCap = 'round'

        const { x, y } = getCoords(e);
        ctx.beginPath()
        ctx.moveTo(x, y)
        setIsDrawing(true)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { x, y } = getCoords(e);

        // --- CORRECTION : Logique de la gomme ---
        if (currentTool === 'eraser') {
            // La gomme efface une zone du calque de dessin
            ctx.clearRect(x - 10, y - 10, 20, 20);
        } else {
            // Le crayon dessine normalement
            ctx.lineTo(x, y)
            ctx.stroke()
        }
    }

    const stopDrawing = () => {
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.closePath()
        setIsDrawing(false)
    }

    const handleClear = () => {
        const canvas = drawingCanvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // On n'efface QUE le calque du dessus
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // --- CORRECTION : Sauvegarde en fusionnant les deux calques ---
    const handleSaveClick = async () => {
        const drawingCanvas = drawingCanvasRef.current
        const backgroundCanvas = backgroundCanvasRef.current
        if (!drawingCanvas || !backgroundCanvas) return

        setSaving(true)

        // On crée un canevas temporaire pour la fusion
        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = drawingCanvas.width;
        mergedCanvas.height = drawingCanvas.height;
        const ctx = mergedCanvas.getContext('2d');

        if (ctx) {
            // 1. On dessine le calque du squelette en premier
            ctx.drawImage(backgroundCanvas, 0, 0);
            // 2. On dessine le calque des annotations par-dessus
            ctx.drawImage(drawingCanvas, 0, 0);

            // 3. On exporte l'image fusionnée
            const dataUrl = mergedCanvas.toDataURL('image/png')
            await onSave(dataUrl)
        }

        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded border border-red-400">{error}</div>
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-4 p-2 bg-gray-100 rounded-md border">
                <Pencil className="w-5 h-5 text-gray-600" />
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => {
                            setCurrentTool('pen')
                            setCurrentColor(color)
                        }}
                        style={{ backgroundColor: color }}
                        className={`w-8 h-8 rounded-full transition ${currentColor === color && currentTool === 'pen' ? 'ring-2 ring-offset-2 ring-black' : 'ring-1 ring-inset ring-gray-400'}`}
                        aria-label={`Sélectionner la couleur ${color}`}
                    />
                ))}
                <div className="border-l border-gray-300 h-8 mx-2"></div>
                <button
                    onClick={() => setCurrentTool('eraser')}
                    className={`p-2 rounded-md transition ${currentTool === 'eraser' ? 'bg-gray-300 ring-2 ring-black' : 'bg-white'}`}
                    aria-label="Gomme"
                >
                    <Eraser className="w-6 h-6" />
                </button>
            </div>

            {/* --- CORRECTION : Structure avec deux canevas superposés --- */}
            <div className="relative w-full" style={{ aspectRatio: '800 / 600' }}>
                <canvas
                    ref={backgroundCanvasRef}
                    width={800}
                    height={600}
                    className="absolute top-0 left-0 w-full h-full rounded-md"
                />
                <canvas
                    ref={drawingCanvasRef}
                    width={800}
                    height={600}
                    className="absolute top-0 left-0 w-full h-full rounded-md cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>

            <div className="flex gap-4 mt-4">
                <button onClick={handleSaveClick} disabled={saving} className="bg-[#B05F63] text-white px-4 py-2 rounded">
                    {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder l’annotation'}
                </button>
                <button onClick={handleClear} className="bg-gray-300 text-gray-800 px-4 py-2 rounded">
                    Effacer le dessin
                </button>
            </div>
        </div>
    )
}


