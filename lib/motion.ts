import type { Transition, Variants } from "framer-motion";

// Easing curves
export const EASE_ENTRANCE = [0.16, 1, 0.3, 1] as const; // spatial/entrance motion
export const EASE_MICRO = [0.4, 0, 0.2, 1] as const; // matches globals.css CSS transitions

// Duration constants
export const DURATION = {
  micro: 0.15, // dismiss / tiny flips (toast exit, dropdown close)
  fast: 0.2, // default — hover, dropdown, modal, card entrance
  section: 0.4, // section reveals (trimmed from 0.6s)
} as const;

// Stagger timing for lists
export const STAGGER_CHILD = 0.04; // 40ms between list items

// Shared transitions
export const entranceTransition: Transition = {
  duration: DURATION.fast,
  ease: EASE_ENTRANCE,
};

export const sectionTransition: Transition = {
  duration: DURATION.section,
  ease: EASE_ENTRANCE,
};

// Shared variants
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: entranceTransition },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.micro, ease: EASE_ENTRANCE } },
};

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.micro } },
};

export const modalPanelVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: entranceTransition },
  exit: { opacity: 0, y: -10, transition: { duration: DURATION.micro, ease: EASE_ENTRANCE } },
};

// List animations
export const listContainer: Variants = {
  visible: { transition: { staggerChildren: STAGGER_CHILD } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: entranceTransition },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.micro, ease: EASE_ENTRANCE } },
};

// Hover interactions
export const hoverLift = {
  whileHover: { y: -2 },
  transition: entranceTransition,
};

export const hoverScaleSubtle = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: entranceTransition,
};

export const tapOnly = {
  whileTap: { scale: 0.98 },
  transition: entranceTransition,
};

// Helper: cap stagger delay on long lists (max 8 items to prevent cascading)
export const staggerDelay = (index: number, max = 8) => Math.min(index, max) * STAGGER_CHILD;

// Skeleton fade animation
export const skeletonFadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0, transition: { duration: DURATION.micro } },
};

// Crossfade variants
export const crossfadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.micro } },
  exit: { opacity: 0, transition: { duration: DURATION.micro } },
};
