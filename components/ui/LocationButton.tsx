import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationButtonProps {
  type: 'meeting' | 'physical';
  urlOrLocation: string;
}

export default function LocationButton({ type, urlOrLocation }: LocationButtonProps) {
  const handleClick = () => {
    if (type === 'meeting') {
      window.open(urlOrLocation, '_blank');
    } else {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(urlOrLocation)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  if (type === 'meeting') {
    return (
      <button 
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
      >
        <ExternalLink size={14} />
        Buka Link Meeting
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors border border-green-200"
    >
      <MapPin size={14} />
      Buka Google Maps
    </button>
  );
}
