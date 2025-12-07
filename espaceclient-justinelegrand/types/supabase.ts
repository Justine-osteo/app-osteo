export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      animaux: {
        Row: {
          activite: string | null
          antecedents: string | null
          archive: boolean | null
          client_id: string
          date_naissance: string | null
          espece: string | null
          id: string
          modification_en_attente: boolean
          nom: string
          notes_admin: string | null
          photo_url: string | null
          poids: number | null
          race: string | null
          remarques: string | null
          sexe: string | null
          sterilise: boolean | null
        }
        Insert: {
          activite?: string | null
          antecedents?: string | null
          archive?: boolean | null
          client_id: string
          date_naissance?: string | null
          espece?: string | null
          id?: string
          modification_en_attente?: boolean
          nom: string
          notes_admin?: string | null
          photo_url?: string | null
          poids?: number | null
          race?: string | null
          remarques?: string | null
          sexe?: string | null
          sterilise?: boolean | null
        }
        Update: {
          activite?: string | null
          antecedents?: string | null
          archive?: boolean | null
          client_id?: string
          date_naissance?: string | null
          espece?: string | null
          id?: string
          modification_en_attente?: boolean
          nom?: string
          notes_admin?: string | null
          photo_url?: string | null
          poids?: number | null
          race?: string | null
          remarques?: string | null
          sexe?: string | null
          sterilise?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "animaux_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      avis: {
        Row: {
          client_id: string
          commentaire: string | null
          cree_le: string
          id: string
          note: number
          seance_id: string | null
        }
        Insert: {
          client_id: string
          commentaire?: string | null
          cree_le?: string
          id?: string
          note: number
          seance_id?: string | null
        }
        Update: {
          client_id?: string
          commentaire?: string | null
          cree_le?: string
          id?: string
          note?: number
          seance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          archive: boolean | null
          auth_id: string
          couleur_preferee: string | null
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          nom: string
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          archive?: boolean | null
          auth_id: string
          couleur_preferee?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_admin?: boolean | null
          nom: string
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          archive?: boolean | null
          auth_id?: string
          couleur_preferee?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          nom?: string
          telephone?: string | null
        }
        Relationships: []
      }
      dashboard_notes: {
        Row: {
          content: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          id: number
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          animal_id: string | null
          client_id: string | null
          id: string
          nom: string
          seance_id: string | null
          url: string
        }
        Insert: {
          animal_id?: string | null
          client_id?: string | null
          id?: string
          nom: string
          seance_id?: string | null
          url: string
        }
        Update: {
          animal_id?: string | null
          client_id?: string | null
          id?: string
          nom?: string
          seance_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animaux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          client_id: string
          cree_le: string
          date_creation: string
          id: string
          nom_fichier: string
          seance_id: string | null
          url_fichier: string
        }
        Insert: {
          client_id: string
          cree_le?: string
          date_creation?: string
          id?: string
          nom_fichier: string
          seance_id?: string | null
          url_fichier: string
        }
        Update: {
          client_id?: string
          cree_le?: string
          date_creation?: string
          id?: string
          nom_fichier?: string
          seance_id?: string | null
          url_fichier?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: true
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      modifications_animaux: {
        Row: {
          animal_id: string
          client_id: string
          cree_le: string | null
          donnees: Json
          id: string
          photo_url: string | null
          statut: string
          traite_le: string | null
        }
        Insert: {
          animal_id: string
          client_id: string
          cree_le?: string | null
          donnees: Json
          id?: string
          photo_url?: string | null
          statut?: string
          traite_le?: string | null
        }
        Update: {
          animal_id?: string
          client_id?: string
          cree_le?: string | null
          donnees?: Json
          id?: string
          photo_url?: string | null
          statut?: string
          traite_le?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifications_animaux_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animaux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifications_animaux_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_analyses: {
        Row: {
          analyse_data: Json | null
          conclusion: string | null
          created_at: string
          id: string
          nom_aliment: string | null
          seance_id: string
          type_aliment: string | null
        }
        Insert: {
          analyse_data?: Json | null
          conclusion?: string | null
          created_at?: string
          id?: string
          nom_aliment?: string | null
          seance_id: string
          type_aliment?: string | null
        }
        Update: {
          analyse_data?: Json | null
          conclusion?: string | null
          created_at?: string
          id?: string
          nom_aliment?: string | null
          seance_id?: string
          type_aliment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_analyses_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_recommandations: {
        Row: {
          analyse_data: Json | null
          avantages: string | null
          budget_mensuel: string | null
          created_at: string
          id: string
          inconvenients: string | null
          mon_avis: string | null
          ration_data: Json | null
          seance_id: string
          titre: string | null
        }
        Insert: {
          analyse_data?: Json | null
          avantages?: string | null
          budget_mensuel?: string | null
          created_at?: string
          id?: string
          inconvenients?: string | null
          mon_avis?: string | null
          ration_data?: Json | null
          seance_id: string
          titre?: string | null
        }
        Update: {
          analyse_data?: Json | null
          avantages?: string | null
          budget_mensuel?: string | null
          created_at?: string
          id?: string
          inconvenients?: string | null
          mon_avis?: string | null
          ration_data?: Json | null
          seance_id?: string
          titre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_recommandations_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          id: string
          reponses: Json
          seance_id: string
          type: string
        }
        Insert: {
          id?: string
          reponses: Json
          seance_id: string
          type: string
        }
        Update: {
          id?: string
          reponses?: Json
          seance_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_seance_id_fkey"
            columns: ["seance_id"]
            isOneToOne: false
            referencedRelation: "seances"
            referencedColumns: ["id"]
          },
        ]
      }
      seances: {
        Row: {
          animal_id: string
          annotation_squelette_url: string | null
          date: string
          id: string
          images_ulrs: string | null
          mesure_ant_droite_apres: number | null
          mesure_ant_droite_avant: number | null
          mesure_ant_gauche_apres: number | null
          mesure_ant_gauche_avant: number | null
          mesure_post_droite_apres: number | null
          mesure_post_droite_avant: number | null
          mesure_post_gauche_apres: number | null
          mesure_post_gauche_avant: number | null
          motif: string | null
          notes_admin: string | null
          nutrition_analyse_actuelle: Json | null
          nutrition_besoins: Json | null
          nutrition_objectifs: string | null
          nutrition_recommandations: Json | null
          observations: string | null
          observations_osteo: string | null
          recommandations: string | null
          suivi: string | null
          type: Database["public"]["Enums"]["type_seance"] | null
        }
        Insert: {
          animal_id: string
          annotation_squelette_url?: string | null
          date: string
          id?: string
          images_ulrs?: string | null
          mesure_ant_droite_apres?: number | null
          mesure_ant_droite_avant?: number | null
          mesure_ant_gauche_apres?: number | null
          mesure_ant_gauche_avant?: number | null
          mesure_post_droite_apres?: number | null
          mesure_post_droite_avant?: number | null
          mesure_post_gauche_apres?: number | null
          mesure_post_gauche_avant?: number | null
          motif?: string | null
          notes_admin?: string | null
          nutrition_analyse_actuelle?: Json | null
          nutrition_besoins?: Json | null
          nutrition_objectifs?: string | null
          nutrition_recommandations?: Json | null
          observations?: string | null
          observations_osteo?: string | null
          recommandations?: string | null
          suivi?: string | null
          type?: Database["public"]["Enums"]["type_seance"] | null
        }
        Update: {
          animal_id?: string
          annotation_squelette_url?: string | null
          date?: string
          id?: string
          images_ulrs?: string | null
          mesure_ant_droite_apres?: number | null
          mesure_ant_droite_avant?: number | null
          mesure_ant_gauche_apres?: number | null
          mesure_ant_gauche_avant?: number | null
          mesure_post_droite_apres?: number | null
          mesure_post_droite_avant?: number | null
          mesure_post_gauche_apres?: number | null
          mesure_post_gauche_avant?: number | null
          motif?: string | null
          notes_admin?: string | null
          nutrition_analyse_actuelle?: Json | null
          nutrition_besoins?: Json | null
          nutrition_objectifs?: string | null
          nutrition_recommandations?: Json | null
          observations?: string | null
          observations_osteo?: string | null
          recommandations?: string | null
          suivi?: string | null
          type?: Database["public"]["Enums"]["type_seance"] | null
        }
        Relationships: [
          {
            foreignKeyName: "seances_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animaux"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_client_id: { Args: never; Returns: string }
      is_admin_user: { Args: never; Returns: boolean }
    }
    Enums: {
      type_seance: "osteopathie" | "nutrition"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      type_seance: ["osteopathie", "nutrition"],
    },
  },
} as const
