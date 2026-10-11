"use client";

import { useState } from "react";
import ImageBatch from "./ImageBatch";
import { Field, QualitySlider, Segmented, Select } from "./ui";
import { useEncodableFormats } from "./hooks";
import { formatForMime, reencodeImage } from "@/lib/images";
import { withExtension } from "@/lib/files";

const MAX_SIDES = [
  { value: "0", label: "Keep original size" },
  { value: "3840", label: "Up to 3840 px (4K)" },
  { value: "2560", label: "Up to 2560 px" },
  { value: "1920", label: "Up to 1920 px (Full HD)" },
  { value: "1280", label: "Up to 1280 px" },
];

export default function CompressImage() {
  const formats = useEncodableFormats();
  const [mime, setMime] = useState("image/jpeg");
  const [quality, setQuality] = useState(0.7);
  const [maxSide, setMaxSide] = useState("0");
  const target = formatForMime(mime);
  // Canvas can only shrink files by lowering quality, which PNG doesn't have.
  const lossyFormats = formats.filter((f) => f.lossy);

  const process = async (file) => {
    const blob = await reencodeImage(file, { mime, quality, maxSide: Number(maxSide) || undefined });
    if (blob.size >= file.size) {
      return { blob: file, name: file.name, note: "Already well compressed, so the original was kept." };
    }
    return { blob, name: withExtension(file.name, target.ext) };
  };

  return (
    <ImageBatch
      settingsKey={`${mime}:${quality}:${maxSide}`}
      process={process}
      actionLabel="Compress"
      zipName="compressed-images.zip"
      settings={
        <div className="grid gap-5 sm:grid-cols-2">
          <QualitySlider value={quality} onChange={setQuality} />
          <Field label="Maximum size" htmlFor="max-side" hint="Shrinking large photos saves the most space.">
            <Select id="max-side" value={maxSide} onChange={setMaxSide} options={MAX_SIDES} />
          </Field>
          <Field label="Save as">
            <Segmented
              label="Save as"
              value={mime}
              onChange={setMime}
              options={lossyFormats.map((f) => ({ value: f.mime, label: f.label }))}
            />
          </Field>
          <p className="self-end text-xs text-gray-500">
            WEBP is usually smallest. JPG works everywhere but has no transparency.
          </p>
        </div>
      }
    />
  );
}
