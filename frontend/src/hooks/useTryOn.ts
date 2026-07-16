"use client";

import { useState, useCallback } from "react";
import type { UploadState, TryOnResponse, TryonMode } from "@/lib/types";
import { generateTryOn } from "@/lib/api";

export function useTryOn() {
  const [upload, setUpload] = useState<UploadState>({});
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<TryonMode>("article_unique");

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
        "vêtement",
        mode,
      );
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [upload, mode]);

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
