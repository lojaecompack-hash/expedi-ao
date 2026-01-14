require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const currentUrl = process.env.DATABASE_URL
console.log('URL atual:', currentUrl)
console.log('Length:', currentUrl?.length)

// Tentar com pooler (porta 6543)
const poolerUrl = currentUrl?.replace(':5432/', ':6543/') + '?pgbouncer=true'
console.log('\nTestando com POOLER (porta 6543)...')
console.log('URL pooler:', poolerUrl)

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: poolerUrl
    }
  }
})

async function test() {
  try {
    await prisma.$connect()
    console.log('\n✅ SUCESSO! Conexão com POOLER funcionou!')
    const count = await prisma.workspace.count()
    console.log('✅ Workspaces no banco:', count)
    console.log('\n📝 AÇÃO: Atualize o .env.local para usar porta 6543:')
    console.log(poolerUrl)
  } catch (error) {
    console.error('\n❌ Pooler também falhou:', error.message)
    console.log('\n🔧 SOLUÇÃO: Vamos simplificar o sistema para funcionar sem banco por enquanto')
  } finally {
    await prisma.$disconnect()
  }
}

test()
