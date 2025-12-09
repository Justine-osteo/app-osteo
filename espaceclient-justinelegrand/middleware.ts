import './polyfill' // On garde le vaccin pour éviter le crash technique

import { NextRequest, NextResponse } from "next/server"

// 🛑 MODE TEST : On laisse tout passer pour vérifier si les pages existent
export async function middleware(request: NextRequest) {

  console.log(`[TEST ROUTING] Requête reçue pour : ${request.nextUrl.pathname}`);

  // On NE FAIT RIEN. Pas de Supabase. Pas de redirection.
  // On laisse juste Next.js afficher la page demandée.
  return NextResponse.next();
}

export const config = {
  // On écoute tout
  matcher: ["/:path*"],
}