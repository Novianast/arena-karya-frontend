'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { User, Users, GraduationCap, Eye, EyeOff, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/ui/Toast";
import Banner from "@/components/sections/Banner";
import { registerWithBrevo } from "@/app/actions/auth";

const KEMENDIKBUD_PROVINCES: Record<string, string> = {
  "D.K.I. JAKARTA": "010000",
  "JAWA BARAT": "020000",
  "JAWA TENGAH": "030000",
  "D.I. YOGYAKARTA": "040000",
  "JAWA TIMUR": "050000",
  "ACEH": "060000",
  "SUMATERA UTARA": "070000",
  "SUMATERA BARAT": "080000",
  "RIAU": "090000",
  "JAMBI": "100000",
  "SUMATERA SELATAN": "110000",
  "LAMPUNG": "120000",
  "KALIMANTAN BARAT": "130000",
  "KALIMANTAN TENGAH": "140000",
  "KALIMANTAN SELATAN": "150000",
  "KALIMANTAN TIMUR": "160000",
  "SULAWESI UTARA": "170000",
  "SULAWESI TENGAH": "180000",
  "SULAWESI SELATAN": "190000",
  "SULAWESI TENGGARA": "200000",
  "MALUKU": "210000",
  "BALI": "220000",
  "NUSA TENGGARA BARAT": "230000",
  "NUSA TENGGARA TIMUR": "240000",
  "PAPUA": "250000",
  "BENGKULU": "260000",
  "MALUKU UTARA": "270000",
  "BANTEN": "280000",
  "BANGKA BELITUNG": "290000",
  "GORONTALO": "300000",
  "KEPULAUAN RIAU": "310000",
  "PAPUA BARAT": "320000",
  "SULAWESI BARAT": "330000",
  "KALIMANTAN UTARA": "340000"
};

const normalizeName = (name: string) => {
  if (!name) return "";
  return name
    .toUpperCase()
    .replace(/^(PROV\.|PROVINSI|KAB\.|KABUPATEN|KOTA|KEC\.|KECAMATAN)\s+/g, "")
    .replace(/\./g, "")
    .replace(/[^A-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getProvinceCode = (provName: string): string | null => {
  const norm = normalizeName(provName);
  for (const [key, val] of Object.entries(KEMENDIKBUD_PROVINCES)) {
    const normKey = normalizeName(key);
    if (norm.includes(normKey) || normKey.includes(norm)) {
      return val;
    }
  }
  return null;
};

export default function RegisterPage() {
  // ROUTE
  const router = useRouter();

  // STATE GLOBAL & AUTH
  const [role, setRole] = useState("organizer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // STATE KHUSUS PENYELENGGARA
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [picName, setPicName] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [orgAddress, setOrgAddress] = useState("");

  // STATE KHUSUS JURI
  const [bio, setBio] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [lastEducation, setLastEducation] = useState("");
  const [institution, setInstitution] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");

  // STATE KHUSUS PESERTA
  const [country, setCountry] = useState("indonesia");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [province, setProvince] = useState("");
  const [regency, setRegency] = useState("");
  const [district, setDistrict] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");

  // STATE KHUSUS DROPDOWN WILAYAH
  const [provId, setProvId] = useState("");
  const [regId, setRegId] = useState("");
  const [distId, setDistId] = useState("");
  const [apiProvinces, setApiProvinces] = useState<{ id: string, name: string }[]>([]);
  const [eduRegencies, setEduRegencies] = useState<{ id: string, name: string }[]>([]);
  const [eduDistricts, setEduDistricts] = useState<{ id: string, name: string }[]>([]);
  const [apiSchools, setApiSchools] = useState<any[]>([]);
  const [districtSchools, setDistrictSchools] = useState<any[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const showError = (msg: string) => showToast(msg, "error");

  const handleEducationLevelChange = (lvl: string) => {
    setEducationLevel(lvl);
    setSchoolName("");
    setSchoolAddress("");
    setProvId("");
    setProvince("");
    setRegId("");
    setRegency("");
    setDistId("");
    setDistrict("");
    setDistrictSchools([]);
    setApiSchools([]);
  };

  // Fungsi Reset Form
  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");

    setOrgName("");
    setOrgDesc("");
    setPicName("");
    setPicPhone("");
    setWebsite("");
    setOrgAddress("");

    setBio("");
    setSpeciality("");
    setLastEducation("");
    setInstitution("");
    setPrefix("");
    setSuffix("");

    setAddress("");
    setBirthDate("");
    setEducationLevel("");
    setSchoolName("");
    setProvince("");
    setRegency("");
    setDistrict("");
    setSchoolAddress("");
  };

  // FETCH API WILAYAH (EMSIFA)
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setApiProvinces(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!provId) { setEduRegencies([]); return; }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
      .then((res) => res.json())
      .then((data) => setEduRegencies(data));
  }, [provId]);

  useEffect(() => {
    if (!regId) { setEduDistricts([]); return; }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regId}.json`)
      .then((res) => res.json())
      .then((data) => setEduDistricts(data));
  }, [regId]);

  // FETCH & FILTER DATA SEKOLAH INDONESIA
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadSchoolsForRegion = async (districtId: string) => {
    if (!districtId || !educationLevel) {
      setApiSchools([]);
      setDistrictSchools([]);
      return;
    }
    setIsLoadingSchools(true);
    try {
      let forms: string[] = [];
      if (educationLevel === "elementary_school") {
        forms = ["SD", "MI"];
      } else if (educationLevel === "middle_school") {
        forms = ["SMP", "MTS"];
      } else if (educationLevel === "high_school") {
        forms = ["SMA", "SMK", "MA"];
      } else if (educationLevel === "college") {
        const query = `provinsi=${encodeURIComponent(province)}&kabupaten=${encodeURIComponent(regency)}&limit=100`;
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
        if (district && district !== "Tidak Diisi") {
          url += `&kecamatan=${encodeURIComponent(district)}`;
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
        npsn: sch.npsn || null,
        provinsi: sch.provinsi || null,
        kabupaten: sch.kabupaten || null,
        kecamatan: sch.kecamatan || null,
        alamat_jalan: sch.alamat_jalan || null,
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

  const fetchSchools = async (term: string) => {
    if (!term.trim()) {
      setApiSchools(districtSchools);
      return;
    }
    setIsLoadingSchools(true);
    try {
      let forms: string[] = [];
      if (educationLevel === "elementary_school") {
        forms = ["SD", "MI"];
      } else if (educationLevel === "middle_school") {
        forms = ["SMP", "MTS"];
      } else if (educationLevel === "high_school") {
        forms = ["SMA", "SMK", "MA"];
      }

      const rawRegencyId = distId ? distId.substring(0, 4) : "";
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
      if (district && district !== "Tidak Diisi") {
        query += `&kecamatan=${encodeURIComponent(district)}`;
      }

      let allSchools: any[] = [];
      if (educationLevel === "college") {
        let collegeQuery = `nama=${encodeURIComponent(term)}&limit=50`;
        if (province && province !== "Tidak Diisi") {
          collegeQuery += `&provinsi=${encodeURIComponent(province)}`;
        }
        if (regency && regency !== "Tidak Diisi") {
          collegeQuery += `&kabupaten=${encodeURIComponent(regency)}`;
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
        name: sch.bentuk_pendidikan === "college" && sch.nm_singkat 
          ? `${sch.nama} (${sch.nm_singkat})` 
          : sch.nama,
        npsn: sch.npsn || null,
        provinsi: sch.provinsi || null,
        kabupaten: sch.kabupaten || null,
        kecamatan: sch.kecamatan || null,
        alamat_jalan: sch.alamat_jalan || null,
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
            namaProvinsi: sch.provinsi || "",
            namaKabupaten: sch.kabupaten || "",
            namaKecamatan: sch.kecamatan || "",
            alamatJalan: sch.alamat_jalan || ""
          };
        }
      }
    } catch (e) {
      console.error("Error fetching school by NPSN:", e);
    }
    return null;
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
      setProvId(foundProv.id);
      setProvince(foundProv.name);

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
        setRegId("");
        setRegency(regName);
        setDistId("");
        setDistrict(distName);
        return;
      }
      setRegId(foundReg.id);
      setRegency(foundReg.name);

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
          setDistId(foundDist.id);
          setDistrict(foundDist.name);
        } else {
          setDistId("");
          setDistrict(distName);
        }
      } else {
        setDistId("");
        setDistrict(educationLevel === "college" ? "Tidak Diisi" : "");
      }
    } catch (e) {
      console.error("Error resolving Emsifa IDs:", e);
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
          setSchoolName(sch.nama);
          setSchoolAddress(sch.alamatJalan || "");
          resolveEmsifaIds(sch.namaProvinsi, sch.namaKabupaten, sch.namaKecamatan);

          const upperName = sch.nama.toUpperCase();
          if (upperName.startsWith("SD") || upperName.startsWith("MI")) {
            setEducationLevel("elementary_school");
          } else if (upperName.startsWith("SMP") || upperName.startsWith("MTS")) {
            setEducationLevel("middle_school");
          } else if (upperName.startsWith("SMA") || upperName.startsWith("SMK") || upperName.startsWith("MA")) {
            setEducationLevel("high_school");
          } else if (upperName.includes("UNIVERSITAS") || upperName.includes("INSTITUT") || upperName.includes("POLITEKNIK") || upperName.includes("STIE") || upperName.includes("STKIP") || upperName.includes("COLLEGE") || upperName.includes("AKADEMI")) {
            setEducationLevel("college");
          }

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

  useEffect(() => {
    if (country === "indonesia" && educationLevel) {
      if (educationLevel === "college") {
        if (regId) {
          loadSchoolsForRegion(regId);
        } else {
          setDistrictSchools([]);
          setApiSchools([]);
        }
      } else {
        if (distId) {
          loadSchoolsForRegion(distId);
        } else {
          setDistrictSchools([]);
          setApiSchools([]);
        }
      }
    } else {
      setDistrictSchools([]);
      setApiSchools([]);
    }
  }, [distId, regId, educationLevel, country, district, province, regency]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // LOGIC REGISTER SUPABASE
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    /* VALIDASI GLOBAL */
    if (!username.trim()) return showError("Nama Lengkap tidak boleh kosong atau hanya berisi spasi!");
    if (username.startsWith(" ")) return showError("Nama Lengkap tidak boleh diawali dengan spasi!");
    if (!role) return showError("Pilih role terlebih dahulu!");
    if (!email || !password) return showError("Email dan Password wajib diisi!");
    if (password !== confirmPassword) return showError("Password tidak sama!");

    /* VALIDASI KHUSUS ROLE */
    if (role === "organizer") {
      if (!orgName || !picName || !picPhone) {
        return showError("Nama Organisasi, PIC, dan No PIC wajib diisi!");
      }
    }
    else if (role === "judge") {
      if (!institution || !lastEducation) {
        return showError("Institusi dan Pendidikan Terakhir wajib diisi!");
      }
    }
    else if (role === "participant") {
      const isCollege = educationLevel === "college";
      if (!birthDate || !country || !educationLevel || !province || !regency || (!isCollege && !district) || !schoolName) {
        return showError("Mohon lengkapi semua data yang wajib diisi!");
      }
    }

    /* PROSES PEMBUATAN AKUN */
    try {
      setLoading(true);

      const formData = {
        email,
        password,
        role,
        username,
        phone,
        orgName,
        orgDesc,
        picName,
        picPhone,
        orgAddress,
        website,
        bio,
        speciality,
        institution,
        lastEducation,
        prefix,
        suffix,
        address,
        birthDate,
        country,
        educationLevel,
        schoolName,
        province,
        regency,
        district,
        schoolAddress
      };

      const result = await registerWithBrevo(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      showToast("Registrasi berhasil! Silakan cek email Anda untuk memverifikasi akun.", "success");
      // Optionally redirect or let them wait
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      console.error("Error Registrasi:", error);
      showError(error.message || "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  // DEFINISI TINGKAT PENDIDIKAN DINAMIS
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

  return (
    <div className="flex min-h-screen items-stretch w-full bg-white">
      {/* SISI KIRI - Gambar Full */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Banner className="h-full min-h-screen">
          <div className="text-center px-12 relative z-10 flex flex-col items-center justify-center h-full">
            <h2 className="font-serif text-4xl xl:text-5xl font-bold text-white mb-6 drop-shadow-md">
              Arena Karya
            </h2>
            <p className="text-blue-100 text-lg xl:text-xl max-w-md mx-auto leading-relaxed">
              Platform digital terpadu untuk digitalisasi proses pendaftaran, pengumpulan karya, dan penjurian.
            </p>
          </div>
        </Banner>
      </div>

      {/* SISI KANAN - Form Scrollable */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto py-10">

          {/* LOGO */}
          <div className="mb-8">
            <Image
              src="/logo/logo.png"
              alt="Logo Arena Karya"
              width={220}
              height={100}
              className="object-contain"
            />
          </div>

          {/* TITLE */}
          <div className="mb-8">
            <h1 className="text-[32px] font-bold text-[#2A2A2A] leading-tight">
              Selamat Datang
            </h1>
            <p className="text-[14px] text-gray-500">
              Daftar dan mulai perjalanan Anda
            </p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="flex gap-3 mb-8 w-full">
            {[
              { id: "organizer", label: "Penyelenggara", icon: <User size={16} /> },
              { id: "judge", label: "Juri", icon: <Users size={16} /> },
              { id: "participant", label: "Peserta", icon: <GraduationCap size={16} /> },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRole(item.id);
                  resetForm();
                }}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl border transition-all
                ${role === item.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="mb-0.5">{item.icon}</div>
                <span className="font-semibold text-[12px] leading-none">{item.label}</span>
              </button>
            ))}
          </div>
          {/* FORM AREA */}
          <form onSubmit={handleRegister} className="space-y-4">

            {/* --- GLOBAL: NAMA LENGKAP --- */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600">Nama Lengkap <span style={{ color: 'red' }} className="text-[15px] align-middle">*</span></label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                required
              />
            </div>
            {/* ======================================= */}
            {/* FORM KHUSUS PENYELENGGARA               */}
            {/* ======================================= */}
            {role === "organizer" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600">Nama Organisasi<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                  <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Masukkan nama organisasi" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600">Deskripsi Organisasi</label>
                  <textarea rows={3} value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} placeholder="Masukkan deskripsi organisasi" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none max-h-32 overflow-y-auto" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Nama PIC<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="text" value={picName} onChange={(e) => setPicName(e.target.value)} placeholder="Masukkan nama pic" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Nomor Telepon PIC<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="tel" value={picPhone} onChange={(e) => setPicPhone(e.target.value)} placeholder="Masukkan nomor telepon pic" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Email<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Website</label>
                    <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Masukkan nama website" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600">Alamat (Organisasi)</label>
                  <textarea rows={3} value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} placeholder="Masukkan alamat lengkap" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none max-h-32 overflow-y-auto" />
                </div>
              </>
            )}
            {/* ======================================= */}
            {/* FORM KHUSUS JURI                        */}
            {/* ======================================= */}
            {role === "judge" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600">Bio</label>
                  <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Masukkan bio" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none max-h-32 overflow-y-auto" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600">Keahlian</label>
                  <input type="text" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="Masukkan keahlian" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Pendidikan Terakhir<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <div className="relative">
                      <select value={lastEducation} onChange={(e) => setLastEducation(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary">
                        <option value="">Pilih salah satu</option>
                        <option value="diploma">D3</option>
                        <option value="bachelor">S1</option>
                        <option value="magister">S2</option>
                        <option value="doctor">S3</option>
                        <option value="professor">Profesor</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Nama Instansi<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Masukkan nama instansi" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Email<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Nomor Telepon</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Masukkan nomor telepon" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Gelar Depan</label>
                    <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Masukkan gelar depan" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Gelar Belakang</label>
                    <input type="text" value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Masukkan gelar belakang" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                </div>
              </>
            )}
            {/* ======================================= */}
            {/* FORM KHUSUS PESERTA                     */}
            {/* ======================================= */}
            {role === "participant" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Tanggal Lahir<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Negara Asal<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <div className="relative">
                      <select value={country} onChange={(e) => {
                        setCountry(e.target.value);
                        setEducationLevel(""); // Reset pendidikan saat ganti negara
                      }} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary">
                        <option value="indonesia">Indonesia</option>
                        <option value="overseas">Luar Negeri</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Email<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-gray-600">Nomor Telepon</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Masukkan nomor telepon" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-600">Alamat Lengkap (Domisili)</label>
                  <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Masukkan alamat domisili" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none max-h-32 overflow-y-auto" />
                </div>

                {country === "indonesia" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-gray-600">Tingkat Pendidikan<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                      <div className="relative">
                        <select value={educationLevel} onChange={(e) => handleEducationLevelChange(e.target.value)} disabled={!country} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary disabled:bg-gray-100 disabled:text-gray-400">
                          <option value="">{country ? "Pilih jenjang pendidikan..." : "Pilih negara asal dulu"}</option>
                          {educationLevels.map((lvl) => (
                            <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 z-40">
                        <SearchableSelect
                          label={
                            <>
                              Provinsi {educationLevel === "college" ? "(Perguruan Tinggi)" : "(Sekolah)"}
                              <span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span>
                            </>
                          }
                          placeholder="Cari Provinsi..."
                          options={apiProvinces}
                          value={province}
                          onChange={(id, name) => { setProvId(id); setProvince(name); setRegId(""); setRegency(""); setDistId(""); setDistrict(""); setSchoolName(""); }}
                        />
                      </div>
                      <div className="space-y-1.5 z-30">
                        <SearchableSelect
                          label={
                            <>
                              Kabupaten/Kota {educationLevel === "college" ? "(Perguruan Tinggi)" : "(Sekolah)"}
                              <span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span>
                            </>
                          }
                          placeholder="Cari Kabupaten/Kota..."
                          options={eduRegencies}
                          value={regency}
                          disabled={!province}
                          onChange={(id, name) => { setRegId(id); setRegency(name); setDistId(""); setDistrict(""); setSchoolName(""); }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 z-20">
                        <SearchableSelect
                          label={
                            <>
                              Kecamatan {educationLevel === "college" ? "(Perguruan Tinggi)" : "(Sekolah)"}
                              {educationLevel !== "college" && <span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span>}
                            </>
                          }
                          placeholder="Cari Kecamatan..."
                          options={eduDistricts}
                          value={district}
                          disabled={!regency}
                          onChange={(id, name) => { setDistId(id); setDistrict(name); setSchoolName(""); }}
                        />
                      </div>
                      <div className="space-y-1.5 z-10">
                        <SearchableSelect
                          label={
                            <>
                              {educationLevel === "college" ? "Nama Perguruan Tinggi" : "Nama Sekolah"}
                              <span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span>
                            </>
                          }
                          placeholder={educationLevel === "college" ? "Cari atau ketik nama perguruan tinggi..." : "Cari atau ketik nama sekolah..."}
                          options={apiSchools}
                          value={schoolName}
                          allowManual={true}
                          disabled={educationLevel === "college" ? !country : !district}
                          isLoading={isLoadingSchools}
                          onChange={(id, name) => {
                            setSchoolName(name);
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
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-gray-600">Alamat Lengkap {educationLevel === "college" ? "Perguruan Tinggi" : "Sekolah"}</label>
                      <textarea rows={3} value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder={educationLevel === "college" ? "Masukkan alamat perguruan tinggi" : "Masukkan alamat sekolah"} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none max-h-32 overflow-y-auto" />
                    </div>
                  </>
                ) : country === "overseas" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-gray-600">Education Level<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                      <div className="relative">
                        <select value={educationLevel} onChange={(e) => handleEducationLevelChange(e.target.value)} disabled={!country} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary disabled:bg-gray-100 disabled:text-gray-400">
                          <option value="">{country ? "Select education level..." : "Select country first"}</option>
                          {educationLevels.map((lvl) => (
                            <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-gray-600">State/Province<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                        <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="State or Province" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-gray-600">City/Region<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                        <input type="text" value={regency} onChange={(e) => setRegency(e.target.value)} placeholder="City or Region" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-gray-600">District/Sub-district<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                        <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-gray-600">School Name<span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                        <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School Name" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-gray-600">School Address</label>
                      <textarea rows={3} value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder="School Address" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none max-h-32 overflow-y-auto" />
                    </div>
                  </>
                ) : null}


              </>
            )}
            {/* --- GLOBAL: PASSWORD & KONFIRMASI PASSWORD --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600">Password <span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600">Konfirmasi Password <span style={{ color: 'red' }} className="text-[15px] align-middle"> *</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </div>
            {/* TOMBOL DAFTAR */}
            <div className="mt-10 pt-4">
              <button
                type="submit"
                className="w-full bg-primary hover:bg-[#1557B0] text-white py-2.5 rounded-lg font-bold text-[16px] transition-all shadow-lg shadow-blue-100"
              >
                Daftar
              </button>
              <p className="text-center text-[14px] text-gray-500 mt-4">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-blue-600 font-semibold cursor-pointer">
                  Masuk
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
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
  label: React.ReactNode;
  value: string;
  onChange: (id: string, name: string) => void;
  options: { id: string; name: string }[];
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
      <label className="text-[13px] font-medium text-gray-600 block mb-1.5">{label}</label>

      <div
        className={`relative flex items-center w-full border border-gray-300 rounded-lg px-4 py-2 text-[13px] overflow-hidden ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-white focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary"}`}
      >
        <Search size={16} className="text-gray-400 mr-2 min-w-[16px]" />
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
          className="w-full bg-transparent outline-none disabled:bg-gray-100 placeholder:text-gray-400"
        />
        <ChevronDown size={16} className="text-gray-400 ml-2" />
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-[13px]">
          {isLoading ? (
            <li className="px-4 py-2.5 text-gray-500 flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
              Memuat data sekolah...
            </li>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt.id}
                className="cursor-pointer px-4 py-2.5 hover:bg-blue-50 hover:text-primary transition-colors border-b border-gray-50 last:border-b-0"
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
              className="cursor-pointer px-4 py-2.5 bg-gray-50 text-primary hover:bg-blue-100 font-medium transition-colors"
              onMouseDown={() => {
                onChange(searchTerm, searchTerm);
                setIsOpen(false);
              }}
            >
              Isi manual: "{searchTerm}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}