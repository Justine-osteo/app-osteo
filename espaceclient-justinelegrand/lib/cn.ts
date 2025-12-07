import { clsx, type ClassValue } from "clsx"
import {
  extendTailwindMerge,
  type TailwindMergeConfig, // ✅ le bon type ici
} from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
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
} satisfies TailwindMergeConfig) // ✅ ne PAS utiliser juste `Config`

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(...inputs))
}

