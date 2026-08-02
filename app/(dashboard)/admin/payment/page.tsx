"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import FilterDropdown from "@/components/ui/FilterDropdown";
import Toast from "@/components/ui/Toast";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import Pagination from "@/components/ui/Pagination";
import { getProofImageUrl } from "@/services/url/getProofImage";
import { getPublicProfile } from "@/services/profile/getProfile";

type PaymentStatus = "success" | "verified" | "rejected" | "used";

interface PaymentItem {
  paymentId: number;
  username: string;
  organizationName: string;
  pkgName: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  proofImage: string;
  profileId: string;
  notes: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusConfig(status: PaymentStatus) {
  switch (status) {
    case "verified":
    case "used":
      return { label: "Terverifikasi", bg: "bg-[#C9E0FF]", text: "text-[#1A73E8]" };
    case "rejected":
      return { label: "Ditolak", bg: "bg-[#D04B33]/20", text: "text-[#D04B33]" };
    case "success":
    default:
      return { label: "Diproses", bg: "bg-[#FFF1C8]", text: "text-[#B28507]" };
  }
}

function PaymentContent() {
  const searchParams = useSearchParams();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [signedProofUrl, setSignedProofUrl] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [packageFilter, setPackageFilter] = useState(searchParams.get("package") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "success");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [reason, setReason] = useState("");
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "success", message: "" }), 3000);
  };

  const truncateText = (text: string, maxLength: number = 15) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from("package_payments")
          .select(`
            payment_id,
            amount,
            status,
            proof_image,
            notes,
            verified_at,
            created_at,
            profile_id,
            organizers (
              organization_name,
              profile_id
            ),
            packages (
              package_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData: PaymentItem[] = await Promise.all(data.map(async (item: any) => {
          let username = "-";
          try {
            const targetProfileId = item.profile_id || item.organizers?.profile_id;
            if (targetProfileId) {
              const profile = await getPublicProfile(targetProfileId);
              if (profile && profile.username) {
                username = profile.username;
              }
            }
          } catch (e) {
            console.error("Error fetching profile", e);
          }

          return {
            paymentId: item.payment_id,
            username: username,
            organizationName: item.organizers?.organization_name || "-",
            pkgName: item.packages?.package_name || "-",
            amount: item.amount,
            paymentMethod: "Bank Transfer",
            status: item.status,
            proofImage: item.proof_image,
            profileId: item.profile_id,
            notes: item.notes,
            verifiedAt: item.verified_at ? new Date(item.verified_at).toLocaleDateString("id-ID") : null,
            createdAt: item.created_at,
          };
        }));

        setPayments(formattedData);
      } catch (error: any) {
        showToast(error.message, "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, packageFilter, statusFilter, sortOrder]);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!selectedPayment?.proofImage || !selectedPayment?.profileId) {
        setSignedProofUrl(null);
        return;
      }
      setSignedProofUrl(null);

      const url = await getProofImageUrl('package_payments', selectedPayment.profileId, selectedPayment.proofImage);
      if (url) {
        setSignedProofUrl(url);
      }
    };
    fetchSignedUrl();
  }, [selectedPayment]);

  const handleUpdateStatus = async (paymentId: number, newStatus: PaymentStatus, rejectionNotes: string = "") => {
    try {
      const verifiedAt = newStatus === "verified" || newStatus === "rejected" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("package_payments")
        .update({
          status: newStatus,
          notes: rejectionNotes || null,
          verified_at: verifiedAt,
        })
        .eq("payment_id", paymentId);

      if (error) throw error;

      const dateNow = new Date().toLocaleDateString("id-ID");

      setPayments((prev) =>
        prev.map((item) =>
          item.paymentId === paymentId ? { ...item, status: newStatus, notes: rejectionNotes || null, verifiedAt: dateNow } : item
        )
      );

      // Reset pilihan agar detail kembali kosong jika difilter berdasarkan status saat ini
      if (selectedPayment?.paymentId === paymentId) {
        setSelectedPayment(null);
      }

      showToast(`Payment ${newStatus}`, newStatus === "verified" ? "success" : "error");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setShowApprovePopup(false);
      setShowRejectPopup(false);
      if (newStatus === "rejected") setReason("");
    }
  };

  const packageOptions = useMemo(() => {
    const pkgs = payments.map((item) => item.pkgName);
    return [{ label: "Semua Paket", value: "" }, ...[...new Set(pkgs)].map((v) => ({ label: v, value: v }))];
  }, [payments]);

  const statusOptions = [
    { label: "Diproses", value: "success" },
    { label: "Terverifikasi", value: "verified" },
    { label: "Ditolak", value: "rejected" },
  ];

  const sortOptions = [
    { label: "Terbaru", value: "desc" },
    { label: "Terlama", value: "asc" },
  ];

  // LOGIKA FILTER TABEL
  const filteredPayments = useMemo(() => {
    let result = payments.filter((payment) => {
      const kw = search.toLowerCase();
      const matchSearch = payment.username.toLowerCase().includes(kw) || payment.organizationName.toLowerCase().includes(kw) || payment.pkgName.toLowerCase().includes(kw);
      const matchPackage = !packageFilter || payment.pkgName === packageFilter;

      // Filter status: Wajib ada proofImage & Cek kesesuaian dengan statusFilter
      const hasProof = !!payment.proofImage;
      const matchStatus = !statusFilter || 
        (statusFilter === "verified" && (payment.status === "verified" || payment.status === "used")) ||
        payment.status === statusFilter;

      return matchSearch && matchPackage && hasProof && matchStatus;
    });

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [payments, search, packageFilter, statusFilter, sortOrder]);

  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  const totalPayments = payments.length;
  const verifiedCount = payments.filter((i) => i.status === "verified" || i.status === "used").length;
  const processingCount = payments.filter((i) => i.status === "success").length;
  const rejectedCount = payments.filter((i) => i.status === "rejected").length;

  return (
    <div className="min-screen-h bg-white">
      <DashboardBannerHeader
        title="Verifikasi Pembayaran Paket"
        subtitle="Verifikasi pembayaran paket dari penyelenggara."
        searchQuery={search}
        onSearchChange={(e: any) => setSearch(e.target.value)}
        searchPlaceholder="Cari username, organisasi, atau paket..."
        customFilters={
          <>
            <FilterDropdown
              value={packageFilter}
              onChange={setPackageFilter}
              options={packageOptions}
              label={truncateText(packageFilter || "Semua Paket", 20)}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              label={statusOptions.find(o => o.value === statusFilter)?.label || ""}
            />
            <FilterDropdown value={sortOrder} onChange={(val) => setSortOrder(val as any)} options={sortOptions} label={sortOrder === "desc" ? "Terbaru" : "Terlama"} />
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#ECECEC] p-5">
          <p className="text-sm text-[#777777]">Total Entri</p>
          <h2 className="text-3xl font-bold mt-2 text-[#2A2A2A]">{totalPayments}</h2>
        </div>
        <div className="bg-white rounded-xl border border-[#ECECEC] p-5">
          <p className="text-sm text-[#777777]">Terverifikasi</p>
          <h2 className="text-3xl font-bold mt-2 text-[#1A73E8]">{verifiedCount}</h2>
        </div>
        <div className="bg-white rounded-xl border border-[#ECECEC] p-5">
          <p className="text-sm text-[#777777]">Diproses</p>
          <h2 className="text-3xl font-bold mt-2 text-[#B28507]">{processingCount}</h2>
        </div>
        <div className="bg-white rounded-xl border border-[#ECECEC] p-5">
          <p className="text-sm text-[#777777]">Ditolak</p>
          <h2 className="text-3xl font-bold mt-2 text-[#D04B33]">{rejectedCount}</h2>
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-6">
        <div className="bg-white border border-[#ECECEC] rounded-xl overflow-hidden min-h-[500px]">
          <div className="grid grid-cols-[70px_1.5fr_1.8fr_1fr_1fr] px-5 py-4 border-b border-[#ECECEC] bg-[#FAFAFA]">
            <div className="text-sm font-medium text-[#777777]">No</div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#777777]"><Icon icon="mdi:account-tie" /> Penyelenggara</div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#777777]"><Icon icon="mdi:package-variant-closed" /> Paket</div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#777777]"><Icon icon="mdi:cash" /> Amount</div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#777777]"><Icon icon="mdi:information-outline" /> Status</div>
          </div>

          <div className="p-3">
            {isLoading ? (
              <div className="flex justify-center py-20 text-[#777777]">Loading...</div>
            ) : paginatedPayments.length === 0 ? (
              <div className="flex justify-center py-20 text-[#777777]">Tidak ada entri yang perlu diproses.</div>
            ) : (
              paginatedPayments.map((payment, index) => {
                const selected = selectedPayment?.paymentId === payment.paymentId;
                const status = getStatusConfig(payment.status);
                const nomorUrut = startIndex + index + 1;

                return (
                  <div
                    key={payment.paymentId}
                    onClick={() => setSelectedPayment(payment)}
                    className={`mb-2 cursor-pointer transition-all duration-200 grid grid-cols-[70px_1.5fr_1.8fr_1fr_1fr] px-4 py-4 rounded-xl border ${selected ? "border-[#1A73E8] shadow-md bg-[#F9FBFF]" : "border-transparent hover:bg-[#FAFAFA]"}`}
                  >
                    <div className="flex items-center text-sm text-[#777777]">{nomorUrut}</div>
                    <div>
                      <p className="text-s font-medium truncate pr-2">{payment.username}</p>
                      <p className="text-sm text-[#777777] mt-1 truncate pr-2">{payment.organizationName}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="font-medium text-[#2A2A2A] truncate pr-2">{payment.pkgName}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="rounded-md bg-[#F4F4F4] px-3 py-2 text-sm text-[#2A2A2A]">{formatCurrency(payment.amount)}</div>
                    </div>
                    <div className="flex items-center">
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${status.bg} ${status.text}`}>
                        <span className="w-[5px] h-[5px] rounded-full bg-current" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-[#ECECEC] rounded-xl p-5">
          {!selectedPayment ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-24">
              <Icon icon="mdi:image-search-outline" className="text-7xl text-[#D8D7D7]" />
              <h3 className="mt-5 text-lg font-semibold text-[#2A2A2A]">Pilih Pembayaran</h3>
              <p className="mt-2 text-sm text-[#777777] max-w-[260px]">Klik salah satu baris pembayaran untuk memeriksa bukti transfer.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-[16px] text-[#2A2A2A] font-semibold">Bukti Pembayaran</h3>
                  <p className="text-[14px] text-[#777777] mt-1">Metode: <span className="text-[#1A73E8] font-medium">{selectedPayment.paymentMethod}</span></p>
                </div>
                {signedProofUrl && (
                  <a href={signedProofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-[#1A73E8] text-white px-4 py-2 text-sm hover:bg-[#155BB5] transition-colors">
                    <Icon icon="mdi:open-in-new" className="text-lg" /><span>Buka</span>
                  </a>
                )}
              </div>

              <div className="border border-[#ECECEC] rounded-xl overflow-hidden bg-[#F8F8F8] flex items-center justify-center min-h-[400px]">
                {!signedProofUrl ? (
                  <div className="text-[#777777] text-sm animate-pulse flex flex-col items-center">
                    <Icon icon="mdi:loading" className="animate-spin text-3xl mb-2" /> Memuat gambar...
                  </div>
                ) : (
                  <img src={signedProofUrl} alt="Payment Proof" className="w-full h-[520px] object-contain bg-white" />
                )}
              </div>

              {selectedPayment.status === "success" && (
                <div className="mt-6">
                  <label className="block text-sm text-[#2A2A2A] mb-2 font-medium">Alasan Penolakan (Opsional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Isi jika Anda ingin menolak..."
                    className="w-full border border-[#D8D7D7] rounded-xl p-3 min-h-[100px] resize-none outline-none focus:border-[#1A73E8]"
                  />
                  <div className="flex flex-col gap-3 mt-4">
                    <button onClick={() => setShowApprovePopup(true)} className="h-[48px] rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors">
                      Terima Pembayaran
                    </button>
                    <button onClick={() => setShowRejectPopup(true)} className="h-[48px] rounded-xl border border-red-600 text-red-600 font-semibold hover:bg-red-50 transition-colors">
                      Tolak Pembayaran
                    </button>
                  </div>
                </div>
              )}

              {selectedPayment.status === "verified" && (
                <div className="mt-6">
                  <p className="text-[12px] text-[#777777]">Tanggal Dikonfirmasi: <span className="text-[#2A2A2A] font-medium">{selectedPayment.verifiedAt}</span></p>
                  <div className="mt-4"><p className="font-semibold text-[16px] text-green-600 flex items-center gap-2"><Icon icon="mdi:check-circle" className="text-xl" /> Pembayaran Diterima</p></div>
                  <div className="mt-4">
                    <p className="text-[14px] text-[#777777]">Nominal diverifikasi:</p>
                    <p className="text-[24px] font-bold text-[#2A2A2A] mt-1">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                </div>
              )}

              {selectedPayment.status === "rejected" && (
                <div className="mt-6">
                  <p className="text-[12px] text-[#777777]">Tanggal Dikonfirmasi: <span className="text-[#2A2A2A] font-medium">{selectedPayment.verifiedAt}</span></p>
                  <div className="mt-4"><p className="font-semibold text-[16px] text-[#D04B33] flex items-center gap-2"><Icon icon="mdi:close-circle" className="text-xl" /> Pembayaran Ditolak</p></div>
                  <div className="mt-4">
                    <p className="text-[14px] text-[#777777]">Alasan Penolakan:</p>
                    <div className="mt-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] p-4 text-sm text-[#2A2A2A] font-medium leading-relaxed">{selectedPayment.notes || "-"}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 pb-5 border-t border-[#ECECEC]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
            itemName="pembayaran"
          />
        </div>
      )}

      <ConfirmPopup isOpen={showApprovePopup} title="Terima Pembayaran?" message="Apakah Anda yakin data transfer ini sudah benar dan masuk?" onCancel={() => setShowApprovePopup(false)} onConfirm={() => selectedPayment && handleUpdateStatus(selectedPayment.paymentId, "verified")} />
      <ConfirmPopup isOpen={showRejectPopup} title="Tolak Pembayaran?" message="Apakah Anda yakin ingin menolak? Pastikan Anda mengisi alasan penolakan." onCancel={() => setShowRejectPopup(false)} onConfirm={() => {
        if (!selectedPayment) return;
        if (!reason.trim()) { showToast("Alasan penolakan wajib diisi", "warning"); return; }
        handleUpdateStatus(selectedPayment.paymentId, "rejected", reason);
      }} />
      <Toast show={toast.show} type={toast.type as any} message={toast.message} />
    </div>
  );
}

export default function AdminPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat data...</div>}>
      <PaymentContent />
    </Suspense>
  );
}