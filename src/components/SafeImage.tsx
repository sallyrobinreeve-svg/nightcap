"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  fallbackLetter?: string;
};

/**
 * Remote avatars/media can 404 or break; avoid broken images and layout glitches.
 */
export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  sizes,
  fallbackLetter = "?",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src?.trim() || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-nightcap-muted text-nightcap-accent font-display ${
          fill ? "absolute inset-0" : "w-full h-full"
        } ${className}`}
        aria-hidden
      >
        {fallbackLetter.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt || ""}
        fill
        sizes={sizes ?? "200px"}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ""}
      width={width ?? 112}
      height={height ?? 112}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
