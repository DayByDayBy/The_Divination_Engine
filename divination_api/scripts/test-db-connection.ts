#!/usr/bin/env tsx

import { testDatabaseConnection, prisma } from '../src/lib/db'

async function main() {
  console.log('Testing database connection...\n')
  
  // Test basic connection
  const isConnected = await testDatabaseConnection()
  
  if (!isConnected) {
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Test basic query
  try {
    const cardCount = await prisma.card.count()
    console.log(`Found ${cardCount} cards in the database`)
    
    const userCount = await prisma.user.count()
    console.log(`Found ${userCount} users in the database`)
    
    const readingCount = await prisma.reading.count()
    console.log(`Found ${readingCount} readings in the database`)
    
    console.log('\nAll database tests passed!')
  } catch (error) {
    console.error('\n❌ Database query failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
