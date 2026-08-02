"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trophy, Flag, FileUp, Headphones } from "lucide-react";

const iconMap = {
  trophy: Trophy,
  settings: Flag,
  file: FileUp,
  user: Headphones,
};

const formatAngka = (angka: number) => {
  return new Intl.NumberFormat("id-ID").format(angka);
};

export default function PackagePage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data: dbPackages, error } = await supabase
        .from("packages")
        .select("*")
        .order("price", { ascending: true });

      if (error) {
        console.error("Error fetching packages:", error);
        setLoading(false);
        return;
      }

      const transformed = dbPackages.map((pkg) => {
        let uploadText = "Format Unggahan Bebas";
        if (pkg.upload_format === "doc_img") uploadText = "Unggahan Dokumen & Gambar";
        else if (pkg.upload_format === "doc_img_vid") uploadText = "Unggahan Dokumen, Gambar & Tautan Video";

        const benefits = [
          { icon: "trophy", text: `Maksimal ${pkg.max_competitions} Jenis Lomba` },
          { icon: "settings", text: pkg.max_stages ? `Maksimal ${pkg.max_stages} Tahapan Lomba` : "Kustomisasi Tahapan Bebas" },
          { icon: "file", text: uploadText },
        ];

        if (pkg.package_name.toLowerCase() === "mahakarya") {
          benefits.push({ icon: "user", text: "Prioritas Dukungan Teknis" });
        }

        return {
          name: pkg.package_name,
          description: pkg.description || `Pilihan paket ${pkg.package_name}`,
          price: pkg.price,
          benefits,
          isIdeal: pkg.package_name.toLowerCase() === "karya"
        };
      });

      setPackages(transformed);
      setLoading(false);
    };

    fetchPackages();
  }, []);

  const handleBuyPackage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const role = session?.user?.user_metadata?.role || "";
      
      if (role === "organizer") {
        router.push("/organizer/event/create/package");
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("Gagal memeriksa sesi auth:", err);
      router.push("/login");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Memuat data paket...</div>;
  }

  if (packages.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Gagal memuat data paket.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <section className="text-center px-6 pt-24 pb-16">
        <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Pilihan Paket
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Pilih Paket Arena Karya yang Sesuai Skala <br className="hidden md:block" /> Event Anda
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
          {packages.map((pkg) => (
            <div 
              key={pkg.name} 
              className={`group relative bg-white rounded-3xl p-8 lg:p-10 flex flex-col border transition-all duration-300 ease-out ${
                pkg.isIdeal 
                  ? 'border-blue-200 bg-gradient-to-b from-blue-50/30 to-white shadow-md shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/60 hover:-translate-y-2 lg:scale-105 z-10' 
                  : 'border-gray-100 hover:border-blue-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-2'
              }`}
            >
              {pkg.isIdeal && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-[#1E62FF] text-white text-[12px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest z-10 shadow-lg shadow-blue-500/30">
                  Pilihan Ideal
                </div>
              )}

              <h2 className={`text-2xl font-bold mb-2 text-center ${pkg.isIdeal ? 'text-[#1E62FF]' : 'text-gray-800'}`}>
                {pkg.name}
              </h2>
              <p className="text-sm text-gray-500 mb-8 h-12 leading-relaxed text-center">
                {pkg.description}
              </p>
              
              <div className="mb-10 text-center">
                <span className="text-sm font-semibold text-gray-400">Mulai dari</span>
                <p className="text-[38px] lg:text-[42px] font-extrabold text-gray-900 tracking-tight mt-1 flex items-start justify-center">
                  <span className="text-2xl text-gray-400 font-medium mr-1 mt-1.5">Rp</span>
                  {formatAngka(pkg.price)}
                </p>
              </div>

              <ul className="space-y-5 mb-12 flex-1">
                {pkg.benefits.map((benefit: any, i: number) => {
                  const Icon = iconMap[benefit.icon as keyof typeof iconMap];
                  return (
                    <li key={i} className="flex items-start gap-4 text-[15px] text-gray-600">
                      <div className="shrink-0 mt-0.5 bg-blue-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300 text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="leading-relaxed font-medium">{benefit.text}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto">
                <button 
                  onClick={handleBuyPackage}
                  className={`w-full rounded-xl py-4 text-[15px] font-bold transition-all duration-300 active:scale-95 ${
                    pkg.isIdeal 
                      ? 'bg-gradient-to-r from-[#1E62FF] to-blue-600 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/30' 
                      : 'bg-gray-900 text-white hover:bg-[#1E62FF] hover:shadow-lg hover:shadow-blue-500/30'
                  }`}
                >
                  Beli Paket
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}