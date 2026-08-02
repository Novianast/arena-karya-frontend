"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import FilterDropdown from "@/components/ui/FilterDropdown";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import UserListTable, { ColumnDef } from "@/components/admin/UserListTable";
import { supabase } from "@/lib/supabase";

// Enums
type EducationLevel = 'elementary_school' | 'middle_school' | 'high_school' | 'college';
type CountryEnum = 'indonesia' | 'overseas';

interface ParticipantEducation {
  institution_name: string;
  education_level: EducationLevel;
}

interface ParticipantData {
  participant_id: number;
  profile_id: string;
  country: CountryEnum;
  created_at: string;
  participant_education: ParticipantEducation | ParticipantEducation[] | null;
  username?: string; // from public_profiles
  institution_name?: string; // derived
  education_level?: EducationLevel; // derived
}

export default function ParticipantPage() {
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [countryFilter, setCountryFilter] = useState("");
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

  const fetchParticipants = async () => {
    setLoading(true);

    // Fetch participants with joined education data
    const { data: partData, error: partError } = await supabase
      .from('participants')
      .select(`
        participant_id,
        profile_id,
        country,
        created_at,
        participant_education (
          institution_name,
          education_level
        )
      `)
      .order('created_at', { ascending: false });

    if (partError) {
      console.error("Error fetching participants:", partError);
      showToast("Gagal memuat data peserta", "error");
      setLoading(false);
      return;
    }

    if (partData && partData.length > 0) {
      // Fetch public profiles for usernames
      const profileIds = partData.map(p => p.profile_id);
      const { data: profileData, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, username')
        .in('id', profileIds);

      if (profileError) {
        console.error("Error fetching public profiles:", profileError);
      } else {
        // Map usernames and flatten education data
        const profileMap = new Map(profileData?.map(p => [p.id, p.username]));
        const mergedData = partData.map(participant => {
          let instName = "-";
          let eduLevel: EducationLevel | undefined = undefined;

          if (participant.participant_education) {
            const eduData = Array.isArray(participant.participant_education)
              ? participant.participant_education[0]
              : participant.participant_education;

            if (eduData) {
              instName = eduData.institution_name;
              eduLevel = eduData.education_level;
            }
          }

          return {
            ...participant,
            username: profileMap.get(participant.profile_id) || "Tidak diketahui",
            institution_name: instName,
            education_level: eduLevel
          };
        });
        setParticipants(mergedData as ParticipantData[]);
        setLoading(false);
        return;
      }
    }

    setParticipants((partData || []) as ParticipantData[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const formatEducation = (education?: EducationLevel) => {
    switch (education) {
      case 'elementary_school': return 'SD/Sederajat';
      case 'middle_school': return 'SMP/Sederajat';
      case 'high_school': return 'SMA/SMK/Sederajat';
      case 'college': return 'Perguruan Tinggi';
      default: return '-';
    }
  };

  const formatCountry = (country: CountryEnum) => {
    return country === 'indonesia' ? 'Indonesia' : 'Luar Negeri';
  };

  // Filter and Pagination
  const filteredParticipants = participants.filter(part => {
    const searchLower = searchQuery.toLowerCase();

    const matchSearch = (part.username || "").toLowerCase().includes(searchLower) ||
      (part.institution_name || "").toLowerCase().includes(searchLower);

    const matchCountry = !countryFilter || part.country === countryFilter;
    const matchEducation = !educationFilter || part.education_level === educationFilter;

    return matchSearch && matchCountry && matchEducation;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  const sortOptions = [
    { label: "Terbaru", value: "desc" },
    { label: "Terlama", value: "asc" },
  ];

  const countryOptions = [
    { label: "Semua Negara", value: "" },
    { label: "Indonesia", value: "indonesia" },
    { label: "Luar Negeri", value: "overseas" },
  ];

  const educationOptions = [
    { label: "Semua Jenjang", value: "" },
    { label: "SD/Sederajat", value: "elementary_school" },
    { label: "SMP/Sederajat", value: "middle_school" },
    { label: "SMA/Sederajat", value: "high_school" },
    { label: "Perguruan Tinggi", value: "college" },
  ];

  const totalItems = filteredParticipants.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredParticipants.slice(startIndex, endIndex);

  const columns: ColumnDef<ParticipantData>[] = [
    {
      header: "No",
      render: (_, index) => <span className="font-medium text-gray-900">{startIndex + index + 1}</span>
    },
    {
      header: "Nama Peserta",
      render: (part) => <div className="font-semibold text-gray-900">{part.username}</div>
    },
    {
      header: "Nama Instansi",
      render: (part) => <div className="font-medium text-gray-700">{part.institution_name}</div>
    },
    {
      header: "Jenjang Pendidikan",
      render: (part) => <div className="text-gray-600">{formatEducation(part.education_level)}</div>
    },
    {
      header: "Negara Asal",
      render: (part) => <div className="text-gray-600">{formatCountry(part.country)}</div>
    },
    {
      header: "Tanggal Daftar",
      className: "text-gray-600 whitespace-nowrap",
      render: (part) => new Date(part.created_at).toLocaleDateString('id-ID', {
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
        icon={<User className="h-8 w-8" />}
        title="Peserta"
        subtitle="Lihat keseluruhan daftar akun Peserta"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Telusuri Nama Peserta atau Instansi..."
        customFilters={
          <>
            <FilterDropdown
              value={countryFilter}
              onChange={setCountryFilter}
              options={countryOptions}
              label={countryOptions.find(o => o.value === countryFilter)?.label || "Semua Negara"}
            />
            <FilterDropdown
              value={educationFilter}
              onChange={setEducationFilter}
              options={educationOptions}
              label={educationOptions.find(o => o.value === educationFilter)?.label || "Semua Jenjang"}
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
        keyExtractor={(part) => part.participant_id}
        loading={loading}
        emptyMessage="Tidak ada peserta yang ditemukan."
        titleIcon={<User className="w-5 h-5" />}
        titleText="Peserta"
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
          itemName="Akun Peserta"
        />
      )}
    </div>
  );
}
