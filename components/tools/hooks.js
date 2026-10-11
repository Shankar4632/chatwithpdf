"use client";

import { useEffect, useState } from "react";
import { encodableFormats } from "@/lib/images";

/** Image formats this browser can save to (needs the DOM, so empty during the first render). */
export function useEncodableFormats() {
  const [formats, setFormats] = useState([]);
  useEffect(() => setFormats(encodableFormats()), []);
  return formats;
}

/** A temporary URL for showing a File or Blob, freed when it changes or the component unmounts. */
export function useObjectUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
