import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export function createAdminClient() {
    // If service role key is not available, fall back to regular client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
        console.warn('Service role key not configured, using regular client')
        return createClient()
    }
    
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
