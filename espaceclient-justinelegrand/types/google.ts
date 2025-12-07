export interface CalendarEvent {
    id?: string
    summary?: string
    location?: string
    description?: string
    start?: {
        dateTime?: string
        date?: string
    }
    attendees?: {
        email?: string
    }[]
}
