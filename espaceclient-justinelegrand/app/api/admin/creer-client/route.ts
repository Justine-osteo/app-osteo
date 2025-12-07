// app/api/admin/creer-client/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
    email: z.string().email(),
    nom: z.string(),
    telephone: z.string().optional(),
    adresse: z.string().optional(),
})

export async function POST(req: NextRequest) {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }

    const { email, nom, telephone, adresse } = parsed.data

    const password =
        typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(-12)

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (authError || !authUser.user) {
        console.error('Erreur création utilisateur :', authError)
        return NextResponse.json(
            { error: 'Erreur création utilisateur auth', details: authError },
            { status: 500 }
        )
    }

    const auth_id = authUser.user.id

    const { error } = await supabaseAdmin.from('clients').insert([
        {
            nom,
            email,
            telephone,
            adresse,
            auth_id,
        },
    ])

    if (error) {
        console.error('Erreur insertion client :', error)
        return NextResponse.json({ error: 'Erreur insertion client', details: error }, { status: 500 })
    }

    return NextResponse.json({ message: 'Client créé avec succès' }, { status: 200 })
}
