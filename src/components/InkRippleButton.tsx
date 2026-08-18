"use client";

import { useState, useRef, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  x: number;
  y: number;
  id: number;
}

import { HTMLMotionProps } from "framer-motion";

interface InkRippleButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export function InkRippleButton({ children, className = "", onClick, ...props }: InkRippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipples((prev) => [...prev, { x, y, id: Date.now() }]);
    }
    if (onClick) onClick(e);
  };

  const handleAnimationComplete = (id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.8, rotate: -45 }}
            animate={{ scale: 6, opacity: 0, rotate: 45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => handleAnimationComplete(ripple.id)}
            style={{
              position: "absolute",
              left: ripple.x - 30, // Offset by half of SVG width
              top: ripple.y - 30,  // Offset by half of SVG height
              pointerEvents: "none",
            }}
          >
            {/* Lotus/Ink Splash SVG */}
            <svg width="60" height="60" viewBox="0 0 100 100" className="fill-current text-white/50 mix-blend-overlay">
              {/* Outer Petals */}
              <path d="M50 10 Q60 40 90 50 Q60 60 50 90 Q40 60 10 50 Q40 40 50 10 Z" />
              {/* Inner Petals */}
              <path d="M50 25 Q55 45 75 50 Q55 55 50 75 Q45 55 25 50 Q45 45 50 25 Z" opacity="0.6" />
              {/* Core Splash */}
              <circle cx="50" cy="50" r="15" opacity="0.3" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
      <span className="relative z-10 block w-full">{children}</span>
    </motion.button>
  );
}
