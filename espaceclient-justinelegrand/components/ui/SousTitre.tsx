// components/ui/SousTitre.tsx
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function SousTitre({ children }: Props) {
    return (
        <h2 className="text-2xl text-accent font-titre mb-2">
            {children}
        </h2>
    );
}
