import React from 'react';

interface AdminDashboardCardProps {
  title: string;
  count: number | string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}

export default function AdminDashboardCard({ title, count, subtitle, icon, bgColor }: AdminDashboardCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-padded-white flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 my-0.5">{count}</h3>
        <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>
      </div>
    </div>
  );
}
