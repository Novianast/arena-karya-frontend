"use client";

import ProfilePopup from "@/components/ui/ProfilePopup";
import InboxPopup from "@/components/ui/InboxPopup";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Home, History, Calendar, Users, User, UserSearch, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JudgeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // State untuk menyimpan data user
    const [userData, setUserData] = useState({
        username: "",
        institutionName: "",
        prefix: "",
        suffix: "",
        avatarUrl: "/images/default-avatar.png",
        email: "",
    });

    // State untuk mapping ID -> Nama Event (Fallback lama)
    const [breadcrumbNames, setBreadcrumbNames] = useState<Record<string, string>>({});
    
    // State BARU untuk menyimpan konteks Assignment (Lomba & Tahap) berdasarkan Assignment ID
    const [assignmentContexts, setAssignmentContexts] = useState<Record<string, { compName: string, stageName: string }>>({});

    // Fetch User Data
    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select(`
                username,
                profile_image,
                judges ( institution, prefix, suffix )
                `)
                .eq("id", user.id)
                .single();

            if (data && !error) {
                const judge = Array.isArray(data.judges) ? data.judges[0] : data.judges;
                let finalAvatarUrl = "/images/default-avatar.png";
                if (data.profile_image) {
                    const { data: publicUrlData } = supabase.storage
                        .from("profiles")
                        .getPublicUrl(`judges/${data.profile_image}`);
                    finalAvatarUrl = publicUrlData.publicUrl;
                }

                setUserData({
                    username: data.username || "Juri",
                    institutionName: judge?.institution || "Juri",
                    prefix: judge?.prefix || "",
                    suffix: judge?.suffix || "",
                    avatarUrl: finalAvatarUrl,
                    email: user.email || "",
                });
            }
        };

        fetchUserData();
    }, [supabase]);

    // Fetch Breadcrumb Data (Event & Assignment)
    useEffect(() => {
        const fetchBreadcrumbNames = async () => {
            const currentSegments = pathname.split("/").filter(Boolean);
            
            // 1. Logika lama untuk fetch nama event
            const updates: Record<string, string> = {};
            let hasNewId = false;
            for (let i = 0; i < currentSegments.length; i++) {
                if (currentSegments[i] === "event" && currentSegments[i + 1]) {
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
            }
            if (hasNewId) {
                setBreadcrumbNames((prev) => ({ ...prev, ...updates }));
            }

            // 2. Logika BARU untuk Assignment (Home Detail, Summary, History Detail)
            const isAssignmentRoute = currentSegments[0] === "judge" && 
                                      (currentSegments[1] === "home" || currentSegments[1] === "history") && 
                                      currentSegments[2]; // Index 2 adalah ID

            if (isAssignmentRoute) {
                const assignmentId = currentSegments[2];
                if (!isNaN(Number(assignmentId)) && !assignmentContexts[assignmentId]) {
                    // Fetch relasi dari judge_assignments -> stages -> competitions
                    const { data, error } = await supabase
                        .from("judge_assignments")
                        .select(`
                            stages (
                                stage_name,
                                competitions ( competition_name )
                            )
                        `)
                        .eq("assignment_id", assignmentId)
                        .single();

                    if (data && !error) {
                        const stages: any = Array.isArray(data.stages) ? data.stages[0] : data.stages;
                        const competitions: any = stages ? (Array.isArray(stages.competitions) ? stages.competitions[0] : stages.competitions) : null;

                        setAssignmentContexts((prev) => ({
                            ...prev,
                            [assignmentId]: {
                                compName: competitions?.competition_name || "Lomba",
                                stageName: stages?.stage_name || "Tahap"
                            }
                        }));
                    }
                }
            }
        };

        fetchBreadcrumbNames();
    }, [pathname, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

    const menuItems = [
        { name: "Dashboard", path: "/judge/home", icon: Home },
        { name: "Riwayat Penilaian", path: "/judge/history", icon: History },
        { name: "Profil", path: "/judge/profile", icon: User },
    ];

    const isMainHeader = pathname === "/" || menuItems.some((item) => item.path === pathname);
    const segments = pathname.split("/").filter(Boolean);
    
    // --- PENYUSUNAN BREADCRUMBS ---
    let breadcrumbs: { name: string; isLoading: boolean }[] = [];

    const isAssignmentRoute = segments[0] === "judge" && 
                              (segments[1] === "home" || segments[1] === "history") && 
                              segments[2];

    if (isAssignmentRoute) {
        // Logika Breadcrumb Khusus Penilaian / Riwayat
        const assignmentId = segments[2];
        const context = assignmentContexts[assignmentId];

        if (context) {
            breadcrumbs.push({ name: context.compName, isLoading: false });
            breadcrumbs.push({ name: context.stageName, isLoading: false });

            // Menentukan label terakhir berdasarkan sisa URL
            if (segments[1] === "home" && !segments[3]) {
                breadcrumbs.push({ name: "Penjurian", isLoading: false });
            } else if (segments[1] === "home" && segments[3] === "summary") {
                breadcrumbs.push({ name: "Rekapan Nilai", isLoading: false });
            } else if (segments[1] === "history") {
                breadcrumbs.push({ name: "Riwayat Penilaian", isLoading: false });
            }
        } else {
            // Tampilkan 3 Skeleton Loading saat data masih di-fetch
            breadcrumbs = [
                { name: "", isLoading: true },
                { name: "", isLoading: true },
                { name: "", isLoading: true }
            ];
        }
    } else {
        // Fallback: Logika default berdasarkan segment URL (untuk path lain)
        breadcrumbs = segments.slice(2).map((path) => {
            if (breadcrumbNames[path]) return { name: breadcrumbNames[path], isLoading: false };
            if (/^\d+$/.test(path)) return { name: "", isLoading: true };
            return {
                name: path.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                isLoading: false
            };
        });
    }

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
                        Menu Juri
                    </h3>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
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
                                    {userData.prefix} {userData.username}{userData.suffix ? `, ${userData.suffix}` : ''}
                                </h2>
                            </div>
                        ) : (
                            <div className="flex items-center text-lg font-bold text-gray-700">
                                {breadcrumbs.map((crumb, index, arr) => (
                                    <React.Fragment key={index}>
                                        {crumb.isLoading ? (
                                            <div className="h-6 w-28 bg-gray-200 animate-pulse rounded-md"></div>
                                        ) : (
                                            <span>{crumb.name}</span>
                                        )}

                                        {index < arr.length - 1 && (
                                            <ChevronRight className="mx-2 text-gray-400" size={20} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center gap-4">
                        <InboxPopup role="judge" />
                        <ProfilePopup
                            username={userData.username}
                            email={userData.email}
                            avatarUrl={userData.avatarUrl}
                            profilePath="/judge/profile"
                        />
                    </div>
                </header>

                {/* ================= KONTEN HALAMAN ================= */}
                <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
        </div>
    );
}