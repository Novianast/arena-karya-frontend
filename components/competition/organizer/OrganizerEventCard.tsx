"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Layers, Trophy } from "lucide-react";
import PosterModal from "@/components/ui/PosterModal";
import { usePoster } from "@/hooks/usePoster";

export default function EventCard({ event }: { event: any }) {
  const formatDateIndo = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const posterSrc = usePoster(event?.poster);
  const packageName = event?.package_payments?.packages?.package_name || "-";
  
  let badgeStyle = "bg-green-500 text-white";
  if (packageName.toUpperCase() === "KARYA") {
    badgeStyle = "bg-primary text-white";
  } else if (packageName.toUpperCase() === "MAHAKARYA") {
    badgeStyle = "bg-accent text-white";
  }

  return (
    <div className="bg-white rounded-lg border border-padded-white overflow-hidden flex flex-col hover:shadow-md transition-all">
      <div className="relative w-full h-55 overflow-hidden rounded-lg">
        <PosterModal src={posterSrc} alt={event.event_name} />
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-gray-800 line-clamp-2 text-base flex-1">
            {event.event_name}
          </h4>
          <span className={`text-xs px-3 py-1 rounded-lg font-bold whitespace-nowrap shrink-0 ${badgeStyle}`}>
            {packageName.toUpperCase()}
          </span>
        </div>

        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs text-gray-600">Status :</span>
          <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${
            event.status === 'active' 
              ? 'bg-green-100 text-green-500' 
              : 'bg-amber-100 text-amber-500'
          }`}>
            {event.status === 'active' ? 'Aktif' : 'Draft'}
          </span>
        </div>

        <hr className="border-gray-100 my-1" />

        <div className="space-y-3 flex-1 mt-3">
          <div className="flex gap-3">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Waktu Pelaksanaan</p>
              <p className="text-xs text-gray-700 font-semibold">
                {formatDateIndo(event.start_date)} - {formatDateIndo(event.end_date)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Lokasi</p>
              <p className="text-xs text-gray-700 font-semibold">
                {event.location || "Online"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center">
              <Layers className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Multi Lomba</p>
              <p className="text-xs text-gray-700 font-semibold">
                {event.allow_multi_comp ? "Diperbolehkan" : "Satu Kompetisi"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 shrink-0 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Lomba Tersedia</p>
              <p className="text-xs text-gray-700 font-semibold">
                {event.competition_count || 0} Jenis Lomba
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Link
          href={`event/${event.event_id}`}
          className="w-full text-center bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-all block"
        >
          Kelola Event
        </Link>
      </div>
    </div>
  );
}