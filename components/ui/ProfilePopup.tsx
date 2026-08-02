"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProfilePopupProps {
  username: string;
  email: string;
  avatarUrl: string;
  profilePath?: string;
  hideProfileButton?: boolean;
}

export default function ProfilePopup({ username, email, avatarUrl, profilePath, hideProfileButton = false }: ProfilePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle klik di luar untuk menutup pop-up
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger: Foto Profil */}
        <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
        <Image
            src={avatarUrl}
            alt="Profile"
            fill
            sizes="(max-width: 48px) 100vw, 48px"
            className="object-cover rounded-full"
        />
        </button>

      {/* Pop Up Box */}
      {isOpen && (
        <div className="absolute right-0 top-16 w-72 bg-white rounded-[20px] border border-padded-white shadow-xl z-50 overflow-hidden">
          {/* Segitiga Penunjuk (Arrow) */}
          <div className="absolute -top-[10px] right-4 w-4 h-4 bg-white border-t-[3px] border-l-[3px] border-[#0A66C2] transform rotate-45"></div>

          <div className="relative bg-white flex flex-col">
            {/* Header: Info User */}
            <div className="p-4 flex items-center gap-4 border-b border-gray-200">
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 relative">
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  fill
                  sizes="(max-width: 56px) 100vw, 56px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-lg text-gray-800 truncate">{username}</span>
                <span className="text-sm text-gray-500 truncate">{email}</span>
              </div>
            </div>

            {/* Menu: Profile */}
            {!hideProfileButton && profilePath && (
              <Link 
                href={profilePath}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200"
              >
                <User size={24} className="text-black" strokeWidth={2.5} />
                <span className="text-lg font-medium text-black">Profile</span>
              </Link>
            )}

            {/* Menu: Logout */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut size={24} className="text-red-500" strokeWidth={2.5} />
              <span className="text-lg font-medium text-red-500">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}