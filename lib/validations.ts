import { z } from 'zod'

/**
 * User validation schemas
 */
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  profileImageUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  profileVisibility: z.enum(['EVERYONE', 'ENGAGED_ONLY']).optional(),
})

/**
 * Host application validation schema
 */
export const hostApplicationSchema = z.object({
  applicationText: z.string().min(50).max(2000),
})

/**
 * Dinner validation schemas
 */
export const dinnerCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(20).max(2000),
  cuisine: z.string().max(50).optional(),
  maxGuests: z.number().int().min(1).max(50),
  basePricePerPerson: z.number().positive().max(1000),
  location: z.string().min(5).max(200),
  dateTime: z.string().datetime(),
  imageUrl: z.string().url().optional(),
  tagIds: z.array(z.string()).optional(),
  planningMode: z.enum(['MANUAL', 'AI_ASSISTED', 'AI_GENERATED']).optional(),
  aiPlanData: z.any().optional(), // JSON data from AI plan
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
})

export const dinnerUpdateSchema = dinnerCreateSchema.partial()

/**
 * Private event validation schema (simplified, no AI planning or add-ons)
 */
export const privateEventCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000), // Shorter minimum for private events
  location: z.string().min(5).max(200),
  dateTime: z.string().datetime(),
  maxGuests: z.number().int().min(1).max(100).default(10),
  imageUrl: z.string().url().optional().nullable(),
  // Optional cost split for splitting dinner costs among guests
  enableCostSplit: z.boolean().optional().default(false),
  basePricePerPerson: z.number().min(0).max(1000).optional().default(0),
})

export const privateEventUpdateSchema = privateEventCreateSchema.partial()

/**
 * Booking validation schema
 */
export const bookingCreateSchema = z.object({
  dinnerId: z.string(),
  numberOfGuests: z.number().int().min(1).max(20),
  selectedAddOns: z.array(z.object({
    addOnId: z.string(),
    quantity: z.number().int().min(1),
  })).optional(),
  referralCode: z.string().optional(),
})

/**
 * Review validation schema (gamified star distribution)
 *
 * Guests get 5 base stars to distribute across 3 categories.
 * Additional stars can be purchased as tips (1% of menu price per star, max 10).
 * Total stars used must equal: 5 (base) + tipStars
 */
export const reviewCreateSchema = z.object({
  bookingId: z.string(),
  hospitalityStars: z.number().int().min(0).max(5),
  cleanlinessStars: z.number().int().min(0).max(5),
  tasteStars: z.number().int().min(0).max(5),
  tipStars: z.number().int().min(0).max(10).default(0),
  tipPaymentIntentId: z.string().optional(),
  comment: z.string().max(1000).optional(),
}).refine(
  (data) => {
    const totalUsed = data.hospitalityStars + data.cleanlinessStars + data.tasteStars
    const expectedTotal = 5 + data.tipStars
    return totalUsed === expectedTotal
  },
  {
    message: 'Total stars distributed must equal 5 (base) plus purchased tip stars',
    path: ['hospitalityStars'],
  }
)

/**
 * Guest review validation schema (host reviewing guest)
 */
export const guestReviewCreateSchema = z.object({
  bookingId: z.string(),
  sentiment: z.enum(['LIKE', 'DISLIKE']),
})

/**
 * Message validation schema
 */
export const messageCreateSchema = z.object({
  recipientId: z.string(),
  bookingId: z.string().optional(),
  content: z.string().min(1).max(2000),
})

/**
 * Tag validation schema
 */
export const tagCreateSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.enum(['CUISINE', 'DIETARY', 'INTEREST', 'LIFESTYLE', 'SKILL', 'OTHER']),
})

/**
 * Swipe action validation schema
 */
export const swipeActionSchema = z.object({
  targetUserId: z.string(),
  action: z.enum(['LIKE', 'PASS']),
})

/**
 * Dinner add-on validation schema
 */
export const dinnerAddOnSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive().max(1000),
})
