"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    X, Save, Settings, Users, User, Plus, Minus,
    CreditCard, UploadCloud, ChevronRight, FileText, Calendar,
    Flag, Search, Trash2, Pencil
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/ui/Toast";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import FilterDropdown from "@/components/ui/FilterDropdown";
import { getDocumentUrl } from "@/services/url/getDocumentUrl";
import { getAllSystemJudges, getJudgeInvitationsByCompetition, getJudgeAssignmentsByStages } from "@/services/profile/getJudges";
import { getProfileImageUrl } from "@/services/profile/getProfileImage";

const defaultTimelines = (stageType: string) => {
    if (stageType === 'registration') {
        return {
            registration: { start_date: "", end_date: "" }
        };
    } else if (stageType === 'submission') {
        return {
            submission: { start_date: "", end_date: "" },
            judging: { start_date: "", end_date: "" },
            announcement: { start_date: "", end_date: "" }
        };
    } else if (stageType === 'final') {
        return {
            submission: { start_date: "", end_date: "" },
            judging: { start_date: "", end_date: "" },
            announcement: { start_date: "", end_date: "" },
            award: { start_date: "", end_date: "" }
        };
    }
    return {};
};

const toRoman = (num: number): string => {
    const romanMap: { [key: number]: string } = {
        1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
        6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X"
    };
    return romanMap[num] || num.toString();
};

interface CustomDateInputProps {
    value: string;
    onChange: (val: string) => void;
    min?: string;
    max?: string;
}

const CustomDateInput = ({ value, onChange, min, max }: CustomDateInputProps) => {
    const formatDisplay = (val: string) => {
        if (!val) return "";
        const [year, month, day] = val.split('-');
        if (!year || !month || !day) return val;
        return `${day}/${month}/${year}`;
    };

    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div
            onClick={() => {
                try {
                    inputRef.current?.showPicker?.();
                } catch (e) {
                    inputRef.current?.focus();
                }
            }}
            className="relative flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 bg-white gap-2 cursor-pointer hover:border-gray-400 transition-colors select-none min-w-[140px]"
        >
            <span className="text-xs text-gray-900 font-semibold">
                {value ? formatDisplay(value) : "Pilih Tanggal"}
            </span>
            <Calendar size={14} className="text-gray-500 shrink-0" />
            <input
                ref={inputRef}
                type="date"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                min={min}
                max={max}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
    );
};

interface HoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onAction: () => void;
    children: React.ReactNode;
}

const HoldButton = ({ onAction, children, className, ...props }: HoldButtonProps) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const actionRef = useRef(onAction);

    useEffect(() => {
        actionRef.current = onAction;
    }, [onAction]);

    const stop = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timerRef.current = null;
        intervalRef.current = null;
    };

    const start = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e && e.cancelable) {
            e.preventDefault();
        }
        stop();
        actionRef.current();
        timerRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                actionRef.current();
            }, 80);
        }, 400);
    };

    useEffect(() => {
        return () => stop();
    }, []);

    return (
        <button
            type="button"
            className={className}
            onMouseDown={(e) => {
                if (e.button === 0) start(e);
            }}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchEnd={stop}
            onTouchCancel={stop}
            {...props}
        >
            {children}
        </button>
    );
};

export default function OrganizerEditCompetitionPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId;
    const competitionId = params.competitionId;

    // --- STATE SUPABASE DATA ---
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [isEventPublished, setIsEventPublished] = useState(false);

    // Competition Fields
    const [competitionName, setCompetitionName] = useState("");
    const [description, setDescription] = useState("");
    const [tipeLomba, setTipeLomba] = useState<"pribadi" | "tim">("tim");
    const [maxParticipants, setMaxParticipants] = useState<number | "">(100);
    const [minMember, setMinMember] = useState<number | "">(2);
    const [maxMember, setMaxMember] = useState<number | "">(4);
    const [maxTeams, setMaxTeams] = useState<number | "">(300);
    const [isPaid, setIsPaid] = useState<"gratis" | "berbayar">("berbayar");
    const [price, setPrice] = useState(0);
    const [guidebookUrl, setGuidebookUrl] = useState("");

    // Stages, Timelines, & Criteria
    const [stages, setStages] = useState<any[]>([]);
    const [initialCriteria, setInitialCriteria] = useState<any[]>([]);
    const [maxStages, setMaxStages] = useState<number>(2);

    // Judges
    const [allJudges, setAllJudges] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [initialInvitations, setInitialInvitations] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [initialAssignments, setInitialAssignments] = useState<any[]>([]);

    // Simulated Bank info (not stored in DB for now)
    const [bankProvider, setBankProvider] = useState("bca");
    const [bankAccountNumber, setBankAccountNumber] = useState("");

    // --- UI STATES ---
    const [activeTab, setActiveTab] = useState<"informasi" | "tahapan">("informasi");

    // Sync activeTab with URL 'tab' parameter on mount and popstate events
    useEffect(() => {
        const handleSearchParamsChange = () => {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab");
            if (tabParam === "informasi" || tabParam === "tahapan") {
                setActiveTab(tabParam);
            }
        };

        handleSearchParamsChange();

        window.addEventListener("popstate", handleSearchParamsChange);
        return () => {
            window.removeEventListener("popstate", handleSearchParamsChange);
        };
    }, []);

    const handleTabChange = (tab: "informasi" | "tahapan") => {
        setActiveTab(tab);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("tab", tab);
            router.replace(url.pathname + url.search, { scroll: false });
        }
    };

    const [selectedStageForCriteria, setSelectedStageForCriteria] = useState<number | string | null>(null);
    const [isKriteriaModalOpen, setIsKriteriaModalOpen] = useState(false);

    // New Criteria Modal inputs
    const [newCriteriaName, setNewCriteriaName] = useState("");
    const [newCriteriaWeight, setNewCriteriaWeight] = useState("");
    const [newCriteriaDesc, setNewCriteriaDesc] = useState("");

    // Guidebook Upload file state
    const [isUploading, setIsUploading] = useState(false);

    // Toast Notification & Confirm dialog
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

    const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" });
        }, 3000);
    };

    // --- FETCH DATA ON MOUNT ---
    useEffect(() => {
        const initDefaultStages = async (supabase: any, competitionId: number, packageName: string, startDate: string, endDate: string) => {
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
                    stage_name: "Final",
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

        const loadData = async () => {
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
                    router.push("/organizer/home");
                    return;
                }

                const currentOrganizerId = orgData.organizer_id;

                // 1. Fetch competition details
                const { data: comp, error: compErr } = await supabase
                    .from("competitions")
                    .select(`
                        *,
                        events(
                            event_id,
                            organizer_id,
                            event_name,
                            start_date,
                            end_date,
                            is_published,
                            package_payments(packages(package_name, max_stages))
                        )
                    `)
                    .eq("competition_id", Number(competitionId))
                    .single();

                if (compErr || !comp) {
                    throw compErr || new Error("Lomba tidak ditemukan");
                }

                // Check authorization
                const eventOrganizerId = comp.events?.organizer_id;
                const eventIdFromDb = comp.events?.event_id;
                if (eventOrganizerId !== currentOrganizerId || eventIdFromDb !== Number(eventId)) {
                    alert("Anda tidak memiliki akses ke lomba ini!");
                    router.push("/organizer/home");
                    return;
                }

                setCompetitionName(comp.competition_name);
                setDescription(comp.description || "");
                setTipeLomba(comp.type === "individual" ? "pribadi" : "tim");
                setMaxParticipants(comp.max_participants || 100);
                setMinMember(comp.team_size_min || 2);
                setMaxMember(comp.team_size_max || 4);
                setMaxTeams(comp.max_teams || 300);
                setGuidebookUrl(comp.guidebook_url || "");

                const initialPrice = Number(comp.price || 0);
                setIsPaid(initialPrice > 0 ? "berbayar" : "gratis");
                setPrice(initialPrice);

                let maxStagesVal = 2; // Default fallback to 2
                let pkgName = "mahakarya";
                if (comp.events) {
                    setEventName(comp.events.event_name);
                    setEventStartDate(comp.events.start_date || "");
                    setEventEndDate(comp.events.end_date || "");
                    setIsEventPublished(comp.events.is_published || false);

                    if (comp.events.packages) {
                        maxStagesVal = comp.events.packages.max_stages || 99;
                        pkgName = comp.events.packages.package_name || "mahakarya";
                    } else if (comp.events.package_payments) {
                        const payList = Array.isArray(comp.events.package_payments)
                            ? comp.events.package_payments
                            : [comp.events.package_payments];
                        const pkg = payList[0]?.packages;
                        if (pkg) {
                            maxStagesVal = pkg.max_stages || 99;
                            pkgName = pkg.package_name || "mahakarya";
                        }
                    }
                }
                setMaxStages(maxStagesVal);

                // 2. Fetch stages
                const { data: stagesData, error: stagesErr } = await supabase
                    .from("stages")
                    .select("*")
                    .eq("competition_id", Number(competitionId))
                    .order("stage_order", { ascending: true });

                if (stagesErr) throw stagesErr;

                let currentStagesData = stagesData || [];
                if (currentStagesData.length === 0) {
                    const startDate = comp.events?.start_date || new Date().toISOString().split('T')[0];
                    const endDate = comp.events?.end_date || new Date().toISOString().split('T')[0];

                    await initDefaultStages(supabase, Number(competitionId), pkgName, startDate, endDate);

                    // Re-fetch stages
                    const { data: refetchedStages, error: refetchErr } = await supabase
                        .from("stages")
                        .select("*")
                        .eq("competition_id", Number(competitionId))
                        .order("stage_order", { ascending: true });

                    if (refetchErr) throw refetchErr;
                    currentStagesData = refetchedStages || [];
                } else if (!currentStagesData.some(s => s.stage_type === 'registration')) {
                    const startDate = comp.events?.start_date || new Date().toISOString().split('T')[0];
                    const endDate = comp.events?.end_date || new Date().toISOString().split('T')[0];

                    // Shift existing stage orders up by 1
                    for (const stage of currentStagesData) {
                        await supabase
                            .from("stages")
                            .update({ stage_order: stage.stage_order + 1 })
                            .eq("stage_id", stage.stage_id);
                    }

                    // Insert registration stage
                    const { data: newRegStage, error: regErr } = await supabase
                        .from("stages")
                        .insert({
                            competition_id: Number(competitionId),
                            stage_name: "Pendaftaran",
                            stage_type: "registration",
                            stage_order: 1,
                            start_date: startDate,
                            end_date: endDate,
                            status: "not_started"
                        })
                        .select()
                        .single();

                    if (newRegStage) {
                        await supabase
                            .from("stage_timelines")
                            .insert([
                                {
                                    stage_id: newRegStage.stage_id,
                                    timeline_type: "registration",
                                    timeline_order: 1,
                                    start_date: startDate,
                                    end_date: endDate
                                }
                            ]);
                    }

                    // Re-fetch stages
                    const { data: refetchedStages, error: refetchErr } = await supabase
                        .from("stages")
                        .select("*")
                        .eq("competition_id", Number(competitionId))
                        .order("stage_order", { ascending: true });

                    if (refetchErr) throw refetchErr;
                    currentStagesData = refetchedStages || [];
                }

                if (currentStagesData && currentStagesData.length > 0) {
                    const stageIds = currentStagesData.map(s => s.stage_id);

                    // Set default selected stage for criteria
                    const firstBabak = currentStagesData.find(s => s.stage_type !== 'registration');
                    if (firstBabak) {
                        setSelectedStageForCriteria(firstBabak.stage_id);
                    }

                    // Fetch timelines
                    const { data: timelinesData, error: timelinesErr } = await supabase
                        .from("stage_timelines")
                        .select("*")
                        .in("stage_id", stageIds);

                    // Fetch criteria
                    const { data: criteriaData, error: criteriaErr } = await supabase
                        .from("evaluation_criteria")
                        .select("*")
                        .in("stage_id", stageIds);

                    // Map stages with their timelines and criteria
                    let babakCount = 0;
                    const mappedStages = currentStagesData.map(s => {
                        const sTimelines = timelinesData?.filter(t => t.stage_id === s.stage_id) || [];
                        const timelinesObj: any = defaultTimelines(s.stage_type);

                        sTimelines.forEach(tl => {
                            timelinesObj[tl.timeline_type] = {
                                timeline_id: tl.timeline_id,
                                start_date: tl.start_date ? tl.start_date.split('T')[0] : "",
                                end_date: tl.end_date ? tl.end_date.split('T')[0] : "",
                                location: tl.location || "",
                                meeting_link: tl.meeting_link || ""
                            };
                        });

                        // If presentation is present, remove the default submission to avoid ghost inserts
                        if (timelinesObj.presentation) {
                            delete timelinesObj.submission;
                        }

                        const sCriteria = criteriaData?.filter(c => c.stage_id === s.stage_id) || [];
                        const mappedCrit = sCriteria.map(c => ({
                            criteria_id: c.criteria_id,
                            name: c.name,
                            weight: Number(c.weight),
                            description: c.description || ""
                        }));

                        let formattedName = s.stage_name;
                        if (s.stage_type !== 'registration') {
                            babakCount++;
                        }

                        return {
                            stage_id: s.stage_id,
                            stage_name: formattedName,
                            stage_order: s.stage_order,
                            stage_type: s.stage_type,
                            max_qualified: s.max_qualified,
                            timelines: timelinesObj,
                            criteria: mappedCrit
                        };
                    });

                    setStages(mappedStages);
                    setInitialCriteria(criteriaData || []);

                    // Fetch invitations
                    const invitationsData = await getJudgeInvitationsByCompetition(Number(competitionId));
                    if (invitationsData) {
                        setInvitations(invitationsData);
                        setInitialInvitations(invitationsData);
                    }

                    // Fetch judge assignments
                    const assignmentsData = await getJudgeAssignmentsByStages(stageIds);
                    if (assignmentsData) {
                        setAssignments(assignmentsData);
                        setInitialAssignments(assignmentsData);
                    }
                }

            } catch (err: any) {
                console.error("Error loading competition edit data:", err);
                showToast(`Gagal memuat data: ${err.message}`, "error");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [competitionId]);

    // Fetch all judges in system (for search/undangan)
    useEffect(() => {
        const fetchAllJudges = async () => {
            try {
                const mappedJudges = await getAllSystemJudges();
                setAllJudges(mappedJudges);
            } catch (error) {
                console.error("Error fetching judges:", error);
            }
        };
        fetchAllJudges();
    }, []);

    // Filter judges as search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const filtered = allJudges.filter(j => {
            const username = j.public_profiles?.username?.toLowerCase() || "";
            const isAlreadyInvited = invitations.some(inv => inv.judge_id === j.judge_id);
            return username.includes(searchQuery.toLowerCase()) && !isAlreadyInvited;
        });
        setSearchResults(filtered);
    }, [searchQuery, allJudges, invitations]);

    const updateStageName = (stageId: any, newName: string) => {
        setStages(prev => prev.map(s => s.stage_id === stageId ? { ...s, stage_name: newName } : s));
    };

    const toggleTimelineMethod = (stageId: any, newMethod: 'submission' | 'presentation') => {
        setStages(prev => prev.map(s => {
            if (s.stage_id === stageId) {
                const oldMethod = newMethod === 'submission' ? 'presentation' : 'submission';
                const existingData = s.timelines[oldMethod] || { start_date: "", end_date: "", location: "", meeting_link: "" };
                const newTimelines = { ...s.timelines };
                delete newTimelines[oldMethod];
                newTimelines[newMethod] = existingData;
                return { ...s, timelines: newTimelines };
            }
            return s;
        }));
    };

    const updateTimelineDate = (stageId: any, timelineType: string, dateField: 'start_date' | 'end_date', value: string) => {
        if (value && eventStartDate && eventEndDate) {
            const dateVal = new Date(value);
            const startLimit = new Date(eventStartDate);
            const endLimit = new Date(eventEndDate);
            if (dateVal < startLimit || dateVal > endLimit) {
                const [sy, sm, sd] = eventStartDate.split('-');
                const [ey, em, ed] = eventEndDate.split('-');
                showToast(`Tanggal tidak boleh di luar periode event (${sd}/${sm}/${sy} - ${ed}/${em}/${ey})`, "error");
                return;
            }
        }
        setStages(prev => prev.map(s => {
            if (s.stage_id === stageId) {
                const currentTimeline = s.timelines[timelineType] || { start_date: "", end_date: "" };
                return {
                    ...s,
                    timelines: {
                        ...s.timelines,
                        [timelineType]: {
                            ...currentTimeline,
                            [dateField]: value
                        }
                    }
                };
            }
            return s;
        }));
    };

    const updateTimelineExtra = (stageId: any, timelineType: string, field: 'location' | 'meeting_link' | 'location_type', value: string) => {
        setStages(prev => prev.map(s => {
            if (s.stage_id === stageId) {
                const currentTimeline = s.timelines[timelineType] || {};
                return {
                    ...s,
                    timelines: {
                        ...s.timelines,
                        [timelineType]: { ...currentTimeline, [field]: value }
                    }
                };
            }
            return s;
        }));
    };

    // --- ADD / DELETE STAGE ACTIONS ---
    const handleAddStage = () => {
        const babakStages = stages.filter(s => s.stage_type !== 'registration');
        if (babakStages.length >= maxStages) {
            showToast(`Maksimal babak untuk paket ini adalah ${maxStages}`, "error");
            return;
        }

        const newTempId = `temp_${Date.now()}`;
        const newOrder = stages.length + 1;

        const lastStageName = babakStages[babakStages.length - 1]?.stage_name || "Final";

        // Create the new stage with type 'final' (since it will be the last one)
        const newStage = {
            stage_id: newTempId,
            stage_name: lastStageName,
            stage_order: newOrder,
            stage_type: 'final',
            max_qualified: null,
            timelines: defaultTimelines('final'),
            criteria: []
        };

        setStages(prev => {
            const reg = prev.find(s => s.stage_type === 'registration');
            const babaks = prev.filter(s => s.stage_type !== 'registration');

            // Map existing babaks to 'submission' type
            const updatedBabaks = babaks.map((s, idx) => {
                const newTimelines = { ...s.timelines };
                delete newTimelines.award;
                
                let newName = s.stage_name;
                if (idx === babaks.length - 1) {
                    if (idx === 0) {
                        newName = "Penyisihan";
                    } else if (idx === 1) {
                        newName = "Semifinal";
                    } else {
                        newName = `Babak ${idx + 1}`;
                    }
                }

                return {
                    ...s,
                    stage_name: newName,
                    stage_type: 'submission',
                    timelines: newTimelines
                };
            });

            return [reg, ...updatedBabaks, newStage].filter(Boolean);
        });
    };

    const handleDeleteStage = (stageId: any) => {
        const babakStages = stages.filter(s => s.stage_type !== 'registration');
        if (babakStages.length <= 1) {
            showToast("Minimal harus memiliki 1 babak", "error");
            return;
        }

        setStages(prev => {
            const reg = prev.find(s => s.stage_type === 'registration');
            const babaks = prev.filter(s => s.stage_type !== 'registration' && s.stage_id !== stageId);

            // Re-order and re-type the remaining babaks
            let count = 0;
            const updatedBabaks = babaks.map((s, idx) => {
                count++;
                const isLast = idx === babaks.length - 1;
                const stageType = isLast ? 'final' : 'submission';

                // Construct timelines based on stageType
                const newTimelines = { ...s.timelines };
                if (stageType === 'submission') {
                    delete newTimelines.award;
                } else if (stageType === 'final' && !newTimelines.award) {
                    newTimelines.award = { start_date: "", end_date: "" };
                }

                return {
                    ...s,
                    stage_name: s.stage_name,
                    stage_order: count + 1,
                    stage_type: stageType,
                    timelines: newTimelines
                };
            });

            // If deleted stage was the one selected for criteria, fallback to the first babak stage
            const firstBabak = updatedBabaks[0];
            if (selectedStageForCriteria === stageId && firstBabak) {
                setSelectedStageForCriteria(firstBabak.stage_id);
            }

            return [reg, ...updatedBabaks].filter(Boolean);
        });

        // Also clean up any judge assignments for this deleted stage in state
        setAssignments(prev => prev.filter(a => a.stage_id !== stageId));
    };

    // --- STAGE MAX QUALIFIED ACTIONS ---
    const updateStageMaxQualified = (stageId: any, value: number | string) => {
        setStages(prev => prev.map(s => {
            if (s.stage_id === stageId) {
                return {
                    ...s,
                    max_qualified: value
                };
            }
            return s;
        }));
    };

    // Versi delta untuk HoldButton — selalu baca nilai terbaru dari state
    const incrementStageMaxQualified = (stageId: any, delta: number) => {
        setStages(prev => prev.map(s => {
            if (s.stage_id === stageId) {
                return { ...s, max_qualified: Math.max(0, (s.max_qualified || 0) + delta) };
            }
            return s;
        }));
    };


    // --- CRITERIA ACTIONS ---
    const handleDeleteCriterion = (stageId: any, critToDelete: any) => {
        setStages(prev => prev.map(s => {
            if (s.stage_id === stageId) {
                return {
                    ...s,
                    criteria: s.criteria.filter((c: any) => {
                        if (critToDelete.criteria_id) {
                            return c.criteria_id !== critToDelete.criteria_id;
                        }
                        return c.name !== critToDelete.name;
                    })
                };
            }
            return s;
        }));
    };

    const handleSaveNewCriterion = () => {
        if (!newCriteriaName.trim()) {
            showToast("Nama kriteria wajib diisi", "error");
            return;
        }
        const weightNum = Number(newCriteriaWeight);
        if (isNaN(weightNum) || weightNum <= 0 || weightNum > 100) {
            showToast("Bobot harus berupa angka antara 1 dan 100", "error");
            return;
        }

        const targetStageId = selectedStageForCriteria || stages.find(s => s.stage_type !== 'registration')?.stage_id;
        if (!targetStageId) {
            showToast("Tahapan babak lomba tidak ditemukan", "error");
            return;
        }

        const targetStage = stages.find(s => s.stage_id === targetStageId);
        if (!targetStage) {
            showToast("Tahapan babak lomba tidak ditemukan", "error");
            return;
        }

        // 1. Maksimal 5 kriteria
        if (targetStage.criteria.length >= 5) {
            showToast("Maksimal 5 kriteria penilaian untuk setiap babak", "error");
            return;
        }

        // 2. Total bobot tidak boleh melebihi 100%
        const currentTotalWeight = targetStage.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
        if (currentTotalWeight + weightNum > 100) {
            showToast(`Total bobot kriteria tidak boleh melebihi 100% (saat ini ${currentTotalWeight}%, tambahan ${weightNum}% akan menjadi ${currentTotalWeight + weightNum}%)`, "error");
            return;
        }

        const newCrit = {
            name: newCriteriaName,
            weight: weightNum,
            description: newCriteriaDesc
        };

        setStages(prev => prev.map(s => {
            if (s.stage_id === targetStageId) {
                return {
                    ...s,
                    criteria: [...s.criteria, newCrit]
                };
            }
            return s;
        }));

        setNewCriteriaName("");
        setNewCriteriaWeight("");
        setNewCriteriaDesc("");
        setIsKriteriaModalOpen(false);
        showToast("Kriteria berhasil ditambahkan", "success");
    };

    const handleCloseCriteriaModal = () => {
        setNewCriteriaName("");
        setNewCriteriaWeight("");
        setNewCriteriaDesc("");
        setIsKriteriaModalOpen(false);
    };

    // --- JUDGES ACTIONS ---
    const handleInviteJudge = async (judge: any) => {
        let judgeId = judge.judge_id;
        let institution = judge.institution;
        let prefix = judge.prefix;
        let suffix = judge.suffix;

        if (!judgeId) {
            // Create a judge record immediately
            const { data, error } = await supabase
                .from("judges")
                .insert({
                    profile_id: judge.profile_id,
                    institution: "-",
                    bio: "",
                    speciality: "",
                    prefix: "",
                    suffix: ""
                })
                .select()
                .single();
            if (error) {
                showToast("Gagal mendaftarkan juri: " + error.message, "error");
                return;
            }
            judgeId = data.judge_id;
            institution = data.institution;
            prefix = data.prefix;
            suffix = data.suffix;

            // Update local state allJudges
            setAllJudges(prev => prev.map(item => item.profile_id === judge.profile_id ? {
                ...item,
                judge_id: judgeId,
                institution,
                prefix,
                suffix
            } : item));
        }

        setInvitations(prev => {
            if (prev.some(inv => inv.judge_id === judgeId)) return prev;
            const newInv = {
                judge_id: judgeId,
                status: 'pending',
                pesan_undangan: 'Halo, Anda diundang menjadi juri.',
                judges: {
                    judge_id: judgeId,
                    institution: institution,
                    prefix: prefix,
                    suffix: suffix,
                    public_profiles: {
                        username: judge.public_profiles.username,
                        profile_image: judge.public_profiles.profile_image
                    }
                }
            };
            return [...prev, newInv];
        });

        // =====================================================================
        // AUTO-ASSIGN: Langsung beri tugas juri ke semua babak yang ada (Poin 9)
        // =====================================================================
        const babakStageIds = stages.filter(s => s.stage_type !== 'registration').map(s => s.stage_id);
        setAssignments(prev => {
            // Filter agar tidak duplicate assignment
            const newAssignments = babakStageIds
                .filter(stageId => !prev.some(a => a.judge_id === judgeId && String(a.stage_id) === String(stageId)))
                .map(stageId => ({ judge_id: judgeId, stage_id: stageId }));
            return [...prev, ...newAssignments];
        });

        setSearchQuery("");
        showToast(`Undangan terkirim (pending) untuk ${judge.public_profiles.username}`, "success");
    };

    const handleRemoveJudgeInvitation = (judgeId: number) => {
        setInvitations(prev => prev.filter(inv => inv.judge_id !== judgeId));
        setAssignments(prev => prev.filter(a => a.judge_id !== judgeId));
        showToast("Undangan/Penugasan Juri dihapus", "success");
    };

    const handleJudgeAssignmentToggle = (judgeId: number, stageIdStr: string) => {
        const stageId = stageIdStr.startsWith("temp_") ? stageIdStr : Number(stageIdStr);
        setAssignments(prev => {
            // Check if this judge-stage combo already exists
            const exists = prev.some(a => a.judge_id === judgeId && String(a.stage_id) === String(stageId));
            if (exists) {
                // Remove it (uncheck)
                return prev.filter(a => !(a.judge_id === judgeId && String(a.stage_id) === String(stageId)));
            } else {
                // Add it (check)
                return [...prev, { judge_id: judgeId, stage_id: stageId }];
            }
        });
    };

    // --- FILE UPLOAD (GUIDEBOOK) ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "application/pdf") {
                showToast("Format file harus PDF", "error");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast("Ukuran file maksimal 5MB", "error");
                return;
            }

            setIsUploading(true);
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_guidebook.${fileExt}`;

                const relativePath = `event_${eventId}/${fileName}`;
                const filePath = `guidebooks/${relativePath}`;

                const { error: uploadError } = await supabase.storage
                    .from('competitions')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) throw uploadError;
                setGuidebookUrl(relativePath);

                showToast("Buku panduan berhasil diunggah!", "success");
            } catch (error: any) {
                showToast(`Gagal mengunggah file: ${error.message}`, "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    // --- SAVE ALL CHANGES ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Validate stage names are not empty
            for (const stage of stages) {
                if (!stage.stage_name || stage.stage_name.trim() === "") {
                    showToast("Nama babak tidak boleh kosong", "error");
                    setIsSaving(false);
                    return;
                }
            }

            // 1. Validate total weight of criteria and max_qualified for each babak stage
            const babakStages = stages.filter(s => s.stage_type !== 'registration');
            for (const stage of babakStages) {
                const totalWeight = stage.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
                if (stage.criteria.length > 0 && totalWeight !== 100) {
                    showToast(`Total bobot kriteria untuk ${stage.stage_name} harus 100% (saat ini ${totalWeight}%)`, "error");
                    setIsSaving(false);
                    return;
                }

                if (!stage.max_qualified || Number(stage.max_qualified) < 1) {
                    showToast(`Jumlah kualifikasi/pemenang untuk ${stage.stage_name} minimal 1`, "error");
                    setIsSaving(false);
                    return;
                }
            }

            // 2. Validate that all timelines are filled
            for (const s of babakStages) {
                const method = s.timelines?.presentation ? 'presentation' : 'submission';
                const methodName = method === 'presentation' ? 'Presentasi (Live)' : 'Pengumpulan Karya';
                const methodStart = s.timelines?.[method]?.start_date;
                const methodEnd = s.timelines?.[method]?.end_date;

                const judgingStart = s.timelines?.judging?.start_date;
                const judgingEnd = s.timelines?.judging?.end_date;
                const announcementStart = s.timelines?.announcement?.start_date;
                const awardStart = s.timelines?.award?.start_date;

                // Validate method dates
                if (!methodStart || !methodEnd) {
                    showToast(`Tanggal ${methodName} untuk ${s.stage_name} belum lengkap`, "error");
                    setIsSaving(false);
                    return;
                }
                
                // Validate judging dates
                if (!judgingStart || !judgingEnd) {
                    showToast(`Tanggal Penjurian untuk ${s.stage_name} belum lengkap`, "error");
                    setIsSaving(false);
                    return;
                }

                // Validate announcement dates
                if (!announcementStart) {
                    showToast(`Tanggal Pengumuman untuk ${s.stage_name} belum diisi`, "error");
                    setIsSaving(false);
                    return;
                }

                // Validate award dates (only for final)
                if (s.stage_type === 'final' && !awardStart) {
                    showToast(`Tanggal Pemberian Sertifikat untuk ${s.stage_name} belum diisi`, "error");
                    setIsSaving(false);
                    return;
                }
            }

            // 3. Validate that all timeline dates are within the event's start_date and end_date
            if (eventStartDate && eventEndDate) {
                const evStart = new Date(eventStartDate);
                const evEnd = new Date(eventEndDate);

                const isDateValid = (dateStr: string) => {
                    if (!dateStr) return true;
                    const d = new Date(dateStr);
                    return d >= evStart && d <= evEnd;
                };

                const formatDateForError = (dateStr: string) => {
                    if (!dateStr) return "";
                    const [year, month, day] = dateStr.split('-');
                    return `${day}/${month}/${year}`;
                };

                const formattedEvStart = formatDateForError(eventStartDate);
                const formattedEvEnd = formatDateForError(eventEndDate);

                // Check registration stage
                const regStage = stages.find(s => s.stage_type === 'registration');
                if (regStage) {
                    const regStart = regStage.timelines?.registration?.start_date;
                    const regEnd = regStage.timelines?.registration?.end_date;

                    if (regStart && !isDateValid(regStart)) {
                        showToast(`Tanggal Mulai Pendaftaran (${formatDateForError(regStart)}) tidak boleh di luar periode event (${formattedEvStart} - ${formattedEvEnd})`, "error");
                        setIsSaving(false);
                        return;
                    }
                    if (regEnd && !isDateValid(regEnd)) {
                        showToast(`Tanggal Selesai Pendaftaran (${formatDateForError(regEnd)}) tidak boleh di luar periode event (${formattedEvStart} - ${formattedEvEnd})`, "error");
                        setIsSaving(false);
                        return;
                    }
                }

                // Check other stages date boundaries
                for (const s of babakStages) {
                    const method = s.timelines?.presentation ? 'presentation' : 'submission';
                    const methodName = method === 'presentation' ? 'Presentasi (Live)' : 'Pengumpulan Karya';
                    const methodStart = s.timelines?.[method]?.start_date;
                    const methodEnd = s.timelines?.[method]?.end_date;

                    const judgingStart = s.timelines?.judging?.start_date;
                    const judgingEnd = s.timelines?.judging?.end_date;
                    const announcementStart = s.timelines?.announcement?.start_date;
                    const awardStart = s.timelines?.award?.start_date;

                    if (!isDateValid(methodStart) || !isDateValid(methodEnd)) {
                        showToast(`Tanggal ${methodName} ${s.stage_name} tidak boleh di luar periode event (${formattedEvStart} - ${formattedEvEnd})`, "error");
                        setIsSaving(false);
                        return;
                    }

                    if (!isDateValid(judgingStart) || !isDateValid(judgingEnd)) {
                        showToast(`Tanggal Penjurian ${s.stage_name} tidak boleh di luar periode event (${formattedEvStart} - ${formattedEvEnd})`, "error");
                        setIsSaving(false);
                        return;
                    }

                    if (!isDateValid(announcementStart)) {
                        showToast(`Tanggal Pengumuman ${s.stage_name} tidak boleh di luar periode event (${formattedEvStart} - ${formattedEvEnd})`, "error");
                        setIsSaving(false);
                        return;
                    }

                    if (s.stage_type === 'final' && awardStart && !isDateValid(awardStart)) {
                        showToast(`Tanggal Pemberian Sertifikat ${s.stage_name} tidak boleh di luar periode event (${formattedEvStart} - ${formattedEvEnd})`, "error");
                        setIsSaving(false);
                        return;
                    }
                }
            }

            // Calculate if all inputs are provided to determine status
            const isBasicInfoFilled = !!(competitionName && competitionName.trim() && description && description.trim() && guidebookUrl && guidebookUrl.trim());

            const isParticipantSettingsFilled = tipeLomba === "tim"
                ? (Number(minMember) > 0 && Number(maxMember) > 0 && Number(maxTeams) > 0)
                : (Number(maxParticipants) > 0);

            const isPaymentSettingsFilled = isPaid === "gratis" || (Number(price) > 0 && bankAccountNumber && bankAccountNumber.trim());

            const regStage = stages.find(s => s.stage_type === 'registration');
            const isRegistrationTimelineFilled = !!(regStage && regStage.timelines?.registration?.start_date && regStage.timelines?.registration?.end_date);

            const areBabakTimelinesAndCriteriaFilled = babakStages.length > 0 && babakStages.every((s: any) => {
                const method = s.timelines?.presentation ? 'presentation' : 'submission';
                const hasMethod = !!(s.timelines?.[method]?.start_date && s.timelines?.[method]?.end_date);
                const hasJudging = !!(s.timelines?.judging?.start_date && s.timelines?.judging?.end_date);
                const hasAnnouncement = !!(s.timelines?.announcement?.start_date);
                const hasAward = s.stage_type !== 'final' || !!(s.timelines?.award?.start_date);
                const hasCriteria = s.criteria && s.criteria.length > 0;
                const totalWeight = s.criteria ? s.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0) : 0;

                return hasMethod && hasJudging && hasAnnouncement && hasAward && hasCriteria && totalWeight === 100;
            });

            const isJudgesFilled = invitations.length > 0;

            const isAllInputted = isBasicInfoFilled &&
                isParticipantSettingsFilled &&
                isPaymentSettingsFilled &&
                isRegistrationTimelineFilled &&
                areBabakTimelinesAndCriteriaFilled &&
                isJudgesFilled;

            const computedStatus = isAllInputted
                ? (isEventPublished ? "active" : "ready")
                : "draft";

            // 2. Update competition details
            const priceVal = isPaid === "gratis" ? 0 : Number(price);

            const { error: compErr } = await supabase
                .from("competitions")
                .update({
                    competition_name: competitionName,
                    description: description,
                    type: tipeLomba === "pribadi" ? "individual" : "team",
                    max_participants: tipeLomba === "pribadi" ? Number(maxParticipants) : null,
                    team_size_min: tipeLomba === "tim" ? Number(minMember) : null,
                    team_size_max: tipeLomba === "tim" ? Number(maxMember) : null,
                    max_teams: tipeLomba === "tim" ? Number(maxTeams) : null,
                    price: priceVal,
                    guidebook_url: guidebookUrl,
                    status: computedStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("competition_id", Number(competitionId));

            if (compErr) throw compErr;

            // 3. Delete stages that were removed in the UI
            const { data: dbStages, error: dbStagesErr } = await supabase
                .from("stages")
                .select("stage_id")
                .eq("competition_id", Number(competitionId));
            if (dbStagesErr) throw dbStagesErr;

            const dbStageIds = dbStages.map(s => s.stage_id);
            const activeStageIds = stages
                .filter(s => s.stage_id && !s.stage_id.toString().startsWith("temp_"))
                .map(s => Number(s.stage_id));
            const stagesToDelete = dbStageIds.filter(id => !activeStageIds.includes(id));

            if (stagesToDelete.length > 0) {
                // Delete linked entities first
                await supabase.from("judge_assignments").delete().in("stage_id", stagesToDelete);
                await supabase.from("evaluation_criteria").delete().in("stage_id", stagesToDelete);
                await supabase.from("stage_timelines").delete().in("stage_id", stagesToDelete);
                const { error: delStageErr } = await supabase
                    .from("stages")
                    .delete()
                    .in("stage_id", stagesToDelete);
                if (delStageErr) throw delStageErr;
            }

            // Map to correlate temp stage IDs to newly inserted real stage IDs
            const stageIdMap: { [key: string]: number } = {};

            // 4. Save/Update stages and timelines
            for (const stage of stages) {
                let realStageId = stage.stage_id;

                if (stage.stage_id && stage.stage_id.toString().startsWith("temp_")) {
                    // Insert new stage
                    const { data: insStageData, error: insStageErr } = await supabase
                        .from("stages")
                        .insert({
                            competition_id: Number(competitionId),
                            stage_name: stage.stage_name,
                            stage_type: stage.stage_type,
                            stage_order: stage.stage_order,
                            max_qualified: stage.max_qualified ? Number(stage.max_qualified) : null,
                            status: "not_started"
                        })
                        .select()
                        .single();

                    if (insStageErr) throw insStageErr;
                    realStageId = insStageData.stage_id;
                    stageIdMap[stage.stage_id.toString()] = realStageId;
                    stage.stage_id = realStageId; // Update the UI stage object for references below
                } else {
                    // Update existing stage
                    const { error: updStageErr } = await supabase
                        .from("stages")
                        .update({
                            stage_name: stage.stage_name,
                            stage_type: stage.stage_type,
                            stage_order: stage.stage_order,
                            max_qualified: stage.max_qualified ? Number(stage.max_qualified) : null
                        })
                        .eq("stage_id", stage.stage_id);

                    if (updStageErr) throw updStageErr;
                    stageIdMap[stage.stage_id.toString()] = Number(stage.stage_id);
                }

                // Delete obsolete timelines of this stage
                const activeTimelineTypes = Object.keys(stage.timelines);
                const activeTimelineIds = Object.values(stage.timelines)
                    .filter((t: any) => t && t.timeline_id)
                    .map((t: any) => t.timeline_id);

                if (activeTimelineIds.length > 0) {
                    const { error: delErr } = await supabase
                        .from("stage_timelines")
                        .delete()
                        .eq("stage_id", realStageId)
                        .not("timeline_id", "in", `(${activeTimelineIds.join(',')})`);
                    if (delErr) throw delErr;
                } else {
                    const { error: delErr } = await supabase
                        .from("stage_timelines")
                        .delete()
                        .eq("stage_id", realStageId);
                    if (delErr) throw delErr;
                }

                // Update or Insert timelines
                for (const timelineType of activeTimelineTypes) {
                    const t = stage.timelines[timelineType];
                    if (t) {
                        const isOnline = t.location_type === 'online' || (!t.location_type && !!t.meeting_link);

                        const timelineData: any = {
                            stage_id: realStageId,
                            timeline_type: timelineType,
                            start_date: t.start_date || null,
                            end_date: t.end_date || t.start_date || null,
                            location: isOnline ? null : (t.location || null),
                            meeting_link: isOnline ? (t.meeting_link || null) : null
                        };

                        if (t.timeline_id && !stage.stage_id.toString().startsWith("temp_")) {
                            const { error: tlErr } = await supabase
                                .from("stage_timelines")
                                .update(timelineData)
                                .eq("timeline_id", t.timeline_id);
                            if (tlErr) throw tlErr;
                        } else {
                            let order = 1;
                            if (timelineType === 'judging') order = 2;
                            if (timelineType === 'announcement') order = 3;
                            if (timelineType === 'award') order = 4;
                            timelineData.timeline_order = order;

                            const { error: tlErr } = await supabase
                                .from("stage_timelines")
                                .insert(timelineData);
                            if (tlErr) throw tlErr;
                        }
                    }
                }

                // 5. Save/Update evaluation criteria
                const dbCriteriaIds = initialCriteria.filter(c => c.stage_id === realStageId).map(c => c.criteria_id);
                const activeCriteriaIds = stage.criteria.filter((c: any) => c.criteria_id).map((c: any) => c.criteria_id);
                const criteriaToDelete = dbCriteriaIds.filter(id => !activeCriteriaIds.includes(id));

                if (criteriaToDelete.length > 0) {
                    const { error: delErr } = await supabase
                        .from("evaluation_criteria")
                        .delete()
                        .in("criteria_id", criteriaToDelete);
                    if (delErr) throw delErr;
                }

                for (const crit of stage.criteria) {
                    const critData = {
                        stage_id: realStageId,
                        name: crit.name,
                        weight: crit.weight,
                        description: crit.description,
                        min_score: 0,
                        max_score: 100
                    };

                    if (crit.criteria_id) {
                        const { error: critErr } = await supabase
                            .from("evaluation_criteria")
                            .update(critData)
                            .eq("criteria_id", crit.criteria_id);
                        if (critErr) throw critErr;
                    } else {
                        const { error: critErr } = await supabase
                            .from("evaluation_criteria")
                            .insert(critData);
                        if (critErr) throw critErr;
                    }
                }
            }

            // 6. Save judge invitations
            const initialInvIds = initialInvitations.map(inv => inv.invitation_id);
            const activeInvIds = invitations.filter(inv => inv.invitation_id).map(inv => inv.invitation_id);
            const invsToDelete = initialInvIds.filter(id => !activeInvIds.includes(id));

            if (invsToDelete.length > 0) {
                const { error: delInvErr } = await supabase
                    .from("judge_invitations")
                    .delete()
                    .in("invitation_id", invsToDelete);
                if (delInvErr) throw delInvErr;
            }

            const newInvs = invitations.filter(inv => !inv.invitation_id);
            for (const inv of newInvs) {
                const { error: insInvErr } = await supabase
                    .from("judge_invitations")
                    .insert({
                        competition_id: Number(competitionId),
                        judge_id: inv.judge_id,
                        status: 'pending',
                        pesan_undangan: inv.pesan_undangan || 'Anda diundang menjadi juri.'
                    });
                if (insInvErr) throw insInvErr;
            }

            // 7. Save judge assignments (multi-stage per judge)
            // Delete all existing assignments for this competition's stages first
            const allStageIds = stages.map((s: any) => {
                const realId = stageIdMap[s.stage_id?.toString()] || s.stage_id;
                return realId;
            }).filter(Boolean);

            if (allStageIds.length > 0) {
                const { error: delAllAssignErr } = await supabase
                    .from("judge_assignments")
                    .delete()
                    .in("stage_id", allStageIds);
                if (delAllAssignErr) throw delAllAssignErr;
            }

            // Re-insert current assignments
            for (const assign of assignments) {
                const realStageId = stageIdMap[assign.stage_id?.toString()] || assign.stage_id;
                if (!realStageId) continue;

                const { error: insAssignErr } = await supabase
                    .from("judge_assignments")
                    .insert({
                        judge_id: assign.judge_id,
                        stage_id: realStageId
                    });
                if (insAssignErr) throw insAssignErr;
            }

            showToast("Perubahan berhasil disimpan!", "success");
            setTimeout(() => {
                router.push(`/organizer/event/${eventId}`);
            }, 1500);

        } catch (err: any) {
            console.error("Error saving competition details:", err);
            showToast(`Gagal menyimpan: ${err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-gray-500 font-semibold">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p>Memuat Data Lomba...</p>
            </div>
        );
    }

    const regStage = stages.find(s => s.stage_type === 'registration');
    const babakStages = stages.filter(s => s.stage_type !== 'registration');
    const activeStageForCriteria = stages.find(s => s.stage_id === selectedStageForCriteria) || babakStages[0];

    return (
        <div className="flex flex-col gap-6 pb-12 text-[#2a2a2a]">
            <div className="flex flex-wrap items-center justify-between border-b border-gray-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{competitionName || "Pengaturan Lomba"}</h1>
                    <p className="text-gray-500 text-sm">Kelola pengaturan lomba Anda</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 border border-gray-300 text-[#d04b33] px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                        disabled={isSaving}
                    >
                        <X size={18} />
                        Batalkan Perubahan
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={isSaving || isUploading}
                    >
                        <Save size={18} />
                        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>

            {/* ========================================= */}
            {/* TAB SELECTOR (INFORMASI VS TAHAPAN)       */}
            {/* ========================================= */}
            <div className="flex bg-gray-100 p-2 rounded-4xl w-fit border border-gray-200">
                <button
                    onClick={() => handleTabChange("informasi")}
                    className={`px-6 py-2 rounded-2xl font-semibold text-sm transition-all ${activeTab === "informasi" ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Informasi
                </button>
                <button
                    onClick={() => handleTabChange("tahapan")}
                    className={`px-6 py-2 rounded-2xl font-semibold text-sm transition-all ${activeTab === "tahapan" ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Tahapan
                </button>
            </div>

            {/* ========================================= */}
            {/* KONTEN TAB: INFORMASI                     */}
            {/* ========================================= */}
            {activeTab === "informasi" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* KOLOM KIRI */}
                    <div className="space-y-6">

                        {/* Card 1: Setting Informasi Lomba */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Settings size={20} className="text-gray-700" />
                                <h2 className="text-lg font-bold text-gray-900">Setting Informasi Lomba</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-[-8px]">Setting General dari Event (Waktu Mulai, tempat, dll)</p>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Nama Lomba</label>
                                <input
                                    type="text"
                                    value={competitionName}
                                    onChange={(e) => setCompetitionName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold">Deskripsi Lomba</label>
                                    <span className="text-xs text-gray-300">{description.length}/1000</span>
                                </div>
                                <textarea
                                    rows={6}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={1000}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary font-medium text-justify resize-none"
                                />
                            </div>
                        </div>

                        {/* Card 2: Setting Peserta */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Users size={20} className="text-gray-700" />
                                <h2 className="text-lg font-bold text-gray-900">Setting Peserta</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-[-12px]">Setting Limiter Dasar Peserta Lomba</p>

                            {/* Tipe Lomba Radio (Vertikal) */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold block text-gray-900">Tipe Lomba</label>
                                <div className="flex flex-col gap-3 pl-1">
                                    <label className="flex items-center gap-3 cursor-pointer font-medium text-sm text-gray-700">
                                        <input
                                            type="radio" name="tipeLomba" checked={tipeLomba === "pribadi"}
                                            onChange={() => setTipeLomba("pribadi")} className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                        />
                                        Pribadi
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer font-medium text-sm text-gray-700">
                                        <input
                                            type="radio" name="tipeLomba" checked={tipeLomba === "tim"}
                                            onChange={() => setTipeLomba("tim")} className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                        />
                                        Tim
                                    </label>
                                </div>
                            </div>

                            {/* Limiter Peserta inputs */}
                            <div className="space-y-4 pt-2">
                                <label className="text-sm font-semibold block text-gray-900">Limiter Peserta</label>

                                <div className="space-y-3 max-w-md">
                                    {tipeLomba === "tim" && (
                                        <>
                                            {/* Min Member */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                <span className="text-sm font-medium text-gray-700">Anggota per Tim (Min) :</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-between border border-gray-300 rounded-lg pl-3 pr-2 w-24 h-10 bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={minMember}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === "") {
                                                                    setMinMember("");
                                                                } else {
                                                                    const num = parseInt(val);
                                                                    if (!isNaN(num)) setMinMember(Math.max(1, num));
                                                                }
                                                            }}
                                                            className="w-full text-sm font-semibold bg-transparent border-none outline-none text-gray-900 focus:outline-none focus:ring-0 p-0 pr-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <User size={16} className="text-gray-400 shrink-0" />
                                                    </div>
                                                    <HoldButton onAction={() => setMinMember(m => (m === "" ? 1 : m + 1))} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium">+</HoldButton>
                                                    <HoldButton onAction={() => setMinMember(m => (m === "" ? 1 : Math.max(1, m - 1)))} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium">-</HoldButton>
                                                </div>
                                            </div>

                                            {/* Max Member */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                                <span className="text-sm font-medium text-gray-700">Anggota per Tim (Max) :</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-between border border-gray-300 rounded-lg pl-3 pr-2 w-24 h-10 bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={maxMember}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === "") {
                                                                    setMaxMember("");
                                                                } else {
                                                                    const num = parseInt(val);
                                                                    if (!isNaN(num)) setMaxMember(Math.max(1, num));
                                                                }
                                                            }}
                                                            className="w-full text-sm font-semibold bg-transparent border-none outline-none text-gray-900 focus:outline-none focus:ring-0 p-0 pr-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <User size={16} className="text-gray-400 shrink-0" />
                                                    </div>
                                                    <HoldButton onAction={() => setMaxMember(m => (m === "" ? 1 : m + 1))} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium">+</HoldButton>
                                                    <HoldButton onAction={() => setMaxMember(m => (m === "" ? 1 : Math.max(1, m - 1)))} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium">-</HoldButton>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Max Teams / Participants */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                        <span className="text-sm font-medium text-gray-700">
                                            Maksimal {tipeLomba === "tim" ? "Tim" : "Peserta"} Pendaftar :
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-between border border-gray-300 rounded-lg pl-3 pr-2 w-24 h-10 bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={tipeLomba === "tim" ? maxTeams : maxParticipants}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (tipeLomba === "tim") {
                                                            if (val === "") {
                                                                setMaxTeams("");
                                                            } else {
                                                                const num = parseInt(val);
                                                                if (!isNaN(num)) setMaxTeams(Math.max(1, num));
                                                            }
                                                        } else {
                                                            if (val === "") {
                                                                setMaxParticipants("");
                                                            } else {
                                                                const num = parseInt(val);
                                                                if (!isNaN(num)) setMaxParticipants(Math.max(1, num));
                                                            }
                                                        }
                                                    }}
                                                    className="w-full text-sm font-semibold bg-transparent border-none outline-none text-gray-900 focus:outline-none focus:ring-0 p-0 pr-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <User size={16} className="text-gray-400 shrink-0" />
                                            </div>
                                            <HoldButton
                                                onAction={() => {
                                                    if (tipeLomba === "tim") {
                                                        setMaxTeams(t => (t === "" ? 1 : t + 1));
                                                    } else {
                                                        setMaxParticipants(p => (p === "" ? 1 : p + 1));
                                                    }
                                                }}
                                                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium"
                                            >
                                                +
                                            </HoldButton>
                                            <HoldButton
                                                onAction={() => {
                                                    if (tipeLomba === "tim") {
                                                        setMaxTeams(t => (t === "" ? 1 : Math.max(1, t - 1)));
                                                    } else {
                                                        setMaxParticipants(p => (p === "" ? 1 : Math.max(1, p - 1)));
                                                    }
                                                }}
                                                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium"
                                            >
                                                -
                                            </HoldButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN */}
                    <div className="space-y-6">

                        {/* Card 3: Pembayaran Lomba */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                <CreditCard size={20} className="text-gray-700" />
                                <h2 className="text-lg font-bold text-gray-900">Pembayaran Lomba</h2>
                            </div>
                            <p className="text-xs text-gray-400 mt-[-12px]">Setting Pembayaran dari Lomba</p>

                            {/* Biaya Pendaftaran (Vertikal) */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold block text-gray-900">Biaya Pendaftaran</label>
                                <div className="flex flex-col gap-3 pl-1">
                                    <label className="flex items-center gap-3 cursor-pointer font-medium text-sm text-gray-700">
                                        <input
                                            type="radio" name="paymentStatus" checked={isPaid === "gratis"}
                                            onChange={() => setIsPaid("gratis")} className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                        />
                                        Gratis
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer font-medium text-sm text-gray-700">
                                        <input
                                            type="radio" name="paymentStatus" checked={isPaid === "berbayar"}
                                            onChange={() => setIsPaid("berbayar")} className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                        />
                                        Berbayar
                                    </label>
                                </div>

                                {/* Input Harga */}
                                {isPaid === "berbayar" && (
                                    <div className="flex items-center gap-2 pt-1 max-w-md">
                                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-10 bg-white flex-1 max-w-[280px]">
                                            <span className="bg-white px-3 text-sm font-bold h-full flex items-center border-r border-gray-200 text-gray-900">Rp.</span>
                                            <input
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(Number(e.target.value))}
                                                className="w-full px-3 outline-none font-semibold text-sm h-full text-gray-700"
                                            />
                                        </div>
                                        <button onClick={() => setPrice(p => p + 10000)} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium">+</button>
                                        <button onClick={() => setPrice(p => Math.max(0, p - 10000))} className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 text-xl font-medium">-</button>
                                    </div>
                                )}
                            </div>

                            {/* Rekening Provider */}
                            {isPaid === "berbayar" && (
                                <div className="space-y-2 max-w-md">
                                    <label className="text-sm font-semibold block text-gray-900">Rekening Provider</label>
                                    <select
                                        value={bankProvider}
                                        onChange={(e) => setBankProvider(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none font-medium text-sm h-11 text-gray-700 cursor-pointer"
                                    >
                                        <option value="bca">BCA</option>
                                        <option value="bni">BNI</option>
                                        <option value="bri">BRI</option>
                                        <option value="mandiri">Mandiri</option>
                                        <option value="bsi">BSI</option>
                                        <option value="btn">BTN</option>
                                    </select>
                                </div>
                            )}

                            {/* Nomor Rekening */}
                            {isPaid === "berbayar" && (
                                <div className="space-y-2 max-w-md">
                                    <label className="text-sm font-semibold block text-gray-900">Nomor Rekening</label>
                                    <input
                                        type="text"
                                        placeholder="Masukkan nomor rekening..."
                                        value={bankAccountNumber}
                                        onChange={(e) => setBankAccountNumber(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-medium text-sm h-11 text-gray-700"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Card 4: Buku Panduan Lomba */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Buku Panduan Lomba</h2>
                                <p className="text-xs text-gray-400 mt-1">Silahkan unggah panduan teknis untuk lomba Anda</p>
                            </div>

                            {/* Current guidebook displays or Drag & Drop Area */}
                            {guidebookUrl ? (
                                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <FileText size={24} className="text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-800">Panduan Teknis Lomba</span>
                                            <a
                                                href={getDocumentUrl(guidebookUrl, 'competitions')}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline font-bold mt-0.5"
                                            >
                                                Lihat / Unduh File PDF
                                            </a>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setGuidebookUrl("")}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-xl p-8 flex flex-col items-center text-center gap-3 relative">
                                    <div className="w-14 h-14 bg-blue-100/60 text-primary rounded-xl flex items-center justify-center">
                                        <UploadCloud size={28} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Pilih atau Drag file untuk Upload</p>
                                        <p className="text-xs text-gray-400 mt-1">Format PDF maks 5MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        disabled={isUploading}
                                    />
                                    <button
                                        className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors pointer-events-none"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? "Mengunggah..." : "Pilih File"}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* KONTEN TAB: TAHAPAN                       */}
            {/* ========================================= */}
            {activeTab === "tahapan" && (
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* ======================= */}
                    {/* KOLOM KIRI (TIMELINE)   */}
                    {/* ======================= */}
                    <div className="w-full lg:w-[45%] flex flex-col gap-6 shrink-0">
                        {/* Card 1: Pendaftaran & Timeline */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">



                            {/* Timeline Babak Lomba */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Flag size={20} className="text-gray-700" />
                                        <h2 className="text-lg font-bold text-gray-900">Timeline Lomba</h2>
                                    </div>
                                    <p className="text-xs text-gray-400">Atur tanggal dan tahapan setiap babak lomba Anda</p>
                                </div>

                                {/* Bagian Pendaftaran Dasar */}
                                <div className="space-y-4">
                                    <h2 className="text-[15px] font-bold text-gray-900">Pendaftaran & Pembayaran Lomba</h2>
                                    {regStage ? (
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-700">Mulai :</span>
                                                <CustomDateInput
                                                    value={regStage.timelines.registration?.start_date || ""}
                                                    onChange={(val) => updateTimelineDate(regStage.stage_id, 'registration', 'start_date', val)}
                                                    min={eventStartDate}
                                                    max={eventEndDate}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-700">Sampai :</span>
                                                <CustomDateInput
                                                    value={regStage.timelines.registration?.end_date || ""}
                                                    onChange={(val) => updateTimelineDate(regStage.stage_id, 'registration', 'end_date', val)}
                                                    min={eventStartDate}
                                                    max={eventEndDate}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Tahap pendaftaran tidak ditemukan</p>
                                    )}
                                </div>

                                {babakStages.map((stage, idx) => {
                                    const method = stage.timelines.presentation ? 'presentation' : 'submission';
                                    const methodData = stage.timelines[method] || {};
                                    // Default radio state, baca dari ada tidaknya meeting_link
                                    const locMode = methodData.location_type || (methodData.meeting_link ? 'online' : 'offline');

                                    return (
                                        <div key={stage.stage_id} className="space-y-3 mt-4">
                                            {/* Header Babak & Tombol Hapus */}
                                            <div className="flex items-end justify-between gap-4">
                                                <div className="space-y-1.5 w-full max-w-sm">
                                                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                                        Nama Babak <span className="text-gray-400 font-normal">(Klik kotak untuk ganti)</span>
                                                    </label>
                                                    <div className="relative group">
                                                        <input
                                                            type="text"
                                                            value={stage.stage_name}
                                                            onChange={(e) => updateStageName(stage.stage_id, e.target.value)}
                                                            className="w-full text-sm font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50 hover:bg-white"
                                                            placeholder="Contoh: Penyisihan, Semifinal, Final"
                                                        />
                                                        <Pencil size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors pointer-events-none" />
                                                    </div>
                                                </div>
                                                {babakStages.length > 1 && (
                                                    <button type="button" onClick={() => handleDeleteStage(stage.stage_id)} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 transition-colors pb-3">
                                                        <Trash2 size={14} /> Hapus Babak
                                                    </button>
                                                )}
                                            </div>

                                            {/* Kotak Konten Babak */}
                                            <div className="border border-gray-200 rounded-xl p-5 space-y-6 bg-white shadow-sm">

                                                {/* Metode Pelaksanaan */}
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Metode Pelaksanaan</h4>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-1">
                                                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-fit">
                                                            <button
                                                                onClick={() => toggleTimelineMethod(stage.stage_id, 'submission')}
                                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${method === 'submission' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                                            >
                                                                Pengumpulan Karya
                                                            </button>
                                                            <button
                                                                onClick={() => toggleTimelineMethod(stage.stage_id, 'presentation')}
                                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${method === 'presentation' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                                            >
                                                                Presentasi (Live)
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Tanggal Mulai & Sampai Pelaksanaan */}
                                                    <div className="flex items-center gap-4 flex-wrap pt-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-sm font-medium text-gray-600">Mulai:</span>
                                                            <CustomDateInput value={methodData.start_date || ""} onChange={(val) => updateTimelineDate(stage.stage_id, method, 'start_date', val)} min={eventStartDate} max={eventEndDate} />
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-sm font-medium text-gray-600">Sampai:</span>
                                                            <CustomDateInput value={methodData.end_date || ""} onChange={(val) => updateTimelineDate(stage.stage_id, method, 'end_date', val)} min={eventStartDate} max={eventEndDate} />
                                                        </div>
                                                    </div>

                                                    {/* Opsi Lokasi Radio Button (Hanya Presentasi) */}
                                                    {method === 'presentation' && (
                                                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-4 space-y-4">
                                                            <div className="flex gap-6">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio" name={`loc_${stage.stage_id}`}
                                                                        checked={locMode === 'offline'}
                                                                        onChange={() => {
                                                                            updateTimelineExtra(stage.stage_id, method, 'location_type', 'offline');
                                                                            updateTimelineExtra(stage.stage_id, method, 'meeting_link', '');
                                                                        }}
                                                                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                                                                    />
                                                                    <span className="text-sm font-semibold text-gray-800">Offline (Lokasi Fisik)</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="radio" name={`loc_${stage.stage_id}`}
                                                                        checked={locMode === 'online'}
                                                                        onChange={() => {
                                                                            updateTimelineExtra(stage.stage_id, method, 'location_type', 'online');
                                                                            updateTimelineExtra(stage.stage_id, method, 'location', '');
                                                                        }}
                                                                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                                                                    />
                                                                    <span className="text-sm font-semibold text-gray-800">Online (Link Meeting)</span>
                                                                </label>
                                                            </div>

                                                            {/* Input Berubah Sesuai Radio yang Dipilih */}
                                                            {locMode === 'offline' ? (
                                                                <div className="space-y-1.5 max-w-md">
                                                                    <label className="text-xs font-bold text-gray-700">Detail Lokasi</label>
                                                                    <input
                                                                        type="text" placeholder="Contoh: Gedung A, Lantai 2, Ruang 101"
                                                                        value={methodData.location || ""} onChange={(e) => updateTimelineExtra(stage.stage_id, method, 'location', e.target.value)}
                                                                        className="w-full text-sm font-medium border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1.5 max-w-md">
                                                                    <label className="text-xs font-bold text-gray-700">Link Video Conference</label>
                                                                    <input
                                                                        type="text" placeholder="https://zoom.us/j/..."
                                                                        value={methodData.meeting_link || ""} onChange={(e) => updateTimelineExtra(stage.stage_id, method, 'meeting_link', e.target.value)}
                                                                        className="w-full text-sm font-medium border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Masa Penjurian */}
                                                <div className="space-y-3 pt-2">
                                                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Masa Penjurian</h4>
                                                    <div className="flex items-center gap-4 flex-wrap pt-1">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-sm font-medium text-gray-600">Mulai:</span>
                                                            <CustomDateInput value={stage.timelines.judging?.start_date || ""} onChange={(val) => updateTimelineDate(stage.stage_id, 'judging', 'start_date', val)} min={eventStartDate} max={eventEndDate} />
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-sm font-medium text-gray-600">Sampai:</span>
                                                            <CustomDateInput value={stage.timelines.judging?.end_date || ""} onChange={(val) => updateTimelineDate(stage.stage_id, 'judging', 'end_date', val)} min={eventStartDate} max={eventEndDate} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pengumuman */}
                                                <div className="space-y-3 pt-2">
                                                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                                                        {stage.stage_type === 'final' ? 'Pengumuman Juara' : 'Pengumuman Kelolosan'}
                                                    </h4>
                                                    <div className="flex items-center gap-2.5 pt-1">
                                                        <span className="text-sm font-medium text-gray-600">Tanggal:</span>
                                                        <CustomDateInput value={stage.timelines.announcement?.start_date || ""} onChange={(val) => updateTimelineDate(stage.stage_id, 'announcement', 'start_date', val)} min={eventStartDate} max={eventEndDate} />
                                                    </div>
                                                </div>

                                                {/* Sertifikat (Khusus Final) */}
                                                {stage.stage_type === 'final' && (
                                                    <div className="space-y-3 pt-2">
                                                        <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Pemberian Sertifikat</h4>
                                                        <div className="flex items-center gap-2.5 pt-1">
                                                            <span className="text-sm font-medium text-gray-600">Tanggal:</span>
                                                            <CustomDateInput value={stage.timelines.award?.start_date || ""} onChange={(val) => updateTimelineDate(stage.stage_id, 'award', 'start_date', val)} min={eventStartDate} max={eventEndDate} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {babakStages.length < maxStages ? (
                                    <button type="button" onClick={handleAddStage} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 hover:border-primary text-primary hover:bg-blue-50/50 py-3 rounded-lg font-semibold text-sm transition-all mt-4">
                                        <Plus size={16} /> Tambah Babak (Sisa Kuota: {maxStages - babakStages.length})
                                    </button>
                                ) : (
                                    <div className="w-full text-center text-xs text-gray-500 font-semibold mt-4 bg-gray-50 border border-gray-200 py-3 rounded-lg">
                                        Kuota Babak Penuh (Maksimal {maxStages} Babak untuk Paket Anda)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 3: Juri */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <User size={20} className="text-gray-900" />
                                    <h2 className="text-lg font-bold text-gray-900">Juri</h2>
                                </div>
                                <p className="text-xs text-gray-500 mt-[-4px]">Undang Juri untuk menilai peserta di lomba Anda</p>
                            </div>

                            <div className="space-y-6">
                                {/* Panel Undang Juri */}
                                <div className="space-y-2 relative">
                                    <h3 className="text-sm font-bold text-gray-900">Undang Juri</h3>
                                    <div className="relative border border-gray-300 rounded-lg h-11 bg-white">
                                        <input
                                            type="text"
                                            placeholder="Telusuri Username Juri"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-full pl-4 pr-10 text-sm outline-none text-gray-700"
                                        />
                                        <Search size={18} className="absolute right-3 top-3 text-gray-600" />
                                    </div>

                                    {/* Search Results overlay */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                                            {searchResults.map((j) => (
                                                <div key={j.judge_id || j.profile_id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-gray-600 text-xs">
                                                            {j.public_profiles?.profile_image ? (
                                                                <img src={`${getProfileImageUrl(j.public_profiles?.profile_image, 'judges')}`} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                j.public_profiles?.username?.[0]?.toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {j.prefix ? `${j.prefix} ` : ""}{j.public_profiles?.username}{j.suffix ? `, ${j.suffix}` : ""}
                                                            </span>
                                                            <span className="text-xs text-gray-500">{j.institution}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleInviteJudge(j)}
                                                        className="text-xs font-bold text-white bg-primary hover:bg-blue-700 px-3 py-1.5 rounded"
                                                    >
                                                        Undang
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Panel Penugasan Juri */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-900">Penugasan Juri</h3>
                                    <div className="border border-gray-300 rounded-lg p-5 space-y-4 bg-white">

                                        {invitations.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic text-center py-4">Belum ada juri yang diundang</p>
                                        ) : (
                                            invitations.map((inv) => {
                                                const judge = inv.judges;
                                                if (!judge) return null;
                                                const judgeStageIds = assignments
                                                    .filter(a => a.judge_id === inv.judge_id)
                                                    .map(a => String(a.stage_id));
                                                const assignedStageNames = babakStages
                                                    .filter(s => judgeStageIds.includes(String(s.stage_id)))
                                                    .map(s => s.stage_name);

                                                return (
                                                    <div key={inv.judge_id} className="flex items-center gap-4">
                                                        <div className="flex-1 flex items-center justify-between border border-gray-300 rounded-xl p-3">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-600">
                                                                    {judge.public_profiles?.profile_image ? (
                                                                        <img src={`${getProfileImageUrl(judge.public_profiles?.profile_image, 'judges')}`} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        judge.public_profiles?.username?.[0]?.toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-gray-900">
                                                                        {judge.prefix ? `${judge.prefix} ` : ""}{judge.public_profiles?.username}{judge.suffix ? `, ${judge.suffix}` : ""}
                                                                    </span>
                                                                    <span className="text-[11px] font-medium text-gray-500">{judge.institution}</span>
                                                                    {assignedStageNames.length > 0 && (
                                                                        <span className="text-xs font-bold text-primary mt-0.5">
                                                                            {assignedStageNames.join(", ")}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {inv.status !== 'accepted' && (
                                                                    <span className={`text-white text-[10px] font-bold px-2 py-1 rounded-md cursor-default ${inv.status === 'rejected' ? 'bg-red-500' : 'bg-[#f4b400]'}`}>
                                                                        {inv.status === 'rejected' ? 'REJECTED' : 'PENDING'}
                                                                    </span>
                                                                )}
                                                                <div className="relative group">
                                                                    <button className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors bg-white">
                                                                        {judgeStageIds.length === 0
                                                                            ? "Pilih Babak"
                                                                            : `${judgeStageIds.length} Babak`
                                                                        }
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                                    </button>
                                                                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 hidden group-hover:block">
                                                                        <p className="text-[10px] text-gray-400 font-semibold px-3 pt-2 pb-1 uppercase tracking-wider">Pilih babak yang dijuri</p>
                                                                        {babakStages.length === 0 ? (
                                                                            <p className="text-xs text-gray-400 italic px-3 py-2">Belum ada babak</p>
                                                                        ) : (
                                                                            babakStages.map(s => {
                                                                                const checked = judgeStageIds.includes(String(s.stage_id));
                                                                                return (
                                                                                    <label
                                                                                        key={s.stage_id}
                                                                                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleJudgeAssignmentToggle(inv.judge_id, String(s.stage_id));
                                                                                        }}
                                                                                    >
                                                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked
                                                                                            ? 'bg-primary border-primary'
                                                                                            : 'border-gray-300'
                                                                                            }`}>
                                                                                            {checked && (
                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className="text-xs font-semibold text-gray-800">{s.stage_name}</span>
                                                                                    </label>
                                                                                );
                                                                            })
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveJudgeInvitation(inv.judge_id)}
                                                            className="text-[#d04b33] hover:text-red-700 shrink-0 transition-colors"
                                                        >
                                                            <X size={22} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-gray-100">
                                            <p className="text-[11px] text-gray-400 italic">
                                                Satu juri dapat menjuri di beberapa babak sekaligus
                                            </p>
                                            <p className="text-xs font-semibold text-gray-500">
                                                {invitations.filter(i => i.status === 'accepted').length} dari {invitations.length} juri menerima undangan
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================================================== */}
                    {/* KOLOM KANAN (KUALIFIKASI, JURI, KRITERIA)          */}
                    {/* ================================================== */}
                    <div className="w-full lg:flex-1 flex flex-col gap-6">

                        {/* Card 2: Kualifikasi */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={20} className="text-gray-700" />
                                    <h2 className="text-lg font-bold text-gray-900">Kualifikasi</h2>
                                </div>
                                <p className="text-xs text-gray-400">Atur jumlah kualifikasi peserta per babak lomba</p>
                            </div>

                            <div className="space-y-4">
                                {babakStages.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Belum ada babak lomba</p>
                                ) : (
                                    babakStages.map((stage) => (
                                        <div key={stage.stage_id} className="space-y-2">
                                            <h3 className="text-sm font-bold text-gray-900">{stage.stage_name}</h3>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                {/* Poin 4: Teks Kualifikasi Dinamis */}
                                                <span className="text-sm font-medium text-gray-700">
                                                    {stage.stage_type === 'final' ? 'Maksimal Pemenang Lomba:' : 'Maksimal Tim/Peserta Lolos ke Babak Selanjutnya:'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 w-20 h-10 bg-white">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={stage.max_qualified || ''}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value, 10);
                                                                updateStageMaxQualified(stage.stage_id, isNaN(val) ? 0 : Math.max(1, val));
                                                            }}
                                                            className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="1"
                                                        />
                                                        <User size={16} className="text-gray-400 shrink-0" />
                                                    </div>
                                                    <HoldButton
                                                        onAction={() => incrementStageMaxQualified(stage.stage_id, 1)}
                                                        className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 active:bg-gray-100 text-xl font-medium"
                                                    >+</HoldButton>
                                                    <HoldButton
                                                        onAction={() => incrementStageMaxQualified(stage.stage_id, -1)}
                                                        className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 active:bg-gray-100 text-xl font-medium"
                                                    >-</HoldButton>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Card 4: Kriteria Penilaian */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={20} className="text-gray-700" />
                                    <h2 className="text-lg font-bold text-gray-900">Kriteria Penilaian</h2>
                                </div>
                                <p className="text-xs text-gray-400">Buat kriteria bobot penilaian babak lomba (Total harus 100%)</p>
                            </div>

                            <div className="space-y-3">
                                {/* Selector Babak if more than 1 */}
                                {babakStages.length > 1 && (
                                    <div className="flex gap-2 mb-3">
                                        {babakStages.map(s => (
                                            <button
                                                key={s.stage_id}
                                                onClick={() => setSelectedStageForCriteria(s.stage_id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedStageForCriteria === s.stage_id
                                                    ? "bg-primary text-white"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {s.stage_name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {activeStageForCriteria ? (
                                    <div className="border border-gray-300 rounded-lg p-3 space-y-3 bg-white">
                                        {/* List Kriteria */}
                                        {activeStageForCriteria.criteria.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic text-center py-4">Belum ada kriteria penilaian</p>
                                        ) : (
                                            activeStageForCriteria.criteria.map((crit: any) => (
                                                <div key={crit.criteria_id || crit.name} className="flex items-center justify-between border border-gray-200 p-3 rounded-lg bg-white">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{crit.name}</span>
                                                        <span className="text-[11px] text-gray-500">{crit.description || "Tidak ada deskripsi"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-bold text-gray-900">{crit.weight}%</span>
                                                        <button
                                                            onClick={() => handleDeleteCriterion(activeStageForCriteria.stage_id, crit)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {/* Status Bobot & Tambah Kriteria */}
                                        <div className="flex flex-col gap-3 pt-2">
                                            <div className="flex justify-center">
                                                {activeStageForCriteria.criteria.length >= 5 ? (
                                                    <span className="text-xs text-red-500 font-semibold bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                                                        Maksimal 5 kriteria penilaian telah tercapai
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsKriteriaModalOpen(true)}
                                                        className="flex items-center gap-2 border border-gray-400 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Plus size={16} /> Tambah Kriteria Penilaian
                                                    </button>
                                                )}
                                            </div>
                                            {(() => {
                                                const totalWeight = activeStageForCriteria.criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
                                                return (
                                                    <span className={`text-xs font-bold text-left ${totalWeight === 100 ? 'text-green-600' : 'text-amber-600'
                                                        }`}>
                                                        Total bobot kriteria saat ini: {totalWeight}%. {totalWeight === 100 ? 'Sesuai' : 'Harus mencapai 100%'}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {/* ========================================= */}
                                        {/* MODAL: TAMBAH KRITERIA PENILAIAN            */}
                                        {/* ========================================= */}
                                        {isKriteriaModalOpen && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                                                <div className="bg-white rounded-xl w-full max-w-[700px] p-6 relative shadow-xl">

                                                    {/* Tombol Close (X) */}
                                                    <button
                                                        onClick={handleCloseCriteriaModal}
                                                        className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>

                                                    {/* Header Modal */}
                                                    <div className="mb-6">
                                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                            <Flag size={18} className="text-gray-800" /> Tambah Kriteria Penilaian
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mt-1 ml-6.5 pl-1">
                                                            Tambahkan kriteria bobot penilaian lomba untuk {activeStageForCriteria.stage_name}
                                                        </p>
                                                    </div>

                                                    {/* Form Inputs */}
                                                    <div className="space-y-5">

                                                        {/* Row 1: Nama & Bobot (Sejajar) */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                            <div className="space-y-1.5">
                                                                <label className="text-sm font-bold text-gray-800">Nama Kriteria</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nama kriteria..."
                                                                    value={newCriteriaName}
                                                                    onChange={(e) => setNewCriteriaName(e.target.value)}
                                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-sm font-bold text-gray-800">Bobot Penilaian (%)</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Masukkan bobot penilaian (%)"
                                                                    value={newCriteriaWeight}
                                                                    onChange={(e) => setNewCriteriaWeight(e.target.value)}
                                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Deskripsi (Full Width) */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-sm font-bold text-gray-800">Deskripsi Kriteria (Opsional)</label>
                                                            <textarea
                                                                rows={3}
                                                                placeholder="Deskripsi kriteria...."
                                                                value={newCriteriaDesc}
                                                                onChange={(e) => setNewCriteriaDesc(e.target.value)}
                                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary text-gray-900 text-sm resize-none"
                                                            />
                                                        </div>

                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                                        <button
                                                            onClick={handleCloseCriteriaModal}
                                                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 text-sm transition-colors"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button
                                                            onClick={handleSaveNewCriterion}
                                                            className="px-5 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors"
                                                        >
                                                            Simpan
                                                        </button>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Tahapan babak lomba tidak ditemukan</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            <Toast show={toast.show} message={toast.message} type={toast.type} />

            {/* CONFIRM POPUP */}
            <ConfirmPopup
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onCancel={() => setConfirmDialog(c => ({ ...c, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
            />

        </div>
    );
}