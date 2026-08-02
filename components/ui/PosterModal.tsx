"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

export default function PosterModal({ src, alt }: { src: string, alt: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Gambar Thumbnail */}
      <div 
        className="relative w-full h-full cursor-pointer overflow-hidden group"
        onClick={() => setIsOpen(true)}
      >
        <Image 
          src={src} 
          alt={alt} 
          fill 
          priority
          unoptimized={src.startsWith('blob:')}
          className="object-cover object-[center_5%] group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Efek Hover: Icon Zoom */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
            <div className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                <ZoomIn className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pop-up Modal */}
      {isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 md:p-8 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Tombol Close */}
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-gray-300 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Gambar Full Size */}
          <div 
            className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image 
              src={src} 
              alt={alt} 
              fill
              unoptimized={src.startsWith('blob:')}
              className="object-contain"
              priority
              sizes="100vw"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}