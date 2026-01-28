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
})

export const dinnerUpdateSchema = dinnerCreateSchema.partial()

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
 * Review validation schema
 */
export const reviewCreateSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
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
