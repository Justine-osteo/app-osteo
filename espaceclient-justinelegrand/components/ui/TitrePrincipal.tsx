// components/ui/TitrePrincipal.tsx
import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function TitrePrincipal({ children }: Props) {
    return (
        <h1 className="text-4xl text-accent font-titre mb-4">
            {children}
        </h1>
    );
}
