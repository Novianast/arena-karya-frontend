"use client";

import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft, Calendar, Globe, MapPin, Flag, FileText,
    Search, Filter, Users, User, Edit, Trash2, CheckCircle2,
    Info, X, CircleAlert, ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link"
import { supabase } from "@/lib/supabase";
import FilterDropdown from "@/components/ui/FilterDropdown";
import PosterModal from "@/components/ui/PosterModal";
import { usePoster } from "@/hooks/usePoster";
import { getDocumentUrl } from "@/services/url/getDocumentUrl";

export default function OrganizerEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId;

    // --- STATE SUPABASE DATA ---
    const [event, setEvent] = useState<any>(null);
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        peserta: 0,
        tim: 0,
        lomba_aktif: 0,
        lomba_lengkap: 0,
        lomba_nonaktif: 0
    });

    // --- STATE FILTERS & SEARCH ---
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // --- STATE MODAL TAMBAH LOMBA ---
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [namaLombaBaru, setNamaLombaBaru] = useState("");

    // --- STATE MODAL HAPUS LOMBA ---
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [competitionToDelete, setCompetitionToDelete] = useState<any>(null);
    const [isPublishConfirmModalOpen, setIsPublishConfirmModalOpen] = useState(false);
    const [isDraftsListModalOpen, setIsDraftsListModalOpen] = useState(false);

    // --- STATE POSTER ---
    const posterSrc = usePoster(event?.poster);

    // --- STATE PACKAGE ---
    const pkgName = event?.packages?.package_name || event?.package_payments?.packages?.package_name || "-";

    // Badge Style
    let badgeStyle = "bg-green-500 text-white";
    if (pkgName.toUpperCase() === "KARYA") {
        badgeStyle = "bg-primary text-white";
    } else if (pkgName.toUpperCase() === "MAHAKARYA") {
        badgeStyle = "bg-accent text-white";
    }

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: orgData, error: orgErr } = await supabase
                .from("organizers")
                .select("organizer_id")
                .eq("profile_id", user.id)
                .single();

            if (orgErr || !orgData) {
                console.error("Error fetching organizer:", orgErr?.message);
                router.push("/organizer/home");
                return;
            }

            const currentOrganizerId = orgData.organizer_id;

            const { data, error } = await supabase
                .from("events")
                .select(`
                    *,
                    package_payments (
                        packages (
                            package_name
                        )
                    )
                `)
                .eq("event_id", Number(eventId))
                .eq("organizer_id", currentOrganizerId)
                .single();

            if (error || !data) {
                console.error("Error fetching event details or unauthorized:", error?.message);
                router.push("/organizer/home");
                return;
            }

            setEvent(data);
        } catch (err) {
            console.error("Error in fetchEventDetails:", err);
            router.push("/organizer/home");
        } finally {
            setLoading(false);
        }
    };

    const fetchCompetitions = async () => {
        try {
            const { data, error } = await supabase
                .from("competitions")
                .select("*")
                .eq("event_id", Number(eventId))
                .order("competition_id", { ascending: true });

            if (error) {
                console.error("Error fetching competitions:", error.message);
            } else {
                setCompetitions(data || []);

                // Calculate stats based on competitions data
                const compIds = (data || []).map((c: any) => c.competition_id);
                let totalPeserta = 0;
                let totalTim = 0;

                if (compIds.length > 0) {
                    const { data: entriesData, error: entriesErr } = await supabase
                        .from("entries")
                        .select("entry_type, entry_id")
                        .in("competition_id", compIds);

                    if (entriesData) {
                        totalTim = entriesData.filter((e: any) => e.entry_type === "team").length;
                        const entryIds = entriesData.map((e: any) => e.entry_id);

                        if (entryIds.length > 0) {
                            const { count, error: countErr } = await supabase
                                .from("entry_members")
                                .select("*", { count: "exact", head: true })
                                .in("entry_id", entryIds);

                            if (!countErr) {
                                totalPeserta = count || 0;
                            }
                        }
                    }
                }

                setStats({
                    peserta: totalPeserta,
                    tim: totalTim,
                    lomba_aktif: (data || []).filter((c: any) => c.status === "active").length,
                    lomba_lengkap: (data || []).filter((c: any) => c.status === "ready").length,
                    lomba_nonaktif: (data || []).filter((c: any) => c.status === "draft" || c.status === "cancelled").length
                });
            }
        } catch (err) {
            console.error("Error in fetchCompetitions:", err);
        }
    };

    useEffect(() => {
        if (eventId) {
            fetchEventDetails();
            fetchCompetitions();
        }
    }, [eventId]);

    const initDefaultStages = async (supabase: any, competitionId: number, packageName: string, startDate: string, endDate: string) => {
        // Default: 1 babak saja untuk semua paket.
        // Organizer bisa menambah babak sendiri melalui tombol "Tambah Babak".
        const stageConfigs = [
            {
                stage_name: "Pendaftaran",
                stage_type: "registration",
                stage_order: 1,
                timelines: [
                    { timeline_type: "registration", timeline_order: 1 }
                ]
            },
            {
                stage_name: "Babak I",
                stage_type: "final",
                stage_order: 2,
                timelines: [
                    { timeline_type: "submission", timeline_order: 1 },
                    { timeline_type: "judging", timeline_order: 2 },
                    { timeline_type: "announcement", timeline_order: 3 },
                    { timeline_type: "award", timeline_order: 4 }
                ]
            }
        ];

        for (const config of stageConfigs) {
            const { data: stageData, error: stageErr } = await supabase
                .from("stages")
                .insert({
                    competition_id: competitionId,
                    stage_name: config.stage_name,
                    stage_type: config.stage_type,
                    stage_order: config.stage_order,
                    start_date: startDate,
                    end_date: endDate,
                    status: "not_started"
                })
                .select()
                .single();

            if (stageErr) {
                console.error("Error creating stage:", stageErr);
                continue;
            }

            const stageId = stageData.stage_id;

            const timelinesToInsert = config.timelines.map((t: any) => ({
                stage_id: stageId,
                timeline_type: t.timeline_type,
                timeline_order: t.timeline_order,
                start_date: startDate,
                end_date: endDate
            }));

            const { error: tlErr } = await supabase
                .from("stage_timelines")
                .insert(timelinesToInsert);

            if (tlErr) {
                console.error("Error creating stage timelines:", tlErr);
            }
        }
    };

    const handleCreateLomba = async () => {
        if (namaLombaBaru.trim() === "") return;

        const { data, error } = await supabase
            .from("competitions")
            .insert([
                {
                    event_id: Number(eventId),
                    competition_name: namaLombaBaru,
                    status: "draft",
                    type: "team",
                    price: 0
                }
            ])
            .select()
            .single();

        if (error) {
            alert("Gagal menambahkan lomba: " + error.message);
        } else {
            // Initialize default stages and timelines based on package
            try {
                const startDate = event?.start_date || new Date().toISOString().split('T')[0];
                const endDate = event?.end_date || new Date().toISOString().split('T')[0];

                await initDefaultStages(supabase, data.competition_id, pkgName, startDate, endDate);
            } catch (initErr) {
                console.error("Error initializing default stages:", initErr);
            }

            setIsConfirmModalOpen(false);
            setNamaLombaBaru("");
            router.push(`/organizer/event/${eventId}/competition/${data.competition_id}/edit?tab=informasi`);
        }
    };

    const handleDeleteCompetition = async () => {
        if (!competitionToDelete) return;

        const { error } = await supabase
            .from("competitions")
            .delete()
            .eq("competition_id", competitionToDelete.competition_id);

        if (error) {
            alert("Gagal menghapus lomba: " + error.message);
        } else {
            alert("Lomba berhasil dihapus!");
            fetchCompetitions();
        }

        setIsDeleteConfirmModalOpen(false);
        setCompetitionToDelete(null);
    };

    const handlePublishEvent = async () => {
        if (!event) return;

        setIsPublishConfirmModalOpen(false);

        // Delete draft competitions first (database CASCADE rules will automatically handle stages, timelines, entries, etc.)
        const { error: deleteDraftsErr } = await supabase
            .from("competitions")
            .delete()
            .eq("event_id", Number(eventId))
            .eq("status", "draft");

        if (deleteDraftsErr) {
            alert("Gagal menghapus lomba draf: " + deleteDraftsErr.message);
            return;
        }

        // Update ready competitions to active
        const { error: updateCompetitionsErr } = await supabase
            .from("competitions")
            .update({
                status: "active",
                updated_at: new Date().toISOString()
            })
            .eq("event_id", Number(eventId))
            .eq("status", "ready");

        if (updateCompetitionsErr) {
            alert("Gagal mengaktifkan lomba: " + updateCompetitionsErr.message);
            return;
        }

        const { error } = await supabase
            .from("events")
            .update({
                is_published: true,
                status: "active",
                published_at: new Date().toISOString()
            })
            .eq("event_id", Number(eventId));

        if (error) {
            alert("Gagal mempublikasikan event: " + error.message);
        } else {
            alert("Event berhasil dipublikasikan!");
            fetchEventDetails();
            fetchCompetitions();
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Belum ditentukan";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const filteredCompetitions = competitions.filter((comp) => {
        const matchesSearch = comp.competition_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || comp.type === typeFilter;
        const matchesStatus = statusFilter === "all"
            ? true
            : comp.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border- border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <CircleAlert size={48} className="text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Event tidak ditemukan</h2>
                <button
                    onClick={() => router.push("/organizer/event")}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold"
                >
                    Kembali ke Daftar Event
                </button>
            </div>
        );
    }

    const draftCompetitionsList = competitions.filter(comp => comp.status === "draft");
    const hasDrafts = draftCompetitionsList.length > 0;

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* 1. Tombol Kembali */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors w-fit"
            >
                <ChevronLeft size={20} />
                <span className="font-semibold">Kembali</span>
            </button>

            {/* 2. Banner & Header Event */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-[267px] w-full bg-gray-200 relative">
                    <PosterModal src={posterSrc} alt={event.event_name} />
                </div>

                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-2">
                        {/* Title & Package Badge */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-[#2a2a2a]">{event.event_name}</h1>
                            <div className={`px-3 py-1 rounded-md ${badgeStyle}`}>
                                <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                                    {event.package_payments?.packages?.package_name || "-"}
                                </span>
                            </div>
                        </div>
                        {/* Date info with icon */}
                        <div className="flex items-center gap-2 text-[#666666]">
                            <div className="bg-[#EAF2FD] p-1.5 rounded-md text-[#1A73E8] flex items-center justify-center">
                                <Calendar size={15} />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold">
                                {formatDate(event.start_date)} - {formatDate(event.end_date)}
                            </span>
                        </div>
                    </div>

                    {/* Status & Action Buttons */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                        {event.is_published ? (
                            <>
                                {/* Badge Aktif (Green) */}
                                <div className="bg-[#e6f4ea] text-[#137333] px-5 py-2 rounded-lg font-bold text-xs sm:text-sm">
                                    Aktif
                                </div>
                                {/* Badge Terpublikasi (Blue with Globe icon) */}
                                <div className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-sm select-none">
                                    <Globe size={16} />
                                    Terpublikasi
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Status badge */}
                                <div className="bg-[#FEF7E0] text-[#B06000] px-4 py-2 rounded-lg font-bold text-xs sm:text-sm">
                                    {event.status === "draft" ? "Draf" : (event.status ? (event.status.charAt(0).toUpperCase() + event.status.slice(1).toLowerCase()) : "Draf")}
                                </div>

                                <button
                                    onClick={() => {
                                        if (hasDrafts) {
                                            setIsDraftsListModalOpen(true);
                                        } else {
                                            setIsPublishConfirmModalOpen(true);
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors text-white ${hasDrafts
                                            ? "bg-gray-400 hover:bg-gray-500"
                                            : "bg-primary hover:bg-blue-700"
                                        }`}
                                >
                                    <Globe size={16} />
                                    Publikasi Event
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Deskripsi & Dokumen */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kiri: Deskripsi & Info */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-3 text-black">Deskripsi Event</h2>
                        <p className="text-gray-700 text-justify leading-relaxed">
                            {event.description || "Belum ada deskripsi event."}
                        </p>
                    </div>

                    <hr className="border-gray-200" />

                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-black">Informasi Event</h2>
                        <div className="flex flex-col sm:flex-row gap-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <MapPin size={18} />
                                    <span className="font-regular">Lokasi</span>
                                </div>
                                <p className="font-bold text-gray-800">{event.location || "Online / Belum ditentukan"}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Flag size={18} />
                                    <span className="font-regular">Multi Lomba</span>
                                </div>
                                <p className="font-bold text-gray-800">{event.allow_multi_comp ? "Ya" : "Tidak"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanan: Dokumen */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                    <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-black" /> Dokumen Lomba
                    </h2>
                    {event?.event_guidebook ? (
                        <div
                            onClick={() => window.open(getDocumentUrl(event?.event_guidebook, 'events'))}
                            className="border border-gray-200 rounded-xl flex justify-between items-stretch hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                        >
                            <div className="p-4 flex-1 flex flex-col justify-center">
                            <h3 className="text-sm font-bold text-gray-800 underline decoration-gray-400 underline-offset-4 group-hover:text-blue-600 transition-colors">Guidebook {event.event_name}</h3>
                            <p className="text-sm font-semibold text-gray-400 mt-1.5">PDF</p>
                            </div>
                            <div className="w-24 bg-gray-900 relative shrink-0">
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <FileText className="text-white/40" size={24} />
                            </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-500 flex-grow">
                            <FileText size={32} className="text-gray-300" />
                            <p className="text-xs font-semibold text-center">Belum ada guidebook yang diunggah</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Tabel Bidang Lomba */}
            <div className="space-y-4 mt-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-[#2a2a2a]">Bidang Lomba</h2>
                    <p className="text-gray-600">Pantau, Tambah dan Kelola bidang Lomba yang tersedia di Event</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                    {/* Kiri: Statistik Mini */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 lg:w-[55%] xl:w-[65%] flex-shrink-0">
                        {/* Card Jumlah Peserta */}
                        <div className="bg-primary p-4 rounded-lg shadow-sm flex flex-col justify-between h-[100px] w-full">
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Jumlah Peserta</p>
                            <p className="text-white text-3xl font-bold">{stats.peserta}</p>
                        </div>
                        {/* Card Jumlah Tim */}
                        <div className="bg-primary p-4 rounded-lg shadow-sm flex flex-col justify-between h-[100px] w-full">
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Jumlah Tim</p>
                            <p className="text-white text-3xl font-bold">{stats.tim}</p>
                        </div>
                        {/* Card Lomba Aktif */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-[100px] w-full">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Jumlah Lomba Aktif</p>
                            <p className="text-[#00ac0b] text-3xl font-bold">{stats.lomba_aktif}</p>
                        </div>
                        {/* Card Lomba Lengkap */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-[100px] w-full">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Jumlah Lomba Lengkap</p>
                            <p className="text-[#1a73e8] text-3xl font-bold">{stats.lomba_lengkap}</p>
                        </div>
                        {/* Card Lomba Nonaktif */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-[100px] w-full">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Jumlah Lomba Nonaktif</p>
                            <p className="text-[#d04b33] text-3xl font-bold">{stats.lomba_nonaktif}</p>
                        </div>
                    </div>

                    {/* Kanan: Search & Filter & Action Button */}
                    <div className="flex flex-col gap-3 lg:w-[45%] xl:w-[35%] flex-grow justify-between min-w-0">
                        {/* Search Bar */}
                        <div className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2.5 rounded-lg w-full shadow-sm">
                            <Search size={18} className="text-gray-500 shrink-0" />
                            <input
                                type="text"
                                placeholder="Telusuri Lomba"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="outline-none w-full text-sm font-semibold text-gray-750 bg-transparent min-w-0"
                            />
                        </div>

                        {/* Dropdowns & Add Button */}
                        <div className="flex flex-wrap items-stretch gap-2 w-full">
                            <div className="flex-1 min-w-0">
                                <FilterDropdown
                                    icon={<Filter size={16} className="text-gray-500 shrink-0" />}
                                    value={typeFilter}
                                    onChange={setTypeFilter}
                                    options={[
                                        { label: "Semua Tipe", value: "all" },
                                        { label: "Pribadi", value: "individual" },
                                        { label: "Tim", value: "team" }
                                    ]}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <FilterDropdown
                                    icon={<Filter size={16} className="text-gray-500 shrink-0" />}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={[
                                        { label: "Semua Status", value: "all" },
                                        { label: "Draf", value: "draft" },
                                        { label: "Aktif", value: "active" },
                                        { label: "Lengkap", value: "ready" },
                                        { label: "Berakhir", value: "end" }
                                    ]}
                                />
                            </div>
                            {!event.is_published && (
                                <button
                                    onClick={() => setIsInputModalOpen(true)}
                                    className="bg-[#f4b400] hover:bg-yellow-500 text-white px-4 py-2 rounded-md font-bold text-[13px] transition-colors shrink-0 shadow-sm flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap"
                                >
                                    Tambah Lomba
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabel Data */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                <th className="p-4 font-bold">No</th>
                                <th className="p-4 font-bold">Nama Lomba</th>
                                <th className="p-4 font-bold">Tipe Perlombaan</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Tanggal</th>
                                <th className="p-4 font-bold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredCompetitions.length > 0 ? (
                                filteredCompetitions.map((comp, idx) => (
                                    <tr key={comp.competition_id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-900">{idx + 1}</td>
                                        <td className="p-4 font-bold text-gray-900">{comp.competition_name}</td>
                                        <td className="p-4">
                                            {comp.type === "individual" ? (
                                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-md font-bold">
                                                    <User size={16} /> Pribadi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-md font-bold">
                                                    <Users size={16} /> Tim
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {comp.status === "active" ? (
                                                <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#00ac0b] px-3 py-1 rounded-md font-bold">
                                                    <CheckCircle2 size={16} /> AKTIF
                                                </span>
                                            ) : comp.status === "ready" ? (
                                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1a73e8] px-3 py-1 rounded-md font-bold">
                                                    <CheckCircle2 size={16} /> LENGKAP
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-[rgba(244,180,0,0.2)] text-[#f4b400] px-3 py-1 rounded-md font-bold">
                                                    {comp.status === "draft" ? "DRAF" : comp.status.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600">{formatDate(comp.created_at)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {event.is_published ? (
                                                    <>
                                                        <Link
                                                            href={`/organizer/event/${event.event_id}/competition/${comp.competition_id}/detail`}
                                                            className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 text-xs shadow-sm transition-all"
                                                        >
                                                            Detail <ArrowRight size={14} className="ml-0.5" />
                                                        </Link>
                                                        <Link
                                                            href={`/organizer/event/${event.event_id}/competition/${comp.competition_id}/timeline`}
                                                            className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 text-xs shadow-sm transition-all"
                                                        >
                                                            Timeline <ArrowRight size={14} className="ml-0.5" />
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => router.push(`/organizer/event/${eventId}/competition/${comp.competition_id}/edit?tab=informasi`)}
                                                            className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-md font-bold hover:bg-blue-700"
                                                        >
                                                            <Edit size={16} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setCompetitionToDelete(comp);
                                                                setIsDeleteConfirmModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-1 bg-[#d04b33] text-white px-3 py-1.5 rounded-md font-bold hover:bg-red-700"
                                                        >
                                                            <Trash2 size={16} /> Hapus
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 font-semibold">
                                        Tidak ada lomba yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* ========================================= */}
            {/* MODAL 1: INPUT NAMA LOMBA                 */}
            {/* ========================================= */}
            {isInputModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-[500px] p-6 relative shadow-xl">
                        <button
                            onClick={() => setIsInputModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-800 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-8">
                            <h3 className="text-[20px] font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-2xl font-normal leading-none">+</span> Tambah Lomba
                            </h3>
                            <p className="text-gray-500 text-[15px] mt-1 ml-6">Tambahkan Lomba sesuai keinginan</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-[16px] font-semibold text-gray-500 mb-2">
                                    <span className="font-serif text-lg leading-none font-bold text-gray-500">Tt</span> Nama Lomba
                                </label>
                                <input
                                    type="text"
                                    value={namaLombaBaru}
                                    onChange={(e) => setNamaLombaBaru(e.target.value)}
                                    placeholder="Masukkan nama Lomba..."
                                    className="w-full px-4 py-3 border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-primary text-gray-900 placeholder-gray-300"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => {
                                        if (namaLombaBaru.trim() !== "") {
                                            setIsInputModalOpen(false);
                                            setIsConfirmModalOpen(true);
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-[#1a73e8] text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                                    disabled={namaLombaBaru.trim() === ""}
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL 2: CONFIRM POPUP                    */}
            {/* ========================================= */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-[450px] p-8 relative shadow-xl flex flex-col items-center text-center">
                        <button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-[#e8f0fe] text-[#1a73e8] border-[3px] border-[#d2e3fc] w-[60px] h-[60px] rounded-full flex items-center justify-center mb-6 mt-2 p-3">
                            <CircleAlert size={32} />
                        </div>

                        <h3 className="text-[18px] font-bold text-[#2a2a2a] mb-4 leading-snug">
                            Yakin ingin menambah Lomba <br /> {namaLombaBaru}?
                        </h3>
                        <p className="text-[15px] text-[#2a2a2a] mb-8">
                            Lomba dapat diganti kembali setelah dibuat
                        </p>

                        <div className="flex w-full gap-4">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 py-2.5 border border-gray-400 text-[#2a2a2a] rounded-lg font-semibold hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateLomba}
                                className="flex-1 py-2.5 bg-[#1a73e8] text-white rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Ya, Buat
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ========================================= */}
            {/* MODAL 3: DELETE CONFIRM POPUP             */}
            {/* ========================================= */}
            {isDeleteConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-[450px] p-8 relative shadow-xl flex flex-col items-center text-center">
                        <button
                            onClick={() => {
                                setIsDeleteConfirmModalOpen(false);
                                setCompetitionToDelete(null);
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-[#fce8e6] text-[#c5221f] border-[3px] border-[#fad2cf] w-[60px] h-[60px] rounded-full flex items-center justify-center mb-6 mt-2 p-3">
                            <CircleAlert size={32} />
                        </div>

                        <h3 className="text-[18px] font-bold text-[#2a2a2a] mb-4 leading-snug">
                            Yakin ingin menghapus Lomba <br /> {competitionToDelete?.competition_name}?
                        </h3>
                        <p className="text-[15px] text-gray-500 mb-8">
                            Semua data terkait lomba ini akan dihapus secara permanen dan tindakan ini tidak dapat dibatalkan.
                        </p>

                        <div className="flex w-full gap-4">
                            <button
                                onClick={() => {
                                    setIsDeleteConfirmModalOpen(false);
                                    setCompetitionToDelete(null);
                                }}
                                className="flex-1 py-2.5 border border-gray-400 text-[#2a2a2a] rounded-lg font-semibold hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteCompetition}
                                className="flex-1 py-2.5 bg-[#d04b33] text-white rounded-lg font-semibold hover:bg-red-700"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL 4: PUBLISH CONFIRM POPUP            */}
            {/* ========================================= */}
            {isPublishConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-[480px] p-8 relative shadow-xl flex flex-col items-center text-center">
                        <button
                            onClick={() => setIsPublishConfirmModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-[#eaf2fd] text-[#1a73e8] border-[3px] border-[#d2e3fc] w-[60px] h-[60px] rounded-full flex items-center justify-center mb-6 mt-2 p-3">
                            <Info size={32} />
                        </div>

                        <h3 className="text-[18px] font-bold text-gray-900 mb-4 leading-snug">
                            Apakah Anda Yakin Ingin Mempublikasi Event <br /> <span className="font-extrabold">{event?.event_name}</span> ?
                        </h3>
                        <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                            Event yang sudah dipublikasikan tidak dapat diedit kembali. Pastikan data sudah benar sebelum publikasi.
                        </p>

                        <div className="flex w-full gap-4">
                            <button
                                onClick={() => setIsPublishConfirmModalOpen(false)}
                                className="flex-1 py-2.5 border border-gray-400 text-[#2a2a2a] rounded-lg font-semibold hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handlePublishEvent}
                                className="flex-1 py-2.5 bg-[#1a73e8] text-white rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Ya, Publikasikan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL 5: DRAFTS LIST POPUP                */}
            {/* ========================================= */}
            {isDraftsListModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-[480px] p-8 relative shadow-xl flex flex-col items-center text-center">
                        <button
                            onClick={() => setIsDraftsListModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-[#fce8e6] text-[#c5221f] border-[3px] border-[#fad2cf] w-[60px] h-[60px] rounded-full flex items-center justify-center mb-6 mt-2 p-3">
                            <CircleAlert size={32} />
                        </div>

                        <h3 className="text-[18px] font-bold text-gray-900 mb-4 leading-snug">
                            Publikasi Gagal
                        </h3>
                        <p className="text-[14px] text-gray-500 mb-4 leading-relaxed">
                            Event belum bisa dipublikasikan karena masih terdapat lomba dengan status draf. Harap lengkapi lomba berikut:
                        </p>

                        <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 max-h-[150px] overflow-y-auto text-left border border-gray-200">
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 font-medium">
                                {draftCompetitionsList.map((comp) => (
                                    <li key={comp.competition_id}>{comp.competition_name}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex w-full gap-4">
                            <button
                                onClick={() => setIsDraftsListModalOpen(false)}
                                className="w-full py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}