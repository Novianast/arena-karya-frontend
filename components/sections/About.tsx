import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export default function About() {
  const highlights = [
    "Pendaftaran Multi-Event Terpadu",
    "Borang Penjurian Digital Praktis",
    "Rekapitulasi Nilai Otomatis & Real-Time",
    "Sistem Paket Fleksibel & Transparan",
    "Pengumpulan Karya Aman & Terpusat",
    "Satu Akun untuk Semua Peran",
  ];

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Background soft decoration */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10"></div>

      <div className="mx-auto max-w-6xl px-6 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left: Illustration Card */}
          <div className="flex-1 w-full flex justify-center relative">
            <div className="relative p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 max-w-[480px] w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/20"></div>
              <Image
                src="/images/arena_karya_question.png"
                alt="Tentang Arena Karya"
                width={380}
                height={220}
                style={{ height: 'auto' }}
                className="object-contain relative z-10 hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Right: Text content */}
          <div className="flex-1 w-full">
            <span className="text-[#1A73E8] font-bold text-xs md:text-sm tracking-widest uppercase block mb-3">
              Tentang Platform
            </span>
            
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0F2B5C] leading-tight mb-6">
              Era Baru Manajemen Kompetisi Digital
            </h2>
            
            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8">
              Arena Karya adalah platform manajemen kompetisi terpadu berkonsep Software as a Service (SaaS) yang mendigitalisasi seluruh alur perlombaan. Mulai dari pendaftaran multi-event, pengumpulan karya (proposal hingga video), hingga proses penjurian dan rekapitulasi nilai, semuanya dikelola dalam satu ekosistem digital yang efisien dan transparan.
            </p>

            {/* Grid Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#1A73E8] shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}