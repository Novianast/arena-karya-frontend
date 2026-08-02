"use client";

import { CheckCircle2, Calendar, Edit3, Flag, UploadCloud, FileEdit, Trophy, Sparkles, MonitorPlay } from "lucide-react";

export default function TimelineStepper({ group, competitionName }: { group: any, competitionName: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getStepStatus = (startStr: string, endStr: string, isMilestone: boolean) => {
    const start = new Date(startStr); start.setHours(0, 0, 0, 0);
    const end = endStr ? new Date(endStr) : start; end.setHours(0, 0, 0, 0);

    // Jika hari ini sudah melewati tanggal akhir, berarti sudah Selesai (Done)
    if (today > end) return "done";
    
    // Jika hari ini berada di antara rentang waktu
    if (today >= start && today <= end) {
      return isMilestone ? "done" : "current";
    }
    
    return "upcoming";
  };

  const findTimeline = (type: string) => group.timelines.find((t: any) => t.timeline_type === type);

  const regTimeline = findTimeline("registration");
  const subTimeline = findTimeline("submission");
  const preTimeline = findTimeline("presentation");
  const judTimeline = findTimeline("judging");
  const annTimeline = findTimeline("announcement");
  const awdTimeline = findTimeline("award");

  const steps: any[] = [];

  // 1. Pendaftaran & Registrasi (Milestone)
  if (regTimeline) {
    steps.push({
      title: "Pendaftaran Dibuka",
      desc: "Peserta melakukan pendaftaran melalui website",
      dateStr: regTimeline.start_date,
      status: getStepStatus(regTimeline.start_date, regTimeline.start_date, true),
      icon: <Calendar size={18} strokeWidth={2.5} />
    });

    // 2. Verifikasi Bukti Pembayaran (Period)
    steps.push({
      title: "Verifikasi Bukti",
      desc: "Penyelenggara melakukan verifikasi pembayaran peserta lomba",
      dateStr: regTimeline.start_date,
      status: getStepStatus(regTimeline.start_date, regTimeline.end_date, false),
      icon: <Edit3 size={18} strokeWidth={2.5} />,
      isVerifikasi: true
    });
  }

  // 3. Babak Dimulai (Milestone)
  const trueBabakStart = group.babakStartDate || group.startDate;
  steps.push({
    title: `Babak ${group.title} ${group.isFinal ? '- Final' : '- Penyisihan'}`,
    desc: `Babak ${group.title} dimulai`,
    dateStr: trueBabakStart,
    status: getStepStatus(trueBabakStart, trueBabakStart, true),
    icon: <Flag size={18} strokeWidth={2.5} />
  });

  // 4. Pengiriman Karya (Period) ATAU Presentasi (Period)
  if (subTimeline) {
    steps.push({
      title: "Pengiriman Karya",
      desc: "Peserta mengirimkan karya terbaik mereka ke Website",
      dateStr: subTimeline.start_date,
      status: getStepStatus(subTimeline.start_date, subTimeline.end_date, false),
      icon: <UploadCloud size={18} strokeWidth={2.5} />
    });
  } else if (preTimeline) {
    steps.push({
      title: "Presentasi",
      desc: "Peserta melakukan presentasi karya atau uji kompetensi",
      dateStr: preTimeline.start_date,
      status: getStepStatus(preTimeline.start_date, preTimeline.end_date, false),
      icon: <MonitorPlay size={18} strokeWidth={2.5} />
    });
  }

  // 5. Penjurian (Period)
  if (judTimeline) {
    steps.push({
      title: "Penjurian",
      desc: "Juri menilai karya dari peserta yang telah dikirim",
      dateStr: judTimeline.start_date,
      status: getStepStatus(judTimeline.start_date, judTimeline.end_date, false),
      icon: <FileEdit size={18} strokeWidth={2.5} />
    });
  }

  // 6. Pengumuman (Period)
  if (annTimeline) {
    steps.push({
      title: group.isFinal ? "Pengumuman Juara" : "Pengumuman Kelolosan",
      desc: group.isFinal 
        ? "Penyelenggara mengumumkan Juara Lomba" 
        : `Penyelenggara mengumumkan kelolosan peserta lomba dari babak ini`,
      dateStr: annTimeline.start_date,
      status: getStepStatus(annTimeline.start_date, annTimeline.end_date, false),
      icon: <Trophy size={18} strokeWidth={2.5} />
    });
  }

  // 7. Pemberian Penghargaan (Period - Khusus Final)
  if (awdTimeline && group.isFinal) {
    steps.push({
      title: "Pemberian Penghargaan",
      desc: "Panitia memberikan sertifikat dan penghargaan kepada pemenang lomba",
      dateStr: awdTimeline.start_date,
      status: getStepStatus(awdTimeline.start_date, awdTimeline.end_date, false),
      icon: <Sparkles size={18} strokeWidth={2.5} />
    });
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm self-start w-full">
      <h2 className="font-bold text-lg mb-6 text-gray-900">Timeline Lomba</h2>
      <div className="space-y-0">
        {steps.map((item, idx, arr) => {
          const isLast = idx === arr.length - 1;
          const isDone = item.status === "done";
          const isCurrent = item.status === "current";
          
          let iconBg = "bg-gray-100 text-gray-300";
          if (isDone || isCurrent) iconBg = "bg-blue-600 text-white shadow-sm";

          let lineColor = "bg-gray-200";
          if (isDone) lineColor = "bg-blue-600";

          // Format Tanggal
          const dateFormatted = new Date(item.dateStr).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }).replace(' ', '\n');

          return (
            <div key={idx} className="flex gap-5 min-h-[90px]">
              {/* Kolom Tanggal Kiri */}
              <div className="w-10 pt-2 text-right shrink-0">
                <p className="text-xs font-semibold text-gray-500 leading-tight whitespace-pre-line">
                  {dateFormatted}
                </p>
              </div>

              {/* Node Garis & Ikon */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-[42px] h-[42px] rounded-full flex justify-center items-center z-10 transition-colors ${iconBg}`}>
                  {item.icon}
                </div>
                {!isLast && <div className={`w-[3px] flex-1 my-1 rounded-full transition-colors ${lineColor}`} />}
              </div>

              {/* Konten Kanan */}
              <div className="flex-1 pt-2 flex justify-between items-start gap-4 pb-6">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>

                <div className="shrink-0 mt-1">
                  {/* Tampilkan Checklist jika Done */}
                  {isDone && <CheckCircle2 className="text-[#10B981]" size={22} strokeWidth={2.5} />}
                  
                  {/* Tampilkan Loading Dots jika Current & merupakan tahap Verifikasi */}
                  {isCurrent && item.isVerifikasi && (
                    <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-sm">
                      <span className="text-sm text-white font-extrabold leading-none pb-1 tracking-widest">...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}