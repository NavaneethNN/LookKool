"use client";

import { type ReactNode } from "react";
import {
  motion,
  type Transition,
  type HTMLMotionProps,
} from "framer-motion";

// ── Shared timing curves ──
const springTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 0.8,
};

const smoothTransition: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

// ── FadeIn ──
interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  className?: string;
  once?: boolean;
}

const directionOffsets = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance,
  className,
  once = true,
  ...props
}: FadeInProps) {
  const offset = { ...directionOffsets[direction] };
  if (distance !== undefined) {
    if ("y" in offset) offset.y = direction === "up" ? distance : -distance;
    if ("x" in offset) offset.x = direction === "left" ? distance : -distance;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerChildren ──
interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayStart?: number;
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.08,
  delayStart = 0,
}: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayStart,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerItem ── (use inside StaggerChildren)
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: smoothTransition,
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── ScaleIn ──
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, className }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...springTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── SlideIn ──
interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = "left",
  delay = 0,
  className,
}: SlideInProps) {
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const value = direction === "left" || direction === "up" ? -60 : 60;

  return (
    <motion.div
      initial={{ opacity: 0, [axis]: value }}
      whileInView={{ opacity: 1, [axis]: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...smoothTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Re-export motion for direct use
export { motion };
