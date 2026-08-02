import Image from "next/image";
import { Trophy, Award } from "lucide-react";
import React from "react";

interface BannerProps {
  className?: string;
  children?: React.ReactNode;
}

export default function Banner({ className, children }: BannerProps) {
  const containerClasses = className
    ? `relative w-full overflow-hidden bg-[#0F2B5C] ${className}`
    : `relative w-full h-[30vh] sm:h-[40vh] md:h-[50vh] min-h-[300px] overflow-hidden bg-[#0F2B5C]`;

  return (
    <section className={containerClasses}>
      {/* Background Image with Dark Blue Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/alea_ecta_est.png"
          alt="Background Pattern"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2B5C]/90 via-[#0F2B5C]/75 to-[#f2f6ff]"></div>
      </div>

      {/* Decorative Dot Patterns */}
      <div className="absolute top-12 left-4 sm:top-24 sm:left-10 md:left-24 opacity-25 z-0 pointer-events-none scale-75 sm:scale-100">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="white">
          <circle cx="10" cy="10" r="2" />
          <circle cx="30" cy="10" r="2" />
          <circle cx="50" cy="10" r="2" />
          <circle cx="70" cy="10" r="2" />
          <circle cx="90" cy="10" r="2" />
          <circle cx="10" cy="30" r="2" />
          <circle cx="30" cy="30" r="2" />
          <circle cx="50" cy="30" r="2" />
          <circle cx="70" cy="30" r="2" />
          <circle cx="90" cy="30" r="2" />
          <circle cx="10" cy="50" r="2" />
          <circle cx="30" cy="50" r="2" />
          <circle cx="50" cy="50" r="2" />
          <circle cx="70" cy="50" r="2" />
          <circle cx="90" cy="50" r="2" />
          <circle cx="10" cy="70" r="2" />
          <circle cx="30" cy="70" r="2" />
          <circle cx="50" cy="70" r="2" />
          <circle cx="70" cy="70" r="2" />
          <circle cx="90" cy="70" r="2" />
        </svg>
      </div>

      <div className="absolute bottom-12 right-4 sm:bottom-24 sm:right-10 md:right-24 opacity-25 z-0 pointer-events-none scale-75 sm:scale-100">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="white">
          <circle cx="10" cy="10" r="2" />
          <circle cx="30" cy="10" r="2" />
          <circle cx="50" cy="10" r="2" />
          <circle cx="70" cy="10" r="2" />
          <circle cx="90" cy="10" r="2" />
          <circle cx="10" cy="30" r="2" />
          <circle cx="30" cy="30" r="2" />
          <circle cx="50" cy="30" r="2" />
          <circle cx="70" cy="30" r="2" />
          <circle cx="90" cy="30" r="2" />
          <circle cx="10" cy="50" r="2" />
          <circle cx="30" cy="50" r="2" />
          <circle cx="50" cy="50" r="2" />
          <circle cx="70" cy="50" r="2" />
          <circle cx="90" cy="50" r="2" />
          <circle cx="10" cy="70" r="2" />
          <circle cx="30" cy="70" r="2" />
          <circle cx="50" cy="70" r="2" />
          <circle cx="70" cy="70" r="2" />
          <circle cx="90" cy="70" r="2" />
        </svg>
      </div>

      {/* Left Floating Trophy */}
      <div className="absolute left-4 sm:left-8 md:left-20 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border border-white/20 flex items-center justify-center opacity-30 animate-pulse pointer-events-none z-0">
        <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full border border-dashed border-white/30 flex items-center justify-center">
          <Trophy className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
        </div>
      </div>

      {/* Right Floating Award */}
      <div className="absolute right-4 sm:right-8 md:right-20 top-1/3 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 border border-dashed border-white/20 flex items-center justify-center opacity-30 animate-bounce pointer-events-none z-0" style={{ animationDuration: '6s' }}>
        <Award className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-white" />
      </div>

      {/* Optional Children Content */}
      {children && (
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      )}
    </section>
  );
}
