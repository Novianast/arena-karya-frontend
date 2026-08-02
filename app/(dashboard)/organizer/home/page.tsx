"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import { Home, Trophy, Users, PlayCircle, FileText } from "lucide-react";
import EventCard from "@/components/competition/organizer/OrganizerEventCard";

export default function OrganizerHomePage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    stats: { totalEvent: 0, totalPeserta: 0, activeEvent: 0, draftEvent: 0 },
    latestEvents: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Penyelenggara");
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    const fetchOrganizerDashboardData = async () => {
      try {
        setIsLoading(true);

        // Ambil user yang sedang login
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Ambil data profil & organisasi
        const { data: profileData } = await supabase
          .from("profiles")
          .select(`
            username,
            organizers (
              organization_name
            )
          `)
          .eq("id", user.id)
          .single();

        if (profileData) {
          setUserName(profileData.username || "Penyelenggara");
          const organizer = Array.isArray(profileData.organizers) ? profileData.organizers[0] : profileData.organizers;
          setOrganizationName(organizer?.organization_name || "");
        }

        // Cari organizer_id
        const { data: organizer, error: orgError } = await supabase
          .from("organizers")
          .select("organizer_id")
          .eq("profile_id", user.id)
          .single();

        if (orgError || !organizer) {
          console.error("Gagal mendapatkan profile organizer:", orgError);
          setIsLoading(false);
          return;
        }

        const currentOrganizerId = organizer.organizer_id;

        // Ambil data events milik penyelenggara terpilih
        const { data: events, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            package_payments(packages(package_name)),
            competitions(competition_id, status)
          `)
          .eq("organizer_id", organizer.organizer_id)
          .eq("competitions.status", "active")
          .order("created_at", { ascending: false });

        if (eventError) throw eventError;

        // Map datanya untuk menghitung jumlah item di dalam array competitions
        const safeEvents = (events || []).map((event: any) => ({
          ...event,
          competition_count: event.competitions?.length || 0
        }));

        const totalEvent = safeEvents.length;
        const activeEvent = safeEvents.filter((e) => e.status === "active").length;
        const draftEvent = safeEvents.filter((e) => e.status === "draft").length;

        // Ambil total pendaftar spesifik organizer
        const { count: totalPesertaCount } = await supabase
          .from("registered_participants")
          .select("*", { count: "exact", head: true })
          .eq("organizer_id", currentOrganizerId);

        // Batasi 4 data terbaru dengan status active & draft
        const filteredLatestEvents = safeEvents
          .filter((e) => e.status === "active" || e.status === "draft")
          .slice(0, 4);

        setDashboardData({
          stats: {
            totalEvent,
            totalPeserta: totalPesertaCount || 0,
            activeEvent,
            draftEvent,
          },
          latestEvents: filteredLatestEvents,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizerDashboardData();
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
      router.refresh();
    } else {
      alert("Gagal logout: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 ">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  const { stats, latestEvents } = dashboardData;

  return (
    <div className="min-h-screen bg-white">
      {/* Banner full-width */}
      <div className="mb-6">
        <DashboardBannerHeader
          icon={<Home className="h-6 w-6 text-white" />}
          title="Beranda"
          subtitle="Buka Beranda Anda untuk melihat overview event Anda"
          showSearchFilter={false}
        />
      </div>

      {/* Baris Ringkasan Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-padded-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-blue-100">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Event</p>
            <h3 className="text-2xl font-bold text-gray-800 my-0.5">{stats.totalEvent}</h3>
            <p className="text-[11px] text-gray-400 truncate">Semua Event yang dibuat</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-padded-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-purple-100">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Peserta</p>
            <h3 className="text-2xl font-bold text-gray-800 my-0.5">{stats.totalPeserta}</h3>
            <p className="text-[11px] text-gray-400 truncate">Total Peserta yang sudah Terdaftar</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-padded-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-green-100">
            <PlayCircle className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Event Berjalan</p>
            <h3 className="text-2xl font-bold text-gray-800 my-0.5">{stats.activeEvent}</h3>
            <p className="text-[11px] text-gray-400 truncate">Sedang Berlangsung</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-padded-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold bg-amber-100">
            <FileText className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Event Draft</p>
            <h3 className="text-2xl font-bold text-gray-800 my-0.5">{stats.draftEvent}</h3>
            <p className="text-[11px] text-gray-400 truncate">Event dalam draft</p>
          </div>
        </div>
      </div>

      {/* Kontainer Utama Event */}
      <div className="bg-white border border-padded-white rounded-2xl p-6 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 font-plex">Event Yang Sedang Kamu Kelola</h3>
            <p className="text-sm text-gray-500">Kelola dan Pantau semua Event yang anda Selenggarakan</p>
          </div>

          <Link
            href="/organizer/event/create/package"
            className="bg-primary hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all inline-flex items-center gap-2 self-start sm:self-auto shadow"
          >
            <span className="text-base font-bold">+</span>
            <span>Buat Event Baru</span>
          </Link>
        </div>

        {latestEvents.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 border border-dashed rounded-xl">
            Belum ada event baru yang kamu buat.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {latestEvents.map((event: any) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        )}

        <div className="flex justify-center pt-6">
          <Link
            href="/organizer/event"
            className="border border-padded-white text-blue-600 hover:bg-gray-50 text-sm font-medium px-6 py-2.5 rounded-lg transition-all inline-flex items-center gap-2"
          >
            Lihat Semua Event <span className="font-bold">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}