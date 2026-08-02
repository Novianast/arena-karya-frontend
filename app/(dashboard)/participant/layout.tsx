"use client";

import ProfilePopup from "@/components/ui/ProfilePopup";
import InboxPopup from "@/components/ui/InboxPopup";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Home, Flag, History, User, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Mapping enum ke text
const educationMap: Record<string, string> = {
  elementary_school: "SD",
  middle_school: "SMP",
  high_school: "SMA/SMK",
  college: "Perguruan Tinggi",
};

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // State untuk menyimpan data yang di-fetch dari Supabase
  const [userData, setUserData] = useState({
    username: "",
    education: "",
    avatarUrl: "/images/default-avatar.png",
    email: "",
  });

  // State untuk menyimpan mapping ID ke Nama Lomba/Event
  const [breadcrumbNames, setBreadcrumbNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      // Ambil user yang sedang login dari session cookie
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch data relasional (Profiles -> Participants -> Participant_Education)
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          username,
          profile_image,
          participants (
            participant_education (
              education_level
            )
          )
        `)
        .eq("id", user.id)
        .single();

      if (data && !error) {
        // Handle struktur balikan Supabase (tergantung apakah dideteksi sebagai array atau object 1-to-1)
        const participant = Array.isArray(data.participants) ? data.participants[0] : data.participants;
        const education = Array.isArray(participant?.participant_education)
          ? participant?.participant_education[0]
          : participant?.participant_education;

        const rawEducationLevel = education?.education_level;
        const mappedEducation = rawEducationLevel ? educationMap[rawEducationLevel] : "Data Belum Lengkap";

        // Handle Profile Image
        let finalAvatarUrl = "/images/default-avatar.png";
        if (data.profile_image) {
          const { data: publicUrlData } = supabase.storage
            .from("profiles")
            .getPublicUrl(`participants/${data.profile_image}`);

          finalAvatarUrl = publicUrlData.publicUrl;
        }

        // Set ke state
        setUserData({
          username: data.username || "Peserta",
          education: mappedEducation,
          avatarUrl: finalAvatarUrl,
          email: user.email || "",
        });
      }
    };

    fetchUserData();
  }, [supabase]);

  // Fetch nama Event atau Competition berdasarkan URL
  useEffect(() => {
    const fetchBreadcrumbNames = async () => {
      const currentSegments = pathname.split("/").filter(Boolean);
      const updates: Record<string, string> = {};
      let hasNewId = false;

      for (let i = 0; i < currentSegments.length; i++) {
        const segment = currentSegments[i];

        // Jalur event/[eventId]
        if (segment === "event" && currentSegments[i + 1]) {
          const eventId = currentSegments[i + 1];
          if (!isNaN(Number(eventId)) && !breadcrumbNames[eventId]) {
            const { data, error } = await supabase
              .from("events")
              .select("event_name")
              .eq("event_id", eventId)
              .single();

            if (data && !error) {
              updates[eventId] = data.event_name;
              hasNewId = true;
            }
          }
        }

        // Jalur competition/[entry_id]
        if (segment === "competition" && currentSegments[i + 1]) {
          const entryId = currentSegments[i + 1];
          if (!isNaN(Number(entryId)) && !breadcrumbNames[entryId]) {
            const { data, error } = await supabase
              .from("entries")
              .select(`
                competitions (
                  competition_name
                )
              `)
              .eq("entry_id", entryId)
              .single();

            if (data && !error) {
              const comp = Array.isArray(data.competitions) ? data.competitions[0] : data.competitions;
              if (comp?.competition_name) {
                updates[entryId] = comp.competition_name;
                hasNewId = true;
              }
            }
          }
        }

        // Jalur register/[competitionId]
        if (segment === "register" && currentSegments[i + 1]) {
          const competitionId = currentSegments[i + 1];
          if (!isNaN(Number(competitionId)) && !breadcrumbNames[competitionId]) {
            const { data, error } = await supabase
              .from("competitions")
              .select("competition_name")
              .eq("competition_id", competitionId)
              .single();

            if (data && !error) {
              updates[competitionId] = data.competition_name;
              hasNewId = true;
            }
          }
        }
      }

      if (hasNewId) {
        setBreadcrumbNames((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchBreadcrumbNames();
  }, [pathname, supabase]);

  // Daftar Menu Sidebar
  const menuItems = [
    { name: "Dashboard", path: "/participant/home", icon: Home },
    { name: "Lomba yang Diikuti", path: "/participant/competition", icon: Flag },
    { name: "Riwayat Lomba", path: "/participant/history-competition", icon: History },
    { name: "Profil", path: "/participant/profile", icon: User },
  ];

  // Logika Pemisah Variant Header & Breadcrumb
  const isMainHeader = pathname === "/" || menuItems.some((item) => item.path === pathname);
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments
    .slice(2)
    .map((path) => {
      // Jika segmen ada di state (sudah difetch namanya)
      if (breadcrumbNames[path]) {
        return { name: breadcrumbNames[path], isLoading: false };
      }

      // Jika segmen adalah ANGKA (ID) dan belum ada di state
      if (/^\d+$/.test(path)) {
        return { name: "", isLoading: true };
      }

      // Mapping khusus untuk segmen URL tertentu menjadi bahasa Indonesia
      const customMappings: Record<string, string> = {
        register: "Pendaftaran",
      };

      // Cek apakah segment ada di customMappings, jika tidak format kapitalisasi default
      const formattedName = customMappings[path.toLowerCase()]
        || path.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      // Jika segmen berupa teks rute biasa
      return {
        name: formattedName,
        isLoading: false
      };
    });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] h-full bg-default-white border-r border-padded-white flex flex-col shrink-0">
        <div className="p-6">
          <Image
            src="/logo/arena-karya-blue.png"
            alt="Logo Arena Karya"
            width={153}
            height={60}
            priority
            className="h-auto w-auto"
          />
        </div>

        <div className="px-6 mb-2">
          <h3 className="text-[12px] font-semibold text-default-gray uppercase tracking-wider">
            Menu Peserta
          </h3>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive
                  ? "text-primary bg-white border border-padded-white"
                  : "text-default-gray hover:bg-default-white"
                  }`}
              >
                <Icon size={20} className={isActive ? "text-primary" : "text-default-gray"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ================= AREA KANAN ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* ================= HEADER ================= */}
        <header className="h-[88px] w-full bg-white border-b border-padded-white px-8 flex items-center justify-between shrink-0">
          <div>
            {isMainHeader ? (
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-gray-500 mb-0.5">Selamat Datang !</span>
                <h2 className="text-xl font-bold text-gray-900">
                  {userData.username} - {userData.education}
                </h2>
              </div>
            ) : (
              <div className="flex items-center text-lg font-bold text-gray-700">
                {breadcrumbs.map((crumb, index, arr) => (
                  <React.Fragment key={index}>
                    {/* Jika masih loading (ID), tampilkan skeleton box */}
                    {crumb.isLoading ? (
                      <div className="h-6 w-28 bg-gray-200 animate-pulse rounded-md"></div>
                    ) : (
                      /* Jika tidak loading, tampilkan nama seperti biasa */
                      <span>{crumb.name}</span>
                    )}

                    {/* Menampilkan Chevron pemisah */}
                    {index < arr.length - 1 && (
                      <ChevronRight className="mx-2 text-gray-400" size={20} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Bagian Kanan Header (Foto Profil & Inbox) */}
          <div className="shrink-0 flex items-center gap-4">
            <InboxPopup role="participant" />
            <ProfilePopup
              username={userData.username}
              email={userData.email}
              avatarUrl={userData.avatarUrl}
              profilePath="/participant/profile"
            />
          </div>
        </header>

        {/* ================= KONTEN HALAMAN ================= */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}