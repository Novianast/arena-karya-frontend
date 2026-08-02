'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Users, MapPin, ClipboardCheck } from 'lucide-react';

export interface TaskType {
  id: number;
  eventId: number;
  competitionId: number;
  eventName: string;
  competitionName: string;
  stageName: string;
  evaluationType: string;
  startDate: Date;
  endDate: Date;
  type: string;
  location: string;
  statusAssignment: string;
  competitionStatus?: string;
  eventStatus?: string;
}

interface TaskCardProps {
  task: TaskType;
  mode: 'active' | 'history';
}

export default function TaskCard({ task, mode }: TaskCardProps) {
  const now = new Date();
  
  // Ambil awal hari untuk startDate dan akhir hari untuk endDate
  const start = new Date(task.startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(task.endDate); end.setHours(23, 59, 59, 999);

  // Helper untuk menentukan label status di pojok kiri atas
  const getStatusLabel = () => {
    if (task.statusAssignment === 'cancelled') return { text: 'Dibatalkan', style: 'bg-red-100 text-red-600' };
    if (mode === 'history') return { text: 'Selesai', style: 'bg-green-100 text-green-700' };

    if (now >= start && now <= end) return { text: 'Berlangsung', style: 'bg-blue-500 text-white' };
    if (now < start) return { text: 'Segera', style: 'bg-yellow-500 text-white' };
    return { text: 'Selesai', style: 'bg-green-100 text-green-700' };
  };

  const label = getStatusLabel();

  // Logika Tombol
  const isJudgingTime = now >= start && now <= end;
  const isDraft = task.competitionStatus === 'draft' || task.eventStatus === 'draft';
  const canGrade = isJudgingTime && task.statusAssignment === 'active' && !isDraft;

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Bagian Atas: Info Lomba */}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-md ${label.style}`}>
            {label.text}
          </span>
        </div>
        
        <h3 className="text-gray-400 text-sm font-semibold mt-2">{task.eventName}</h3>
        <h2 className="text-lg font-bold text-gray-800">{task.competitionName}</h2>
        <p className="text-sm font-semibold text-gray-700 mb-4">{task.stageName}</p>
        
        <div className="space-y-3 text-sm text-gray-600 mb-6 mt-4">
            {/* Tanggal */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={16} />
                <span>Tanggal</span>
                </div>
                <span className="font-medium text-gray-800">
                {start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} - {end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            </div>

            {/* Tipe Lomba */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                <Users size={16} />
                <span>Tipe Lomba</span>
                </div>
                <span className="font-medium text-gray-800">{task.type}</span>
            </div>

            {/* Tipe Penilaian */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                <ClipboardCheck size={16} />
                <span>Penilaian</span>
                </div>
                <span className="font-medium text-gray-800">{task.evaluationType}</span>
            </div>

            {/* Lokasi */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={16} />
                <span>Lokasi</span>
                </div>
                <span className="font-medium text-gray-800 text-right truncate max-w-[60%]">
                {task.location}
                </span>
            </div>
        </div>
      </div>

      {/* Bagian Bawah: Tombol Action */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        {mode === 'history' ? (
          // Tombol untuk halaman History
          <Link 
            href={`/judge/history/${task.id}`} 
            className="block w-full text-center bg-gray-800 text-white font-medium py-2.5 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Lihat Detail
          </Link>
        ) : (
          // Tombol untuk halaman Home
          canGrade ? (
            <Link 
              href={`/judge/home/${task.id}`} 
              className="block w-full text-center bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Nilai Karya
            </Link>
          ) : (
            <button 
              disabled 
              className="w-full bg-gray-100 text-gray-400 font-medium py-2.5 rounded-lg cursor-not-allowed border border-gray-200"
            >
              {isDraft ? 'Belum Diterbitkan' : (now < start ? 'Penjurian Belum Dimulai' : 'Penjurian Selesai/Ditutup')}
            </button>
          )
        )}
      </div>
    </div>
  );
}