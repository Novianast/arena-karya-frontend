"use client";

import React, { useState, useEffect } from "react";
import { Gavel } from "lucide-react";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import FilterDropdown from "@/components/ui/FilterDropdown";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import UserListTable, { ColumnDef } from "@/components/admin/UserListTable";
import { supabase } from "@/lib/supabase";

// Enums
type JudgeLastEducation = 'diploma' | 'bachelor' | 'master' | 'phd';

interface JudgeData {
  judge_id: number;
  profile_id: string;
  speciality: string;
  last_education: JudgeLastEducation;
  institution: string;
  prefix: string | null;
  suffix: string | null;
  created_at: string;
  username?: string; // from public_profiles
}

export default function JudgePage() {
  const [judges, setJudges] = useState<JudgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [educationFilter, setEducationFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const fetchJudges = async () => {
    setLoading(true);

    // Fetch judges with specific columns only
    const { data: judgeData, error: judgeError } = await supabase
      .from('judges')
      .select('judge_id, profile_id, institution, speciality, last_education, created_at, prefix, suffix')
      .order('created_at', { ascending: false });

    if (judgeError) {
      console.error("Error fetching judges:", judgeError);
      showToast("Gagal memuat data juri", "error");
      setLoading(false);
      return;
    }

    if (judgeData && judgeData.length > 0) {
      // Fetch public profiles for usernames
      const profileIds = judgeData.map(j => j.profile_id);
      const { data: profileData, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, username')
        .in('id', profileIds);

      if (profileError) {
        console.error("Error fetching public profiles:", profileError);
      } else {
        // Map usernames to judges
        const profileMap = new Map(profileData?.map(p => [p.id, p.username]));
        const mergedData = judgeData.map(judge => ({
          ...judge,
          username: profileMap.get(judge.profile_id) || "Tidak diketahui"
        }));
        setJudges(mergedData);
        setLoading(false);
        return;
      }
    }

    setJudges(judgeData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJudges();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const formatJudgeName = (judge: JudgeData) => {
    const prefix = judge.prefix ? `${judge.prefix} ` : "";
    const suffix = judge.suffix ? `, ${judge.suffix}` : "";
    return `${prefix}${judge.username}${suffix}`;
  };

  const formatEducation = (education: JudgeLastEducation) => {
    switch (education) {
      case 'diploma': return 'Diploma (D3/D4)';
      case 'bachelor': return 'Sarjana (S1)';
      case 'master': return 'Magister (S2)';
      case 'phd': return 'Doktoral (S3)';
      default: return education;
    }
  };

  // Filter and Pagination
  const filteredJudges = judges.filter(judge => {
    const fullName = formatJudgeName(judge).toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchSearch = fullName.includes(searchLower) ||
      judge.institution.toLowerCase().includes(searchLower) ||
      judge.speciality.toLowerCase().includes(searchLower);

    const matchEducation = !educationFilter || judge.last_education === educationFilter;

    return matchSearch && matchEducation;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const sortOptions = [
    { label: "Terbaru", value: "desc" },
    { label: "Terlama", value: "asc" },
  ];

  const educationOptions = [
    { label: "Semua Pendidikan", value: "" },
    { label: "Diploma (D3/D4)", value: "diploma" },
    { label: "Sarjana (S1)", value: "bachelor" },
    { label: "Magister (S2)", value: "master" },
    { label: "Doktoral (S3)", value: "phd" },
  ];

  const totalItems = filteredJudges.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredJudges.slice(startIndex, endIndex);

  const columns: ColumnDef<JudgeData>[] = [
    {
      header: "No",
      render: (_, index) => <span className="font-medium text-gray-900">{startIndex + index + 1}</span>
    },
    {
      header: "Nama Juri",
      render: (judge) => <div className="font-semibold text-gray-900">{formatJudgeName(judge)}</div>
    },
    {
      header: "Nama Instansi",
      render: (judge) => <div className="font-medium text-gray-700">{judge.institution}</div>
    },
    {
      header: "Spesialis",
      key: "speciality",
      className: "text-gray-600"
    },
    {
      header: "Pendidikan Terakhir",
      render: (judge) => <div className="text-gray-600">{formatEducation(judge.last_education)}</div>
    },
    {
      header: "Tanggal Daftar",
      className: "text-gray-600 whitespace-nowrap",
      render: (judge) => new Date(judge.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
  ];

  return (
    <div>
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <DashboardBannerHeader
        icon={<Gavel className="h-8 w-8" />}
        title="Juri"
        subtitle="Lihat keseluruhan daftar akun Juri"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Telusuri Juri, Instansi, atau Spesialis..."
        customFilters={
          <>
            <FilterDropdown
              value={educationFilter}
              onChange={setEducationFilter}
              options={educationOptions}
              label={educationOptions.find(o => o.value === educationFilter)?.label || "Semua Pendidikan"}
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
        columns={columns}
        keyExtractor={(judge) => judge.judge_id}
        loading={loading}
        emptyMessage="Tidak ada juri yang ditemukan."
        titleIcon={<Gavel className="w-5 h-5" />}
        titleText="Juri"
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
          itemName="Akun Juri"
        />
      )}
    </div>
  );
}
