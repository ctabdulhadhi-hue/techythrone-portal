import React from 'react';

export function TechythroneLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]"
      >
        {/* Isometric Cube / Shield in vivid cyber blue */}
        <path
          d="M16 2L28 8.5V20.5L16 27L4 20.5V8.5L16 2Z"
          fill="#0B1220"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 2V27M4 8.5L16 15L28 8.5M4 20.5L16 15L28 20.5"
          stroke="#60A5FA"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeOpacity="0.8"
        />
        <circle cx="16" cy="15" r="3" fill="#3B82F6" />
      </svg>
    </div>
  );
}
