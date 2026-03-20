import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing in .env');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const rooms = [
    {
      name: 'Sea View Room',
      city: 'Tel Aviv',
      capacity: 2,
      pricePerNight: 450.0,
      description: 'Nice room near the beach',
    },
    {
      name: 'Business Suite',
      city: 'Tel Aviv',
      capacity: 4,
      pricePerNight: 700.0,
      description: 'Large suite for families',
    },
    {
      name: 'Jerusalem Studio',
      city: 'Jerusalem',
      capacity: 2,
      pricePerNight: 350.0,
      description: 'Small and cozy studio',
    },
    {
      name: 'Haifa Budget Room',
      city: 'Haifa',
      capacity: 1,
      pricePerNight: 220.0,
      description: 'Affordable room for solo travelers',
    },
    {
      name: 'Eilat Family Room',
      city: 'Eilat',
      capacity: 5,
      pricePerNight: 950.0,
      description: 'Spacious room for a family vacation',
    },
  ];

  console.log('🧹 Clearing rooms...');
  await prisma.room.deleteMany();

  console.log('🏨 Creating rooms...');
  await prisma.room.createMany({
    data: rooms,
  });

  const roomCount = await prisma.room.count();

  console.log('\n📊 Database Summary:');
  console.log(`   Rooms: ${roomCount}`);
  console.log('\n✅ Seed complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
