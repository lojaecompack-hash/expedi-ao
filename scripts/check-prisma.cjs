const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({})

async function main() {
  console.log('hasWorkspace', Boolean(prisma.workspace))
  console.log('hasMembership', Boolean(prisma.membership))
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  try {
    await prisma.$disconnect()
  } catch {}
  process.exit(1)
})
