"use client";

import React, {
  useEffect,
  useState,
  useRef
} from "react";
import {
  Camera,
  ChevronDown,
  Info,
  Save,
  School,
  Search,
  User,
  UserRound,
  Loader2,
  XCircle,
  Pencil,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import Toast from "@/components/ui/Toast";
import BannerHeader from '@/components/ui/DashboardBannerHeader';

// Interface untuk Emsifa API
interface Region {
  id: string;
  name: string;
  npsn?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  alamat_jalan?: string;
}

// Interface untuk API Sekolah
interface School {
  id: string;
  sekolah: string;
}

export default function ParticipantProfilePage() {

  /* ========================================
     POPUP & TOAST
  ======================================== */
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  /* ========================================
     STATE MODE
  ======================================== */
  const [isEditing, setIsEditing] = useState(false);

  /* ========================================
     PROFILE (INFORMASI PRIBADI)
  ======================================== */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("/images/default-avatar.png");
  const [uploading, setUploading] = useState(false);
  const [currentImageName, setCurrentImageName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [country, setCountry] = useState("indonesia");
  const [personalAddress, setPersonalAddress] = useState("");
  
  /* ========================================
     EDUCATION (DETAIL PENDIDIKAN)
  ======================================== */
  const [jenjang, setJenjang] = useState("high_school");

  // Wilayah Pendidikan
  const [eduProvId, setEduProvId] = useState("");
  const [eduProvName, setEduProvName] = useState("");
  const [eduRegId, setEduRegId] = useState("");
  const [eduRegName, setEduRegName] = useState("");
  const [eduDisId, setEduDisId] = useState("");
  const [eduDisName, setEduDisName] = useState("");

  const [instansi, setInstansi] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");

  const [eduRegencies, setEduRegencies] = useState<Region[]>([]);
  const [eduDistricts, setEduDistricts] = useState<Region[]>([]);
  const [apiSchools, setApiSchools] = useState<Region[]>([]);
  const [districtSchools, setDistrictSchools] = useState<Region[]>([]);

  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const educationLevels = country === "indonesia"
    ? [
      { id: "elementary_school", name: "SD/MI" },
      { id: "middle_school", name: "SMP/MTs" },
      { id: "high_school", name: "SMA/SMK/MA" },
      { id: "college", name: "Perguruan Tinggi" }
    ]
    : [
      { id: "elementary_school", name: "Elementary School" },
      { id: "middle_school", name: "Middle School" },
      { id: "high_school", name: "High School" },
      { id: "college", name: "College / University" }
    ];

  const countries = [{ id: "indonesia", name: "Indonesia" }, { id: "overseas", name: "Luar Negeri" }];
  
  /* ========================================
     STATE API WILAYAH (GLOBAL)
  ======================================== */
  const [apiProvinces, setApiProvinces] = useState<Region[]>([]);
  
  /* ========================================
     FETCH DATA WILAYAH
  ======================================== */
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setApiProvinces(data))
      .catch((err) => console.error("Gagal load provinsi:", err));
  }, []);

  useEffect(() => {
    if (!eduProvId) {
      setEduRegencies([]);
      return;
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${eduProvId}.json`)
      .then((res) => res.json())
      .then((data) => setEduRegencies(data));
  }, [eduProvId]);

  useEffect(() => {
    if (!eduRegId) {
      setEduDistricts([]);
      return;
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${eduRegId}.json`)
      .then((res) => res.json())
      .then((data) => setEduDistricts(data));
  }, [eduRegId]);

  const handleEducationLevelChange = (lvl: string) => {
    setJenjang(lvl);
    setInstansi("");
    setSchoolAddress("");
    setEduProvId("");
    setEduProvName("");
    setEduRegId("");
    setEduRegName("");
    setEduDisId("");
    setEduDisName(lvl === "college" ? "Tidak Diisi" : "");
    setDistrictSchools([]);
    setApiSchools([]);
  };

  const resolveEmsifaIds = async (provName: string, regName: string, distName: string) => {
    if (!provName || !provName.trim()) return;
    try {
      if (!apiProvinces || apiProvinces.length === 0) return;

      const cleanProv = provName.toUpperCase().replace(/^PROV\.\s+/i, "").trim();
      if (!cleanProv) return;
      const foundProv = apiProvinces.find(p => {
        const pName = p.name.toUpperCase().replace(/^PROVINSI\s+/g, "").trim();
        return pName.includes(cleanProv) || cleanProv.includes(pName);
      });

      if (!foundProv) return;
      setEduProvId(foundProv.id);
      setEduProvName(foundProv.name);

      const regRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${foundProv.id}.json`);
      if (!regRes.ok) return;
      const regencies = await regRes.json();
      setEduRegencies(regencies);

      const regNameUpper = regName.toUpperCase();
      const isInputKota = regNameUpper.includes("KOTA");
      const isInputKab = regNameUpper.includes("KAB") || regNameUpper.includes("KABUPATEN");
      const cleanReg = regNameUpper.replace(/^(KAB\.|KABUPATEN|KOTA)\s+/i, "").trim();

      let foundReg = regencies.find((r: any) => {
        const rNameUpper = r.name.toUpperCase();
        const isTargetKota = rNameUpper.includes("KOTA");
        const isTargetKab = rNameUpper.includes("KAB") || rNameUpper.includes("KABUPATEN");
        const rName = rNameUpper.replace(/^(KAB\.|KABUPATEN|KOTA)\s+/g, "").trim();
        const baseMatches = rName.includes(cleanReg) || cleanReg.includes(rName);
        if (!baseMatches) return false;
        if (isInputKota && !isTargetKota) return false;
        if (isInputKab && !isTargetKab) return false;
        return true;
      });

      if (!foundReg) {
        foundReg = regencies.find((r: any) => {
          const rName = r.name.toUpperCase().replace(/^(KAB\.|KABUPATEN|KOTA)\s+/g, "").trim();
          return rName.includes(cleanReg) || cleanReg.includes(rName);
        });
      }

      if (!foundReg) {
        setEduRegId("");
        setEduRegName(regName);
        setEduDisId("");
        setEduDisName(distName);
        return;
      }
      setEduRegId(foundReg.id);
      setEduRegName(foundReg.name);

      const distRes = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${foundReg.id}.json`);
      if (!distRes.ok) return;
      const districts = await distRes.json();
      setEduDistricts(districts);

      if (distName && distName !== "Tidak Diisi") {
        const cleanDist = distName.toUpperCase().replace(/^KEC\.\s+/i, "").trim();
        const foundDist = districts.find((d: any) => {
          const dName = d.name.toUpperCase().replace(/^KECAMATAN\s+/g, "").trim();
          return dName.includes(cleanDist) || cleanDist.includes(dName);
        });

        if (foundDist) {
          setEduDisId(foundDist.id);
          setEduDisName(foundDist.name);
        } else {
          setEduDisId("");
          setEduDisName(distName);
        }
      } else {
        setEduDisId("");
        setEduDisName(jenjang === "college" ? "Tidak Diisi" : "");
      }
    } catch (e) {
      console.error("Error resolving Emsifa IDs:", e);
    }
  };

  const fetchSchoolByNpsn = async (npsn: string) => {
    try {
      const res = await fetch(`/api/sekolah?npsn=${npsn}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          const sch = result.data[0];
          return {
            nama: sch.nama,
            npsn: sch.npsn,
            namaProvinsi: sch.alamat?.nama_provinsi || "",
            namaKabupaten: sch.alamat?.nama_kabupaten || "",
            namaKecamatan: sch.alamat?.nama_kecamatan || "",
            alamatJalan: sch.alamat?.jalan || ""
          };
        }
      }
    } catch (e) {
      console.error("Error fetching school by NPSN:", e);
    }
    return null;
  };

  const fetchSchools = async (term: string) => {
    if (!term.trim()) {
      setApiSchools(districtSchools);
      return;
    }
    setIsLoadingSchools(true);
    try {
      let forms: string[] = [];
      if (jenjang === "elementary_school") {
        forms = ["SD", "MI"];
      } else if (jenjang === "middle_school") {
        forms = ["SMP", "MTS"];
      } else if (jenjang === "high_school") {
        forms = ["SMA", "SMK", "MA"];
      }

      const rawRegencyId = eduDisId ? eduDisId.substring(0, 4) : "";
      const regencyId = rawRegencyId === "3171" ? "3174" : // South Jakarta
        rawRegencyId === "3172" ? "3175" : // East Jakarta
          rawRegencyId === "3173" ? "3171" : // Central Jakarta
            rawRegencyId === "3174" ? "3173" : // West Jakarta
              rawRegencyId === "3175" ? "3172" : // North Jakarta
                rawRegencyId;
      let query = `nama=${encodeURIComponent(term)}`;
      if (regencyId) {
        query += `&kode_wilayah=${regencyId}`;
      }
      if (eduDisName && eduDisName !== "Tidak Diisi") {
        query += `&kecamatan=${encodeURIComponent(eduDisName)}`;
      }

      let allSchools: any[] = [];
      if (jenjang === "college") {
        let collegeQuery = `nama=${encodeURIComponent(term)}&limit=50`;
        if (eduProvName && eduProvName !== "Tidak Diisi") {
          collegeQuery += `&provinsi=${encodeURIComponent(eduProvName)}`;
        }
        if (eduRegName && eduRegName !== "Tidak Diisi") {
          collegeQuery += `&kabupaten=${encodeURIComponent(eduRegName)}`;
        }
        const res = await fetch(`/api/universitas?${collegeQuery}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            allSchools = result.data;
          }
        }
      } else if (forms.length > 0) {
        for (const form of forms) {
          const res = await fetch(`/api/sekolah?${query}&bentuk_pendidikan=${form}&limit=50`);
          if (res.ok) {
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
              allSchools = allSchools.concat(result.data);
            }
          }
        }
      } else {
        const res = await fetch(`/api/sekolah?${query}&limit=50`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            allSchools = result.data;
          }
        }
      }

      const options = allSchools.map((sch: any) => ({
        id: sch.npsn || String(sch.id || Math.random()),
        name: sch.nm_singkat ? `${sch.nama} (${sch.nm_singkat})` : sch.nama,
        npsn: sch.npsn || null,
        provinsi: sch.alamat?.nama_provinsi || sch.provinsi || "",
        kabupaten: sch.alamat?.nama_kabupaten || sch.kabupaten || "",
        kecamatan: sch.alamat?.nama_kecamatan || sch.kecamatan || "",
        alamat_jalan: sch.alamat?.jalan || sch.alamat_jalan || "",
      }));

      const uniqueOptions = options.filter(
        (value, index, self) =>
          self.findIndex((t) => t.name === value.name) === index
      );

      setApiSchools(uniqueOptions);
    } catch (err) {
      console.error("Error fetching schools:", err);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const handleSchoolSearch = (term: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!term.trim()) {
      setApiSchools(districtSchools);
      return;
    }

    if (/^\d{8}$/.test(term.trim())) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsLoadingSchools(true);
        const sch = await fetchSchoolByNpsn(term.trim());
        if (sch) {
          setInstansi(sch.nama);
          setEduProvName(sch.namaProvinsi);
          setEduRegName(sch.namaKabupaten);
          setEduDisName(sch.namaKecamatan);
          setSchoolAddress(sch.alamatJalan || "");

          const upperName = sch.nama.toUpperCase();
          let targetJenjang = jenjang;
          if (upperName.startsWith("SD") || upperName.startsWith("MI")) {
            targetJenjang = "elementary_school";
          } else if (upperName.startsWith("SMP") || upperName.startsWith("MTS")) {
            targetJenjang = "middle_school";
          } else if (upperName.startsWith("SMA") || upperName.startsWith("SMK") || upperName.startsWith("MA")) {
            targetJenjang = "high_school";
          } else if (upperName.includes("UNIVERSITAS") || upperName.includes("INSTITUT") || upperName.includes("POLITEKNIK") || upperName.includes("STIE") || upperName.includes("STKIP") || upperName.includes("COLLEGE") || upperName.includes("AKADEMI")) {
            targetJenjang = "college";
          }
          setJenjang(targetJenjang);

          resolveEmsifaIds(sch.namaProvinsi, sch.namaKabupaten, sch.namaKecamatan);

          const option = {
            id: sch.npsn || term.trim(),
            name: sch.nama,
            npsn: sch.npsn,
            provinsi: sch.namaProvinsi,
            kabupaten: sch.namaKabupaten,
            kecamatan: sch.namaKecamatan,
            alamat_jalan: sch.alamatJalan
          };
          setApiSchools([option]);
          setDistrictSchools([option]);
          showToast("Sekolah ditemukan & data otomatis terisi!", "success");
        } else {
          showToast("Sekolah dengan NPSN tersebut tidak ditemukan", "error");
        }
        setIsLoadingSchools(false);
      }, 500);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSchools(term);
    }, 500);
  };

  const loadSchoolsForRegion = async (districtId: string) => {
    if (jenjang !== "college" && !districtId) {
      setApiSchools([]);
      setDistrictSchools([]);
      return;
    }
    setIsLoadingSchools(true);
    try {
      let forms: string[] = [];
      if (jenjang === "elementary_school") {
        forms = ["SD", "MI"];
      } else if (jenjang === "middle_school") {
        forms = ["SMP", "MTS"];
      } else if (jenjang === "high_school") {
        forms = ["SMA", "SMK", "MA"];
      } else if (jenjang === "college") {
        const query = `provinsi=${encodeURIComponent(eduProvName)}&kabupaten=${encodeURIComponent(eduRegName)}&limit=100`;
        const res = await fetch(`/api/universitas?${query}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            const options = result.data.map((univ: any) => ({
              id: univ.id || String(Math.random()),
              name: univ.nm_singkat ? `${univ.nama} (${univ.nm_singkat})` : univ.nama,
              npsn: null,
              provinsi: univ.provinsi,
              kabupaten: univ.kabupaten,
              kecamatan: univ.kecamatan,
              alamat_jalan: univ.alamat_jalan,
            }));
            const uniqueOptions = options.filter(
              (value: any, index: number, self: any[]) =>
                self.findIndex((t: any) => t.name === value.name) === index
            );
            setDistrictSchools(uniqueOptions);
            setApiSchools(uniqueOptions);
          }
        }
        setIsLoadingSchools(false);
        return;
      } else {
        setApiSchools([]);
        setDistrictSchools([]);
        setIsLoadingSchools(false);
        return;
      }

      const rawRegencyId = districtId.substring(0, 4);
      const regencyId = rawRegencyId === "3171" ? "3174" : // South Jakarta
        rawRegencyId === "3172" ? "3175" : // East Jakarta
          rawRegencyId === "3173" ? "3171" : // Central Jakarta
            rawRegencyId === "3174" ? "3173" : // West Jakarta
              rawRegencyId === "3175" ? "3172" : // North Jakarta
                rawRegencyId;
      let allSchools: any[] = [];
      for (const form of forms) {
        let url = `/api/sekolah?kode_wilayah=${regencyId}&bentuk_pendidikan=${form}&limit=100`;
        if (eduDisName && eduDisName !== "Tidak Diisi") {
          url += `&kecamatan=${encodeURIComponent(eduDisName)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            allSchools = allSchools.concat(result.data);
          }
        }
      }

      const options = allSchools.map((sch: any) => ({
        id: sch.npsn || String(sch.id || Math.random()),
        name: sch.nama,
        npsn: sch.npsn,
        provinsi: sch.alamat?.nama_provinsi || sch.provinsi || "",
        kabupaten: sch.alamat?.nama_kabupaten || sch.kabupaten || "",
        kecamatan: sch.alamat?.nama_kecamatan || sch.kecamatan || "",
        alamat_jalan: sch.alamat?.jalan || sch.alamat_jalan || "",
      }));

      const uniqueOptions = options.filter(
        (value, index, self) =>
          self.findIndex((t) => t.name === value.name) === index
      );

      setDistrictSchools(uniqueOptions);
      setApiSchools(uniqueOptions);
    } catch (err) {
      console.error("Error loading schools for region:", err);
      setDistrictSchools([]);
      setApiSchools([]);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  useEffect(() => {
    if (country === "indonesia" && jenjang && (jenjang === "college" || eduDisId)) {
      loadSchoolsForRegion(eduDisId);
    } else {
      setDistrictSchools([]);
      setApiSchools([]);
    }
  }, [eduDisId, eduRegId, jenjang, country, eduDisName, eduProvName, eduRegName]);

  useEffect(() => {
    if (apiProvinces.length > 0 && eduProvName && !eduProvId) {
      const prov = apiProvinces.find((p) => p.name === eduProvName);
      if (prov) setEduProvId(prov.id);
    }
  }, [apiProvinces, eduProvName, eduProvId]);

  useEffect(() => {
    if (eduRegencies.length > 0 && eduRegName && !eduRegId) {
      const reg = eduRegencies.find((r) => r.name === eduRegName);
      if (reg) setEduRegId(reg.id);
    }
  }, [eduRegencies, eduRegName, eduRegId]);

  useEffect(() => {
    if (eduDistricts.length > 0 && eduDisName && !eduDisId) {
      const dis = eduDistricts.find((d) => d.name === eduDisName);
      if (dis) setEduDisId(dis.id);
    }
  }, [eduDistricts, eduDisName, eduDisId]);
  
  /* ========================================
     FETCH PROFILE
  ======================================== */
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      /* PROFILE */
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.username || "");
        setEmail(user.email || "");
        setPhone(profile.phone || "");
        if (profile.profile_image) {
          setCurrentImageName(profile.profile_image);
          const { data } = supabase.storage.from("profiles").getPublicUrl(`participants/${profile.profile_image}`);
          setProfileImage(data.publicUrl);
        } else {
          setProfileImage("/images/default-avatar.png");
        }
      }

      /* PARTICIPANT */
      const { data: participant } = await supabase.from("participants").select("*").eq("profile_id", user.id).single();
      if (participant) {
        setBirthDate(participant.birth_date || "");
        setCountry(participant.country || "indonesia");
        setPersonalAddress(participant.address || "");

        /* EDUCATION */
        const { data: education } = await supabase.from("participant_education").select("*").eq("participant_id", participant.participant_id).single();
        if (education) {
          setJenjang(education.education_level || "high_school");
          setEduProvName(education.province || "");
          setEduRegName(education.regency || "");
          setEduDisName(education.district || "");
          setInstansi(education.institution_name || "");
          setSchoolAddress(education.school_address || "");
          setSupervisorName(education.supervisor_name || "");
          setSupervisorPhone(education.supervisor_phone || "");
        }
      }
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      showToast(error?.message || "Terjadi kesalahan!", "error");
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }
  
  /* ========================================
     SAVE & DISCARD
  ======================================== */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 3MB", "error");
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleValidateAndConfirm = () => {
    if (!fullName.trim()) return showToast("Nama Lengkap tidak boleh kosong!", "error");
    if (!birthDate.trim()) return showToast("Tanggal Lahir tidak boleh kosong!", "error");
    if (!jenjang.trim()) return showToast("Tingkat Pendidikan tidak boleh kosong!", "error");
    if (!country.trim()) return showToast("Negara Asal tidak boleh kosong!", "error");
    if (!eduProvName.trim()) return showToast("Provinsi Instansi tidak boleh kosong!", "error");
    if (!eduRegName.trim()) return showToast("Kabupaten/Kota Instansi tidak boleh kosong!", "error");
    if (jenjang !== "college" && !eduDisName.trim()) return showToast("Kecamatan Instansi tidak boleh kosong!", "error");
    if (!instansi.trim()) return showToast(jenjang === "college" ? "Nama Perguruan Tinggi tidak boleh kosong!" : "Nama Sekolah tidak boleh kosong!", "error");
    setConfirmDialog({
      isOpen: true,
      title: "Simpan Perubahan Profil?",
      message: "Apakah anda yakin ingin mengubah Profile anda?",
      onConfirm: handleConfirm
    });
  };

  const handleConfirm = async () => {
    try {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalProfileImage = currentImageName;
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("profiles").upload(`participants/${fileName}`, selectedFile);
        if (uploadError) throw uploadError;

        finalProfileImage = fileName;
        if (currentImageName) await supabase.storage.from("profiles").remove([`participants/${currentImageName}`]);

        setCurrentImageName(fileName);
        const { data } = supabase.storage.from("profiles").getPublicUrl(`participants/${fileName}`);
        setProfileImage(data.publicUrl);
      }

      await supabase.from("profiles").update({
        username: fullName,
        phone: phone,
        profile_image: finalProfileImage,
      }).eq("id", user.id);

      const { data: participant } = await supabase.from("participants").select("*").eq("profile_id", user.id).single();
      if (participant) {
        await supabase.from("participants").update({
          address: personalAddress,
          birth_date: birthDate,
          country: country,
        }).eq("participant_id", participant.participant_id);

        await supabase.from("participant_education").update({
          education_level: jenjang,
          province: eduProvName,
          regency: eduRegName,
          district: eduDisName,
          institution_name: instansi,
          school_address: schoolAddress,
          supervisor_name: supervisorName,
          supervisor_phone: supervisorPhone,
        }).eq("participant_id", participant.participant_id);
      }

      setPreviewImage(null);
      setSelectedFile(null);
      setIsEditing(false); // Selesai edit, kembali ke View Mode
      showToast("Profil berhasil diupdate!", "success");
      
      fetchProfile();
    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan!", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDiscardChanges = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setIsEditing(false);
    fetchProfile(); // Reset data
  };

  // Helper untuk View Mode
  const countryName = countries.find(r => r.id === country)?.name || country;
  const educationLevelName = educationLevels.find(lvl => lvl.id === jenjang)?.name || jenjang;

  return (
    <div className="min-h-screen bg-white">
      {/* --- BANNER HEADER --- */}
      <BannerHeader
        icon={<User className="h-6 w-6 text-white" />}
        title={isEditing ? "Edit Profile" : "Profile"}
        subtitle={isEditing ? "Edit Profile dan Data Diri anda" : "Kelola Profile dan Data diri anda"}
        showSearchFilter={false}
      />

      {/* CARD */}
      <div className="rounded-md border border-gray-200 bg-white px-16 py-10 shadow-sm">
        {/* FOTO */}
        <div className="flex items-center gap-16">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-300">
              <img src={previewImage || profileImage || "/images/default-avatar.png"} alt="Profile" className="h-full w-full object-cover" />
            </div>
            {previewImage && (
              <button
                onClick={() => { setPreviewImage(null); setSelectedFile(null); }}
                className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <X className="text-s" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <label className="flex h-10 w-max px-4 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#1F7AEE] text-sm text-white hover:bg-blue-600 transition-colors">
              <Camera size={24} />
              {previewImage ? "Ganti Foto Preview" : "Unggah Foto Profile Baru"}
              <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleFileSelect} />
            </label>
            <p className="mt-2 text-sm text-gray-600">
              Disarankan foto Berukuran <b>800 x 800</b> dengan format <b>.PNG, .JPEG, .JPG</b> - maks. <b>3 MB</b>
            </p>
          </div>
        </div>

        <hr className="my-10 border-gray-300" />

        {/* INFORMASI PRIBADI */}
        <section>
          <div className="mb-6">
            <div className="flex items-center gap-1 text-s font-bold">
              <Info size={20} /> Informasi Pribadi
            </div>
            <p className="text-[13px] text-gray-500 font-medium font-sans">
              Data Diri diisi untuk Kepentingan Administrasi dan Perlombaan
            </p>
          </div>

          <div className="rounded-md border border-gray-300 p-6 bg-white">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Nama Lengkap" value={fullName} onChange={setFullName} placeholder="Masukkan nama lengkap" />
                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="text"
                    value={email}
                    disabled
                    className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] outline-none bg-gray-100 text-gray-400 cursor-not-allowed font-sans"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Email tidak bisa dirubah</p>
                </div>
                <Field label="Nomor Telepon" value={phone} onChange={setPhone} placeholder="Masukkan nomor telepon" />
                <DateField label="Tanggal Lahir" value={birthDate} onChange={setBirthDate} />
                <SearchableSelect
                  label="Negara Asal"
                  placeholder="Pilih Negara Asal..."
                  options={countries}
                  value={countryName}
                  onChange={(id) => setCountry(id)}
                />
                <div className="md:col-span-2">
                  <Field label="Alamat Lengkap" value={personalAddress} onChange={setPersonalAddress} as="textarea" placeholder="Masukkan alamat domisili" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ViewField label="Nomor Telepon" value={phone} />
                <ViewField label="Tanggal Lahir" value={birthDate} />
                <ViewField label="Negara Asal" value={countryName} colSpan />
                <ViewField label="Alamat Lengkap" value={personalAddress} colSpan />
              </div>
            )}
          </div>
        </section>

        {/* DETAIL PENDIDIKAN */}
        <section className="mt-12">
          <div className="mb-6">
            <div className="flex items-center gap-1 text-s font-bold">
              <School size={20} /> Detail Pendidikan
            </div>
            <p className="text-[13px] text-gray-500 font-medium font-sans">
              Data Pendidikan bisa diisi dengan pendidikan Anda
            </p>
          </div>

          <div className="rounded-md border border-gray-300 px-6 py-8 grid grid-cols-2 gap-8">
            {country === "indonesia" ? (
              <>
                <SearchableSelect
                  label="Tingkat Pendidikan"
                  placeholder="Pilih Jenjang pendidikan..."
                  options={educationLevels}
                  value={educationLevels.find(lvl => lvl.id === jenjang)?.name || ""}
                  onChange={(id, name) => handleEducationLevelChange(id)}
                />


                <SearchableSelect
                  label="Provinsi"
                  placeholder="Cari Provinsi..."
                  options={apiProvinces}
                  value={eduProvName}
                  onChange={(id, name) => {
                    setEduProvId(id);
                    setEduProvName(name);
                    setEduRegId("");
                    setEduRegName("");
                    setEduDisId("");
                    setEduDisName(jenjang === "college" ? "Tidak Diisi" : "");
                    setInstansi("");
                  }}
                />
                <SearchableSelect
                  label="Kabupaten/Kota"
                  placeholder="Cari Kabupaten/Kota..."
                  options={eduRegencies}
                  value={eduRegName}
                  disabled={!eduProvName}
                  onChange={(id, name) => {
                    setEduRegId(id);
                    setEduRegName(name);
                    setEduDisId("");
                    setEduDisName(jenjang === "college" ? "Tidak Diisi" : "");
                    setInstansi("");
                  }}
                />
                <SearchableSelect
                  label="Kecamatan"
                  placeholder={jenjang === "college" ? "Tidak Diisi" : "Cari Kecamatan..."}
                  options={jenjang === "college" ? [{ id: "Tidak Diisi", name: "Tidak Diisi" }] : eduDistricts}
                  value={jenjang === "college" ? (eduDisName || "Tidak Diisi") : eduDisName}
                  disabled={jenjang === "college" || !eduRegName}
                  onChange={(id, name) => {
                    setEduDisId(id);
                    setEduDisName(name);
                    setInstansi("");
                  }}
                />
                <SearchableSelect
                  label={jenjang === "college" ? "Nama Perguruan Tinggi" : "Nama Sekolah"}
                  placeholder={jenjang === "college" ? "Cari atau ketik nama perguruan tinggi..." : "Cari atau ketik nama sekolah..."}
                  options={apiSchools}
                  value={instansi}
                  allowManual={true}
                  disabled={jenjang === "college" ? !country : !eduDisName}
                  isLoading={isLoadingSchools}
                  onChange={(id, name) => {
                    setInstansi(name);
                    const selected = apiSchools.find(s => s.id === id);
                    if (selected) {
                      if (selected.alamat_jalan) setSchoolAddress(selected.alamat_jalan);
                      resolveEmsifaIds(
                        selected.provinsi || "",
                        selected.kabupaten || "",
                        selected.kecamatan || ""
                      );
                    }
                  }}
                  onSearchChange={handleSchoolSearch}
                />
                <div className="col-span-2">
                  <Field label={jenjang === "college" ? "Alamat Lengkap Perguruan Tinggi" : "Alamat Lengkap Sekolah"} value={schoolAddress} onChange={setSchoolAddress} as="textarea" placeholder={jenjang === "college" ? "Masukkan alamat perguruan tinggi" : "Masukkan alamat sekolah"} />
                </div>
              </>
            ) : (
              <>
                <SearchableSelect
                  label="Education Level"
                  placeholder="Select education level..."
                  options={educationLevels}
                  value={educationLevels.find(lvl => lvl.id === jenjang)?.name || ""}
                  onChange={(id, name) => handleEducationLevelChange(id)}
                />
                <Field label="State/Province" value={eduProvName} onChange={setEduProvName} />
                <Field label="City/Region" value={eduRegName} onChange={setEduRegName} />
                <Field label="District/Sub-district" value={eduDisName} onChange={setEduDisName} />
                <div className="col-span-2">
                  <Field label={jenjang === "college" ? "College/University Name" : "School Name"} value={instansi} onChange={setInstansi} />
                </div>
                <div className="col-span-2">
                  <Field label={jenjang === "college" ? "College/University Address" : "School Address"} value={schoolAddress} onChange={setSchoolAddress} as="textarea" placeholder={jenjang === "college" ? "College/University Address" : "School Address"} />
                </div>
              </>
            )}
          </div>
        </section>

        {/* INFORMASI PENANGGUNG JAWAB */}
        <section className="mt-12">
          <div className="mb-6">
            <div className="flex items-center gap-1 text-s font-bold">
              <UserRound size={20} /> Informasi Penanggung Jawab (Opsional)
            </div>
            <p className="text-[13px] text-gray-500 font-medium font-sans">
              Bisa diisi dengan nama Guru Pembimbing atau Orang Tua
            </p>
          </div>
          
          <div className="rounded-md border border-gray-300 p-6 bg-white">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Nama Penanggung Jawab" value={supervisorName} onChange={setSupervisorName} placeholder="Masukkan nama" />
                <Field label="Nomor Telepon Penanggung Jawab" value={supervisorPhone} onChange={setSupervisorPhone} placeholder="Masukkan nomor telepon" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ViewField label="Nama Penanggung Jawab" value={supervisorName} />
                <ViewField label="Nomor Telepon Penanggung Jawab" value={supervisorPhone} />
              </div>
            )}
          </div>
        </section>

        {/* BUTTON */}
        <div className="mt-4 flex flex-col gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleValidateAndConfirm}
                disabled={uploading}
                className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Perubahan</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={uploading}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-red-500 border border-gray-300 hover:bg-red-600 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Buang Perubahan</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 cursor-pointer shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* CONFIRM POPUP */}
      <ConfirmPopup
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* TOAST NOTIFICATION */}
      <Toast show={toast.show} message={toast.message} type={toast.type as any} />
    </div>
  );
}

/* ========================================
   COMPONENTS
======================================== */

function ViewField({ label, value, colSpan = false }: { label: string, value: string, colSpan?: boolean }) {
  return (
    <div className={`border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px] ${colSpan ? 'md:col-span-2' : ''}`}>
      <span className="text-[12px] text-gray-500 font-medium">{label}</span>
      <span className="text-[14px] font-bold text-gray-900 mt-0.5 whitespace-pre-wrap">{value || "-"}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  as = "input", 
}: any) {
  const baseClass = `w-full rounded border px-3 text-sm outline-none ${disabled
      ? "border-gray-200 bg-gray-100 text-gray-400"
      : "border-gray-300 bg-white"
    }`;

  return (
    <div className="flex flex-col">
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>

      {as === "textarea" ? (
        <textarea
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} py-3 resize-none min-h-[90px]`}
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClass} h-11`}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function DateField({ label, value, onChange }: any) {
  return (
    <div className="flex flex-col">
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full border border-gray-300 rounded-lg px-4 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 font-sans"
      />
    </div>
  );
}

/* ========================================
   CUSTOM SEARCHABLE SELECT
======================================== */
function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  allowManual = false,
  disabled = false,
  onSearchChange,
  isLoading = false,
}: {
  label: string;
  value: string;
  onChange: (id: string, name: string) => void;
  options: Region[];
  placeholder?: string;
  allowManual?: boolean;
  disabled?: boolean;
  onSearchChange?: (term: string) => void;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) setSearchTerm(value);
  }, [value, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showManualOption = allowManual && searchTerm.length > 0 && !options.some(o => o.name.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      <div
        className={`relative flex items-center h-10 w-full rounded border border-gray-300 px-3 text-sm overflow-hidden ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
      >
        <Search className="text-gray-400 mr-2 min-w-[16px]" size={16} />
        <input
          type="text"
          disabled={disabled}
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            if (!isOpen) setIsOpen(true);
            if (onSearchChange) onSearchChange(val);
          }}
          onFocus={() => {
            setSearchTerm(""); 
            setIsOpen(true);
            if (onSearchChange) onSearchChange("");
          }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none disabled:bg-gray-100 disabled:text-gray-400 placeholder:text-gray-400 font-sans"
        />
        <ChevronDown className="text-gray-400 ml-2" size={16} />
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg text-sm">
          {isLoading ? (
            <li className="px-4 py-2 text-gray-500 flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></span>
              Memuat data sekolah...
            </li>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.id}
                className="cursor-pointer px-4 py-2.5 hover:bg-blue-50 hover:text-[#1A73E8] transition-colors"
                onMouseDown={() => {
                  onChange(opt.id, opt.name);
                  setIsOpen(false);
                }}
              >
                {opt.name}
              </li>
            ))
          ) : (
            !showManualOption && <li className="px-4 py-2.5 text-gray-500 italic">Data tidak ditemukan</li>
          )}

          {showManualOption && (
            <li
              className="cursor-pointer px-4 py-2.5 bg-gray-50 text-[#1A73E8] hover:bg-blue-100 font-medium transition-colors"
              onMouseDown={() => {
                onChange(searchTerm, searchTerm); 
                setIsOpen(false);
              }}
            >
              Nama tidak ada di daftar - isi manual: "{searchTerm}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}