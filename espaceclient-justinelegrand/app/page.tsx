export default function Home() {
    // Le middleware gère désormais la redirection pour la page d'accueil ('/')
    // Laisser ce fichier minimal pour éviter les conflits de redirection.
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            {/* Si ce texte s'affiche, c'est que le middleware n'a pas redirigé. */}
            <p className="text-xl text-gray-700">Redirection en cours...</p>
        </div>
    )
}