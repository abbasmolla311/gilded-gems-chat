import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadProductImage } from "@/lib/admin-images.functions";

export function ImageUpload({
  value,
  onChange,
  label = "Photo",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Please choose a photo smaller than 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
      const { url } = await uploadProductImage({
        data: {
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          dataBase64: btoa(binary),
        },
      });
      onChange(url);
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] tracking-luxe text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-4">
        {value ? (
          <img
            src={value}
            alt="Selected"
            loading="lazy"
            width={80}
            height={80}
            className="h-20 w-20 rounded-sm border border-border/70 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-sm border border-dashed border-border text-[10px] text-muted-foreground">
            No photo
          </div>
        )}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-sm border border-primary/50 px-4 py-2 text-xs tracking-luxe text-primary disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Upload photo"}
          </button>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="or paste an image link"
            className="block w-64 rounded-sm border border-input bg-background px-3 py-2 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
