import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client admin pour accéder au storage privé
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const docId = params.id;

    // Client Supabase SSR pour récupérer l'utilisateur connecté
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: cookies() as any, // TS-friendly
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
        const { data: docRecord, error } = await supabase
            .from("documents")
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
        .download(`${docId}.pdf`);

    if (error || !data) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new Response(data, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${docId}.pdf"`,
        },
    });
}
