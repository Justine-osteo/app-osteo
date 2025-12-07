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

export default function CarteItem({ titre, boutonTexte, onClick, imageUrl, fallback, }: CarteItemProps) {
    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: '#FAEEF0',
                borderRadius: 12,
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
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
            }}
        >
            {/* Titre */}
            <div style={{ textAlign: 'center', padding: '1px 0', fontSize: '1.7rem', fontWeight: 'bold', color: '#6E4B42' }}>
                {titre}
            </div>

            {/* Image ou fallback */}
            <div
                style={{
                    height: 150,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
                            backgroundColor: '#F3D8DD',
                            color: '#6E4B42',
                            fontStyle: 'italic',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '1.2rem',
                            padding: '0 8px',
                            textAlign: 'center',
                        }}
                    >
                        {fallback ?? 'Pas d’image'}
                    </div>
                )}
            </div>

            {/* Bouton */}
            <div
                style={{
                    backgroundColor: '#B05F63',
                    padding: '8px',
                    textAlign: 'center',
                }}
            >
                <span style={{ color: 'white', fontWeight: 'bold' }}>{boutonTexte}</span>
            </div>
        </div>
    )
}
