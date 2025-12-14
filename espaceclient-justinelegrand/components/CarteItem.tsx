'use client'

import React from 'react'

interface CarteItemProps {
    titre: string
    boutonTexte: string
    onClick: () => void
    imageUrl?: string | null
    fallback?: string // Emoji ou texte alternatif si pas d’image
    className?: string
}

export default function CarteItem({ titre, boutonTexte, onClick, imageUrl, fallback, className }: CarteItemProps) {
    return (
        <div
            onClick={onClick}
            className={className} // Permet de recevoir les styles de la page parente (taille, bordure...)
            style={{
                backgroundColor: '#FAEEF0',
                borderRadius: 12,
                // On utilise min-height plutôt que height fixe pour la flexibilité
                minHeight: 240,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'Charm, cursive',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
            }}
        >
            {/* Titre : Même style que le bouton (Rose foncé + Blanc) */}
            <div style={{
                textAlign: 'center',
                padding: '8px 4px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#B05F63' // Changement de couleur ici
            }}>
                {titre}
            </div>

            {/* Image ou fallback */}
            <div
                style={{
                    flex: 1, // Prend toute la place disponible au milieu
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    overflow: 'hidden'
                }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={titre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '3rem',
                            color: '#F3D8DD',
                        }}
                    >
                        {fallback ?? '🐾'}
                    </div>
                )}
            </div>

            {/* Bouton du bas */}
            <div
                style={{
                    backgroundColor: '#B05F63',
                    padding: '10px',
                    textAlign: 'center',
                }}
            >
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{boutonTexte}</span>
            </div>
        </div>
    )
}