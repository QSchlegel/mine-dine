import { PrismaClient, UserRole, TagCategory, DinnerStatus, BookingStatus, SwipeActionType, ProfileVisibility } from '@prisma/client'

const prisma = new PrismaClient()

// Profile images from Unsplash (food/chef themed)
const profileImages = [
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1583394293214-28ez560eb5f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
]

// Cover images (food/kitchen themed)
const coverImages = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1482049016-b5a13a28aae7?w=1200&h=400&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&h=400&fit=crop',
]

// Dinner images
const dinnerImages = [
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop', // Pasta
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop', // Salad
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', // Pancakes
  'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&h=600&fit=crop', // Burger
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&h=600&fit=crop', // Sushi
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop', // Indian
  'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=600&fit=crop', // Pasta 2
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop', // Healthy bowl
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop', // Pizza
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Fine dining
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', // Shared table
  'https://images.unsplash.com/photo-1482049016-b5a13a28aae7?w=800&h=600&fit=crop', // Brunch spread
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=600&fit=crop', // Food table
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', // Kitchen table
]

// Simple seeded RNG to keep seed data deterministic across runs.
const createSeededRng = (seed: number) => {
  let state = seed >>> 0
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
  return {
    next,
    int: (max: number) => Math.floor(next() * Math.max(1, max)),
    pick: <T,>(items: T[]) => items[Math.floor(next() * items.length)],
    shuffle: <T,>(items: T[]) => {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1))
        const temp = copy[i]
        copy[i] = copy[j]
        copy[j] = temp
      }
      return copy
    },
  }
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.message.deleteMany()
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.swipeAction.deleteMany()
  await prisma.groceryBill.deleteMany()
  await prisma.dinnerAddOn.deleteMany()
  await prisma.dinnerTag.deleteMany()
  await prisma.dinner.deleteMany()
  await prisma.userTag.deleteMany()
  await prisma.hostApplication.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()

  // Create Tags
  console.log('🏷️  Creating tags...')
  const tagsData = [
    // Cuisine tags
    { name: 'Italian', category: TagCategory.CUISINE },
    { name: 'French', category: TagCategory.CUISINE },
    { name: 'Japanese', category: TagCategory.CUISINE },
    { name: 'Mexican', category: TagCategory.CUISINE },
    { name: 'Indian', category: TagCategory.CUISINE },
    { name: 'Thai', category: TagCategory.CUISINE },
    { name: 'Mediterranean', category: TagCategory.CUISINE },
    { name: 'American', category: TagCategory.CUISINE },
    { name: 'Chinese', category: TagCategory.CUISINE },
    { name: 'Korean', category: TagCategory.CUISINE },
    // Dietary tags
    { name: 'Vegetarian', category: TagCategory.DIETARY },
    { name: 'Vegan', category: TagCategory.DIETARY },
    { name: 'Gluten-Free', category: TagCategory.DIETARY },
    { name: 'Dairy-Free', category: TagCategory.DIETARY },
    { name: 'Nut-Free', category: TagCategory.DIETARY },
    { name: 'Pescatarian', category: TagCategory.DIETARY },
    { name: 'Keto', category: TagCategory.DIETARY },
    { name: 'Halal', category: TagCategory.DIETARY },
    // Interest tags
    { name: 'Wine Lover', category: TagCategory.INTEREST },
    { name: 'Foodie', category: TagCategory.INTEREST },
    { name: 'Cooking Enthusiast', category: TagCategory.INTEREST },
    { name: 'Spice Lover', category: TagCategory.INTEREST },
    { name: 'Fine Dining', category: TagCategory.INTEREST },
    { name: 'Street Food', category: TagCategory.INTEREST },
    { name: 'Organic', category: TagCategory.INTEREST },
    { name: 'Farm to Table', category: TagCategory.INTEREST },
    { name: 'Craft Beer', category: TagCategory.INTEREST },
    // Lifestyle tags
    { name: 'Social', category: TagCategory.LIFESTYLE },
    { name: 'Intimate Gatherings', category: TagCategory.LIFESTYLE },
    { name: 'Family Friendly', category: TagCategory.LIFESTYLE },
    { name: 'Date Night', category: TagCategory.LIFESTYLE },
    { name: 'Business Casual', category: TagCategory.LIFESTYLE },
    { name: 'Adventure Seeker', category: TagCategory.LIFESTYLE },
    // Skill tags
    { name: 'Professional Chef', category: TagCategory.SKILL },
    { name: 'Home Cook', category: TagCategory.SKILL },
    { name: 'Pastry Expert', category: TagCategory.SKILL },
    { name: 'BBQ Master', category: TagCategory.SKILL },
    { name: 'Sommelier', category: TagCategory.SKILL },
    { name: 'Baker', category: TagCategory.SKILL },
  ]

  const tags = await Promise.all(
    tagsData.map(tag => prisma.tag.create({ data: tag }))
  )
  console.log(`   Created ${tags.length} tags`)

  // Create Users
  console.log('👤 Creating users...')

  // Create admin user (email can be overridden via FIRST_ADMIN_EMAIL)
  const adminEmail = (process.env.FIRST_ADMIN_EMAIL || 'admin@minedine.com').toLowerCase()
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Mine Dine Admin',
      bio: 'Platform administrator',
      role: UserRole.ADMIN,
      profileImageUrl: profileImages[0],
      emailVerified: true,
    },
  })

  // Create hosts
  const baseHostsData = [
    {
      email: 'marco@example.com',
      name: 'Marco Rossi',
      bio: 'Born and raised in Rome, I bring authentic Italian flavors to Amsterdam. My nonna\'s recipes have been passed down for generations. Join me for a true taste of Italy! 🍝',
      profileImageUrl: profileImages[1],
      coverImageUrl: coverImages[0],
    },
    {
      email: 'yuki@example.com',
      name: 'Yuki Tanaka',
      bio: 'Former sushi chef from Tokyo with 15 years of experience. I specialize in omakase-style dining experiences. Every meal is a journey through Japanese culinary traditions. 🍣',
      profileImageUrl: profileImages[2],
      coverImageUrl: coverImages[1],
    },
    {
      email: 'priya@example.com',
      name: 'Priya Sharma',
      bio: 'Spice enthusiast and home cook from Mumbai. I create vegetarian Indian feasts that will transport your taste buds to the streets of India. Chai included! ☕',
      profileImageUrl: profileImages[3],
      coverImageUrl: coverImages[2],
    },
    {
      email: 'pierre@example.com',
      name: 'Pierre Dubois',
      bio: 'Classically trained French chef bringing bistro culture to your table. From coq au vin to crème brûlée, experience the art of French cuisine. Bon appétit! 🥐',
      profileImageUrl: profileImages[4],
      coverImageUrl: coverImages[3],
    },
    {
      email: 'carlos@example.com',
      name: 'Carlos Rodriguez',
      bio: 'Mexican food is my passion! Growing up in Oaxaca, I learned the secrets of mole and traditional tacos. Join me for an authentic fiesta of flavors. 🌮',
      profileImageUrl: profileImages[5],
      coverImageUrl: coverImages[4],
    },
    {
      email: 'sarah@example.com',
      name: 'Sarah Mitchell',
      bio: 'Plant-based chef and wellness advocate. I prove that vegan food can be exciting, delicious, and satisfying. All organic, locally sourced ingredients. 🌱',
      profileImageUrl: profileImages[7],
      coverImageUrl: coverImages[5],
      profileVisibility: ProfileVisibility.ENGAGED_ONLY,
    },
    {
      email: 'ahmed@example.com',
      name: 'Ahmed Hassan',
      bio: 'Mediterranean flavors meet modern techniques. From falafel to shawarma, I create dishes that celebrate the rich culinary heritage of the Middle East. 🧆',
      profileImageUrl: profileImages[6],
      coverImageUrl: coverImages[6],
    },
    {
      email: 'lisa@example.com',
      name: 'Lisa Chen',
      bio: 'Dim sum specialist and dumpling master. Sunday brunch at my place is legendary! Learn the art of folding while enjoying authentic Cantonese cuisine. 🥟',
      profileImageUrl: profileImages[8],
      coverImageUrl: coverImages[7],
    },
  ]

  const rng = createSeededRng(20240207)
  const extraHostFirstNames = ['Ava', 'Liam', 'Noah', 'Mia', 'Elena', 'Mateo', 'Amir', 'Zoe', 'Hana', 'Leo', 'Nina', 'Arjun', 'Sasha', 'Rina', 'Omar', 'Jade']
  const extraHostLastNames = ['Bennett', 'Kim', 'Patel', 'Nguyen', 'Hernandez', 'Kumar', 'Cohen', 'Lopez', 'Singh', 'Ito', 'Alvarez', 'Moreno', 'Khan', 'Ivanov', 'Santos', 'Rossi']
  const extraHostCuisines = ['Italian', 'French', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Mediterranean', 'American', 'Chinese', 'Korean']
  const extraHostSignatureDishes = ['slow-braised ragu', 'seasonal tasting menu', 'hand-rolled sushi', 'fresh masa tacos', 'spiced curry platters', 'bright herb salads', 'wood-fired flatbreads', 'comfort classics', 'dim sum assortment', 'Korean BBQ feast']
  const extraHostVibes = [
    'I host relaxed, family-style dinners with warm conversation and big flavors.',
    'Expect a cozy supper club vibe with plenty of stories and thoughtful pairings.',
    'I love teaching guests the techniques behind each course while keeping the night fun.',
    'My table is all about community, shared plates, and bold seasonal ingredients.',
  ]
  const extraHostNeighborhoods = ['Amsterdam Centrum', 'Amsterdam Oost', 'Amsterdam West', 'Amsterdam Noord', 'Amsterdam Zuid', 'Amsterdam De Pijp']

  const extraHostsData = Array.from({ length: 12 }, (_, index) => {
    const firstName = extraHostFirstNames[index % extraHostFirstNames.length]
    const lastName = extraHostLastNames[(index * 3) % extraHostLastNames.length]
    const cuisine = extraHostCuisines[index % extraHostCuisines.length]
    const signature = extraHostSignatureDishes[(index * 5) % extraHostSignatureDishes.length]
    const vibe = extraHostVibes[index % extraHostVibes.length]
    const neighborhood = extraHostNeighborhoods[index % extraHostNeighborhoods.length]
    return {
      email: `host${index + 1}@example.com`,
      name: `${firstName} ${lastName}`,
      bio: `${vibe} My specialty is ${cuisine.toLowerCase()} cooking, and my signature is ${signature}. Join me in ${neighborhood} for a delicious, welcoming evening.`,
      profileImageUrl: profileImages[(index + baseHostsData.length) % profileImages.length],
      coverImageUrl: coverImages[(index + baseHostsData.length) % coverImages.length],
    }
  })

  const hostsData = [...baseHostsData, ...extraHostsData]

  const hosts = await Promise.all(
    hostsData.map(data =>
      prisma.user.create({
        data: {
          ...data,
          role: UserRole.HOST,
          hostApplication: {
            create: {
              applicationText: `I am passionate about cooking and want to share my culinary skills with others. ${data.bio}`,
              status: 'APPROVED',
              reviewedById: admin.id,
              reviewedAt: new Date(),
            },
          },
        },
      })
    )
  )
  console.log(`   Created ${hosts.length} hosts`)

  // Create regular users (guests)
  const guestsData = [
    {
      email: 'emma@example.com',
      name: 'Emma Wilson',
      bio: 'Food blogger and adventure eater. Always looking for unique dining experiences!',
      profileImageUrl: profileImages[9],
    },
    {
      email: 'james@example.com',
      name: 'James Brown',
      bio: 'Corporate lawyer by day, foodie by night. Love discovering hidden culinary gems.',
    },
    {
      email: 'sofia@example.com',
      name: 'Sofia Garcia',
      bio: 'Travel enthusiast who believes food is the best way to experience culture.',
    },
    {
      email: 'michael@example.com',
      name: 'Michael Johnson',
      bio: 'Wine collector and culinary curious. Looking for great pairings!',
    },
    {
      email: 'anna@example.com',
      name: 'Anna Kowalski',
      bio: 'Vegetarian food lover exploring plant-based options around the city.',
    },
  ]

  const guests = await Promise.all(
    guestsData.map(data =>
      prisma.user.create({
        data: {
          ...data,
          role: UserRole.USER,
        },
      })
    )
  )
  console.log(`   Created ${guests.length} guests`)

  // Assign tags to hosts
  console.log('🏷️  Assigning tags to users...')
  const hostTagAssignments = [
    { hostIndex: 0, tagNames: ['Italian', 'Wine Lover', 'Professional Chef', 'Fine Dining', 'Social'] },
    { hostIndex: 1, tagNames: ['Japanese', 'Pescatarian', 'Professional Chef', 'Fine Dining', 'Intimate Gatherings'] },
    { hostIndex: 2, tagNames: ['Indian', 'Vegetarian', 'Home Cook', 'Spice Lover', 'Family Friendly'] },
    { hostIndex: 3, tagNames: ['French', 'Wine Lover', 'Professional Chef', 'Pastry Expert', 'Date Night'] },
    { hostIndex: 4, tagNames: ['Mexican', 'Street Food', 'Home Cook', 'Social', 'Family Friendly'] },
    { hostIndex: 5, tagNames: ['Vegan', 'Organic', 'Farm to Table', 'Home Cook', 'Intimate Gatherings'] },
    { hostIndex: 6, tagNames: ['Mediterranean', 'Halal', 'Home Cook', 'Social', 'Family Friendly'] },
    { hostIndex: 7, tagNames: ['Chinese', 'Home Cook', 'Social', 'Family Friendly', 'Foodie'] },
  ]

  const cuisineTags = ['Italian', 'French', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Mediterranean', 'American', 'Chinese', 'Korean']
  const dietaryTags = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Pescatarian', 'Keto', 'Halal']
  const interestTags = ['Wine Lover', 'Foodie', 'Cooking Enthusiast', 'Spice Lover', 'Fine Dining', 'Street Food', 'Organic', 'Farm to Table', 'Craft Beer']
  const lifestyleTags = ['Social', 'Intimate Gatherings', 'Family Friendly', 'Date Night', 'Business Casual', 'Adventure Seeker']
  const skillTags = ['Professional Chef', 'Home Cook', 'Pastry Expert', 'BBQ Master', 'Sommelier', 'Baker']

  for (let i = hostTagAssignments.length; i < hosts.length; i += 1) {
    const hostCuisine = extraHostCuisines[(i - baseHostsData.length) % extraHostCuisines.length]
    const generatedTags = new Set<string>()
    if (cuisineTags.includes(hostCuisine)) {
      generatedTags.add(hostCuisine)
    }
    generatedTags.add(rng.pick(dietaryTags))
    generatedTags.add(rng.pick(interestTags))
    generatedTags.add(rng.pick(lifestyleTags))
    generatedTags.add(rng.pick(skillTags))
    while (generatedTags.size < 5) {
      generatedTags.add(rng.pick([...dietaryTags, ...interestTags, ...lifestyleTags, ...skillTags]))
    }
    hostTagAssignments.push({ hostIndex: i, tagNames: Array.from(generatedTags) })
  }

  for (const assignment of hostTagAssignments) {
    const host = hosts[assignment.hostIndex]
    for (const tagName of assignment.tagNames) {
      const tag = tags.find(t => t.name === tagName)
      if (tag) {
        await prisma.userTag.create({
          data: {
            userId: host.id,
            tagId: tag.id,
          },
        })
      }
    }
  }

  // Assign tags to guests
  const guestTagAssignments = [
    { guestIndex: 0, tagNames: ['Foodie', 'Fine Dining', 'Wine Lover', 'Italian', 'Japanese'] },
    { guestIndex: 1, tagNames: ['Wine Lover', 'French', 'Business Casual', 'Fine Dining'] },
    { guestIndex: 2, tagNames: ['Adventure Seeker', 'Street Food', 'Mexican', 'Thai'] },
    { guestIndex: 3, tagNames: ['Wine Lover', 'Italian', 'French', 'Sommelier'] },
    { guestIndex: 4, tagNames: ['Vegetarian', 'Vegan', 'Organic', 'Indian'] },
  ]

  for (const assignment of guestTagAssignments) {
    const guest = guests[assignment.guestIndex]
    for (const tagName of assignment.tagNames) {
      const tag = tags.find(t => t.name === tagName)
      if (tag) {
        await prisma.userTag.create({
          data: {
            userId: guest.id,
            tagId: tag.id,
          },
        })
      }
    }
  }

  // Create Dinners
  console.log('🍽️  Creating dinners...')
  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000

  const dinnerTemplates = [
    {
      title: 'Authentic Roman Pasta Night',
      description: 'A hands-on pasta workshop with cacio e pepe, carbonara, and amatriciana. Learn timing, texture, and sauce secrets with plenty of wine.',
      cuisine: 'Italian',
      maxGuests: 8,
      basePricePerPerson: 65,
      location: 'Amsterdam Centrum',
      tagNames: ['Italian', 'Wine Lover', 'Fine Dining'],
      addOns: [
        { name: 'Wine Pairing', description: 'Selection of Italian wines', price: 25 },
        { name: 'Tiramisu', description: 'Homemade classic tiramisu', price: 12 },
      ],
    },
    {
      title: 'Omakase Experience',
      description: 'A 10-course chef\'s choice dinner using seasonal fish and traditional techniques. Intimate seating and detailed explanations.',
      cuisine: 'Japanese',
      maxGuests: 6,
      basePricePerPerson: 95,
      location: 'Amsterdam Zuid',
      tagNames: ['Japanese', 'Fine Dining', 'Pescatarian'],
      addOns: [
        { name: 'Sake Pairing', description: 'Premium sake selection', price: 35 },
        { name: 'Wagyu Upgrade', description: 'A5 Wagyu beef course', price: 45 },
      ],
    },
    {
      title: 'Vegetarian Indian Feast',
      description: 'A colorful spread from different regions, featuring crispy starters, slow-cooked dals, and fresh naan. Spice levels adjustable.',
      cuisine: 'Indian',
      maxGuests: 10,
      basePricePerPerson: 45,
      location: 'Amsterdam West',
      tagNames: ['Indian', 'Vegetarian', 'Family Friendly'],
      addOns: [
        { name: 'Mango Lassi', description: 'Refreshing yogurt drink', price: 5 },
        { name: 'Gulab Jamun', description: 'Sweet milk dumplings', price: 8 },
      ],
    },
    {
      title: 'French Bistro Evening',
      description: 'A classic three-course bistro menu with seasonal starters, coq au vin or bourguignon, and a creme brulee finale.',
      cuisine: 'French',
      maxGuests: 8,
      basePricePerPerson: 75,
      location: 'Amsterdam Oud-Zuid',
      tagNames: ['French', 'Wine Lover', 'Date Night'],
      addOns: [
        { name: 'Champagne Aperitif', description: 'Start with bubbles', price: 20 },
        { name: 'Cheese Board', description: 'Selection of French cheeses', price: 18 },
      ],
    },
    {
      title: 'Taco Tuesday Fiesta',
      description: 'Fresh masa tortillas, slow-cooked fillings, and bright salsas. Learn assembly tricks and enjoy a lively night.',
      cuisine: 'Mexican',
      maxGuests: 12,
      basePricePerPerson: 40,
      location: 'Amsterdam Noord',
      tagNames: ['Mexican', 'Street Food', 'Social'],
      addOns: [
        { name: 'Margarita Pitcher', description: 'Classic lime margarita', price: 15 },
        { name: 'Churros', description: 'With chocolate sauce', price: 8 },
      ],
    },
    {
      title: 'Plant-Based Gourmet',
      description: 'A five-course vegan menu using seasonal produce, housemade sauces, and playful textures. Satisfying and elegant.',
      cuisine: 'Vegan',
      maxGuests: 8,
      basePricePerPerson: 55,
      location: 'Amsterdam De Pijp',
      tagNames: ['Vegan', 'Organic', 'Farm to Table'],
      addOns: [
        { name: 'Natural Wine', description: 'Organic vegan wines', price: 22 },
        { name: 'Raw Dessert', description: 'No-bake chocolate tart', price: 10 },
      ],
    },
    {
      title: 'Mediterranean Mezze Night',
      description: 'An abundant table of mezze: hummus, falafel, tabbouleh, shawarma, and warm flatbread for sharing.',
      cuisine: 'Mediterranean',
      maxGuests: 10,
      basePricePerPerson: 50,
      location: 'Amsterdam Oost',
      tagNames: ['Mediterranean', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Mint Tea Service', description: 'Traditional mint tea', price: 8 },
        { name: 'Baklava Platter', description: 'Assorted honey pastries', price: 12 },
      ],
    },
    {
      title: 'Dim Sum Brunch',
      description: 'A weekend brunch with dumplings, buns, and small plates. Learn folding techniques and sip premium tea.',
      cuisine: 'Chinese',
      maxGuests: 8,
      basePricePerPerson: 45,
      location: 'Amsterdam Chinatown',
      tagNames: ['Chinese', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Tea Flight', description: 'Premium Chinese tea selection', price: 15 },
        { name: 'Egg Tarts', description: 'Hong Kong style custard tarts', price: 8 },
      ],
    },
    {
      title: 'Levantine Grill Night',
      description: 'Smoky grilled meats, herb salads, and bright sauces inspired by Lebanon and Turkey. Plenty of vegetarian options.',
      cuisine: 'Mediterranean',
      maxGuests: 10,
      basePricePerPerson: 58,
      location: 'Amsterdam Oost',
      tagNames: ['Mediterranean', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Arak Pairing', description: 'Traditional anise spirit', price: 18 },
        { name: 'Pistachio Baklava', description: 'Housemade and warm', price: 10 },
      ],
    },
    {
      title: 'Tokyo Ramen Lab',
      description: 'Build your perfect bowl with handmade noodles, slow-simmered broth, and a toppings bar.',
      cuisine: 'Japanese',
      maxGuests: 8,
      basePricePerPerson: 52,
      location: 'Amsterdam Zuid',
      tagNames: ['Japanese', 'Street Food', 'Pescatarian'],
      addOns: [
        { name: 'Extra Chashu', description: 'Double pork belly', price: 9 },
        { name: 'Craft Highball', description: 'Japanese whisky and soda', price: 12 },
      ],
    },
    {
      title: 'Seasonal Vegan Brunch',
      description: 'A slow brunch with baked oats, herbed tofu scramble, citrus salad, and small-batch pastries.',
      cuisine: 'Vegan',
      maxGuests: 10,
      basePricePerPerson: 48,
      location: 'Amsterdam De Pijp',
      tagNames: ['Vegan', 'Organic', 'Farm to Table'],
      addOns: [
        { name: 'Cold-Pressed Juice', description: 'Seasonal blend', price: 8 },
        { name: 'Vegan Pastry Box', description: 'Three mini pastries', price: 14 },
      ],
    },
    {
      title: 'Cantonese Hot Pot Night',
      description: 'A cozy hot pot dinner with fresh seafood, thin-sliced meats, and a variety of broths for sharing.',
      cuisine: 'Chinese',
      maxGuests: 10,
      basePricePerPerson: 60,
      location: 'Amsterdam Chinatown',
      tagNames: ['Chinese', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Premium Seafood Set', description: 'Extra prawns and scallops', price: 20 },
        { name: 'Dessert Soup', description: 'Sweet red bean soup', price: 6 },
      ],
    },
    {
      title: 'Korean BBQ Night',
      description: 'Tabletop grilling with marinated meats, banchan, and ssam wraps. Learn how to build the perfect bite.',
      cuisine: 'Korean',
      maxGuests: 10,
      basePricePerPerson: 62,
      location: 'Amsterdam Zuid',
      tagNames: ['Korean', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Soju Flight', description: 'Three house flavors', price: 14 },
        { name: 'Kimchi Trio', description: 'Housemade kimchi sampler', price: 7 },
      ],
    },
    {
      title: 'Thai Street Food Night',
      description: 'Pad thai, spicy salads, and coconut curries with plenty of herbs and heat. Expect bright, fresh flavors.',
      cuisine: 'Thai',
      maxGuests: 12,
      basePricePerPerson: 46,
      location: 'Amsterdam West',
      tagNames: ['Thai', 'Street Food', 'Spice Lover'],
      addOns: [
        { name: 'Thai Iced Tea', description: 'Sweet and creamy', price: 6 },
        { name: 'Mango Sticky Rice', description: 'Seasonal mango dessert', price: 9 },
      ],
    },
    {
      title: 'American Smokehouse Supper',
      description: 'Slow-smoked brisket, crispy slaw, and cornbread with all the classic sides. Backyard vibes indoors.',
      cuisine: 'American',
      maxGuests: 12,
      basePricePerPerson: 54,
      location: 'Amsterdam Noord',
      tagNames: ['American', 'Social', 'BBQ Master'],
      addOns: [
        { name: 'Craft Beer Flight', description: 'Local brewery picks', price: 12 },
        { name: 'Pecan Pie', description: 'Warm slice with cream', price: 8 },
      ],
    },
  ]

  const titleSuffixes = ['Supper Club', 'Chef\'s Table', 'Family Style', 'Tasting Night', 'Weekend Edition']
  const descriptionExtras = [
    'Expect generous portions and a welcoming host.',
    'Perfect for meeting fellow food lovers in the city.',
    'Great for celebrating a special night out.',
    'Come hungry and ready to learn a few tricks.',
  ]

  const dinnersData = Array.from({ length: 30 }, (_, index) => {
    const template = dinnerTemplates[index % dinnerTemplates.length]
    const dayOffset = (index % 30) + 1
    const status = index % 12 === 0 ? DinnerStatus.DRAFT : index % 10 === 0 ? DinnerStatus.CANCELLED : DinnerStatus.PUBLISHED
    const dateTime = new Date(now.getTime() + dayOffset * oneDay)
    dateTime.setHours(18 + (index % 3), index % 2 === 0 ? 0 : 30, 0, 0)
    return {
      hostIndex: index % hosts.length,
      title: `${template.title} - ${titleSuffixes[index % titleSuffixes.length]}`,
      description: `${template.description} ${descriptionExtras[index % descriptionExtras.length]}`,
      cuisine: template.cuisine,
      maxGuests: template.maxGuests,
      basePricePerPerson: template.basePricePerPerson,
      location: template.location,
      daysFromNow: dayOffset,
      imageUrl: dinnerImages[index % dinnerImages.length],
      tagNames: template.tagNames,
      addOns: template.addOns,
      status,
      dateTime,
    }
  })

  const dinners = []
  for (const dinnerData of dinnersData) {
    const host = hosts[dinnerData.hostIndex]
    const dinner = await prisma.dinner.create({
      data: {
        hostId: host.id,
        title: dinnerData.title,
        description: dinnerData.description,
        cuisine: dinnerData.cuisine,
        maxGuests: dinnerData.maxGuests,
        basePricePerPerson: dinnerData.basePricePerPerson,
        location: dinnerData.location,
        dateTime: dinnerData.dateTime || new Date(now.getTime() + dinnerData.daysFromNow * oneDay),
        imageUrl: dinnerData.imageUrl,
        status: dinnerData.status || DinnerStatus.PUBLISHED,
      },
    })

    // Add tags to dinner
    for (const tagName of dinnerData.tagNames) {
      const tag = tags.find(t => t.name === tagName)
      if (tag) {
        await prisma.dinnerTag.create({
          data: {
            dinnerId: dinner.id,
            tagId: tag.id,
          },
        })
      }
    }

    // Add add-ons
    for (const addOn of dinnerData.addOns) {
      await prisma.dinnerAddOn.create({
        data: {
          dinnerId: dinner.id,
          name: addOn.name,
          description: addOn.description,
          price: addOn.price,
        },
      })
    }

    dinners.push(dinner)
  }
  console.log(`   Created ${dinners.length} dinners`)

  // Create Bookings
  console.log('📅 Creating bookings...')
  const bookingsData = [
    { guestIndex: 0, dinnerIndex: 1, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 1, dinnerIndex: 2, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 2, dinnerIndex: 3, numberOfGuests: 4, status: BookingStatus.CONFIRMED },
    { guestIndex: 3, dinnerIndex: 4, numberOfGuests: 2, status: BookingStatus.PENDING },
    { guestIndex: 4, dinnerIndex: 5, numberOfGuests: 3, status: BookingStatus.CONFIRMED },
    { guestIndex: 4, dinnerIndex: 6, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 1, dinnerIndex: 7, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 2, dinnerIndex: 8, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 3, dinnerIndex: 9, numberOfGuests: 3, status: BookingStatus.PENDING },
    { guestIndex: 0, dinnerIndex: 11, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 0, dinnerIndex: 13, numberOfGuests: 2, status: BookingStatus.COMPLETED },
    { guestIndex: 1, dinnerIndex: 14, numberOfGuests: 2, status: BookingStatus.COMPLETED },
    { guestIndex: 2, dinnerIndex: 15, numberOfGuests: 2, status: BookingStatus.COMPLETED },
    { guestIndex: 3, dinnerIndex: 16, numberOfGuests: 2, status: BookingStatus.COMPLETED },
  ]

  const bookingRng = createSeededRng(20240207 + 77)
  const bookings = []
  for (const bookingData of bookingsData) {
    const guest = guests[bookingData.guestIndex]
    const dinner = dinners[bookingData.dinnerIndex]
    const basePrice = dinner.basePricePerPerson * bookingData.numberOfGuests
    const totalPrice = basePrice // Add add-ons if needed

    const booking = await prisma.booking.create({
      data: {
        userId: guest.id,
        dinnerId: dinner.id,
        numberOfGuests: bookingData.numberOfGuests,
        basePrice,
        addOnsTotal: 0,
        totalPrice,
        status: bookingData.status,
        stripePaymentIntentId: `pi_seed_${bookingData.guestIndex}_${bookingData.dinnerIndex}_${bookingRng.int(1_000_000_000)}`,
      },
    })
    bookings.push(booking)
  }
  console.log(`   Created ${bookings.length} bookings`)

  // Create Reviews for completed bookings
  console.log('⭐ Creating reviews...')
  const reviewsData = [
    {
      bookingIndex: 10,
      rating: 5,
      comment: 'Absolutely incredible experience! Marco\'s pasta was the best I\'ve ever had outside of Italy. The atmosphere was warm and welcoming, and I learned so much about Italian cooking techniques. Can\'t wait to come back!',
    },
    {
      bookingIndex: 11,
      rating: 5,
      comment: 'Pierre is a true artist. The wine and cheese pairing was perfect, and his knowledge of French cuisine is impressive. The crème brûlée was divine!',
    },
    {
      bookingIndex: 12,
      rating: 4,
      comment: 'Great food and lovely host. The sugo was delicious and I\'ve already made it at home twice! Only giving 4 stars because the space was a bit cramped, but the experience was worth it.',
    },
    {
      bookingIndex: 13,
      rating: 5,
      comment: 'Carlos created such a vibrant atmosphere. The tlayudas were unreal and the salsas had real depth. Would book again in a heartbeat.',
    },
  ]

  for (const reviewData of reviewsData) {
    const booking = bookings[reviewData.bookingIndex]
    // Distribute rating across the three star categories
    // For seed data, use a simple distribution: hospitality 40%, cleanliness 30%, taste 30%
    const hospitalityStars = Math.ceil(reviewData.rating * 0.4)
    const cleanlinessStars = Math.ceil(reviewData.rating * 0.3)
    const tasteStars = reviewData.rating - hospitalityStars - cleanlinessStars
    
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        dinnerId: booking.dinnerId,
        hospitalityStars,
        cleanlinessStars,
        tasteStars,
        tipStars: 0, // No tips in seed data
        tipAmount: 0,
        comment: reviewData.comment,
      },
    })
  }
  console.log(`   Created ${reviewsData.length} reviews`)

  // Create Swipe Actions
  console.log('💕 Creating swipe actions...')
  const swipeActionsData = [
    // Guest 0 (Emma) swipes
    { guestIndex: 0, hostIndex: 0, action: SwipeActionType.LIKE },
    { guestIndex: 0, hostIndex: 1, action: SwipeActionType.LIKE },
    { guestIndex: 0, hostIndex: 3, action: SwipeActionType.LIKE },
    { guestIndex: 0, hostIndex: 5, action: SwipeActionType.PASS },
    // Guest 1 (James) swipes
    { guestIndex: 1, hostIndex: 0, action: SwipeActionType.LIKE },
    { guestIndex: 1, hostIndex: 3, action: SwipeActionType.LIKE },
    // Guest 2 (Sofia) swipes
    { guestIndex: 2, hostIndex: 4, action: SwipeActionType.LIKE },
    { guestIndex: 2, hostIndex: 6, action: SwipeActionType.LIKE },
    // Guest 3 (Michael) swipes
    { guestIndex: 3, hostIndex: 0, action: SwipeActionType.LIKE },
    { guestIndex: 3, hostIndex: 3, action: SwipeActionType.LIKE },
    { guestIndex: 3, hostIndex: 1, action: SwipeActionType.PASS },
    // Guest 4 (Anna) swipes
    { guestIndex: 4, hostIndex: 2, action: SwipeActionType.LIKE },
    { guestIndex: 4, hostIndex: 5, action: SwipeActionType.LIKE },
  ]

  for (const swipeData of swipeActionsData) {
    const guest = guests[swipeData.guestIndex]
    const host = hosts[swipeData.hostIndex]
    await prisma.swipeAction.create({
      data: {
        userId: guest.id,
        targetUserId: host.id,
        action: swipeData.action,
      },
    })
  }

  // Create some mutual likes (matches)
  const hostSwipesBack = [
    { hostIndex: 0, guestIndex: 0 }, // Marco likes Emma back - MATCH!
    { hostIndex: 3, guestIndex: 1 }, // Pierre likes James back - MATCH!
    { hostIndex: 4, guestIndex: 2 }, // Carlos likes Sofia back - MATCH!
    { hostIndex: 2, guestIndex: 4 }, // Priya likes Anna back - MATCH!
  ]

  for (const swipeBack of hostSwipesBack) {
    const host = hosts[swipeBack.hostIndex]
    const guest = guests[swipeBack.guestIndex]
    await prisma.swipeAction.create({
      data: {
        userId: host.id,
        targetUserId: guest.id,
        action: SwipeActionType.LIKE,
      },
    })
  }

  console.log(`   Created swipe actions with ${hostSwipesBack.length} matches`)

  // Create some messages
  console.log('💬 Creating messages...')
  const messagesData = [
    {
      senderIndex: 0, // Emma
      recipientHostIndex: 0, // Marco
      messages: [
        'Hi Marco! I\'m so excited about the pasta night. I have a question - can you accommodate a dairy allergy for one of my guests?',
        'That\'s wonderful, thank you! We can\'t wait.',
      ],
    },
    {
      senderIndex: 2, // Sofia
      recipientHostIndex: 4, // Carlos
      messages: [
        'Hola Carlos! Are your tacos spicy? I love heat but my partner is sensitive.',
        'Perfect, thanks for the heads up!',
      ],
    },
    {
      senderIndex: 1, // James
      recipientHostIndex: 1, // Yuki
      messages: [
        'Hi Yuki, is there a pescatarian option in the ramen lab?',
        'Great, appreciate it!',
      ],
    },
  ]

  for (const convo of messagesData) {
    const sender = guests[convo.senderIndex]
    const recipient = hosts[convo.recipientHostIndex]

    for (let i = 0; i < convo.messages.length; i++) {
      await prisma.message.create({
        data: {
          senderId: sender.id,
          recipientId: recipient.id,
          content: convo.messages[i],
          readAt: i === 0 ? new Date() : null,
        },
      })

      // Host reply
      if (i === 0) {
        await prisma.message.create({
          data: {
            senderId: recipient.id,
            recipientId: sender.id,
            content: 'Hi Emma! Yes, absolutely. I can prepare a dairy-free version of all the pasta dishes. Just let me know when you arrive which guest it is. Looking forward to meeting you!',
            readAt: new Date(),
          },
        })
      }
    }
  }

  console.log('   Created messages')

  // Summary
  console.log('\n✅ Seed completed successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   👤 Users: ${1 + hosts.length + guests.length} (1 admin, ${hosts.length} hosts, ${guests.length} guests)`)
  console.log(`   🏷️  Tags: ${tags.length}`)
  console.log(`   🍽️  Dinners: ${dinners.length}`)
  console.log(`   📅 Bookings: ${bookings.length}`)
  console.log(`   ⭐ Reviews: ${reviewsData.length}`)
  console.log(`   💕 Matches: ${hostSwipesBack.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📧 Test accounts:')
  console.log('   Guest: emma@example.com (has matches with hosts)')
  console.log('   Host: marco@example.com (Italian chef)')
  console.log(`   Admin: ${adminEmail}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
