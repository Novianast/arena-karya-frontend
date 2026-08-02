"use client";

import React from "react";

export interface ColumnDef<T> {
  header: string;
  key?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface UserListTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  titleIcon?: React.ReactNode;
  titleText?: string;
  totalItems?: number;
}

export default function UserListTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = "Tidak ada data yang ditemukan.",
  titleIcon,
  titleText,
  totalItems
}: UserListTableProps<T>) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header Section */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-900 font-bold">
          {titleIcon && <div className="text-primary flex items-center">{titleIcon}</div>}
          <span>List Akun</span>
          {totalItems !== undefined && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        {titleText && (
          <>
            <div className="w-px h-5 bg-gray-300"></div>
            <div className="text-gray-500 font-medium">{titleText}</div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 font-bold">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={keyExtractor(item)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(item, index) : (item as any)[col.key as string]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
