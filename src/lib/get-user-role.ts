import { createSupabaseServerClient } from './supabase/server'
import { prisma } from './prisma'

export type UserRole = 'ADMIN' | 'EXPEDICAO'

export async function getUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Buscar role do usuário no banco
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email || '' },
      select: { role: true }
    })

    return dbUser?.role as UserRole || null
  } catch (error) {
    console.error('[getUserRole] Erro:', error)
    return null
  }
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'ADMIN'
}

export async function isExpedicao(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'EXPEDICAO'
}
