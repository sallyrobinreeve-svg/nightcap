"use client";

import { SafeImage } from "@/components/SafeImage";

interface EntryMediaImageProps {
  src: string;
  alt: string;
  label?: string;
}

/** Shows uploaded photos at their natural aspect ratio (no forced crop). */
export function EntryMediaImage({ src, alt, label }: EntryMediaImageProps) {
  return (
    <div>
      {label && <p className="text-nightcap-muted text-sm mb-2">{label}</p>}
      <div className="rounded-2xl overflow-hidden bg-nightcap-muted/20 flex justify-center">
        <SafeImage
          src={src}
          alt={alt}
          width={1200}
          height={1600}
          className="w-full h-auto max-h-[70vh] object-contain"
        />
      </div>
    </div>
  );
}
