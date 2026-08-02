"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { X, UploadCloud } from "lucide-react";
import Toast from "@/components/ui/Toast";
import ConfirmPopup from "@/components/ui/ConfirmPopup";

interface UploadKaryaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  competition: any;
  eventData: any;
  tahap: any;
  entryData: any;
}

export function UploadKaryaModal({
  isOpen,
  onClose,
  onUploadSuccess,
  competition,
  eventData,
  tahap,
  entryData,
}: UploadKaryaModalProps) {
  // State Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  // STATE UNTUK CONFIRM POPUP
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  if (!isOpen) return null;

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

  // Handler Upload
  const handleUploadKarya = async () => {
    if (!title) return alert("Judul karya wajib diisi!");
    if (!selectedFile && !linkUrl) return alert("Silahkan unggah file atau masukkan link pendukung!");
    
    // Buka Pop-up Konfirmasi
    setConfirmDialog({
      isOpen: true,
      title: "Konfirmasi Unggah Karya",
      message: "Pastikan data sudah benar. Anda TIDAK DAPAT mengubah file atau data setelah dikonfirmasi.\n\nLanjutkan mengunggah?",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false }); // Tutup Popup
        setIsUploading(true);

        try {
          let file_url = null;

          // Upload File ke Storage
          if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}_${entryData.entry_id}.${fileExt}`;
            const filePath = `event_${eventData.event_id}/competition_${competition.competition_id}/stage_${tahap.stage_id}/entry_${entryData.entry_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('submissions')
              .upload(filePath, selectedFile, { upsert: true });

            if (uploadError) throw uploadError;
            file_url = filePath;
          }

          // Insert ke tabel submissions
          const { error: dbError } = await supabase
            .from('submissions')
            .insert({
              stage_id: tahap.stage_id,
              entry_id: entryData.entry_id,
              title: title,
              description: description,
              file_url: file_url,
              link_url: linkUrl
            });

          if (dbError) throw dbError;

          showToast("Karya berhasil diunggah!", "success");
          
          // Reset form & tutup modal & fetch data di parent
          setTitle("");
          setDescription("");
          setLinkUrl("");
          setSelectedFile(null);
          onUploadSuccess();
          setTimeout(() => onClose(), 1500);

        } catch (error: any) {
          showToast(`Gagal mengunggah: ${error.message}`, "error");
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex justify-between items-start p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <UploadCloud className="text-gray-900" size={24} strokeWidth={2.5}/>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Unggah Karya</h3>
              <p className="text-[12px] text-gray-500">Unggah Karya Tim/Anda disini</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
        </div>

        {/* Body Modal */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block font-bold text-[13px] text-gray-800 mb-1">Judul Karya <span className="text-red-500">*</span></label>
            <p className="text-[11px] text-gray-500 mb-2">Judul karya sesuai dengan ketentuan lomba</p>
            <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Masukkan judul karya" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-[#1E62FF] focus:ring-1 focus:ring-[#1E62FF] outline-none transition-all" />
          </div>

          <div>
            <label className="block font-bold text-[13px] text-gray-800 mb-1">Deskripsi Karya (Opsional)</label>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Masukkan deskripsi karya" rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-[#1E62FF] focus:ring-1 focus:ring-[#1E62FF] outline-none transition-all resize-none" />
          </div>

          <div>
            <label className="block font-bold text-[13px] text-gray-800 mb-1">Link Pendukung (Opsional)</label>
            <p className="text-[11px] text-gray-500 mb-2">Tambahkan link (YouTube, Google Drive, Github, dll)</p>
            <input type="url" value={linkUrl} onChange={(e)=>setLinkUrl(e.target.value)} placeholder="https://" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-[#1E62FF] focus:ring-1 focus:ring-[#1E62FF] outline-none transition-all" />
          </div>

          <div>
            <label className="block font-bold text-[13px] text-gray-800 mb-1">Unggah file karya (Opsional)</label>
            <p className="text-[11px] text-gray-500 mb-2">Unggah file karya sesuai dengan ketentuan lomba</p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full border-2 border-dashed transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer ${
                isDragging ? "border-[#1E62FF] bg-[#EAF2FF]" : "border-[#1E62FF]/40 bg-[#F4F8FF] hover:bg-[#EAF2FF]"
              }`}
            >
              <UploadCloud size={40} className={`mb-3 ${isDragging ? "text-blue-700 animate-bounce" : "text-[#1E62FF]"}`} />
              <p className="text-sm font-bold text-[#1E62FF]">
                {isDragging ? "Lepaskan file di sini" : "Seret & lepas file di sini, atau klik untuk memilih file"}
              </p>
              <p className="text-[11px] text-[#1E62FF]/70 mt-1">
                {selectedFile ? selectedFile.name : "Pastikan format file dengan ketentuan lomba"}
              </p>
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} disabled={isUploading} className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-300 transition-colors">Batal</button>
          <button onClick={handleUploadKarya} disabled={isUploading} className="px-6 py-2.5 bg-[#1E62FF] text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {isUploading ? "Mengunggah..." : "Upload"}
          </button>
        </div>

      </div>
      {/* TOAST NOTIFICATION */}
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* CONFIRM POPUP */}
      <ConfirmPopup 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}