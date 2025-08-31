import { PrismaClient, Floor } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.customOrder.deleteMany();
  await prisma.table.deleteMany();
  await prisma.drinkPackage.deleteMany();
  await prisma.spirit.deleteMany();
  await prisma.champagne.deleteMany();
  await prisma.customer.deleteMany();

  // Seed Tables - Upstairs
  const upstairsTables = [
    { tableNumber: 1, capacityMin: 4, capacityMax: 12, description: 'Dance floor premium booth', features: ['Prime location', 'Dance floor view'], isVip: true },
    { tableNumber: 2, capacityMin: 4, capacityMax: 8, description: 'Dance floor side high table', features: ['Great views', 'Side position'] },
    { tableNumber: 3, capacityMin: 4, capacityMax: 8, description: 'Dance floor side high table', features: ['Next to DJ', 'Side position'] },
    { tableNumber: 4, capacityMin: 4, capacityMax: 8, description: 'Dance floor front high table', features: ['Next to DJ', 'Front position'] },
    { tableNumber: 5, capacityMin: 4, capacityMax: 10, description: 'Dance floor front large high table', features: ['Central location', 'Large table'] },
    { tableNumber: 6, capacityMin: 2, capacityMax: 4, description: 'Barrel bar area', features: ['Intimate setting', 'Bar area'] },
    { tableNumber: 7, capacityMin: 2, capacityMax: 4, description: 'Barrel bar area', features: ['Intimate setting', 'Bar area'] },
    { tableNumber: 8, capacityMin: 2, capacityMax: 4, description: 'Barrel bar area', features: ['Intimate setting', 'Bar area'] },
    { tableNumber: 9, capacityMin: 4, capacityMax: 10, description: 'Large booth', features: ['Near bar', 'Terrace access', 'Near ladies'] },
    { tableNumber: 10, capacityMin: 4, capacityMax: 12, description: 'Premium Ciroc booth', features: ['Bar area VIP', 'Premium location'], isVip: true },
  ];

  for (const table of upstairsTables) {
    await prisma.table.create({
      data: {
        ...table,
        floor: Floor.UPSTAIRS,
      },
    });
  }

  // Seed Tables - Downstairs
  const downstairsTables = [
    { tableNumber: 11, capacityMin: 2, capacityMax: 8, description: 'Intimate booth', features: ['Opposite bar', 'Cozy atmosphere'] },
    { tableNumber: 12, capacityMin: 2, capacityMax: 8, description: 'Intimate booth', features: ['Opposite bar', 'Cozy atmosphere'] },
    { tableNumber: 13, capacityMin: 2, capacityMax: 8, description: 'Dancefloor booth', features: ['Next to DJ', 'Dance floor view'] },
    { tableNumber: 14, capacityMin: 2, capacityMax: 8, description: 'Dance floor booth', features: ['Near facilities', 'Dance floor view'] },
    { tableNumber: 15, capacityMin: 2, capacityMax: 6, description: 'Curved seating', features: ['Next to bar', 'Can combine with table 16'], canCombineWith: [16] },
    { tableNumber: 16, capacityMin: 2, capacityMax: 6, description: 'Curved seating', features: ['Next to bar', 'Can combine with table 15'], canCombineWith: [15] },
  ];

  for (const table of downstairsTables) {
    await prisma.table.create({
      data: {
        ...table,
        floor: Floor.DOWNSTAIRS,
      },
    });
  }

  // Seed Drink Packages
  const packages = [
    {
      name: 'Hush & Shush',
      price: 170,
      description: 'Perfect starter package with vodka, prosecco and shots',
      includes: {
        items: [
          'Bottle of Smirnoff',
          '2 x jugs mixer',
          'Bottle of Prosecco',
          '8 x Tequila Rose shots'
        ]
      },
      sortOrder: 1
    },
    {
      name: 'Speak Whiskey To Me',
      price: 280,
      description: 'Premium whiskey and rum combination',
      includes: {
        items: [
          'Bottle of Jack Daniels',
          'Bottle of Bacardi Spiced',
          '4 x jugs mixer'
        ]
      },
      sortOrder: 2
    },
    {
      name: 'After Hours',
      price: 400,
      description: 'Espresso martinis and premium vodka',
      includes: {
        items: [
          '8 x Grey Goose Espresso Martini',
          'Bottle of Ciroc',
          'Bottle of Ciroc Flavours',
          '4 x jugs mixer'
        ]
      },
      sortOrder: 3
    },
    {
      name: 'Midnight Madness',
      price: 580,
      description: 'Ultimate VIP package with premium spirits',
      includes: {
        items: [
          'Bottle of Premium Spirit',
          'Bottle of Moet',
          'Bottle Don Julio Blanco',
          'Bottle of Hennessy VS',
          '6 x jugs mixer'
        ]
      },
      sortOrder: 4
    },
    {
      name: 'Cocktail Tree',
      price: 120,
      description: 'Spectacular cocktail presentation',
      includes: {
        items: ['12 x Grey Goose Espresso Martini']
      },
      sortOrder: 5
    },
    {
      name: 'House G&T',
      price: 40,
      description: 'Classic gin and tonic selection',
      includes: {
        items: ['4 x double Tanqueray & tonic']
      },
      sortOrder: 6
    },
    {
      name: 'Pieces of 8',
      price: 50,
      description: 'Premium rum experience',
      includes: {
        items: ['4 x double Bacardi 8', '2 cans ginger beer']
      },
      sortOrder: 7
    },
    {
      name: 'Ting Wray',
      price: 50,
      description: 'Caribbean special',
      includes: {
        items: ['4x double Wray & Nephew', '2 cans Ting']
      },
      sortOrder: 8
    }
  ];

  for (const pkg of packages) {
    await prisma.drinkPackage.create({ data: pkg });
  }

  // Seed Spirits
  const spirits = [
    // Vodka
    { category: 'Vodka', brand: 'Smirnoff', name: 'Smirnoff', price: 120 },
    { category: 'Vodka', brand: 'Belvedere', name: 'Belvedere', price: 160 },
    { category: 'Vodka', brand: 'Ciroc', name: 'Ciroc', price: 160 },
    { category: 'Vodka', brand: 'Ciroc', name: 'Ciroc Flavours', price: 170 },
    { category: 'Vodka', brand: 'Grey Goose', name: 'Grey Goose', price: 180 },
    
    // Rum
    { category: 'Rum', brand: 'Bacardi', name: 'Bacardi', price: 140 },
    { category: 'Rum', brand: 'Bacardi', name: 'Bacardi Spiced', price: 140 },
    { category: 'Rum', brand: 'Bacardi', name: 'Bacardi 8', price: 180 },
    { category: 'Rum', brand: 'Sailor Jerry', name: 'Sailor Jerry', price: 140 },
    { category: 'Rum', brand: 'Havana Club', name: 'Havana 7', price: 160 },
    
    // Gin
    { category: 'Gin', brand: 'Tanqueray', name: 'Tanqueray', price: 130 },
    { category: 'Gin', brand: 'Tanqueray', name: 'Tanqueray Sevilla', price: 140 },
    { category: 'Gin', brand: "Gordon's", name: "Gordon's Pink", price: 150 },
    { category: 'Gin', brand: 'Hendricks', name: 'Hendricks', price: 150 },
    { category: 'Gin', brand: 'Whitley Neill', name: 'Whitley Neill Flavours', price: 150 },
    
    // Cognac
    { category: 'Cognac', brand: 'Courvoisier', name: 'Courvoisier VS', price: 150 },
    { category: 'Cognac', brand: 'Hennessy', name: 'Hennessy VS', price: 170 },
    { category: 'Cognac', brand: 'Hennessy', name: 'Hennessy XO', price: 500 },
    
    // Whiskey
    { category: 'Whiskey', brand: 'Jim Beam', name: 'Jim Beam White', price: 130 },
    { category: 'Whiskey', brand: 'Makers Mark', name: 'Makers Mark', price: 160 },
    { category: 'Whiskey', brand: 'Jack Daniels', name: 'Jack Daniels', price: 160 },
    { category: 'Whiskey', brand: 'Jameson', name: 'Jameson', price: 160 },
    { category: 'Whiskey', brand: 'Johnnie Walker', name: 'Johnnie Walker Black', price: 170 },
    { category: 'Whiskey', brand: 'Johnnie Walker', name: 'Johnnie Walker Blue', price: 550 },
    
    // Tequila
    { category: 'Tequila', brand: 'El Jimador', name: 'El Jimador', price: 130 },
    { category: 'Tequila', brand: 'Don Julio', name: 'Don Julio Blanco', price: 220 },
    { category: 'Tequila', brand: 'Don Julio', name: 'Don Julio Reposado', price: 240 },
    { category: 'Tequila', brand: 'Don Julio', name: 'Don Julio 1942', price: 600 },
    
    // Liqueurs
    { category: 'Liqueurs', brand: 'Jagermeister', name: 'Jagermeister', price: 130 },
    { category: 'Liqueurs', brand: 'Disaronno', name: 'Disaronno', price: 150 },
    { category: 'Liqueurs', brand: 'Cazcabel', name: 'Cazcabel Coffee', price: 160 },
  ];

  for (const spirit of spirits) {
    await prisma.spirit.create({ data: spirit });
  }

  // Seed Champagnes
  const champagnes = [
    { brand: 'Perrier Jouet', name: 'Perrier Jouet', price: 85 },
    { brand: 'Belaire', name: 'Belaire Rose', price: 90 },
    { brand: 'Taittinger', name: 'Taittinger', price: 90 },
    { brand: 'Taittinger', name: 'Taittinger Rose', price: 95 },
    { brand: 'Moet', name: 'Moet', price: 90 },
    { brand: 'Veuve Clicquot', name: 'Veuve Clicquot', price: 95 },
    { brand: 'Laurent Perrier', name: 'Laurent Perrier Rose', price: 120 },
    { brand: 'Dom Perignon', name: 'Dom Perignon', price: 250 },
  ];

  for (const champagne of champagnes) {
    await prisma.champagne.create({ data: champagne });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created ${upstairsTables.length + downstairsTables.length} tables`);
  console.log(`🍾 Created ${packages.length} drink packages`);
  console.log(`🥃 Created ${spirits.length} spirits`);
  console.log(`🍾 Created ${champagnes.length} champagnes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });