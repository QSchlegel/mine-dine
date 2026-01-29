/**
 * Tip calculation utilities for the gamified review system.
 *
 * Each additional star costs 1% of the booking total price.
 * Maximum of 10 tip stars (10% tip).
 */

export const BASE_STARS = 5
export const MAX_TIP_STARS = 10
export const TIP_PERCENTAGE_PER_STAR = 0.01 // 1% per star

/**
 * Calculate the tip amount in EUR for a given number of tip stars.
 * @param bookingTotalPrice - The total price of the booking in EUR
 * @param tipStars - Number of additional stars to purchase (0-10)
 * @returns Tip amount in EUR
 */
export function calculateTipAmount(
  bookingTotalPrice: number,
  tipStars: number
): number {
  const clampedStars = Math.min(Math.max(0, tipStars), MAX_TIP_STARS)
  return bookingTotalPrice * (clampedStars * TIP_PERCENTAGE_PER_STAR)
}

/**
 * Calculate the cost per star for a booking.
 * @param bookingTotalPrice - The total price of the booking in EUR
 * @returns Cost per star in EUR
 */
export function calculateStarCost(bookingTotalPrice: number): number {
  return bookingTotalPrice * TIP_PERCENTAGE_PER_STAR
}

/**
 * Get the total number of available stars (base + tip).
 * @param tipStars - Number of purchased tip stars
 * @returns Total available stars
 */
export function getTotalAvailableStars(tipStars: number): number {
  return BASE_STARS + Math.min(Math.max(0, tipStars), MAX_TIP_STARS)
}

/**
 * Validate that the star distribution is correct.
 * @param hospitalityStars - Stars allocated to hospitality (0-5)
 * @param cleanlinessStars - Stars allocated to cleanliness (0-5)
 * @param tasteStars - Stars allocated to taste (0-5)
 * @param tipStars - Number of purchased tip stars (0-10)
 * @returns Validation result with error message if invalid
 */
export function validateStarDistribution(
  hospitalityStars: number,
  cleanlinessStars: number,
  tasteStars: number,
  tipStars: number
): { valid: boolean; error?: string } {
  // Validate individual category bounds
  if (hospitalityStars < 0 || hospitalityStars > 5) {
    return { valid: false, error: 'Hospitality must be 0-5 stars' }
  }
  if (cleanlinessStars < 0 || cleanlinessStars > 5) {
    return { valid: false, error: 'Cleanliness must be 0-5 stars' }
  }
  if (tasteStars < 0 || tasteStars > 5) {
    return { valid: false, error: 'Taste must be 0-5 stars' }
  }
  if (tipStars < 0 || tipStars > MAX_TIP_STARS) {
    return { valid: false, error: `Tip stars must be 0-${MAX_TIP_STARS}` }
  }

  // Validate total stars match expected
  const totalUsed = hospitalityStars + cleanlinessStars + tasteStars
  const expectedTotal = BASE_STARS + tipStars

  if (totalUsed !== expectedTotal) {
    return {
      valid: false,
      error: `Must use exactly ${expectedTotal} stars (you used ${totalUsed})`,
    }
  }

  return { valid: true }
}
