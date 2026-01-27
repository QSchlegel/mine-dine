import { PrismaClient, UserRole, TagCategory, DinnerStatus, BookingStatus, SwipeActionType } from '@prisma/client'

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
  'https://images.unsplash.com/photo-1482049016gy-b5a13a28aae7?w=1200&h=400&fit=crop',
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
]

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

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@minedine.com',
      name: 'Mine Dine Admin',
      bio: 'Platform administrator',
      role: UserRole.ADMIN,
      profileImageUrl: profileImages[0],
      emailVerified: true,
    },
  })

  // Create hosts
  const hostsData = [
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

  const dinnersData = [
    {
      hostIndex: 0,
      title: 'Authentic Roman Pasta Night',
      description: 'Join me for a journey through Rome\'s classic pasta dishes. We\'ll prepare cacio e pepe, carbonara, and amatriciana from scratch. Learn the secrets of perfect al dente pasta and the importance of quality ingredients. Wine pairing included!',
      cuisine: 'Italian',
      maxGuests: 8,
      basePricePerPerson: 65,
      location: 'Amsterdam Centrum',
      daysFromNow: 7,
      imageUrl: dinnerImages[0],
      tagNames: ['Italian', 'Wine Lover', 'Fine Dining'],
      addOns: [
        { name: 'Wine Pairing', description: 'Selection of Italian wines', price: 25 },
        { name: 'Tiramisu', description: 'Homemade classic tiramisu', price: 12 },
      ],
    },
    {
      hostIndex: 1,
      title: 'Omakase Experience',
      description: 'Trust the chef for a 12-course omakase journey. Fresh fish flown in from Tsukiji market, seasonal ingredients, and traditional Japanese techniques. An intimate dining experience for true sushi enthusiasts.',
      cuisine: 'Japanese',
      maxGuests: 6,
      basePricePerPerson: 95,
      location: 'Amsterdam Zuid',
      daysFromNow: 10,
      imageUrl: dinnerImages[4],
      tagNames: ['Japanese', 'Fine Dining', 'Pescatarian'],
      addOns: [
        { name: 'Sake Pairing', description: 'Premium sake selection', price: 35 },
        { name: 'Wagyu Upgrade', description: 'A5 Wagyu beef course', price: 45 },
      ],
    },
    {
      hostIndex: 2,
      title: 'Vegetarian Indian Feast',
      description: 'A colorful spread of vegetarian Indian dishes from different regions. From crispy samosas to creamy dal makhani, fragrant biryani to fresh naan. Spice levels can be adjusted to your preference!',
      cuisine: 'Indian',
      maxGuests: 10,
      basePricePerPerson: 45,
      location: 'Amsterdam West',
      daysFromNow: 5,
      imageUrl: dinnerImages[5],
      tagNames: ['Indian', 'Vegetarian', 'Family Friendly'],
      addOns: [
        { name: 'Mango Lassi', description: 'Refreshing yogurt drink', price: 5 },
        { name: 'Gulab Jamun', description: 'Sweet milk dumplings', price: 8 },
      ],
    },
    {
      hostIndex: 3,
      title: 'French Bistro Evening',
      description: 'A classic French dinner starting with French onion soup, followed by coq au vin or beef bourguignon, and finishing with crème brûlée. Paired with carefully selected French wines.',
      cuisine: 'French',
      maxGuests: 8,
      basePricePerPerson: 75,
      location: 'Amsterdam Oud-Zuid',
      daysFromNow: 12,
      imageUrl: dinnerImages[9],
      tagNames: ['French', 'Wine Lover', 'Date Night'],
      addOns: [
        { name: 'Champagne Aperitif', description: 'Start with bubbles', price: 20 },
        { name: 'Cheese Board', description: 'Selection of French cheeses', price: 18 },
      ],
    },
    {
      hostIndex: 4,
      title: 'Taco Tuesday Fiesta',
      description: 'An authentic Mexican taco night with handmade tortillas, slow-cooked meats, fresh salsas, and all the fixings. Learn to make the perfect taco and enjoy margaritas!',
      cuisine: 'Mexican',
      maxGuests: 12,
      basePricePerPerson: 40,
      location: 'Amsterdam Noord',
      daysFromNow: 3,
      imageUrl: dinnerImages[3],
      tagNames: ['Mexican', 'Street Food', 'Social'],
      addOns: [
        { name: 'Margarita Pitcher', description: 'Classic lime margarita', price: 15 },
        { name: 'Churros', description: 'With chocolate sauce', price: 8 },
      ],
    },
    {
      hostIndex: 5,
      title: 'Plant-Based Gourmet',
      description: 'Discover how delicious vegan food can be! A 5-course plant-based menu using seasonal, organic ingredients. From creamy cashew risotto to decadent chocolate avocado mousse.',
      cuisine: 'Vegan',
      maxGuests: 8,
      basePricePerPerson: 55,
      location: 'Amsterdam De Pijp',
      daysFromNow: 8,
      imageUrl: dinnerImages[7],
      tagNames: ['Vegan', 'Organic', 'Farm to Table'],
      addOns: [
        { name: 'Natural Wine', description: 'Organic vegan wines', price: 22 },
        { name: 'Raw Dessert', description: 'No-bake chocolate tart', price: 10 },
      ],
    },
    {
      hostIndex: 6,
      title: 'Mediterranean Mezze Night',
      description: 'A feast of small plates from across the Mediterranean. Hummus, falafel, tabbouleh, shawarma, and more. Perfect for sharing and socializing!',
      cuisine: 'Mediterranean',
      maxGuests: 10,
      basePricePerPerson: 50,
      location: 'Amsterdam Oost',
      daysFromNow: 6,
      imageUrl: dinnerImages[1],
      tagNames: ['Mediterranean', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Mint Tea Service', description: 'Traditional mint tea', price: 8 },
        { name: 'Baklava Platter', description: 'Assorted honey pastries', price: 12 },
      ],
    },
    {
      hostIndex: 7,
      title: 'Dim Sum Brunch',
      description: 'A Sunday dim sum experience with over 15 different varieties of dumplings, buns, and small plates. Learn the art of dumpling folding while enjoying authentic Cantonese tea.',
      cuisine: 'Chinese',
      maxGuests: 8,
      basePricePerPerson: 45,
      location: 'Amsterdam Chinatown',
      daysFromNow: 4,
      imageUrl: dinnerImages[2],
      tagNames: ['Chinese', 'Social', 'Family Friendly'],
      addOns: [
        { name: 'Tea Flight', description: 'Premium Chinese tea selection', price: 15 },
        { name: 'Egg Tarts', description: 'Hong Kong style custard tarts', price: 8 },
      ],
    },
    // Past dinners (for reviews)
    {
      hostIndex: 0,
      title: 'Sunday Sugo Session',
      description: 'Learn to make the perfect Italian tomato sauce. A hands-on cooking experience followed by a family-style meal.',
      cuisine: 'Italian',
      maxGuests: 6,
      basePricePerPerson: 55,
      location: 'Amsterdam Centrum',
      daysFromNow: -14,
      imageUrl: dinnerImages[6],
      tagNames: ['Italian', 'Home Cook'],
      addOns: [],
      status: DinnerStatus.COMPLETED,
    },
    {
      hostIndex: 3,
      title: 'Wine & Cheese Soirée',
      description: 'An evening dedicated to the art of French wine and cheese pairing.',
      cuisine: 'French',
      maxGuests: 8,
      basePricePerPerson: 60,
      location: 'Amsterdam Oud-Zuid',
      daysFromNow: -7,
      imageUrl: dinnerImages[8],
      tagNames: ['French', 'Wine Lover'],
      addOns: [],
      status: DinnerStatus.COMPLETED,
    },
  ]

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
        dateTime: new Date(now.getTime() + dinnerData.daysFromNow * oneDay),
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
    { guestIndex: 0, dinnerIndex: 0, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 1, dinnerIndex: 1, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    { guestIndex: 2, dinnerIndex: 4, numberOfGuests: 4, status: BookingStatus.CONFIRMED },
    { guestIndex: 3, dinnerIndex: 3, numberOfGuests: 2, status: BookingStatus.PENDING },
    { guestIndex: 4, dinnerIndex: 2, numberOfGuests: 3, status: BookingStatus.CONFIRMED },
    { guestIndex: 4, dinnerIndex: 5, numberOfGuests: 2, status: BookingStatus.CONFIRMED },
    // Past bookings (completed)
    { guestIndex: 0, dinnerIndex: 8, numberOfGuests: 2, status: BookingStatus.COMPLETED },
    { guestIndex: 1, dinnerIndex: 9, numberOfGuests: 2, status: BookingStatus.COMPLETED },
    { guestIndex: 2, dinnerIndex: 8, numberOfGuests: 2, status: BookingStatus.COMPLETED },
  ]

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
        stripePaymentIntentId: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    })
    bookings.push(booking)
  }
  console.log(`   Created ${bookings.length} bookings`)

  // Create Reviews for completed bookings
  console.log('⭐ Creating reviews...')
  const reviewsData = [
    {
      bookingIndex: 6,
      rating: 5,
      comment: 'Absolutely incredible experience! Marco\'s pasta was the best I\'ve ever had outside of Italy. The atmosphere was warm and welcoming, and I learned so much about Italian cooking techniques. Can\'t wait to come back!',
    },
    {
      bookingIndex: 7,
      rating: 5,
      comment: 'Pierre is a true artist. The wine and cheese pairing was perfect, and his knowledge of French cuisine is impressive. The crème brûlée was divine!',
    },
    {
      bookingIndex: 8,
      rating: 4,
      comment: 'Great food and lovely host. The sugo was delicious and I\'ve already made it at home twice! Only giving 4 stars because the space was a bit cramped, but the experience was worth it.',
    },
  ]

  for (const reviewData of reviewsData) {
    const booking = bookings[reviewData.bookingIndex]
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        dinnerId: booking.dinnerId,
        rating: reviewData.rating,
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
  console.log('   Admin: admin@minedine.com')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
