"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Phone, Search, HelpCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  
  // State untuk autentikasi dan profil
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Fungsi untuk mengecek token / session aktif
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setSessionUser(session.user);
        
        // Ambil role dari metadata
        const role = session.user.user_metadata?.role || "";
        setUserRole(role);

        // Map role ke nama folder di Storage
        const roleToFolder: Record<string, string> = {
          participant: "participants",
          organizer: "organizers",
          judge: "judges"
        };
        const folderName = roleToFolder[role];

        // Hanya fetch & set profile image jika bukan admin
        if (folderName) {
          const { data: profile } = await supabase
            .from("public_profiles")
            .select("profile_image")
            .eq("id", session.user.id)
            .single();

          if (profile?.profile_image) {
            const imgUrl = supabase.storage
              .from("profiles")
              .getPublicUrl(`${folderName}/${profile.profile_image}`).data.publicUrl;
            setProfileImage(imgUrl);
          }
        }
      }
    };

    checkUserSession();

    // Listener otomatis jika user tiba-tiba login/logout di tab yang sama
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
      } else {
        setSessionUser(null);
        setProfileImage(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const navClass = (href: string) => {
    const isActive =
      href === "/"
        ? pathname === "/"
        : pathname.startsWith(href);

    return isActive
      ? "border-b-2 border-[#1A73E8] pb-2 font-semibold text-[#1A73E8]"
      : "text-gray-500 hover:text-[#1A73E8] transition-colors";
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-[#F2F6FF]/95 backdrop-blur-md shadow-sm transition-all duration-300">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        
        {/* Logo */}
        <Link href="/">
          <Image
            src="/logo/arka_blue.png"
            alt="logo"
            width={85}
            height={42}
            style={{ height: 'auto' }}
            className="cursor-pointer hover:opacity-85 transition-opacity"
          />
        </Link>

        {/* Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link href="/" className={navClass("/")}>Beranda</Link>
          <Link href="/package" className={navClass("/package")}>Paket</Link>
          <Link href="/event" className={navClass("/event")}>Event</Link>
          <Link href="/contact" className={navClass("/contact")}>Kontak</Link>
        </div>

        {/* Right side capsule design aligned to template */}
        <div className="flex items-center gap-4">
          {!sessionUser && (
            <Link 
              href="/login" 
              className="text-[#1A73E8] font-semibold text-sm hover:text-blue-700 px-3 py-2 transition-colors"
            >
              Login
            </Link>
          )}

          {/* Capsule Container */}
          <div className="flex items-center bg-[#1A73E8] text-white pl-4 pr-1.5 py-1.5 rounded-full shadow-md gap-3 md:gap-4">
            {/* Phone Info */}
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold hover:text-blue-100 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">(024) 76922629</span>
            </div>

            {/* Separator */}
            <div className="w-[1px] h-5 bg-blue-300/40"></div>

            {/* Help/Search Icon */}
            <Link href="/contact" className="hover:text-blue-100 transition-colors" title="Bantuan">
              <HelpCircle className="w-4 h-4" />
            </Link>

            {/* CTA Button Inside Capsule */}
            {sessionUser ? (
              <Link 
                href={`/${userRole}/home`}
                className="flex items-center gap-2 bg-white text-[#1A73E8] hover:bg-blue-50 font-bold pl-3 pr-1.5 py-1 rounded-full text-xs md:text-sm transition-all shadow-sm"
              >
                <span>Dashboard</span>
                <img 
                  src={profileImage || "/images/default-avatar.png"} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover border border-blue-200" 
                />
              </Link>
            ) : (
              <Link
                href="/register"
                className="bg-white text-[#1A73E8] hover:bg-blue-50 font-bold px-4 py-1.5 rounded-full text-xs md:text-sm transition-all shadow-sm"
              >
                Mulai
              </Link>
            )}
          </div>
        </div>

      </nav>
    </header>
  );
}