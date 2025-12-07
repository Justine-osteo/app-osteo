import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
    try {
        const calendar = google.calendar({
            version: 'v3',
            auth: process.env.GOOGLE_CALENDAR_API_KEY,
        })

        const now = new Date()

        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: now.toISOString(), // À partir de maintenant
            maxResults: 5, // On prend les 5 prochains
            singleEvents: true,
            orderBy: 'startTime',
        })

        const events = response.data.items || []

        const formattedEvents = events.map((event) => {
            return {
                id: event.id,
                summary: event.summary,
                start: event.start?.dateTime || event.start?.date,
                end: event.end?.dateTime || event.end?.date,
            }
        })

        return NextResponse.json(formattedEvents)

    } catch (error) {
        console.error("Error fetching Google Calendar events:", error)
        return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
    }
}
