import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B1930] text-slate-300 pt-16 pb-8 px-6 md:px-10 mt-20 relative overflow-hidden">
      <div className="mx-auto max-w-6xl">
        
        {/* Subscribe Banner (Pre-footer) styled to template */}
        <div className="bg-[#1A73E8] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-16 shadow-xl relative z-10">
          <div className="flex items-center gap-4">
            <Image 
              src="/logo/arena_karya_white.png" 
              alt="Arena Karya Logo" 
              width={150} 
              height={40} 
              style={{ height: 'auto' }}
              className="object-contain"
            />
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="font-serif text-xl md:text-2xl font-bold">Langganan Sekarang</h3>
            <p className="text-blue-100 text-xs md:text-sm mt-1">Dapatkan informasi terbaru mengenai event dan kompetisi menarik.</p>
          </div>

          <div className="w-full md:w-auto flex items-center bg-blue-800/40 rounded-full p-1 border border-blue-400/30 max-w-md">
            <input 
              type="email" 
              placeholder="Email Anda" 
              className="bg-transparent text-white placeholder-blue-200 text-sm px-4 py-2 focus:outline-none flex-grow"
            />
            <button className="bg-white text-[#1A73E8] hover:bg-blue-50 font-bold px-5 py-2 rounded-full text-xs md:text-sm transition-all shadow flex items-center gap-1.5 cursor-pointer">
              <span>Subscribe</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer Content Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: About */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-white font-bold text-lg mb-2 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#1A73E8]">
              Tentang Kami
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Arena Karya adalah platform digital terpadu untuk digitalisasi proses pendaftaran, pengumpulan karya, hingga penjurian kompetisi.
            </p>
            <div className="flex gap-3 mt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#1A73E8] text-white flex items-center justify-center transition-colors shadow">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#1A73E8] text-white flex items-center justify-center transition-colors shadow">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#1A73E8] text-white flex items-center justify-center transition-colors shadow">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#1A73E8] text-white flex items-center justify-center transition-colors shadow">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-serif text-white font-bold text-lg mb-2 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#1A73E8]">
              Navigasi
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/" className="hover:text-white hover:underline transition-all">Beranda</Link></li>
              <li><Link href="/package" className="hover:text-white hover:underline transition-all">Paket Event</Link></li>
              <li><Link href="/event" className="hover:text-white hover:underline transition-all">Daftar Event</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline transition-all">Kontak</Link></li>
            </ul>
          </div>

          {/* Column 3: Working Hours */}
          <div className="flex flex-col gap-3">
            <h3 className="font-serif text-white font-bold text-lg mb-2 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#1A73E8]">
              Jam Operasional
            </h3>
            <div className="text-sm flex flex-col gap-2 text-slate-400">
              <div>
                <p className="font-semibold text-white">Senin - Jumat:</p>
                <p className="text-xs">09:00 AM - 05:00 PM</p>
              </div>
              <div>
                <p className="font-semibold text-white">Sabtu - Minggu:</p>
                <p className="text-xs">08:00 AM - 12:00 PM</p>
              </div>
            </div>
          </div>

          {/* Column 4: Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-white font-bold text-lg mb-2 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#1A73E8]">
              Hubungi Kami
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#1A73E8] mt-1 shrink-0" />
                <span className="text-xs leading-relaxed text-slate-400">
                  Jl. Prof. Soedarto, Tembalang, Kota Semarang, Jawa Tengah 50275
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#1A73E8] shrink-0" />
                <span className="text-xs text-slate-400">info@arenakarya.id</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#1A73E8] shrink-0" />
                <span className="text-xs text-slate-400">(024) 76922629</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-xs text-slate-500 gap-4">
          <p>© 2026 Arena Karya. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-400">Syarat & Ketentuan</a>
          </div>
        </div>

      </div>
    </footer>
  );
}