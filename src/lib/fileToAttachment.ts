import type { SourceType } from "@/lib/types";

export interface PendingAttachment {
  fileName: string;
  mimeType: string;
  base64: string;
  sourceType: SourceType;
}

function sourceTypeFor(mimeType: string): SourceType | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

export function fileToAttachment(file: File): Promise<PendingAttachment> {
  const sourceType = sourceTypeFor(file.type);
  if (!sourceType) {
    return Promise.reject(new Error("Unsupported file type — attach an image, PDF, or audio file."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ fileName: file.name, mimeType: file.type, base64, sourceType });
    };
    reader.readAsDataURL(file);
  });
}
