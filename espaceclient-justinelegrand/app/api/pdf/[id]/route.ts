import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from '@/types/supabase'

// Client admin pour accéder au storage privé
const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> } // <-- 1. Le type params est une Promise
) {
    // 2. On attend la résolution des paramètres
    const params = await props.params;
    const docId = params.id;

    // 3. On attend les cookies (Nouveauté Next.js 15)
    const cookieStore = await cookies();

    // Client Supabase SSR pour récupérer l'utilisateur connecté
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // Ignorer en mode lecture seule (route handler)
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.delete({ name, ...options })
                    } catch (error) {
                        // Ignorer
                    }
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const isAdmin = user.user_metadata?.role === "admin";

    // Vérification client propriétaire si ce n'est pas un admin
    if (!isAdmin) {
        // Correction TS : On caste en any si les types bloquent, ou on utilise le type générique si dispo
        const { data: docRecord, error } = await (supabase
            .from("documents") as any)
            .select("id, client_id")
            .eq("id", docId)
            .single();

        if (error || !docRecord) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        if (docRecord.client_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    // Téléchargement du fichier depuis le bucket privé
    const { data, error } = await supabaseAdmin.storage
        .from("documents")
        .download(`${docId}.pdf`); // Assurez-vous que le nom du fichier est bien l'ID

    if (error || !data) {
        return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    return new Response(data, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="document_${docId}.pdf"`,
        },
    });
}