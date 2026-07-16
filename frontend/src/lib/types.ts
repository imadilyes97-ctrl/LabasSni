/** Types partagés entre le widget et l'API */

export type TryonMode = "article_unique" | "tenue_complete" | "sequentiel";

export type GenerationStatus =
  | "en_attente"
  | "en_cours"
  | "termine"
  | "echoue";

export interface TryOnRequest {
  mode: TryonMode;
  type_produit: string;
  zone_corps: string;
  style_rendu: string;
  orientation: string;
  session_id?: string;
}

export interface TryOnResponse {
  id: string;
  status: GenerationStatus;
  image_url?: string;
  mode: TryonMode;
  message?: string;
  error?: string;
  validation_checklist?: Record<string, boolean>;
}

export interface DetectionResult {
  mode: TryonMode;
  type_produit: string;
  zone_corps: string;
  raison: string;
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  suggested_actions?: string[];
}

export interface UploadState {
  personPhoto?: File;
  productPhoto?: File;
  personPreview?: string;
  productPreview?: string;
  session_id?: string;
}
