"use client";

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, UploadCloud, Link as LinkIcon, FileText, ExternalLink } from "lucide-react";
import Toast from "@/components/ui/Toast";

interface UploadCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  entryData: any;
  eventId: string;
  competitionId: string;
  isAwardActive?: boolean;
}

export function UploadCertificateModal({
  isOpen,
  onClose,
  onUploadSuccess,
  entryData,
  eventId,
  competitionId,
  isAwardActive = true,
}: UploadCertificateModalProps) {
  // State Form
  const [uploadType, setUploadType] = useState<"link" | "file">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // State UI
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STATE UNTUK TOAST
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  useEffect(() => {
    if (isOpen && entryData) {
      setLinkUrl(entryData.certificate_external_url || "");
      if (entryData.certificate_external_url) {
        setUploadType("link");
      } else {
        setUploadType("file");
      }
      setSelectedFile(null);
    }
  }, [isOpen, entryData]);

  if (!isOpen || !entryData) return null;

  // Handler File
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handlePreviewSertifikat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (entryData.certificate_external_url) {
      window.open(entryData.certificate_external_url, '_blank');
      return;
    }

    if (entryData.certificate_file_path) {
      try {
        const { data, error } = await supabase.storage
          .from('certificates')
          .createSignedUrl(entryData.certificate_file_path, 60 * 60);
          
        if (error) throw error;
        if (data) window.open(data.signedUrl, '_blank');
      } catch (error: any) {
        console.error("Error previewing certificate:", error);
        showToast("Gagal mempratinjau sertifikat: " + error.message, "error");
      }
    }
  };

  // Handler Upload
  const handleUploadCertificate = async () => {
    if (uploadType === "link" && !linkUrl) return alert("Silahkan masukkan link sertifikat!");
    if (uploadType === "file" && !selectedFile && !entryData.certificate_file_path) {
      return alert("Silahkan pilih file sertifikat untuk diunggah!");
    }
    
    setIsUploading(true);

    try {
      let file_path = entryData.certificate_file_path || null;
      let external_url = uploadType === "link" ? linkUrl : null;

      // Upload File ke Storage jika uploadType file dan ada file baru yang dipilih
      if (uploadType === "file" && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_certificate.${fileExt}`;
        const filePath = `event_${eventId}/competition_${competitionId}/entry_${entryData.entry_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;
        file_path = filePath;
        external_url = null; // Clear external url if uploading file
      } else if (uploadType === "link") {
        if (entryData.certificate_file_path) {
          // Hapus file lama dari storage jika sebelumnya menggunakan file
          const { error: removeError } = await supabase.storage
            .from('certificates')
            .remove([entryData.certificate_file_path]);
          if (removeError) console.error("Gagal menghapus file sertifikat lama:", removeError);
        }
        file_path = null; // Clear file path if using link
      }

      // Update ke tabel awards
      const { error: dbError } = await supabase
        .from('awards')
        .update({
          certificate_file_path: file_path,
          certificate_external_url: external_url
        })
        .eq('award_id', entryData.award_id);

      if (dbError) throw dbError;

      showToast("Sertifikat berhasil diberikan!", "success");
      
      // Reset form & fetch data di parent
      onUploadSuccess();
      setTimeout(() => onClose(), 1500);

    } catch (error: any) {
      showToast(`Gagal mengunggah: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex justify-between items-start p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <UploadCloud className="text-gray-900" size={24} strokeWidth={2.5}/>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{!isAwardActive ? "Detail Sertifikat" : "Unggah Sertifikat"}</h3>
              <p className="text-[12px] text-gray-500">{!isAwardActive ? "Sertifikat yang telah diberikan kepada pemenang" : "Upload Sertifikat kepada Juara Lomba"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Info Peserta */}
          <div>
            <label className="block font-bold text-[13px] text-gray-800 mb-2">Peserta Juara</label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
              <h4 className="font-bold text-gray-900">{entryData.entry_name}</h4>
              <p className="text-sm text-blue-600 font-semibold mt-1">{entryData.award_category_name}</p>
              {entryData.members && entryData.members.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-[11px] text-gray-500 font-semibold mb-1">Anggota Tim:</p>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    {entryData.members.map((m: any, i: number) => (
                      <li key={i}>{m.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Pilihan Metode & Form Upload (HANYA MUNCUL JIKA AKTIF) */}
          {isAwardActive ? (
            <>
              <div>
                <label className="block font-bold text-[13px] text-gray-800 mb-2">Berikan Sertifikat Lewat</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="uploadType" 
                      value="link" 
                      checked={uploadType === "link"} 
                      onChange={() => setUploadType("link")}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Link</span>
                  </label>
                  
                  {uploadType === "link" && (
                    <div className="pl-6">
                      <input 
                        type="url" 
                        value={linkUrl} 
                        onChange={(e)=>setLinkUrl(e.target.value)} 
                        placeholder="Masukkan Link Sertifikat...." 
                        className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:bg-white focus:border-[#1E62FF] focus:ring-1 focus:ring-[#1E62FF] outline-none transition-all" 
                      />
                      {entryData.certificate_external_url && (
                        <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <LinkIcon size={16} className="text-green-600 shrink-0" />
                            <span className="text-sm font-medium text-green-900 truncate">Link sudah ditautkan</span>
                          </div>
                          <button 
                            onClick={handlePreviewSertifikat}
                            className="flex items-center gap-1 text-[13px] font-bold text-green-700 hover:text-green-800 transition-colors shrink-0"
                          >
                            <ExternalLink size={14} /> Lihat Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input 
                      type="radio" 
                      name="uploadType" 
                      value="file" 
                      checked={uploadType === "file"} 
                      onChange={() => setUploadType("file")}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">File</span>
                  </label>
                </div>
              </div>

              {/* Upload File Area */}
              {uploadType === "file" && (
                <div>
                  <label className="block font-bold text-[13px] text-gray-800 mb-2">Upload File Sertifikat</label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full border-2 border-dashed transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer ${
                      isDragging ? "border-[#1E62FF] bg-[#EAF2FF]" : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                  >
                    <UploadCloud size={40} className={`mb-3 ${isDragging ? "text-blue-700 animate-bounce" : "text-blue-400"}`} />
                    <p className="text-sm font-bold text-gray-700">
                      {isDragging ? "Lepaskan file di sini" : "Pilih atau Drag File untuk Upload"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Disarankan PNG, JPG, JPEG, PDF (Maks 5MB)
                    </p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors">
                      Pilih File
                    </button>
                  </div>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                  
                  {selectedFile && (
                    <div className="mt-3 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className="text-blue-600 shrink-0" />
                        <span className="text-sm font-medium text-blue-900 truncate">{selectedFile.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-blue-400 hover:text-blue-600 shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  {!selectedFile && entryData.certificate_file_path && (
                    <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className="text-green-600 shrink-0" />
                        <span className="text-sm font-medium text-green-900 truncate">Sertifikat sudah diunggah</span>
                      </div>
                      <button 
                        onClick={handlePreviewSertifikat}
                        className="flex items-center gap-1 text-[13px] font-bold text-green-700 hover:text-green-800 transition-colors shrink-0"
                      >
                        <ExternalLink size={14} /> Lihat File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // Tampilan READ-ONLY jika waktu sudah berakhir
            <div>
              <label className="block font-bold text-[13px] text-gray-800 mb-2">Sertifikat Tersedia</label>
              {entryData.certificate_external_url ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <LinkIcon size={20} className="text-green-600 shrink-0" />
                    <span className="text-sm font-medium text-green-900 truncate">Sertifikat dibagikan via Link</span>
                  </div>
                  <button 
                    onClick={handlePreviewSertifikat}
                    className="flex items-center gap-1 text-[13px] font-bold text-green-700 hover:text-green-800 transition-colors shrink-0 bg-white px-3 py-1.5 rounded-md border border-green-200"
                  >
                    <ExternalLink size={14} /> Buka Link
                  </button>
                </div>
              ) : entryData.certificate_file_path ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={20} className="text-green-600 shrink-0" />
                    <span className="text-sm font-medium text-green-900 truncate">Sertifikat berupa File</span>
                  </div>
                  <button 
                    onClick={handlePreviewSertifikat}
                    className="flex items-center gap-1 text-[13px] font-bold text-green-700 hover:text-green-800 transition-colors shrink-0 bg-white px-3 py-1.5 rounded-md border border-green-200"
                  >
                    <ExternalLink size={14} /> Buka File
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Penyelenggara tidak memberikan sertifikat.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-white">
          <button onClick={onClose} disabled={isUploading} className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-300 transition-colors">
            {!isAwardActive ? "Tutup" : "Batal"}
          </button>
          {isAwardActive && (
            <button onClick={handleUploadCertificate} disabled={isUploading} className="px-6 py-2.5 bg-[#1E62FF] text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              {isUploading ? "Memproses..." : "Berikan Sertifikat"}
            </button>
          )}
        </div>

      </div>
      {/* TOAST NOTIFICATION */}
      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </div>
  );
}
