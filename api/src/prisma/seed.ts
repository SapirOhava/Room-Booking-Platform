import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is missing in .env');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  console.log('🧹 Clearing data...');
  await prisma.favorite.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating test user...');
  const passwordHash = await argon2.hash('password123');
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash,
      fullName: 'Sapir Test',
    },
  });
  console.log(`✅ Created user: ${user.email} / password: password123`);

  console.log('🏨 Creating rooms...');
  await prisma.room.createMany({
    data: [
      // Tel Aviv
      {
        name: 'Sea View Studio',
        city: 'Tel Aviv',
        capacity: 2,
        pricePerNight: 450,
        imageUrl:
          'https://images.unsplash.com/photo-1670600482855-dff9cc556137?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description:
          'Bright studio with a stunning Mediterranean sea view. Steps away from the beach promenade.',
      },
      {
        name: 'Rothschild Luxury Suite',
        city: 'Tel Aviv',
        capacity: 4,
        pricePerNight: 850,
        imageUrl:
          'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description:
          'Upscale suite on the iconic Rothschild Boulevard. Walking distance to top restaurants and nightlife.',
      },
      {
        name: 'Florentin Loft',
        city: 'Tel Aviv',
        capacity: 3,
        pricePerNight: 380,
        imageUrl:
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
        description:
          'Industrial-style loft in the heart of the artsy Florentin neighbourhood.',
      },

      // Jerusalem
      {
        name: 'Old City Gateway Room',
        city: 'Jerusalem',
        capacity: 2,
        pricePerNight: 320,
        imageUrl:
          'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop',
        description:
          'Charming stone-walled room within walking distance of the Old City walls.',
      },
      {
        name: 'Mount Scopus View Suite',
        city: 'Jerusalem',
        capacity: 4,
        pricePerNight: 620,
        imageUrl:
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
        description:
          'Panoramic views of the city. Quiet location perfect for a cultural getaway.',
      },

      // Eilat
      {
        name: 'Red Sea Bungalow',
        city: 'Eilat',
        capacity: 2,
        pricePerNight: 550,
        imageUrl:
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop',
        description:
          'Private bungalow 50 meters from the Red Sea beach. Perfect for snorkelling.',
      },
      {
        name: 'Eilat Family Resort Room',
        city: 'Eilat',
        capacity: 6,
        pricePerNight: 980,
        imageUrl:
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
        description:
          'Large family room with pool access and a separate kids sleeping area.',
      },

      // Paris
      {
        name: 'Marais Boutique Room',
        city: 'Paris',
        capacity: 2,
        pricePerNight: 290,
        imageUrl:
          'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format&fit=crop',
        description:
          'Cozy room in the trendy Le Marais district. Cafes and galleries at your doorstep.',
      },
      {
        name: 'Eiffel Tower View Suite',
        city: 'Paris',
        capacity: 2,
        pricePerNight: 720,
        imageUrl:
          'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&fit=crop',
        description:
          'Wake up to a direct view of the Eiffel Tower from your private balcony.',
      },

      // London
      {
        name: 'Shoreditch Creative Studio',
        city: 'London',
        capacity: 2,
        pricePerNight: 260,
        imageUrl:
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop',
        description:
          "Modern studio in London's coolest creative quarter. Great transport links.",
      },
      {
        name: 'Kensington Garden Apartment',
        city: 'London',
        capacity: 4,
        pricePerNight: 590,
        imageUrl:
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
        description:
          'Classic London apartment overlooking a private garden square in Kensington.',
      },

      // Barcelona
      {
        name: 'Gothic Quarter Hideaway',
        city: 'Barcelona',
        capacity: 2,
        pricePerNight: 210,
        imageUrl:
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop',
        description:
          'Authentic room in a historic building in the Gothic Quarter. Explore the city on foot.',
      },
      {
        name: 'Barceloneta Beachfront Room',
        city: 'Barcelona',
        capacity: 3,
        pricePerNight: 390,
        imageUrl:
          'https://images.unsplash.com/photo-1689737969303-a32ea2f78f0a?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description:
          'Modern room 2 minutes from Barceloneta beach. Summer vibes all year round.',
      },

      // Amsterdam
      {
        name: 'Canal House Studio',
        city: 'Amsterdam',
        capacity: 2,
        pricePerNight: 280,

        imageUrl:
          'https://plus.unsplash.com/premium_photo-1661887237533-b38811c27add?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        description:
          'Charming studio in a 17th-century canal house in the Jordaan neighbourhood.',
      },
      {
        name: 'Vondelpark Apartment',
        city: 'Amsterdam',
        capacity: 4,
        pricePerNight: 460,
        imageUrl:
          'https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800&auto=format&fit=crop',
        description:
          'Spacious apartment adjacent to Vondelpark. Bikes included.',
      },

      // New York
      {
        name: 'Manhattan Midtown Studio',
        city: 'New York',
        capacity: 2,
        pricePerNight: 420,
        imageUrl:
          'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&auto=format&fit=crop',
        description:
          'Compact but well-designed studio in the heart of Midtown Manhattan.',
      },
      {
        name: 'Brooklyn Loft',
        city: 'New York',
        capacity: 4,
        pricePerNight: 510,
        imageUrl:
          'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&auto=format&fit=crop',
        description:
          'Spacious industrial loft in Williamsburg with Manhattan skyline views.',
      },

      // Tokyo
      {
        name: 'Shinjuku Modern Pod Suite',
        city: 'Tokyo',
        capacity: 1,
        pricePerNight: 180,
        imageUrl:
          'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop',
        description:
          "Smart and compact suite in bustling Shinjuku. Everything you need, nothing you don't.",
      },
      {
        name: 'Shibuya Apartment',
        city: 'Tokyo',
        capacity: 3,
        pricePerNight: 350,
        imageUrl:
          'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&auto=format&fit=crop',
        description:
          'Modern apartment minutes from Shibuya Crossing. Full kitchen and fast WiFi.',
      },

      // Lisbon
      {
        name: 'Alfama Tiled Apartment',
        city: 'Lisbon',
        capacity: 2,
        pricePerNight: 195,
        imageUrl:
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop',
        description:
          'Traditional azulejo-tiled apartment in the historic Alfama district with castle views.',
      },
    ],
  });

  const roomCount = await prisma.room.count();
  const userCount = await prisma.user.count();

  console.log('\n📊 Database Summary:');
  console.log(`   Users:  ${userCount}`);
  console.log(`   Rooms:  ${roomCount}`);
  console.log('\n✅ Seed complete!');
  console.log('💡 Login with: test@example.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database ', e);
    await prisma.$disconnect();
    process.exit(1);
  });
