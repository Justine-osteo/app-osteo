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
            className={className}
            style={{
                backgroundColor: '#FAEEF0',
                borderRadius: 12,
                // RETOUR AUX DIMENSIONS INITIALES FIXES
                width: 160,
                height: 240,

                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'Charm, cursive',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                margin: '0 auto', // Pour centrer dans la grille si nécessaire
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
            }}
        >
            {/* Titre : Même style que le bouton (Rose foncé + Blanc) */}
            <div style={{
                textAlign: 'center',
                padding: '4px 2px',
                fontSize: '1.2rem', // Taille ajustée pour la largeur de 160px
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#B05F63',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {titre}
            </div>

            {/* Image ou fallback */}
            <div
                style={{
                    flex: 1,
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
                            fontSize: '2.5rem',
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
                    padding: '8px',
                    textAlign: 'center',
                }}
            >
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{boutonTexte}</span>
            </div>
        </div>
    )
}