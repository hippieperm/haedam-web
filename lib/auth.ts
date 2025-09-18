import { createClient } from './supabase/server'
import { User } from '@supabase/supabase-js'

export type UserRole = 'USER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  name?: string
  nickname?: string
  phone?: string
  profile_image?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return profile
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

export async function getCurrentAuthUser(): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error fetching auth user:', error)
    return null
  }
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('인증이 필요합니다.')
  }
  return user
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('관리자 권한이 필요합니다.')
  }
  return user
}

export async function requireSeller(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'SELLER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('판매자 권한이 필요합니다.')
  }
  return user
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
