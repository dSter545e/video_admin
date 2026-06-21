"use client";

import Image from "next/image";
import { formatThumbnailSeekLabel } from "../lib/videoThumbnailOptions";

export type ThumbnailPickerOption = {
  seekSeconds: number;
  previewUrl: string;
};

type ThumbnailPickerProps = {
  options: ThumbnailPickerOption[];
  selectedSeekSeconds: number | null;
  onSelect: (option: ThumbnailPickerOption) => void;
  loading?: boolean;
  emptyMessage?: string;
};

export default function ThumbnailPicker({
  options,
  selectedSeekSeconds,
  onSelect,
  loading = false,
  emptyMessage = "No thumbnail frames available yet.",
}: ThumbnailPickerProps) {
  if (loading) {
    return <p className="admin-muted text-sm">Generating thumbnail options...</p>;
  }

  if (!options.length) {
    return <p className="admin-muted text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {options.map((option) => {
        const selected = selectedSeekSeconds === option.seekSeconds;
        return (
          <button
            key={`${option.seekSeconds}-${option.previewUrl}`}
            type="button"
            onClick={() => onSelect(option)}
            className={`overflow-hidden rounded border text-left transition ${
              selected
                ? "border-[var(--admin-brand)] ring-2 ring-[var(--admin-brand)]"
                : "border-[var(--admin-border)] hover:border-[var(--admin-brand)]"
            }`}
          >
            <div className="relative aspect-video bg-black/5">
              <Image
                src={option.previewUrl}
                alt={`Thumbnail at ${formatThumbnailSeekLabel(option.seekSeconds)}`}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <p className="px-2 py-1.5 text-xs font-medium">{formatThumbnailSeekLabel(option.seekSeconds)}</p>
          </button>
        );
      })}
    </div>
  );
}
