"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import { Home, Trophy, Users, User, Package, Briefcase } from "lucide-react";
import AdminDashboardCard from "@/components/admin/AdminDashboardCard";

export default function AdminHomePage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    stats: { totalEvent: 0, totalOrganizer: 0, totalJudge: 0, totalParticipant: 0 },
    recentPackages: [] as any[],
    recentEvents: [] as any[],
    recentOrganizers: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDashboardData = async () => {
      try {
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch counts
        const { count: eventsCount } = await supabase.from("events").select("event_id", { count: "exact", head: true }).neq("status", "draft");
        const { count: organizersCount } = await supabase.from("organizers").select("organizer_id", { count: "exact", head: true });
        const { count: judgesCount } = await supabase.from("judges").select("judge_id", { count: "exact", head: true });
        const { count: participantsCount } = await supabase.from("participants").select("participant_id", { count: "exact", head: true });

        // Fetch overviews (3 terbaru)
        const { data: recentPackages } = await supabase.from("packages").select("package_id, package_name, price").order("created_at", { ascending: false }).limit(3);
        const { data: recentEvents } = await supabase.from("events").select("event_id, organizer_id, event_name, status, organizers(organization_name)").neq("status", "draft").order("created_at", { ascending: false }).limit(3);
        const { data: recentOrganizers } = await supabase.from("organizers").select("organizer_id, organization_name, pic_name").order("created_at", { ascending: false }).limit(3);

        setDashboardData({
          stats: {
            totalEvent: eventsCount || 0,
            totalOrganizer: organizersCount || 0,
            totalJudge: judgesCount || 0,
            totalParticipant: participantsCount || 0,
          },
          recentPackages: recentPackages || [],
          recentEvents: recentEvents || [],
          recentOrganizers: recentOrganizers || [],
        });
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminDashboardData();
  }, [router]);

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

  const { stats, recentPackages, recentEvents, recentOrganizers } = dashboardData;

  return (
    <div className="min-h-screen bg-white">
      {/* Banner full-width */}
      <div className="mb-6">
        <DashboardBannerHeader
          icon={<Home className="h-6 w-6 text-white" />}
          title="Dashboard"
          subtitle="Lihat Keseluruhan Perlombaan"
          showSearchFilter={false}
        />
      </div>

      {/* Baris Ringkasan Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminDashboardCard
          title="Total Event"
          count={stats.totalEvent}
          subtitle="Semua Event yang dibuat"
          icon={<Trophy className="h-6 w-6 text-primary" />}
          bgColor="bg-blue-100"
        />
        <AdminDashboardCard
          title="Jumlah Penyelenggara"
          count={stats.totalOrganizer}
          subtitle="Total Penyelenggara yang Terdaftar"
          icon={<Users className="h-6 w-6 text-purple-500" />}
          bgColor="bg-purple-100"
        />
        <AdminDashboardCard
          title="Jumlah Juri"
          count={stats.totalJudge}
          subtitle="Total Juri yang Terdaftar"
          icon={<User className="h-6 w-6 text-amber-500" />}
          bgColor="bg-amber-100"
        />
        <AdminDashboardCard
          title="Jumlah Peserta"
          count={stats.totalParticipant}
          subtitle="Total Peserta yang Terdaftar"
          icon={<User className="h-6 w-6 text-orange-500" />}
          bgColor="bg-orange-100"
        />
      </div>

      {/* Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Package Overview */}
        <div className="bg-white border border-padded-white rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-plex">
              <Package className="h-5 w-5 text-primary" /> Paket Event
            </h3>
            <Link href="/admin/package" className="text-sm text-primary hover:underline font-medium">
              Lihat Selengkapnya
            </Link>
          </div>
          <div className="flex-1 space-y-3">
            {recentPackages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded-xl">Belum ada paket.</p>
            ) : (
              recentPackages.map((pkg) => (
                <div key={pkg.package_id} className="p-3 border border-padded-white rounded-lg hover:bg-gray-50 flex justify-between items-center transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{pkg.package_name}</h4>
                    <p className="text-xs text-gray-500 font-medium text-primary mt-0.5">Rp {pkg.price.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Events Overview */}
        <div className="bg-white border border-padded-white rounded-2xl p-6 flex flex-col ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-plex">
              <Trophy className="h-5 w-5 text-primary" /> Event Terbaru
            </h3>
            <Link href="/admin/event" className="text-sm text-primary hover:underline font-medium">
              Lihat Selengkapnya
            </Link>
          </div>
          <div className="flex-1 space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded-xl">Belum ada event.</p>
            ) : (
              recentEvents.map((evt) => (
                <div key={evt.event_id} className="p-3 border border-padded-white rounded-lg hover:bg-gray-50 flex justify-between items-center transition-colors">
                  <div className="overflow-hidden pr-2">
                    <h4 className="font-semibold text-gray-800 text-sm truncate" title={evt.event_name}>
                      {evt.event_name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {evt.organizers?.organization_name || "Tanpa Penyelenggara"}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                    evt.status === 'queue' ? 'bg-blue-100 text-blue-700' : 
                    evt.status === 'active' ? 'bg-green-100 text-green-700' : 
                    evt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {evt.status === 'queue' ? 'Antrian' : evt.status === 'active' ? 'Aktif' : evt.status === 'end' ? 'Selesai' : evt.status === 'cancelled' ? 'Batal' : 'Draft'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organizers Overview */}
        <div className="bg-white border border-padded-white rounded-2xl p-6 flex flex-col ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-plex">
              <Briefcase className="h-5 w-5 text-primary" /> Penyelenggara
            </h3>
            <Link href="/admin/organizer" className="text-sm text-primary hover:underline font-medium">
              Lihat Selengkapnya
            </Link>
          </div>
          <div className="flex-1 space-y-3">
            {recentOrganizers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded-xl">Belum ada penyelenggara.</p>
            ) : (
              recentOrganizers.map((org) => (
                <div key={org.organizer_id} className="p-3 border border-padded-white rounded-lg hover:bg-gray-50 flex justify-between items-center transition-colors">
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{org.organization_name}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{org.pic_name || "-"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}