// Guide configuration and state management

import React from 'react'

export type TourType = 'guest' | 'host'

export interface TourStep {
  target: string
  content: React.ReactNode | string
  title?: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  disableBeacon?: boolean
}

export interface GuideConfig {
  steps: TourStep[]
  tourId: string
  title: string
}

// Guest tour steps
export const guestTourSteps: TourStep[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3>Welcome to MineDine!</h3>
        <p>
          MineDine connects you with amazing hosts for unique dining experiences.
          Let's take a quick tour to get you started!
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile"]',
    content: (
      <div>
        <h3>Complete Your Profile</h3>
        <p>
          Add your name, bio, and interests to help hosts get to know you.
          A complete profile improves your matching experience!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="tags"]',
    content: (
      <div>
        <h3>Select Your Interests</h3>
        <p>
          Choose tags that match your culinary interests. This helps us match
          you with hosts who share your passion!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="swipe"]',
    content: (
      <div>
        <h3>Discover Hosts</h3>
        <p>
          Swipe right to like a host, left to pass. When both you and a host
          like each other, you'll get matched!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="bookings"]',
    content: (
      <div>
        <h3>Book Dinners</h3>
        <p>
          Browse available dinners from matched hosts and book your spot.
          Secure payment is handled through Stripe.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="messages"]',
    content: (
      <div>
        <h3>Message Hosts</h3>
        <p>
          Connect directly with hosts to ask questions, coordinate details,
          or just say hello!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
]

// Host tour steps
export const hostTourSteps: TourStep[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3>Welcome, Host!</h3>
        <p>
          You're approved to host dinners! Let's walk through how to create
          amazing dining experiences for your guests.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-dinner"]',
    content: (
      <div>
        <h3>Create Your First Dinner</h3>
        <p>
          Click here to create a new dinner listing. You can use our AI planner
          to help design the perfect menu!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="pricing"]',
    content: (
      <div>
        <h3>Set Your Pricing</h3>
        <p>
          Set a base price per person (recommended: €50). You can also add
          optional add-ons like wine pairings or special desserts.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="bookings"]',
    content: (
      <div>
        <h3>Manage Bookings</h3>
        <p>
          View and manage all your dinner bookings. See who's coming and
          communicate with your guests.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="grocery-bills"]',
    content: (
      <div>
        <h3>Transparency Matters</h3>
        <p>
          Upload grocery bills to show guests the cost breakdown. This builds
          trust and transparency in your pricing.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
]

export function getTourSteps(tourType: TourType): TourStep[] {
  return tourType === 'guest' ? guestTourSteps : hostTourSteps
}

export function getTourConfig(tourType: TourType): GuideConfig {
  return {
    tourId: `${tourType}-tour`,
    title: tourType === 'guest' ? 'Guest Tour' : 'Host Tour',
    steps: getTourSteps(tourType),
  }
}
