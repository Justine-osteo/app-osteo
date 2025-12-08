import { clsx, type ClassValue } from "clsx"
import {
  extendTailwindMerge,
  // Correction: TailwindMergeConfig a été remplacé par 'Config' dans les versions récentes de tailwind-merge
  type Config,
} from "tailwind-merge"

// Définition de l'objet de configuration pour permettre à TypeScript d'inférer les clés
const tailwindMergeConfig = {
  classGroups: {
    btn: ["btn-primary", "btn-secondary", "btn-muted"],
    backgroundColor: [
      "bg-rose-500",
      "bg-rose-300",
      "bg-[#F3D8DD]",
      "bg-[#B05F63]",
      "bg-[#6E4B42]",
    ],
    textColor: [
      "text-black",
      "text-white",
      "text-muted",
      "text-rose-500",
      "text-[#6E4B42]",
    ],
    borderColor: [
      "border-[#6E4B42]",
      "border-[#B05F63]",
      "border-rose-500",
    ],
  },
}

// Extraction des ClassGroupIds pour le type générique Config
type ClassGroupIds = keyof typeof tailwindMergeConfig.classGroups

// CORRECTION FINALE: Utilisation de 'as any' sur la configuration pour contourner
// l'exigence des propriétés optionnelles (cacheSize, theme, etc.) de l'interface Config.
const customTwMerge = extendTailwindMerge(tailwindMergeConfig as any)

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(...inputs))
}