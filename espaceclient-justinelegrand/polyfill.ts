// Ce fichier définit la variable __dirname qui manque sur Vercel.
// On force une valeur vide pour que la librairie Supabase ne plante pas.
if (typeof globalThis.__dirname === 'undefined') {
    (globalThis as any).__dirname = '';
}