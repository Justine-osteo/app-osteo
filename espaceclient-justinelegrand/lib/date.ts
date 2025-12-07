import { format, parseISO, isBefore, isAfter, addDays, addWeeks, addMonths, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formate une date en format court français : dd/MM/yyyy
 */
export const formatShortDate = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy', { locale: fr })
}

/**
 * Formate une date avec texte complet : lundi 25 mai 2025
 */
export const formatLongDate = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, "EEEE d MMMM yyyy", { locale: fr })
}

/**
 * Compare si une date est passée
 */
export const isPast = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isBefore(d, new Date())
}

/**
 * Compare si une date est future
 */
export const isFuture = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isAfter(d, new Date())
}

/**
 * Ajoute des jours à une date
 */
export const addDaysToDate = (date: Date | string, days: number) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return addDays(d, days)
}

/**
 * Ajoute des semaines à une date
 */
export const addWeeksToDate = (date: Date | string, weeks: number) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return addWeeks(d, weeks)
}

/**
 * Ajoute des mois à une date
 */
export const addMonthsToDate = (date: Date | string, months: number) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return addMonths(d, months)
}

/**
 * Calcule le nombre de jours entre deux dates
 */
export const daysBetween = (date1: Date | string, date2: Date | string) => {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
    return differenceInDays(d1, d2)
}
import {
    formatDistanceToNow,
    formatDistance,
    isToday,
    isTomorrow,
    isYesterday,
} from 'date-fns'

/**
 * Renvoie une phrase relative : "il y a 3 jours", "dans 2 semaines", etc.
 */
export const formatRelativeDate = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { locale: fr, addSuffix: true })
}

/**
 * Renvoie une phrase du type : "aujourd’hui", "demain", "hier", ou "le 24 mai 2025"
 */
export const formatSmartDate = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (isToday(d)) return "aujourd’hui"
    if (isTomorrow(d)) return "demain"
    if (isYesterday(d)) return "hier"
    return formatLongDate(d)
}

/**
 * Renvoie une phrase relative entre deux dates : "3 jours", "2 semaines", etc.
 */
export const relativeBetween = (
    date1: Date | string,
    date2: Date | string
) => {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
    return formatDistance(d1, d2, { locale: fr })
}

/**
 * Trie un tableau d'objets contenant une propriété date par ordre décroissant (plus récent en premier)
 */
export const sortByDateDesc = <T extends { date: string | Date }>(items: T[]) => {
    return items.sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date
        const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date
        return dateB.getTime() - dateA.getTime()
    })
}

/**
 * Trie un tableau d'objets contenant une propriété date par ordre croissant (plus ancien en premier)
 */
export const sortByDateAsc = <T extends { date: string | Date }>(items: T[]) => {
    return items.sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date
        const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date
        return dateA.getTime() - dateB.getTime()
    })
}

/**
 * Regroupe les éléments par mois et année (ex : "mai 2025")
 */
export const groupByMonth = <T extends { date: string | Date }>(items: T[]) => {
    return items.reduce((acc: Record<string, T[]>, item) => {
        const d = typeof item.date === 'string' ? parseISO(item.date) : item.date
        const key = format(d, "MMMM yyyy", { locale: fr }) // ex: "mai 2025"
        if (!acc[key]) acc[key] = []
        acc[key].push(item)
        return acc
    }, {})
}

/**
 * Filtre les éléments dont la date est dans le mois en cours
 */
export const filterCurrentMonth = <T extends { date: string | Date }>(items: T[]) => {
    const now = new Date()
    return items.filter((item) => {
        const d = typeof item.date === 'string' ? parseISO(item.date) : item.date
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
}

/**
 * Filtre les éléments selon un mois et une année donnés
 * @param month 0-11 (janvier = 0, décembre = 11)
 * @param year année complète (ex : 2025)
 */
export const filterByMonthYear = <T extends { date: string | Date }>(
    items: T[],
    month: number,
    year: number
) => {
    return items.filter((item) => {
        const d = typeof item.date === 'string' ? parseISO(item.date) : item.date
        return d.getMonth() === month && d.getFullYear() === year
    })
}

/**
 * Compte les éléments dont la date est dans le mois en cours
 */
export const countCurrentMonth = <T extends { date: string | Date }>(items: T[]) => {
    const now = new Date()
    return items.reduce((count, item) => {
        const d = typeof item.date === 'string' ? parseISO(item.date) : item.date
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            return count + 1
        }
        return count
    }, 0)
}

/**
 * Compte les éléments selon un mois et une année donnés
 * @param month 0-11 (janvier = 0, décembre = 11)
 * @param year année complète (ex : 2025)
 */
export const countByMonthYear = <T extends { date: string | Date }>(
    items: T[],
    month: number,
    year: number
) => {
    return items.reduce((count, item) => {
        const d = typeof item.date === 'string' ? parseISO(item.date) : item.date
        if (d.getMonth() === month && d.getFullYear() === year) {
            return count + 1
        }
        return count
    }, 0)
}

/**
 * Génère un tableau avec le nombre d'éléments par mois pour une année donnée
 * @returns Un tableau de 12 nombres (index 0 = janvier, 11 = décembre)
 */
export const countPerMonth = <T extends { date: string | Date }>(
    items: T[],
    year: number
): number[] => {
    const result = Array(12).fill(0)
    items.forEach(item => {
        const d = typeof item.date === 'string' ? parseISO(item.date) : item.date
        if (d.getFullYear() === year) {
            result[d.getMonth()] += 1
        }
    })
    return result
}

/**
 * Regroupe les séances par animalId
 * @returns Un objet avec une clé par animalId et un tableau de séances en valeur
 */
export const groupByAnimal = <T extends { animalId: string }>(séances: T[]) => {
    return séances.reduce<Record<string, T[]>>((acc, séance) => {
        if (!acc[séance.animalId]) {
            acc[séance.animalId] = []
        }
        acc[séance.animalId].push(séance)
        return acc
    }, {})
}

/**
 * Filtre les séances qui ont lieu aujourd'hui
 */
export const filterToday = <T extends { date: string | Date }>(séances: T[]) => {
    const today = new Date()
    return séances.filter(séance => {
        const d = typeof séance.date === 'string' ? parseISO(séance.date) : séance.date
        return (
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
        )
    })
}

/**
 * Renvoie la prochaine séance à venir pour chaque animal
 */
export const getNextSéanceForEachAnimal = <T extends { animalId: string; date: string | Date }>(séances: T[]) => {
    const now = new Date()
    const séancesParAnimal = groupByAnimal(séances)

    const prochainesSéances: Record<string, T | null> = {}

    Object.entries(séancesParAnimal).forEach(([animalId, séances]) => {
        const futures = séances.filter(s => isAfter(typeof s.date === 'string' ? parseISO(s.date) : s.date, now))
        const sorted = sortByDateAsc(futures)
        prochainesSéances[animalId] = sorted[0] ?? null
    })

    return prochainesSéances
}

/**
 * Retourne un classement des animaux selon leur nombre de séances
 */
export const getMostSeenAnimals = <T extends { animalId: string }>(séances: T[]) => {
    const counts = séances.reduce<Record<string, number>>((acc, séance) => {
        acc[séance.animalId] = (acc[séance.animalId] || 0) + 1
        return acc
    }, {})

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // ordre décroissant
        .map(([animalId, count]) => ({ animalId, count }))
}

/**
 * Vérifie si un animal a eu une séance dans les X derniers jours
 */
export const hasSéanceInLastXDays = <T extends { animalId: string; date: string | Date }>(
    séances: T[],
    animalId: string,
    days: number
) => {
    const seuil = addDays(new Date(), -days)
    return séances.some(s =>
        s.animalId === animalId &&
        isAfter(typeof s.date === 'string' ? parseISO(s.date) : s.date, seuil)
    )
}

/**
 * Filtre les séances entre deux dates incluses
 */
export const getSéancesInRange = <T extends { date: string | Date }>(
    séances: T[],
    start: Date,
    end: Date
) => {
    return séances.filter(s => {
        const d = typeof s.date === 'string' ? parseISO(s.date) : s.date
        return d >= start && d <= end
    })
}

/**
 * Renvoie les séances prévues dans les X prochains jours
 */
export const getUpcomingSéances = <T extends { date: string | Date }>(séances: T[], days: number) => {
    const today = new Date()
    const limit = addDays(today, days)
    return séances.filter(s => {
        const d = typeof s.date === 'string' ? parseISO(s.date) : s.date
        return d >= today && d <= limit
    })
}

