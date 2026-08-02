"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, Plus, Calendar, Flag, Layers, FileText, CheckCircle, XCircle } from "lucide-react";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import FilterDropdown from "@/components/ui/FilterDropdown";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import Pagination from "@/components/ui/Pagination";
import Toast from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";

// Enums
type UploadFormat = 'doc_img' | 'doc_img_vid' | 'all';

// Interfaces
interface PackageData {
  package_id: number;
  package_name: string;
  price: number;
  max_competitions: number;
  max_stages: number;
  max_days: number;
  upload_format: UploadFormat;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface SoldData {
  [package_id: number]: number;
}

export default function PackagePage() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [soldData, setSoldData] = useState<SoldData>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    package_name: "",
    price: "",
    max_competitions: "",
    max_stages: "",
    max_days: "",
    upload_format: "doc_img" as UploadFormat,
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Popup states
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: React.ReactNode;
    message: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
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

  const fetchPackages = async () => {
    setLoading(true);
    // Fetch packages
    const { data: pkgData, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .order('package_id', { ascending: true });

    if (pkgError) {
      console.error("Error fetching packages:", pkgError);
      setLoading(false);
      return;
    }

    setPackages(pkgData || []);

    // Fetch sold count
    const { data: soldCounts, error: soldError } = await supabase
      .from('package_payments')
      .select('package_id, status');

    if (!soldError && soldCounts) {
      const counts: SoldData = {};
      soldCounts.forEach((payment) => {
        if (payment.status === 'verified' || payment.status === 'success' || payment.status === 'used') {
          counts[payment.package_id] = (counts[payment.package_id] || 0) + 1;
        }
      });
      setSoldData(counts);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset page to 1 on search
  };

  const executeToggleActive = async (packageId: number, currentActive: boolean) => {
    const { error } = await supabase
      .from('packages')
      .update({ is_active: !currentActive })
      .eq('package_id', packageId);
    
    if (error) {
      console.error("Error updating active status:", error);
      showToast("Gagal mengubah status paket.", "error");
      return;
    }
    
    // Update local state
    setPackages(packages.map(pkg => 
      pkg.package_id === packageId ? { ...pkg, is_active: !currentActive } : pkg
    ));
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    showToast(`Paket berhasil ${currentActive ? 'dinonaktifkan' : 'diaktifkan'}.`, "success");
  };

  const handleToggleActive = (pkg: PackageData) => {
    setConfirmConfig({
      isOpen: true,
      title: pkg.is_active ? "Nonaktifkan Paket" : "Aktifkan Paket",
      message: `Apakah Anda yakin ingin ${pkg.is_active ? 'menonaktifkan' : 'mengaktifkan'} paket "${pkg.package_name}"? ${pkg.is_active ? '\nPaket yang dinonaktifkan tidak akan bisa dibeli lagi oleh Penyelenggara, tapi riwayat lama akan tetap aman.' : ''}`,
      onConfirm: () => executeToggleActive(pkg.package_id, pkg.is_active)
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);

    const { error } = await supabase
      .from('packages')
      .insert({
        package_name: formData.package_name,
        price: Number(formData.price),
        max_competitions: Number(formData.max_competitions),
        max_stages: Number(formData.max_stages),
        max_days: Number(formData.max_days),
        upload_format: formData.upload_format,
        description: formData.description,
        is_active: true
      });

    if (error) {
      console.error("Error adding package:", error);
      showToast("Gagal menambah paket.", "error");
    } else {
      showToast("Berhasil menambah paket!", "success");
      setIsModalOpen(false);
      setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      setFormData({
        package_name: "",
        price: "",
        max_competitions: "",
        max_stages: "",
        max_days: "",
        upload_format: "doc_img",
        description: "",
      });
      fetchPackages();
    }
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Number(formData.max_competitions) < 1) {
      showToast("Maksimal lomba minimal 1.", "error");
      return;
    }
    if (Number(formData.max_stages) < 1) {
      showToast("Maksimal babak minimal 1.", "error");
      return;
    }
    if (Number(formData.max_days) < 1) {
      showToast("Maksimal hari minimal 1.", "error");
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: "Tambah Paket Baru",
      message: `Apakah Anda yakin ingin menambahkan paket "${formData.package_name}" dengan harga Rp ${Number(formData.price).toLocaleString('id-ID')}?`,
      onConfirm: () => executeSubmit()
    });
  };

  const formatUploadFormat = (format: string) => {
    switch (format) {
      case 'doc_img': return '.pdf, .jpg, .png';
      case 'doc_img_vid': return '.pdf, .jpg, .png';
      case 'all': return 'Semua Format';
      default: return format;
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchSearch = pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || (statusFilter === 'active' ? pkg.is_active : !pkg.is_active);
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
    { label: "Tidak Aktif", value: "inactive" },
  ];

  // Pagination Logic
  const totalItems = filteredPackages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredPackages.slice(startIndex, endIndex);

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
        icon={<Package className="h-8 w-8" />}
        title="Paket Penyelenggara"
        subtitle="Kelola Paket untuk Penyelenggara"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Cari Paket..."
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

      {/* Statistics & Add Button */}
      <div className="flex flex-col xl:flex-row gap-4 mb-8">
        <div className="bg-primary text-white rounded-xl p-6 flex flex-col justify-center min-w-[200px]">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-80">Total Paket</h3>
          <p className="text-3xl font-bold">{packages.length}</p>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
          {packages.map(pkg => (
            <div key={pkg.package_id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col min-w-[150px] shrink-0">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{pkg.package_name}</h3>
              <p className="text-2xl font-bold text-primary">{soldData[pkg.package_id] || 0}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-full px-8 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap flex items-center justify-center min-h-[80px]"
          >
            Tambah Paket
          </button>
        </div>
      </div>

      {/* Package List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat data paket...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Tidak ada paket yang ditemukan.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map(pkg => (
              <div key={pkg.package_id} className={`bg-white border ${!pkg.is_active ? 'border-red-200 opacity-70' : 'border-gray-200'} rounded-xl p-6 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden`}>
                {!pkg.is_active && (
                  <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    TIDAK AKTIF
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary">{pkg.package_name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[40px]">{pkg.description || 'Tidak ada deskripsi'}</p>
                    </div>
                    <div className="text-lg font-bold text-gray-900 whitespace-nowrap ml-2">
                      Rp {pkg.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-2 text-gray-500"><Flag className="w-4 h-4" /> Max. Lomba</span>
                      <span className="font-medium text-gray-800">{pkg.max_competitions} Lomba</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-2 text-gray-500"><Layers className="w-4 h-4" /> Max. Babak</span>
                      <span className="font-medium text-gray-800">{pkg.max_stages} Babak</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-2 text-gray-500"><Calendar className="w-4 h-4" /> Max. Hari</span>
                      <span className="font-medium text-gray-800">{pkg.max_days} Hari</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-2 text-gray-500"><FileText className="w-4 h-4" /> File Upload</span>
                      <span className="font-medium text-gray-800 text-right">{formatUploadFormat(pkg.upload_format)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => handleToggleActive(pkg)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                      pkg.is_active 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {pkg.is_active ? (
                      <>Nonaktifkan</>
                    ) : (
                      <>Aktifkan</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
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
              itemName="Paket"
            />
          )}
        </>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Tambah Paket Baru</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-package-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
                  <input
                    type="text"
                    name="package_name"
                    required
                    value={formData.package_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Contoh: Karsa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Contoh: 300000"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Lomba</label>
                    <input
                      type="number"
                      name="max_competitions"
                      required
                      min="1"
                      value={formData.max_competitions}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      placeholder="Contoh: 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Babak</label>
                    <input
                      type="number"
                      name="max_stages"
                      required
                      min="1"
                      value={formData.max_stages}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      placeholder="Contoh: 2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Hari</label>
                    <input
                      type="number"
                      name="max_days"
                      required
                      min="1"
                      value={formData.max_days}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      placeholder="Contoh: 30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format Upload Karya</label>
                  <select
                    name="upload_format"
                    required
                    value={formData.upload_format}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="doc_img">Dokumen & Gambar (.pdf, .jpg, .png)</option>
                    <option value="doc_img_vid">Dokumen, Gambar & Tautan Video</option>
                    <option value="all">Semua Format</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Tuliskan deskripsi singkat tentang paket ini..."
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-package-form"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Paket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
