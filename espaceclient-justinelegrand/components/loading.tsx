'use client';

import Lottie from 'lottie-react';
import dogAnimation from '@/assets/lottie/chien-chargement.json';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-[#B05F63] font-charm">
      {/* Animation Lottie */}
      <div className="w-60 h-60">
        <Lottie animationData={dogAnimation} loop autoplay />
      </div>

      {/* Barre de chargement */}
      <div className="relative w-48 h-2 mt-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute h-full w-1/3 bg-[#B05F63] animate-slide rounded-full" />
      </div>

      {/* Texte */}
      <p className="mt-6 text-lg font-charm">Chargement…</p>
    </div>
  );
}
