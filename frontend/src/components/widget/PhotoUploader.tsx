"use client";

import { useRef, useCallback } from "react";

interface PhotoUploaderProps {
  label: string;
  description: string;
  preview?: string;
  onChange: (file: File) => void;
  accept?: string;
}

export function PhotoUploader({
  label,
  description,
  preview,
  onChange,
  accept = "image/*",
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onChange(file);
    },
    [onChange]
  );

  const handleClick = () => inputRef.current?.click();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-zinc-700
                 bg-zinc-900/50 p-6 transition-all hover:border-zinc-500 hover:bg-zinc-800/50"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />

      {preview ? (
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
          <img
            src={preview}
            alt="Prévisualisation"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
            <span className="text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Changer la photo
            </span>
          </div>
        </div>
      ) : (
        <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-xl bg-zinc-800/30">
          <div className="text-4xl opacity-30">+</div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-300">{label}</p>
            <p className="mt-1 text-xs text-zinc-500">{description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
