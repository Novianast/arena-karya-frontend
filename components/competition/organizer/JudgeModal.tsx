"use client";

import { useEffect, useState } from "react";
import { Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getJudgesByStageIds } from "@/services/profile/getJudges";

interface JuriModalProps {
  isOpen: boolean;
  onClose: () => void;
  babakTitle: string;
  stageIds: number[];
}

export default function JudgeModal({ isOpen, onClose, babakTitle, stageIds }: JuriModalProps) {
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || stageIds.length === 0) return;

    const fetchJudges = async () => {
      setLoading(true);
      try {
        const data = await getJudgesByStageIds(stageIds);
        setJudges(data || []);
      } catch (error) {
        console.error("Error fetching judges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJudges();
  }, [isOpen, stageIds]);

  const getImageUrl = (fileName: string | null) => {
    if (!fileName) return "/images/default-avatar.png";
    if (fileName.startsWith("http")) return fileName;
    
    const { data } = supabase.storage.from("profiles").getPublicUrl(`judges/${fileName}`);
    return data.publicUrl;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
            <Users size={20} />
            Juri - {babakTitle}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Memuat data juri...</p>
          ) : judges.length > 0 ? (
            judges.map((assignment, idx) => {
              const profile = assignment.judges?.profiles;
              return (
                <div key={idx} className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
                  <div 
                    className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${getImageUrl(profile?.profile_image)})` }}
                  />
                  <div>
                    <p className="text-base font-bold text-gray-900">{profile?.username || "Nama Tidak Tersedia"}</p>
                    <p className="text-sm text-gray-500">{assignment.judges?.institution || "-"}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada juri yang ditugaskan pada babak ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}