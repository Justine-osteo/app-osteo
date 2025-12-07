import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
    try {
        // 1. Initialisation standard (plus de casting complexe ici)
        const supabase = await createServerSupabase();

        const formData = await request.formData();

        // Récupération des champs en sécurisant les conversions
        const file = formData.get("file") as File | null;
        const seanceId = formData.get("seance_id")?.toString() ?? null;
        const clientId = formData.get("client_id")?.toString() ?? null;
        const originalName = formData.get("original_name")?.toString() ?? null;

        if (!file || !seanceId || !clientId || !originalName) {
            return NextResponse.json(
                { error: "Paramètres manquants (file, seance_id, client_id, original_name)" },
                { status: 400 }
            );
        }

        // Normalisation du nom de fichier
        const normalize = (s: string) =>
            s
                .toLowerCase()
                .replace(/['\s/\\()&]+/g, "-")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/--+/g, "-")
                .replace(/^-|-$/g, "");

        const normalized = normalize(originalName);
        const filePath = `${clientId}/${randomUUID()}-${normalized}`;

        // Upload vers le bucket 'factures'
        const { error: uploadError } = await supabase.storage
            .from("factures")
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Récupération de l'URL publique
        const { data: publicUrlData } = supabase.storage.from("factures").getPublicUrl(filePath);
        const publicUrl = publicUrlData?.publicUrl ?? null;

        if (!publicUrl) {
            return NextResponse.json({ error: "Impossible de générer l'URL publique." }, { status: 500 });
        }

        // Payload pour l'insertion
        const insertPayload = {
            seance_id: seanceId,
            client_id: clientId,
            nom_fichier: originalName,
            url_fichier: publicUrl,
        };

        // 2. CORRECTION DÉFINITIVE : 
        // On caste le résultat de .from("factures") en 'any'.
        // Cela désactive complètement la vérification TS sur .insert() pour cette ligne uniquement.
        // C'est la méthode la plus sûre quand on n'a pas les types générés.
        const { error: insertError } = await (supabase.from("factures") as any).insert([insertPayload]);

        if (insertError) {
            console.error("Insert error:", insertError);
            // Suppression du fichier uploadé en cas d'erreur d'insertion pour éviter les orphelins
            await supabase.storage.from("factures").remove([filePath]);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, url: publicUrl });
    } catch (e: any) {
        console.error("Server error:", e);
        return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
    }
}