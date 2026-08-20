import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const targets = [
  {
    name: 'WatchAniTrack',
    url: 'https://watchanitrack.com',
    checkIntervalSeconds: 60,
  },
  {
    name: 'GitHub Profile',
    url: 'https://github.com/Jashanpreetsingh-9',
    checkIntervalSeconds: 60,
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    checkIntervalSeconds: 300,
  },
  {
    name: 'npm',
    url: 'https://www.npmjs.com',
    checkIntervalSeconds: 300,
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    checkIntervalSeconds: 300,
  },
];

async function main() {
  for (const target of targets) {
    const existing = await prisma.target.findFirst({
      where: { url: target.url },
    });

    if (!existing) {
      await prisma.target.create({ data: target });
    }
  }

  console.log(`Seeded ${targets.length} targets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
