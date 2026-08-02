"use client";

import { useEffect, useState } from "react";
import { FileCheck, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface KriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  babakTitle: string;
  stageIds: number[];
}

export default function CriteriaModal({ isOpen, onClose, babakTitle, stageIds }: KriteriaModalProps) {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || stageIds.length === 0) return;

    const fetchCriteria = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("evaluation_criteria")
          .select("name, weight, description")
          .in("stage_id", stageIds)
          .order("criteria_id", { ascending: true });

        if (error) throw error;
        setCriteria(data || []);
      } catch (error) {
        console.error("Error fetching criteria:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCriteria();
  }, [isOpen, stageIds]);

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
            <FileCheck size={20} />
            Kriteria Penilaian - {babakTitle}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Memuat kriteria...</p>
          ) : criteria.length > 0 ? (
            criteria.map((item, idx) => (
              <div key={idx} className="flex items-center gap-6 rounded-xl border border-gray-200 p-4">
                <div className="text-2xl font-black text-gray-900 w-16 text-center">
                  {item.weight}%
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <p className="text-base font-bold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.description || "Tidak ada deskripsi."}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">Belum ada kriteria penilaian untuk babak ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}