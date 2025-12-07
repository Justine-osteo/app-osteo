'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

export default function ChargementAdmin() {
    const [progress, setProgress] = useState(0)
    const [animationData, setAnimationData] = useState<any>(null)

    useEffect(() => {
        fetch('/lottie/chien-chargement.json')
            .then((res) => res.json())
            .then(setAnimationData)
            .catch(() => {
                setAnimationData(null)
            })
    }, [])

    useEffect(() => {
        let progressValue = 0
        const interval = setInterval(() => {
            progressValue += 2
            setProgress(progressValue)
            if (progressValue >= 100) clearInterval(interval)
        }, 30)

        return () => clearInterval(interval)
    }, [])

    return (
        <main
            style={{
                height: '100vh',
                backgroundColor: '#f3d8dd',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                padding: '1rem',
                color: '#6E4B42',
                fontFamily: 'Charm, cursive',
            }}
        >
            <div style={{ width: 300, height: 300 }}>
                {animationData ? <Lottie animationData={animationData} loop autoplay /> : <p>Chargement…</p>}
            </div>

            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                style={{
                    width: '80%',
                    maxWidth: 400,
                    height: 20,
                    border: '1px solid #B05F63',
                    borderRadius: 10,
                    backgroundColor: '#F3D8DD',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: '#B05F63',
                        borderRadius: 10,
                        transition: 'width 0.3s ease',
                    }}
                />
            </div>

            <p style={{ color: '#6E4B42', fontWeight: '600' }}>Chargement... {progress}%</p>
        </main>
    )
}
