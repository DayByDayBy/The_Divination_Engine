import { PrismaClient, CardType } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface RawCard {
  name: string;
  nameShort: string;
  value: string;
  intValue: number;
  type: string;
  suit?: string;
  meaningUp: string;
  meaningRev: string;
  description?: string;
}

async function main() {
  const filePath = join(__dirname, '..', 'resources', 'cardList.json');
  const raw: RawCard[] = JSON.parse(readFileSync(filePath, 'utf-8'));

  console.log(`Found ${raw.length} cards in cardList.json`);

  const existing = await prisma.card.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} cards — skipping seed.`);
    return;
  }

  const cards = raw.map((c) => ({
    name: c.name,
    nameShort: c.nameShort,
    value: c.value,
    intValue: c.intValue,
    type: c.type.toUpperCase() as CardType,
    suit: c.suit ?? null,
    meaningUp: c.meaningUp,
    meaningRev: c.meaningRev,
    description: c.description ?? null,
  }));

  const result = await prisma.card.createMany({ data: cards });
  console.log(`✅ Seeded ${result.count} cards into the database.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
