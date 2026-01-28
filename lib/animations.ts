import { Variants, Transition } from 'framer-motion'

// ========================================
// Transition Presets
// ========================================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const smoothTransition: Transition = {
  type: 'tween',
  duration: 0.3,
  ease: 'easeOut',
}

export const quickTransition: Transition = {
  type: 'tween',
  duration: 0.15,
  ease: 'easeOut',
}

// ========================================
// Page Transitions
// ========================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
}

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
}

// ========================================
// Stagger Animations (for lists/grids)
// ========================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

export const staggerItemFade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
}

// ========================================
// Card Animations
// ========================================

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springTransition,
  },
  tap: {
    scale: 0.98,
    transition: quickTransition,
  },
}

export const cardHoverSubtle: Variants = {
  rest: {
    scale: 1,
    transition: smoothTransition,
  },
  hover: {
    scale: 1.01,
    transition: smoothTransition,
  },
}

export const cardGlow: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(236, 72, 153, 0)',
  },
  hover: {
    boxShadow: '0 0 30px rgba(236, 72, 153, 0.25)',
    transition: { duration: 0.3 },
  },
}

// ========================================
// Button Animations
// ========================================

export const buttonPress: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

export const buttonGlow: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(236, 72, 153, 0)',
  },
  hover: {
    boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
    transition: { duration: 0.2 },
  },
}

// ========================================
// Modal Animations
// ========================================

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
}

// ========================================
// Slide Animations
// ========================================

export const slideInFromRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const slideInFromLeft: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const slideInFromBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// ========================================
// Dropdown/Menu Animations
// ========================================

export const dropdownMenu: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15 },
  },
}

// ========================================
// Swipe Card Animations (for Tinder-like UX)
// ========================================

export const swipeCard: Variants = {
  center: {
    x: 0,
    rotate: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction * 300,
    rotate: direction * 20,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  }),
}

export const swipeIndicator: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
}

// ========================================
// Pulse/Glow Animations
// ========================================

export const glowPulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

export const pulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ========================================
// Toast/Notification Animations
// ========================================

export const toastSlideIn: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

// ========================================
// Tab Indicator Animation
// ========================================

export const tabIndicator: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
}

// ========================================
// Float Animation (for decorative elements)
// ========================================

export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ========================================
// Skeleton/Loading Animations
// ========================================

export const shimmer: Variants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: ['200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// ========================================
// Icon Animations
// ========================================

export const iconSpin: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const iconBounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ========================================
// Theme Toggle Animation
// ========================================

export const themeToggle: Variants = {
  light: {
    rotate: 0,
    scale: 1,
  },
  dark: {
    rotate: 180,
    scale: 1,
  },
}

// ========================================
// Mobile Page Transitions
// ========================================

export const mobilePageFade: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

export const mobilePageSlideRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  enter: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    x: '-20%',
    opacity: 0.5,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

export const mobilePageSlideLeft: Variants = {
  initial: {
    x: '-100%',
    opacity: 0,
  },
  enter: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    x: '20%',
    opacity: 0.5,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

// ========================================
// Swipe Card Enhancements
// ========================================

export const swipeCardEnhanced: Variants = {
  initial: {
    scale: 0.95,
    opacity: 0,
  },
  center: {
    scale: 1,
    opacity: 1,
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: (direction: number) => ({
    x: direction * 400,
    rotateZ: direction * 20,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
  }),
}

export const swipeStamp: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    rotate: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -20,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
}

export const cardStackItem: Variants = {
  stack: (i: number) => ({
    scale: 1 - i * 0.05,
    y: i * 8,
    zIndex: 10 - i,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  }),
}

// ========================================
// Bottom Navigation
// ========================================

export const bottomNavSlide: Variants = {
  hidden: {
    y: '100%',
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

export const navItemPop: Variants = {
  rest: {
    scale: 1,
  },
  active: {
    scale: 1.1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: 0.1,
    },
  },
}
