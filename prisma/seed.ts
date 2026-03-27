import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.category.count()
  if (count > 0) return

  await prisma.category.createMany({
    data: [
      { name: 'Work', color: '#3b82f6' },
      { name: 'Personal', color: '#10b981' },
      { name: 'Shopping', color: '#f59e0b' },
      { name: 'Health', color: '#ef4444' },
    ],
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e)
    void prisma.$disconnect()
    process.exit(1)
  })
