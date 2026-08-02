"use client";
import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
}

export default function Tooltip({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Kalkulasi posisi berdasarkan kursor/elemen
  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left + rect.width / 2, // Posisi tengah elemen icon
        top: rect.top, // Posisi persis di atas batas atas icon
      });
      setIsVisible(true);
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex items-center justify-center cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Icon atau Trigger tetap dirender normal di dalam tabel */}
      {children}

      {/* Konten Tooltip di-render di luar tabel (langsung di body) */}
      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] flex -translate-x-1/2 -translate-y-full pb-2 flex-col items-center pointer-events-none"
            style={{ left: coords.left, top: coords.top }}
          >
            <div className="relative w-max max-w-xs whitespace-normal rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
              {content}
            </div>
            {/* Segitiga panah bawah */}
            <div className="h-3 w-3 -mt-1.5 rotate-45 bg-gray-900"></div>
          </div>,
          document.body
        )}
    </div>
  );
}