import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export default async function UsuariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar se é ADMIN
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/')
  }

  return <>{children}</>
}
