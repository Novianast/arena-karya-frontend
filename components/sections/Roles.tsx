import Link from "next/link";
import { Users, Award, Trophy, ShieldCheck, Calculator, Layers, ArrowRight } from "lucide-react";

export default function Roles() {
  const cards = [
    {
      icon: Users,
      title: "Manajemen Penyelenggara",
      desc: "Kelola penuh aturan, panduan, tahapan, hingga mengundang dewan juri secara langsung ke dalam sistem kami.",
      link: "/register"
    },
    {
      icon: Award,
      title: "Penjurian Digital",
      desc: "Fokus berikan penilaian pada lomba yang ditugaskan kepada Anda melalui fitur borang digital yang praktis.",
      link: "/register"
    },
    {
      icon: Trophy,
      title: "Portal Peserta",
      desc: "Gunakan satu akun untuk mendaftar berbagai macam kompetisi, unggah hasil karya, dan pantau status kelolosan.",
      link: "/register"
    },
    {
      icon: ShieldCheck,
      title: "Identitas Terpadu",
      desc: "Tidak perlu registrasi ulang dari nol untuk mengikuti event yang berbeda di platform kami.",
      link: "/register"
    },
    {
      icon: Calculator,
      title: "Kalkulasi Nilai Otomatis",
      desc: "Akumulasi nilai juri dan penentuan juara diproses secara real-time, akurat, dan transparan.",
      link: "/register"
    },
    {
      icon: Layers,
      title: "Tahapan Lomba Kustom",
      desc: "Mendukung format penilaian dinamis untuk berbagai tahap (proposal, poster, video, presentasi).",
      link: "/register"
    }
  ];

  return (
    <section id="roles" className="py-28 bg-[#F8FAFC] relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 relative z-10 w-full text-center">
        
        {/* Header */}
        <div className="mb-20">
          <span className="text-[#1A73E8] font-bold text-xs md:text-sm tracking-widest uppercase block mb-3">
            Layanan & Fitur
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#0F2B5C] max-w-2xl mx-auto leading-tight">
            Solusi Lengkap untuk Mengelola Kompetisi Anda
          </h2>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                className="group bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(15,43,92,0.04)] hover:shadow-[0_20px_40px_rgba(15,43,92,0.08)] transition-all duration-300 pt-16 pb-10 px-8 flex flex-col items-center relative"
              >
                {/* Protruding tab */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F8FAFC] px-6 py-2.5 rounded-t-2xl border-t border-x border-slate-200/60 shadow-sm flex items-center justify-center z-10">
                  <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-center text-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-serif text-xl font-bold text-[#0F2B5C] mb-4 group-hover:text-[#1A73E8] transition-colors duration-300">
                  {card.title}
                </h3>
                
                <p className="text-gray-500 text-sm leading-relaxed text-center mb-8 flex-grow">
                  {card.desc}
                </p>

                {/* Bottom Circle Arrow Button */}
                <Link 
                  href={card.link}
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#1A73E8] group-hover:bg-[#1A73E8] group-hover:text-white transition-all duration-300"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}