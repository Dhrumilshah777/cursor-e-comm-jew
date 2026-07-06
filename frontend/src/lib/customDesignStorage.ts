export const CUSTOM_DESIGN_UPLOAD_KEY = "custom-design-upload";

export type CustomDesignUpload = {
  fileName: string;
  dataUrl: string;
  mimeType: string;
};

export function saveCustomDesignUpload(upload: CustomDesignUpload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CUSTOM_DESIGN_UPLOAD_KEY, JSON.stringify(upload));
}

export function getCustomDesignUpload(): CustomDesignUpload | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(CUSTOM_DESIGN_UPLOAD_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CustomDesignUpload;
  } catch {
    return null;
  }
}

export function clearCustomDesignUpload(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CUSTOM_DESIGN_UPLOAD_KEY);
}

export async function readImageFile(file: File): Promise<CustomDesignUpload> {
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image."));
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });

  return {
    fileName: file.name,
    dataUrl,
    mimeType: file.type,
  };
}
