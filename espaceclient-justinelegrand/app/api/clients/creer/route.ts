import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// On crée un client Supabase "Admin" qui utilise la clé secrète
// Ce client a tous les droits et contourne la RLS.
// NE JAMAIS utiliser ce code côté client (dans une page)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

export async function POST(request: Request) {
    const { nom, email, telephone, adresse } = await request.json()

    if (!email || !nom) {
        return NextResponse.json({ error: "Le nom et l'email sont requis" }, { status: 400 })
    }

    // Étape 1 : Créer l'utilisateur dans le système d'authentification de Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // L'email est automatiquement marqué comme confirmé
    })

    if (authError) {
        console.error("Erreur lors de la création de l'utilisateur Auth:", authError)
        return NextResponse.json({ error: `Erreur Auth: ${authError.message}` }, { status: 500 })
    }

    const newUserId = authData.user.id

    // Étape 2 : Créer le profil correspondant dans la table "clients"
    const { error: profileError } = await supabaseAdmin.from('clients').insert({
        auth_id: newUserId,
        nom,
        email,
        telephone,
        adresse,
    })

    if (profileError) {
        console.error("Erreur lors de la création du profil client:", profileError)
        // Si la création du profil échoue, on supprime l'utilisateur Auth pour éviter les "orphelins"
        await supabaseAdmin.auth.admin.deleteUser(newUserId)
        return NextResponse.json({ error: `Erreur Profil: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Client créé avec succès' }, { status: 201 })
}

