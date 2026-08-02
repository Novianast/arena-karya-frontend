import { useState, useEffect } from "react";
import { getPosterUrl, DEFAULT_POSTER } from "@/services/url/getPosterUrl";

export const usePoster = (posterPath: string | null | undefined) => {
  const initialUrl = getPosterUrl(posterPath);
  const [posterSrc, setPosterSrc] = useState<string>(initialUrl);

  useEffect(() => {
    let active = true;
    // Update src jika posterPath dari props berubah
    const currentUrl = getPosterUrl(posterPath);
    setPosterSrc(currentUrl);

    const checkImage = async () => {
      try {
        const res = await fetch(currentUrl, { method: "HEAD" });
        if (!active) return;
        
        if (!res.ok) {
          setPosterSrc(DEFAULT_POSTER);
        } else {
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) {
            setPosterSrc(DEFAULT_POSTER);
          }
        }
      } catch (err) {
        if (active) setPosterSrc(DEFAULT_POSTER);
      }
    };

    checkImage();

    return () => { active = false; };
  }, [posterPath]);

  return posterSrc;
};