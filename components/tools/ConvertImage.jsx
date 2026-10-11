"use client";

import { useEffect, useState } from "react";
import ImageBatch from "./ImageBatch";
import { Field, QualitySlider, Segmented } from "./ui";
import { useEncodableFormats } from "./hooks";
import { formatForMime, reencodeImage } from "@/lib/images";
import { withExtension } from "@/lib/files";

export default function ConvertImage() {
  const formats = useEncodableFormats();
  const [mime, setMime] = useState("image/jpeg");
  const [quality, setQuality] = useState(0.9);
  const target = formatForMime(mime);

  // Fall back to PNG if the browser can't write the chosen format.
  useEffect(() => {
    if (formats.length && !formats.some((f) => f.mime === mime)) setMime("image/png");
  }, [formats, mime]);

  const process = async (file) => ({
    blob: await reencodeImage(file, { mime, quality }),
    name: withExtension(file.name, target.ext),
  });

  return (
    <ImageBatch
      settingsKey={`${mime}:${quality}`}
      process={process}
      actionLabel={`Convert to ${target.label}`}
      zipName="converted-images.zip"
      settings={
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Convert to">
            <Segmented
              label="Convert to"
              value={mime}
              onChange={setMime}
              options={formats.map((f) => ({ value: f.mime, label: f.label }))}
            />
          </Field>
          {target.lossy && <QualitySlider value={quality} onChange={setQuality} />}
          {mime === "image/jpeg" && (
            <p className="text-xs text-gray-500 sm:col-span-2">
              JPG has no transparency, so transparent areas become white.
            </p>
          )}
        </div>
      }
    />
  );
}
