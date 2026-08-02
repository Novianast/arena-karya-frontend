"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, Search, ShieldAlert, CheckCircle, Clock, XCircle, AlertTriangle, ChevronDown } from "lucide-react";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import FilterDropdown from "@/components/ui/FilterDropdown";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import UserListTable, { ColumnDef } from "@/components/admin/UserListTable";
import { supabase } from "@/lib/supabase";

// Enums
type OrganizerStatus = 'pending' | 'active' | 'inactive' | 'blocked';

interface OrganizerData {
  organizer_id: number;
  profile_id: string;
  organization_name: string;
  pic_name: string;
  pic_phone: string;
  status: OrganizerStatus;
  created_at: string;
  username?: string;
}

export default function OrganizerPage() {
  const [organizers, setOrganizers] = useState<OrganizerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Confirm Popup states
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  // Toast states
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchOrganizers = async () => {
    setLoading(true);

    // Fetch organizers
    const { data: orgData, error: orgError } = await supabase
      .from('organizers')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error("Error fetching organizers:", orgError);
      showToast("Gagal memuat data penyelenggara", "error");
      setLoading(false);
      return;
    }

    if (orgData && orgData.length > 0) {
      // Fetch public profiles for usernames
      const profileIds = orgData.map(org => org.profile_id);
      const { data: profileData, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, username')
        .in('id', profileIds);

      if (profileError) {
        console.error("Error fetching public profiles:", profileError);
      } else {
        // Map usernames to organizers
        const profileMap = new Map(profileData?.map(p => [p.id, p.username]));
        const mergedData = orgData.map(org => ({
          ...org,
          username: profileMap.get(org.profile_id) || "Tidak diketahui"
        }));
        setOrganizers(mergedData);
        setLoading(false);
        return;
      }
    }

    setOrganizers(orgData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const executeStatusChange = async (organizerId: number, newStatus: OrganizerStatus) => {
    const { error } = await supabase
      .from('organizers')
      .update({ status: newStatus })
      .eq('organizer_id', organizerId);

    if (error) {
      console.error("Error updating status:", error);
      showToast("Gagal mengubah status penyelenggara.", "error");
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      return;
    }

    // Update local state
    setOrganizers(organizers.map(org =>
      org.organizer_id === organizerId ? { ...org, status: newStatus } : org
    ));
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    showToast(`Status penyelenggara berhasil diubah menjadi ${newStatus}.`, "success");
  };

  const handleStatusChangeClick = (org: OrganizerData, newStatus: string) => {
    if (org.status === newStatus) return;

    const statusMap: Record<string, string> = {
      pending: "Menunggu",
      active: "Aktif",
      inactive: "Tidak Aktif",
      blocked: "Diblokir"
    };

    setConfirmConfig({
      isOpen: true,
      title: "Ubah Status Penyelenggara",
      message: `Apakah Anda yakin ingin mengubah status "${org.organization_name}" dari ${statusMap[org.status]} menjadi ${statusMap[newStatus]}?`,
      onConfirm: () => executeStatusChange(org.organizer_id, newStatus as OrganizerStatus)
    });
  };

  const getStatusBadge = (status: OrganizerStatus) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200"><CheckCircle className="w-3.5 h-3.5" /> Aktif</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200"><Clock className="w-3.5 h-3.5" /> Menunggu</span>;
      case 'inactive':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-200"><XCircle className="w-3.5 h-3.5" /> Tdk Aktif</span>;
      case 'blocked':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200"><ShieldAlert className="w-3.5 h-3.5" /> Diblokir</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // Filter and Pagination
  const filteredOrganizers = organizers.filter(org => {
    const matchSearch = org.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.pic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || org.status === statusFilter;
    
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const sortOptions = [
    { label: "Terbaru", value: "desc" },
    { label: "Terlama", value: "asc" },
  ];

  const statusOptions = [
    { label: "Semua Status", value: "" },
    { label: "Aktif", value: "active" },
    { label: "Menunggu", value: "pending" },
    { label: "Tidak Aktif", value: "inactive" },
    { label: "Diblokir", value: "blocked" },
  ];

  const totalItems = filteredOrganizers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredOrganizers.slice(startIndex, endIndex);

  return (
    <div>
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <ConfirmPopup
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
      />

      <DashboardBannerHeader
        icon={<Briefcase className="h-8 w-8" />}
        title="Penyelenggara"
        subtitle="Lihat dan kelola seluruh akun Penyelenggara"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Telusuri Organisasi, PIC, atau Username..."
        customFilters={
          <>
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              label={statusOptions.find(o => o.value === statusFilter)?.label || "Semua Status"}
            />
            <FilterDropdown 
              value={sortOrder} 
              onChange={(val) => setSortOrder(val as any)} 
              options={sortOptions} 
              label={sortOrder === "desc" ? "Terbaru" : "Terlama"} 
            />
          </>
        }
      />

      <UserListTable
        data={currentData}
        columns={[
          {
            header: "No",
            render: (_, index) => <span className="font-medium text-gray-900">{startIndex + index + 1}</span>
          },
          {
            header: "Nama Penyelenggara",
            render: (org) => <div className="font-semibold text-gray-900">{org.username}</div>
          },
          {
            header: "Nama Organisasi",
            render: (org) => <div className="font-medium text-gray-700">{org.organization_name}</div>
          },
          {
            header: "Nama PIC",
            key: "pic_name",
            className: "text-gray-600"
          },
          {
            header: "Nomor PIC",
            key: "pic_phone",
            className: "text-gray-600"
          },
          {
            header: "Tanggal Daftar",
            className: "text-gray-600 whitespace-nowrap",
            render: (org) => new Date(org.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          },
          {
            header: "Status",
            render: (org) => (
              <div className="relative inline-block w-[130px]">
                <select
                  value={org.status}
                  onChange={(e) => handleStatusChangeClick(org, e.target.value)}
                  className={`w-full text-xs font-semibold rounded-lg pl-3 pr-8 py-2 border outline-none cursor-pointer appearance-none transition-colors
                    ${org.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                      org.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100' :
                        org.status === 'inactive' ? 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' :
                          'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }
                  `}
                >
                  <option value="pending" className="bg-white text-gray-900 font-medium">Menunggu</option>
                  <option value="active" className="bg-white text-gray-900 font-medium">Aktif</option>
                  <option value="inactive" className="bg-white text-gray-900 font-medium">Tidak Aktif</option>
                  <option value="blocked" className="bg-white text-gray-900 font-medium">Diblokir</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            )
          }
        ]}
        keyExtractor={(org) => org.organizer_id}
        loading={loading}
        emptyMessage="Tidak ada penyelenggara yang ditemukan."
        titleIcon={<Briefcase className="w-5 h-5" />}
        titleText="Penyelenggara"
        totalItems={totalItems}
      />



      {totalPages > 1 && (
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
          itemName="Akun Penyelenggara"
        />
      )}
    </div>
  );
}
