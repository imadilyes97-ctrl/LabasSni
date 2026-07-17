import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { requireAuth } from "@/lib/auth";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_IMAGE_SIZE_MB = parseInt(
  process.env.MAX_IMAGE_SIZE_MB || "10",
  10
);
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
  let clientId = "anonymous";

  try {
    const auth = requireAuth(request);
    clientId = auth.clientId;
  } catch {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const consent = formData.get("consent") === "true";
    const image = formData.get("image") as File | null;

    // Consentement RGPD obligatoire
    if (!consent) {
      return NextResponse.json(
        { error: "Consentement RGPD requis" },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "Image requise" },
        { status: 400 }
      );
    }

    // Validation MIME
    if (
      !image.type.startsWith("image/") ||
      !ALLOWED_MIME_TYPES.has(image.type)
    ) {
      return NextResponse.json(
        { error: "Format invalide" },
        { status: 400 }
      );
    }

    // Validation taille
    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Image trop volumineuse (max ${MAX_IMAGE_SIZE_MB}MB)`,
        },
        { status: 400 }
      );
    }

    // Validation extension
    const ext =
      (image.name || "").split(".").pop()?.toLowerCase() || "jpg";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Extension interdite: .${ext}` },
        { status: 400 }
      );
    }

    // Sauvegarde
    const fileId = crypto.randomUUID();
    const safeFilename = `${fileId}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await image.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, safeFilename), buffer);

    console.log(
      `📸 Upload: ${safeFilename} (${buffer.length} bytes) — client=${clientId}, consent=oui`
    );

    return NextResponse.json({
      id: fileId,
      url: `/api/upload/${fileId}`,
      size: buffer.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur upload",
      },
      { status: 500 }
    );
  }
}
