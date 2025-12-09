import './polyfill'
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  console.log(`[TEST] Requête: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // CRUCIAL : On exclut les fichiers internes (_next), les images, les favicons, etc.
  // Sinon, Next.js ne peut pas charger ses propres scripts et renvoie 404 ou plante.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}