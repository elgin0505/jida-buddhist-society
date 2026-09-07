const fs = require('fs');
const html = fs.readFileSync('orb.html', 'utf8');

const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error("No script found");

let js = scriptMatch[1].trim();

// Manually slice out the window.addEventListener block
const pageHideStart = js.indexOf('window.addEventListener("pagehide"');
const pageHideEnd = js.indexOf('}, { once: true });') + 19;
if (pageHideStart !== -1 && pageHideEnd !== -1) {
    js = js.slice(0, pageHideStart) + js.slice(pageHideEnd);
}

const component = `
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function LiquidOrbButton({ onClick }: { onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wrap all the webgpu logic here
    ${js.replace(/const canvas = document\.querySelector\("#orb"\);/g, "")
        .replace(/const status = document\.querySelector\("#status"\);/g, "")
        .replace(/status\.hidden = false;/g, "")
        .replace(/status\.textContent = .*/g, "setError(error instanceof Error ? error.message : String(error));")
        .replace(/Object\.defineProperty\(window, "liquidOrb".*?\}\);/gs, "")
    }

    // Cleanup function
    return () => {
      // stopped = true;
      // cancelAnimationFrame(animationFrame);
      // device?.destroy();
    };
  }, []);

  return (
    <button
      onClick={onClick}
      className="fixed z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#010208] text-white shadow-[0_8px_20px_rgba(201,162,39,0.4)] transition-all hover:scale-110 active:scale-95 overflow-hidden"
      style={{
        left: "20px",
        bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
      }}
      title="供灯祈福"
    >
      {!error ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-golden-deep to-golden-rich" />
      )}
      <span className="relative z-10 text-2xl drop-shadow-md">🪷</span>
    </button>
  );
}
`;

fs.writeFileSync('src/components/LiquidOrbButton.tsx', component);
console.log("Component generated");
