"use client";

import { useRef, useCallback, useState } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const descId = `upload-desc-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const announceId = `upload-announce-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const clearAnnouncement = useCallback(() => {
    setTimeout(() => setAnnouncement(""), 3000);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onChange(file);
        setAnnouncement(`${label} chargée : ${file.name}`);
        clearAnnouncement();
      }
    },
    [onChange, label, clearAnnouncement]
  );

  const handleClick = () => inputRef.current?.click();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      setAnnouncement(`${label} chargée : ${file.name}`);
      clearAnnouncement();
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all
          ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800/50"
          }`}
        role="button"
        tabIndex={0}
        aria-describedby={descId}
        aria-label={label}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        {preview ? (
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
            <img
              src={preview}
              alt={`${label} — prévisualisation`}
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
            <div
              className={`text-4xl transition-all ${
                isDragging ? "text-indigo-400 scale-110" : "opacity-30"
              }`}
              aria-hidden="true"
            >
              +
            </div>
            <div className="text-center" id={descId}>
              <p className="text-sm font-medium text-zinc-300">{label}</p>
              <p className="mt-1 text-xs text-zinc-500">{description}</p>
              <p className="mt-2 text-[11px] text-zinc-600">
                Cliquez ou glissez-déposez
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Annonce pour lecteurs d'écran */}
      <div
        id={announceId}
        role="status"
        aria-live="polite"
        className="sr-only"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </>
  );
}
