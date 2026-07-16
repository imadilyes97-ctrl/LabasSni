"use client";

import { useState, useCallback } from "react";
import type { UploadState, TryOnResponse, TryonMode } from "@/lib/types";
import { generateTryOn } from "@/lib/api";

export function useTryOn(productType?: string) {
  const [upload, setUpload] = useState<UploadState>({});
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-sélection du mode selon le type de produit
  const initialMode = (): TryonMode => {
    if (!productType) return "article_unique";
    const multi = ["tenue", "ensemble", "costume", "pack", "lot"];
    if (multi.some((k) => productType.toLowerCase().includes(k))) {
      return "tenue_complete";
    }
    return "article_unique";
  };

  const [mode, setMode] = useState<TryonMode>(initialMode);

  const setPersonPhoto = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    setUpload((prev) => ({ ...prev, personPhoto: file, personPreview: preview }));
  }, []);

  const setProductPhoto = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    setUpload((prev) => ({ ...prev, productPhoto: file, productPreview: preview }));
  }, []);

  const submit = useCallback(async () => {
    if (!upload.personPhoto || !upload.productPhoto) {
      setError("Prends une photo et choisis un produit d'abord !");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateTryOn(
        upload.personPhoto,
        upload.productPhoto,
        productType || "vêtement",
        mode,
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [upload, mode, productType]);

  const reset = useCallback(() => {
    setUpload({});
    setResult(null);
    setError(null);
  }, []);

  return {
    upload,
    result,
    loading,
    error,
    mode,
    setMode,
    setPersonPhoto,
    setProductPhoto,
    submit,
    reset,
  };
}
