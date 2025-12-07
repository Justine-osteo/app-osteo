'use client'

import React from 'react'
import ReactDOM from 'react-dom'

interface ModalProps {
    onClose: () => void
    children: React.ReactNode
}

export default function Modal({ onClose, children }: ModalProps) {
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl"
                >
                    &times;
                </button>
                {children}
            </div>
        </div>,
        document.body
    )
}
