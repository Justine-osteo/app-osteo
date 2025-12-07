import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import LayoutClient from '@/components/admin/LayoutClient'

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const supabase = await createServerSupabase() // ✅ await ajouté ici

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const ADMIN_ID = 'a0b59794-d81d-4b26-9a58-da05260c7ea7'

    if (!user || user.id !== ADMIN_ID) {
        redirect('/')
    }

    return <LayoutClient>{children}</LayoutClient>
}
