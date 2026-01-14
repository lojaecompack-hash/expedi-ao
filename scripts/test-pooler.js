const { PrismaClient } = require('@prisma/client')

// Testar com pooler (porta 6543)
const urlPooler = 'postgresql://postgres:%40Bruno0154@db.lholkeljnuevtcu.supabase.co:6543/postgres?pgbouncer=true'

console.log('Testando conexão com POOLER (porta 6543)...')
console.log('URL:', urlPooler)

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: urlPooler
    }
  }
})

async function test() {
  try {
    await prisma.$connect()
    console.log('✅ Conexão com POOLER OK!')
    const count = await prisma.workspace.count()
    console.log('✅ Workspaces no banco:', count)
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
