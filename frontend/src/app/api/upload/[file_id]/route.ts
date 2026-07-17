import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function validateFileId(fileId: string): boolean {
  return UUID_REGEX.test(fileId);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file_id: string }> }
) {
  const { file_id } = await params;

  if (!validateFileId(file_id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    for (const ext of ALLOWED_EXTENSIONS) {
      const filePath = path.resolve(UPLOAD_DIR, `${file_id}.${ext}`);

      // Protection path traversal
      if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) {
        continue;
      }

      if (existsSync(filePath)) {
        const buffer = await readFile(filePath);
        const contentType = MIME_MAP[ext] || "application/octet-stream";

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=86400",
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Fichier non trouvé" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lecture fichier" },
      { status: 500 }
    );
  }
}
