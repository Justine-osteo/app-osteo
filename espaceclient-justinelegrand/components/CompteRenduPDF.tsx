import React, { FC } from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image
} from '@react-pdf/renderer';

// --- TYPES ---
export type SeanceTypePDF = {
    date?: string;
    motif?: string;
    observations?: string;
    annotation_squelette_url?: string | null;
    annotation_squelette_droit_url?: string | null;
    recommandations?: string;
    suivi?: string;
    mesures_avant?: {
        avant_gauche?: string;
        avant_droit?: string;
        arriere_gauche?: string;
        arriere_droit?: string;
    };
    mesures_apres?: {
        avant_gauche?: string;
        avant_droit?: string;
        arriere_gauche?: string;
        arriere_droit?: string;
    };
};

type Props = {
    seance: SeanceTypePDF;
    animalName: string;
    clientName: string;
    // Ajout de props pour rendre le template dynamique
    practitionerName?: string;
    practitionerContact?: string;
    logoUrl?: string;
};

// Fonction utilitaire pour construire l'URL absolue des polices
const getFontUrl = (path: string) => {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}${path}`;
    }
    return path;
};

// Enregistrement des polices (Assurez-vous que les fichiers sont dans votre dossier public/fonts)
Font.register({
    family: 'Charm',
    fonts: [
        { src: getFontUrl('/fonts/Charm-Regular.ttf') },
        { src: getFontUrl('/fonts/Charm-Regular.ttf'), fontWeight: 'bold' }
    ]
});
Font.register({
    family: 'Open Sans',
    src: getFontUrl('/fonts/OpenSans-Regular.ttf'),
});

// --- STYLES ---
// On centralise les couleurs pour faciliter les modifications futures
const theme = {
    primary: '#B05F63',
    secondary: '#FBEAEC',
    border: '#E5E7EB',
    bgLight: '#F9FAFB',
    textDark: '#111827',
    textGrey: '#374151',
    white: '#FFFFFF'
};

const styles = StyleSheet.create({
    page: {
        backgroundColor: theme.white,
        paddingBottom: 70, // Espace pour le footer
        fontFamily: 'Open Sans',
    },
    // --- HEADER ---
    headerContainer: {
        backgroundColor: theme.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerSide: { width: '25%' },
    headerCenter: { width: '50%', alignItems: 'center' },

    // Logo optionnel
    logo: {
        width: 50,
        height: 50,
        objectFit: 'contain',
    },

    animalName: {
        fontFamily: 'Charm',
        fontSize: 30,
        fontWeight: 'bold',
        color: theme.white,
        textAlign: 'center',
    },
    dateSeance: {
        fontSize: 14,
        color: theme.secondary,
        marginTop: 2,
        textAlign: 'center',
    },
    ownerLabel: { fontSize: 10, color: theme.secondary, textAlign: 'right' },
    ownerName: {
        fontFamily: 'Charm',
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.white,
        textAlign: 'right',
    },

    // --- BODY ---
    body: { paddingHorizontal: 30 },

    mainTitle: {
        fontFamily: 'Charm',
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3D8DD',
        paddingBottom: 10,
        marginHorizontal: 40,
    },

    section: { marginBottom: 15 },

    colTitle: {
        fontSize: 16,
        fontFamily: 'Charm',
        fontWeight: 'bold',
        color: theme.primary,
        marginBottom: 6,
        paddingLeft: 4,
    },

    valueContainer: {
        backgroundColor: theme.bgLight,
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },

    value: {
        fontSize: 12,
        color: theme.textGrey,
        lineHeight: 1.5,
        textAlign: 'justify',
    },

    // --- MESURES ---
    mesuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 15,
        backgroundColor: theme.bgLight,
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    col: { flex: 1, marginHorizontal: 10 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        paddingBottom: 2,
    },
    label: { fontSize: 9, color: '#6E4B42', fontWeight: 'bold' },
    valMesure: { fontSize: 9, color: theme.textDark },

    // --- IMAGE ---
    annotationImage: {
        width: '100%',
        height: 250,
        objectFit: 'contain',
        marginTop: 5,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 4,
        backgroundColor: theme.bgLight,
    },

    // --- FOOTER ---
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.primary,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        fontFamily: 'Charm',
        fontWeight: 'bold',
        fontSize: 12,
        color: theme.white,
    },
    footerSubText: {
        fontSize: 9,
        color: theme.secondary,
        marginTop: 3,
        fontFamily: 'Open Sans',
    },
});

const CompteRenduPDF: FC<Props> = ({
    seance,
    animalName,
    clientName,
    // Valeurs par défaut si non fournies
    practitionerName = "Justine Legrand OA796",
    practitionerContact = "07 88 56 63 98  •  jlegrand.osteopatheanimalier@orange.fr",
    logoUrl
}) => {

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        try {
            const dateObj = new Date(dateStr);
            return new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(dateObj);
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* --- EN-TÊTE --- */}
                <View style={styles.headerContainer} fixed>
                    <View style={styles.headerSide}>
                        {logoUrl && <Image style={styles.logo} src={logoUrl} />}
                    </View>

                    <View style={styles.headerCenter}>
                        <Text style={styles.animalName}>{animalName}</Text>
                        <Text style={styles.dateSeance}>Séance du {formatDate(seance?.date)}</Text>
                    </View>

                    <View style={styles.headerSide}>
                        <Text style={styles.ownerLabel}>Propriétaire :</Text>
                        <Text style={styles.ownerName}>{clientName}</Text>
                    </View>
                </View>

                {/* --- CORPS --- */}
                <View style={styles.body}>
                    <Text style={styles.mainTitle}>Compte rendu de consultation ostéopathique</Text>

                    {/* Motif */}
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.colTitle}>Motif de la consultation :</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>{seance?.motif || '—'}</Text>
                        </View>
                    </View>

                    {/* Observations */}
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.colTitle}>Observations :</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>{seance?.observations || '—'}</Text>
                        </View>
                    </View>

                    {/* Annotations Schémas (Gauche / Droite) */}
                    {(seance.annotation_squelette_url || seance.annotation_squelette_droit_url) && (
                        <View style={styles.section} wrap={false}>
                            <Text style={styles.colTitle}>Schémas annotés :</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                {/* Profil Gauche (URL standard) */}
                                {seance.annotation_squelette_url && (
                                    <View style={{ width: seance.annotation_squelette_droit_url ? '48%' : '100%' }}>
                                        <Text style={{ fontSize: 10, marginBottom: 5, color: theme.textGrey, fontWeight: 'bold' }}>
                                            {seance.annotation_squelette_droit_url ? 'Profil Gauche' : 'Schéma'}
                                        </Text>
                                        <Image
                                            style={[styles.annotationImage, { height: 200, marginTop: 0 }]}
                                            src={seance.annotation_squelette_url}
                                        />
                                    </View>
                                )}

                                {/* Profil Droit */}
                                {seance.annotation_squelette_droit_url && (
                                    <View style={{ width: seance.annotation_squelette_url ? '48%' : '100%' }}>
                                        <Text style={{ fontSize: 10, marginBottom: 5, color: theme.textGrey, fontWeight: 'bold' }}>Profil Droit</Text>
                                        <Image
                                            style={[styles.annotationImage, { height: 200, marginTop: 0 }]}
                                            src={seance.annotation_squelette_droit_url}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Mesures Musculaires */}
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.colTitle}>Mesures musculaires :</Text>
                        <View style={styles.mesuresContainer}>
                            {/* Colonne Avant */}
                            <View style={styles.col}>
                                <Text style={[styles.label, { marginBottom: 6, fontSize: 10 }]}>Mesures avant</Text>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Av G :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_avant?.avant_gauche || '-'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Av D :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_avant?.avant_droit || '-'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Ar G :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_avant?.arriere_gauche || '-'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Ar D :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_avant?.arriere_droit || '-'}</Text>
                                </View>
                            </View>

                            {/* Colonne Après */}
                            <View style={styles.col}>
                                <Text style={[styles.label, { marginBottom: 6, fontSize: 10 }]}>Mesures après</Text>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Av G :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_apres?.avant_gauche || '-'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Av D :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_apres?.avant_droit || '-'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Ar G :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_apres?.arriere_gauche || '-'}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Ar D :</Text>
                                    <Text style={styles.valMesure}>{seance?.mesures_apres?.arriere_droit || '-'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Recommandations */}
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.colTitle}>Recommandations & Conseils :</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>{seance?.recommandations || '—'}</Text>
                        </View>
                    </View>

                    {/* Suivi */}
                    <View style={styles.section} wrap={false}>
                        <Text style={styles.colTitle}>Suivi conseillé :</Text>
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>{seance?.suivi || '—'}</Text>
                        </View>
                    </View>
                </View>

                {/* --- FOOTER --- */}
                <View style={styles.footerContainer} fixed>
                    <Text style={styles.footerText}>
                        Séance réalisée par {practitionerName}
                    </Text>
                    <Text style={styles.footerSubText}>
                        {practitionerContact}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default CompteRenduPDF;