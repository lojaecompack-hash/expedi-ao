require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

console.log('DATABASE_URL presente:', Boolean(process.env.DATABASE_URL))
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0)
console.log('DATABASE_URL start:', process.env.DATABASE_URL?.substring(0, 50))

const prisma = new PrismaClient({})

async function test() {
  try {
    await prisma.$connect()
    console.log('✅ Conexão com banco OK')
    const count = await prisma.workspace.count()
    console.log('✅ Workspaces no banco:', count)
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
