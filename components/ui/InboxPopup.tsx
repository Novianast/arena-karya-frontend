"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Check,
  X,
  RotateCw,
  Inbox,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast from "./Toast";

interface InboxPopupProps {
  role: "participant" | "judge" | "organizer";
}

// Unified interface for resolved notifications across roles
interface NotificationItem {
  id: string; // Unified unique string ID (e.g. 'inv_123', 'payment_456')
  rawId: number; // Original DB ID
  title: string;
  description: string;
  time: string;
  status: "pending" | "accepted" | "rejected" | "verified" | "success" | "used" | "pending_payment";
  type: "member_invitation" | "judge_invitation" | "payment" | "judge_response";
  meta?: any; // Hold raw objects for callback actions
}

export default function InboxPopup({ role }: InboxPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"baru" | "riwayat">("baru");

  // Local storage read tracker for organizer
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Toast notifications state
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch dismissed notifications for organizer from localStorage
  useEffect(() => {
    if (role === "organizer") {
      try {
        const stored = localStorage.getItem("arena_read_notifications_organizer");
        if (stored) {
          setDismissedIds(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Error reading localStorage:", err);
      }
    }
  }, [role]);

  // Main fetch function
  const fetchNotifications = async (showToastOnSuccess = false) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (role === "participant") {
        // 1. Get participant record
        const { data: participant } = await supabase
          .from("participants")
          .select("participant_id")
          .eq("profile_id", user.id)
          .single();

        if (participant) {
          // 2. Get member invitations
          const { data: invitations, error } = await supabase
            .from("member_invitations")
            .select(`
              invitation_id,
              status,
              created_at,
              entry:entries (
                entry_id,
                entry_name,
                leader:participants (
                  profile:profiles (
                    username
                  )
                ),
                competition:competitions (
                  competition_name
                )
              )
            `)
            .eq("participant_id", participant.participant_id)
            .order("created_at", { ascending: false });

          if (error) throw error;

          const formatted: NotificationItem[] = (invitations || []).map((inv: any) => {
            const entry = inv.entry;
            const leaderName = entry?.leader?.profile?.username || "Ketua Kelompok";
            const compName = entry?.competition?.competition_name || "Lomba";
            const entryName = entry?.entry_name || "Kelompok";

            return {
              id: `member_inv_${inv.invitation_id}`,
              rawId: inv.invitation_id,
              title: "Undangan Kelompok",
              description: `Anda diundang oleh ${leaderName} untuk bergabung dengan kelompok "${entryName}" di lomba "${compName}".`,
              time: inv.created_at,
              status: inv.status,
              type: "member_invitation",
              meta: {
                entryId: entry?.entry_id,
                participantId: participant.participant_id,
              }
            };
          });
          setNotifications(formatted);
        }
      } else if (role === "judge") {
        // 1. Get judge record
        const { data: judge } = await supabase
          .from("judges")
          .select("judge_id")
          .eq("profile_id", user.id)
          .single();

        if (judge) {
          // 2. Get judge invitations
          const { data: invitations, error } = await supabase
            .from("judge_invitations")
            .select(`
              invitation_id,
              status,
              pesan_undangan,
              created_at,
              responded_at,
              competition:competitions (
                competition_name
              )
            `)
            .eq("judge_id", judge.judge_id)
            .order("created_at", { ascending: false });

          if (error) throw error;

          const formatted: NotificationItem[] = (invitations || []).map((inv: any) => {
            const compName = inv.competition?.competition_name || "Lomba";
            const noteText = inv.pesan_undangan ? ` Pesan: "${inv.pesan_undangan}"` : "";

            return {
              id: `judge_inv_${inv.invitation_id}`,
              rawId: inv.invitation_id,
              title: "Undangan Juri Lomba",
              description: `Anda diundang menjadi juri untuk lomba "${compName}".${noteText}`,
              time: inv.created_at,
              status: inv.status,
              type: "judge_invitation"
            };
          });
          setNotifications(formatted);
        }
      } else if (role === "organizer") {
        // 1. Get organizer record
        const { data: organizer } = await supabase
          .from("organizers")
          .select("organizer_id")
          .eq("profile_id", user.id)
          .single();

        if (organizer) {
          const orgId = organizer.organizer_id;

          // 2. Get package payments
          const { data: payments } = await supabase
            .from("package_payments")
            .select(`
              payment_id,
              status,
              notes,
              created_at,
              verified_at,
              package:packages (
                package_name
              )
            `)
            .eq("organizer_id", orgId)
            .in("status", ["verified", "rejected"])
            .order("created_at", { ascending: false });

          // 3. Get competitions to locate judge responses
          const { data: events } = await supabase
            .from("events")
            .select("event_id, competitions(competition_id)")
            .eq("organizer_id", orgId);

          const compIds = events?.flatMap(e => {
            const comps = Array.isArray(e.competitions) ? e.competitions : (e.competitions ? [e.competitions] : []);
            return comps.map((c: any) => c.competition_id);
          }) || [];

          let judgeInvs: any[] = [];
          if (compIds.length > 0) {
            const { data } = await supabase
              .from("judge_invitations")
              .select(`
                invitation_id,
                status,
                responded_at,
                created_at,
                judge:judges (
                  profile:profiles (
                    username
                  )
                ),
                competition:competitions (
                  competition_name
                )
              `)
              .in("competition_id", compIds)
              .in("status", ["accepted", "rejected"]);
            judgeInvs = data || [];
          }

          // Format & Combine
          const paymentNotifications: NotificationItem[] = (payments || []).map((pay: any) => {
            const isVerified = pay.status === "verified";
            return {
              id: `payment_${pay.payment_id}`,
              rawId: pay.payment_id,
              title: isVerified ? "Paket Diverifikasi" : "Pembayaran Paket Ditolak",
              description: isVerified
                ? `Pembayaran paket "${pay.package?.package_name || 'Premium'}" Anda telah berhasil diverifikasi oleh admin.`
                : `Pembayaran paket "${pay.package?.package_name || 'Premium'}" Anda ditolak. Catatan: ${pay.notes || "Tidak ada catatan."}`,
              time: pay.verified_at || pay.created_at,
              status: pay.status,
              type: "payment"
            };
          });

          const judgeNotifications: NotificationItem[] = judgeInvs.map((inv: any) => {
            const isAccepted = inv.status === "accepted";
            const judgeName = inv.judge?.profile?.username || "Juri";
            const compName = inv.competition?.competition_name || "Lomba";

            return {
              id: `judge_resp_${inv.invitation_id}`,
              rawId: inv.invitation_id,
              title: isAccepted ? "Juri Menerima Undangan" : "Juri Menolak Undangan",
              description: `Juri "${judgeName}" telah ${isAccepted ? "menerima" : "menolak"} undangan untuk menilai lomba "${compName}".`,
              time: inv.responded_at || inv.created_at,
              status: inv.status,
              type: "judge_response"
            };
          });

          const combined = [...paymentNotifications, ...judgeNotifications].sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          );

          setNotifications(combined);
        }
      }

      if (showToastOnSuccess) {
        showToast("Kotak masuk berhasil diperbarui", "success");
      }
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      showToast("Gagal mengambil data kotak masuk", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("inbox-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "member_invitations" },
        () => {
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "judge_invitations" },
        () => {
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "package_payments" },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Show customized Toast notifications
  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle participant invitation responses
  const handleMemberInvitation = async (invId: number, accept: boolean, meta: any) => {
    const actionKey = `member_${invId}`;
    setActionLoading(actionKey);
    try {
      const nextStatus = accept ? "accepted" : "rejected";

      // Update invitation status
      const { error: updateError } = await supabase
        .from("member_invitations")
        .update({ status: nextStatus })
        .eq("invitation_id", invId);

      if (updateError) throw updateError;

      // If accepted, add to entry_members
      if (accept && meta) {
        const { error: insertError } = await supabase
          .from("entry_members")
          .insert({
            entry_id: meta.entryId,
            participant_id: meta.participantId,
            role: "member"
          });

        if (insertError) {
          // Rollback status to pending if insert fails
          await supabase
            .from("member_invitations")
            .update({ status: "pending" })
            .eq("invitation_id", invId);
          throw insertError;
        }
      }

      showToast(
        accept ? "Berhasil menerima undangan kelompok" : "Undangan kelompok ditolak",
        accept ? "success" : "warning"
      );

      // Refresh notifications list
      await fetchNotifications();
    } catch (err) {
      console.error("Error responding to invitation:", err);
      showToast("Gagal memproses undangan", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle judge invitation responses
  const handleJudgeInvitation = async (invId: number, accept: boolean) => {
    const actionKey = `judge_${invId}`;
    setActionLoading(actionKey);
    try {
      const nextStatus = accept ? "accepted" : "rejected";

      // Update invitation status with responded_at timestamp
      const { error } = await supabase
        .from("judge_invitations")
        .update({
          status: nextStatus,
          responded_at: new Date().toISOString()
        })
        .eq("invitation_id", invId);

      if (error) throw error;

      showToast(
        accept ? "Berhasil menerima undangan juri" : "Undangan juri ditolak",
        accept ? "success" : "warning"
      );

      // Refresh list
      await fetchNotifications();
    } catch (err) {
      console.error("Error responding to judge invitation:", err);
      showToast("Gagal memproses undangan juri", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Dismiss notification for Organizer (stored in localStorage)
  const handleDismissOrganizerNotification = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem("arena_read_notifications_organizer", JSON.stringify(updated));
    showToast("Pemberitahuan berhasil dihapus", "success");
  };

  // Mark all as read/dismissed for Organizer
  const handleMarkAllAsReadOrganizer = () => {
    const unreadItems = notifications.filter(n => !dismissedIds.includes(n.id));
    if (unreadItems.length === 0) return;

    const unreadIds = unreadItems.map(n => n.id);
    const updated = [...dismissedIds, ...unreadIds];
    setDismissedIds(updated);
    localStorage.setItem("arena_read_notifications_organizer", JSON.stringify(updated));
    showToast("Semua pemberitahuan ditandai dibaca", "success");
  };

  // Helper to format date
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return timeString;
    }
  };

  // Separate notifications based on tab and active role
  const getFilteredNotifications = () => {
    if (role === "organizer") {
      if (activeTab === "baru") {
        return notifications.filter(n => !dismissedIds.includes(n.id));
      } else {
        return notifications.filter(n => dismissedIds.includes(n.id));
      }
    } else {
      // Participant & Judge: "baru" means "pending", "riwayat" means "accepted" or "rejected"
      if (activeTab === "baru") {
        return notifications.filter(n => n.status === "pending");
      } else {
        return notifications.filter(n => n.status === "accepted" || n.status === "rejected");
      }
    }
  };

  // Unread counts for the badge
  const getUnreadCount = () => {
    if (role === "organizer") {
      return notifications.filter(n => !dismissedIds.includes(n.id)).length;
    } else {
      return notifications.filter(n => n.status === "pending").length;
    }
  };

  const unreadCount = getUnreadCount();
  const filteredList = getFilteredNotifications();

  return (
    <div className="relative mr-4" ref={popupRef}>
      {/* Inbox Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-200/80 transition-all text-black focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
        aria-label="Notification Inbox"
      >
        <Mail size={22} className="stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Pop Up Dropdown Window */}
      {isOpen && (
        <div className="absolute right-0 top-14 w-[380px] sm:w-[420px] bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Top Pointer Triangle */}
          <div className="absolute -top-[8px] right-4 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>

          <div className="relative bg-white flex flex-col w-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 text-lg">Kotak Masuk</span>
                {unreadCount > 0 && (
                  <span className="bg-red-50 text-red-600 font-semibold text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {role === "organizer" && activeTab === "baru" && filteredList.length > 0 && (
                  <button
                    onClick={handleMarkAllAsReadOrganizer}
                    className="text-xs text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Tandai semua dibaca
                  </button>
                )}
                <button
                  onClick={() => fetchNotifications(true)}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Perbarui"
                >
                  <RotateCw size={16} className={`${loading ? "animate-spin text-primary" : ""}`} />
                </button>
              </div>
            </div>

            {/* Role-Specific Mode Notification Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
              <button
                onClick={() => setActiveTab("baru")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === "baru"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {role === "organizer" ? "Belum Dibaca" : "Undangan Baru"}
              </button>
              <button
                onClick={() => setActiveTab("riwayat")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${activeTab === "riwayat"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                Riwayat
              </button>
            </div>

            {/* List Body */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
              {loading && filteredList.length === 0 ? (
                // Skeleton Loader
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-start animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-150 shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-150 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-150 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-150 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredList.length === 0 ? (
                // Empty State
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
                    <Inbox size={28} className="stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-700 mb-1">
                    {activeTab === "baru" ? "Tidak ada notifikasi baru" : "Riwayat kosong"}
                  </h4>
                  <p className="text-xs text-gray-400 max-w-[240px] mx-auto">
                    {activeTab === "baru"
                      ? "Semua pesan atau undangan yang masuk akan tampil di sini."
                      : "Pesan yang sudah Anda respon atau tandai dibaca akan dipindahkan ke sini."}
                  </p>
                </div>
              ) : (
                // Notification items
                filteredList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-gray-50/50 transition-colors flex gap-3.5 items-start ${item.status === "pending" ? "bg-blue-50/10" : ""
                      }`}
                  >
                    {/* Visual Indicator Icon */}
                    <div className="shrink-0 mt-0.5">
                      {item.type === "member_invitation" && (
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Mail size={18} />
                        </div>
                      )}
                      {item.type === "judge_invitation" && (
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Mail size={18} />
                        </div>
                      )}
                      {item.type === "payment" && (
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.status === "verified" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                          }`}>
                          {item.status === "verified" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                        </div>
                      )}
                      {item.type === "judge_response" && (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.status === "accepted" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                          }`}>
                          {item.status === "accepted" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-sm text-gray-800 truncate pr-2">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0 mt-0.5">
                          <Clock size={10} />
                          <span>{formatTime(item.time)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed break-words mb-2">
                        {item.description}
                      </p>

                      {/* Action buttons or status indicator */}
                      {item.status === "pending" ? (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              if (item.type === "member_invitation") {
                                handleMemberInvitation(item.rawId, true, item.meta);
                              } else {
                                handleJudgeInvitation(item.rawId, true);
                              }
                            }}
                            disabled={actionLoading !== null}
                            className="bg-primary hover:bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-55"
                          >
                            {actionLoading === `${item.type === "member_invitation" ? "member" : "judge"}_${item.rawId}` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Terima
                          </button>
                          <button
                            onClick={() => {
                              if (item.type === "member_invitation") {
                                handleMemberInvitation(item.rawId, false, item.meta);
                              } else {
                                handleJudgeInvitation(item.rawId, false);
                              }
                            }}
                            disabled={actionLoading !== null}
                            className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all disabled:opacity-55"
                          >
                            <X size={12} />
                            Tolak
                          </button>
                        </div>
                      ) : (
                        // History Badge or Actions for read notification
                        <div className="flex items-center justify-between mt-2">
                          {/* Badge status */}
                          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === "accepted" || item.status === "verified" || item.status === "success"
                            ? "bg-green-55/15 text-green-700"
                            : item.status === "rejected"
                              ? "bg-red-55/15 text-red-700"
                              : "bg-gray-100 text-gray-600"
                            }`}>
                            {item.status === "accepted" && "Diterima"}
                            {item.status === "rejected" && "Ditolak"}
                            {item.status === "verified" && "Diverifikasi"}
                            {item.status === "success" && "Sukses"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Message inside Popup Component */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}
