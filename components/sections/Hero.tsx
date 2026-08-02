import Image from "next/image";
import Link from "next/link";
import { Trophy, Award, ChevronRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center pt-28 pb-20 overflow-hidden bg-[#0F2B5C]">
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

      {/* Decorative Dot Patterns from the template */}
      <div className="absolute top-24 left-10 md:left-24 opacity-25 z-10 pointer-events-none">
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

      <div className="absolute bottom-24 right-10 md:right-24 opacity-25 z-10 pointer-events-none">
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

      {/* Floating Outline Icons from the template */}
      {/* Left Floating Trophy */}
      <div className="absolute left-8 md:left-20 top-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/20 flex items-center justify-center opacity-30 animate-pulse pointer-events-none">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-dashed border-white/30 flex items-center justify-center">
          <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
      </div>

      {/* Right Floating Award */}
      <div className="absolute right-8 md:right-20 top-1/3 w-16 h-16 md:w-24 md:h-24 border border-dashed border-white/20 flex items-center justify-center opacity-30 animate-bounce pointer-events-none" style={{ animationDuration: '6s' }}>
        <Award className="w-8 h-8 md:w-12 md:h-12 text-white" />
      </div>

      {/* Main Hero Content */}
      <div className="mx-auto max-w-4xl px-6 relative z-10 text-center flex flex-col items-center">
        
        {/* Subtitle / Breadcrumb styled to template */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wider text-blue-300 uppercase mb-4 bg-blue-900/40 px-4 py-1.5 rounded-full border border-blue-800/30">
          <span>Beranda</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white">Solusi Kompetisi</span>
        </div>

        {/* Title (Serif styled to template) */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6 drop-shadow-md max-w-3xl">
          Satu Platform untuk Semua Kebutuhan Kompetisi
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-sm md:text-lg max-w-2xl leading-relaxed mb-8">
          Platform digital terpadu untuk digitalisasi proses pendaftaran, pengumpulan karya, dan penjurian. Skalakan event Anda dengan sistem paket yang fleksibel dan transparan.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/register" 
            className="w-full sm:w-auto bg-[#1A73E8] hover:bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 text-sm md:text-base cursor-pointer"
          >
            Mulai Sekarang
          </Link>
          <a 
            href="#roles" 
            className="w-full sm:w-auto border-2 border-white/30 hover:border-white text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm md:text-base hover:bg-white/5 flex items-center justify-center gap-1 cursor-pointer"
          >
            Lihat Layanan Kami &darr;
          </a>
        </div>

      </div>
    </section>
  );
}