// lib/google.ts
import { google } from "googleapis";

const calendar = google.calendar("v3");

// Liste des titres d’événements à ignorer (en minuscules pour comparer facilement)
const IGNORED_TITLES = [
    "off",
    "🍴pause déjeuner (horaire flexible)",
    "laisser 15 min avant et 15 min après la première et dernière séance",
    "j1",
    "1er rdv",
    "j2 - à partir de 12h00",
    "notes (ne pas supprimer)",
    "off - sauf exceptions / clubs canins",
    "journée proche de bourges",
];

export async function getUpcomingEvents() {
    const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const now = new Date();
    const res = await calendar.events.list({
        auth,
        calendarId: process.env.GOOGLE_CALENDAR_ID!,
        timeMin: now.toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: "startTime",
    });

    const events = res.data.items || [];

    return events
        .filter((event) => {
            const title = event.summary?.toLowerCase().trim() || "";
            return !IGNORED_TITLES.includes(title);
        })
        .map((event) => {
            const description = event.description || "";

            // Nettoyage du téléphone (supprime les balises HTML éventuelles)
            const phoneMatch = description.match(/téléphone\s*:\s*(.+)/i);
            const phone = phoneMatch
                ? phoneMatch[1].replace(/<[^>]+>/g, "").trim()
                : "";

            // On récupère tous les blocs animaux
            const animalRegex =
                /Animal\s*:\s*(.+?)\s*(?:Nom\s*:\s*(.+?)\s*)?(?:Race\s*:\s*(.+?)\s*)?(?:Motif\s*:\s*(.+?)\s*)?/gi;

            const animaux: {
                espece: string;
                nom: string;
                race: string;
                motif: string;
            }[] = [];

            let match;
            while ((match = animalRegex.exec(description)) !== null) {
                animaux.push({
                    espece: match[1]?.trim() || "",
                    nom: match[2]?.trim() || "",
                    race: match[3]?.trim() || "",
                    motif: match[4]?.trim() || "",
                });
            }

            return {
                id: event.id,
                date: event.start?.dateTime || event.start?.date || "",
                client: {
                    nom: event.summary || "",
                    adresse: event.location || "",
                    email: event.attendees?.[0]?.email || "",
                    telephone: phone,
                },
                animaux, // tableau d’animaux au lieu d’un seul
            };
        });
}
