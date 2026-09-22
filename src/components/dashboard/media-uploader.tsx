"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_MIME, ALLOWED_VIDEO_MIME, LIMITS } from "@/lib/constants";

export interface MediaValue {
  url: string;
  type: "IMAGE" | "VIDEO";
}

interface Pending {
  id: string;
  name: string;
  progress: number;
  type: "IMAGE" | "VIDEO";
  error?: string;
}

/** Re-encodes an image in the browser: fixes orientation, removes EXIF/GPS, keeps uploads under serverless body limits. */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const q of [0.86, 0.75, 0.62]) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", q));
      if (blob && blob.size <= LIMITS.maxImageBytes - 200_000) return blob;
    }
  } catch {
    /* fall through to original */
  }
  return file;
}

function xhrUpload(url: string, body: FormData, onProgress: (p: number) => void): Promise<{ status: number; json: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON */
      }
      resolve({ status: xhr.status, json });
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(body);
  });
}

export function MediaUploader({ value, onChange, error }: { value: MediaValue[]; onChange: (v: MediaValue[]) => void; error?: string }) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const images = value.filter((m) => m.type === "IMAGE");
  const videos = value.filter((m) => m.type === "VIDEO");

  const patch = (id: string, p: Partial<Pending>) => setPending((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const uploadOne = useCallback(async (file: File) => {
    const isVideo = (ALLOWED_VIDEO_MIME as readonly string[]).includes(file.type);
    const isImage = (ALLOWED_IMAGE_MIME as readonly string[]).includes(file.type);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: Pending = { id, name: file.name, progress: 0, type: isVideo ? "VIDEO" : "IMAGE" };
    setPending((l) => [...l, item]);
    const fail = (msg: string) => patch(id, { error: msg });

    if (!isVideo && !isImage) return fail("Unsupported file. Use JPG, PNG, WebP (photos) or MP4/WebM/MOV (videos).");
    const current = valueRef.current;
    if (isImage && current.filter((m) => m.type === "IMAGE").length >= LIMITS.maxImages) return fail(`Maximum ${LIMITS.maxImages} photos.`);
    if (isVideo && current.filter((m) => m.type === "VIDEO").length >= LIMITS.maxVideos) return fail(`Maximum ${LIMITS.maxVideos} videos.`);
    if (isVideo && file.size > LIMITS.maxVideoBytes) return fail(`Video is larger than ${LIMITS.maxVideoBytes / 1024 / 1024} MB.`);

    try {
      let url: string | undefined;
      if (isVideo) {
        const signRes = await fetch("/api/upload/sign", { method: "POST" });
        const sign = await signRes.json();
        if (!signRes.ok) return fail(sign.error ?? "Could not start upload.");
        const fd = new FormData();
        fd.append("file", file);
        if (sign.direct) {
          fd.append("api_key", sign.apiKey);
          fd.append("timestamp", String(sign.timestamp));
          fd.append("signature", sign.signature);
          fd.append("folder", sign.folder);
          fd.append("allowed_formats", sign.allowed_formats);
          const r = await xhrUpload(`https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`, fd, (p) => patch(id, { progress: p }));
          url = typeof r.json.secure_url === "string" ? r.json.secure_url : undefined;
          if (!url) return fail("Video upload failed. Check format and size.");
        } else {
          fd.append("kind", "video");
          const r = await xhrUpload("/api/upload", fd, (p) => patch(id, { progress: p }));
          if (r.status !== 200) return fail(String(r.json.error ?? "Video upload failed."));
          url = String(r.json.url);
        }
      } else {
        const blob = await compressImage(file);
        const fd = new FormData();
        fd.append("file", blob, file.name.replace(/\.\w+$/, "") + ".jpg");
        const r = await xhrUpload("/api/upload", fd, (p) => patch(id, { progress: p }));
        if (r.status !== 200) return fail(String(r.json.error ?? "Upload failed."));
        url = String(r.json.url);
      }
      // Update the ref synchronously: parallel uploads can finish before React re-renders.
      valueRef.current = [...valueRef.current, { url, type: isVideo ? "VIDEO" : "IMAGE" }];
      onChange(valueRef.current);
      setPending((l) => l.filter((x) => x.id !== id));
    } catch {
      fail("Network error. Please try again.");
    }
  }, [onChange]);

  function addFiles(files: FileList | File[]) {
    // Upload sequentially-ish (max 3 at a time) to stay within the upload rate limit
    const queue = Array.from(files);
    const worker = async () => {
      for (let f = queue.shift(); f; f = queue.shift()) await uploadOne(f);
    };
    void Promise.all([worker(), worker(), worker()]);
  }

  function reorderImages(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const copy = [...images];
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m!);
    onChange([...copy, ...videos]);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn("rounded-xl border-2 border-dashed p-6 text-center transition-colors", dragging ? "border-primary bg-primary-soft" : "border-border bg-muted/40", error && "border-danger")}
      >
        <ImagePlus className="mx-auto size-9 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 font-medium">Drag &amp; drop photos and videos here</p>
        <p className="text-sm text-muted-foreground">
          up to {LIMITS.maxImages} photos (JPG/PNG/WebP) and {LIMITS.maxVideos} videos (MP4/WebM/MOV, max {LIMITS.maxVideoBytes / 1024 / 1024} MB)
        </p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Choose files
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={[...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME].join(",")}
          className="sr-only"
          aria-label="Upload photos and videos"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">Location data is removed from photos and a small watermark is added automatically.</p>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}

      {pending.length > 0 && (
        <ul className="space-y-2" aria-label="Uploads in progress">
          {pending.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">{p.name}</span>
                {p.error ? (
                  <button type="button" onClick={() => setPending((l) => l.filter((x) => x.id !== p.id))} className="shrink-0 font-medium text-danger underline">Dismiss</button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />{p.progress}%</span>
                )}
              </div>
              {p.error ? (
                <p role="alert" className="mt-1 text-danger">{p.error}</p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${p.name}`}>
                  <div className="h-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Photos ({images.length}/{LIMITS.maxImages}), the first photo is the cover</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((m, i) => (
              <li key={m.url} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={`Photo ${i + 1}`} className="size-full object-cover" loading="lazy" />
                  {i === 0 && <span className="absolute start-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground"><Star className="size-3" aria-hidden="true" />Cover</span>}
                </div>
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <div className="flex">
                    <IconBtn label="Move earlier" disabled={i === 0} onClick={() => reorderImages(i, i - 1)}><ArrowLeft className="rtl-flip size-4" /></IconBtn>
                    <IconBtn label="Move later" disabled={i === images.length - 1} onClick={() => reorderImages(i, i + 1)}><ArrowRight className="rtl-flip size-4" /></IconBtn>
                  </div>
                  <div className="flex">
                    {i !== 0 && <IconBtn label="Make cover photo" onClick={() => reorderImages(i, 0)}><Star className="size-4" /></IconBtn>}
                    <IconBtn label="Remove photo" danger onClick={() => onChange(value.filter((v) => v.url !== m.url))}><Trash2 className="size-4" /></IconBtn>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Videos ({videos.length}/{LIMITS.maxVideos})</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {videos.map((m, i) => (
              <li key={m.url} className="overflow-hidden rounded-lg border border-border bg-card">
                <video src={m.url} controls preload="metadata" className="aspect-video w-full bg-black" aria-label={`Video ${i + 1} preview`} />
                <div className="flex items-center justify-between p-1.5">
                  <span className="flex items-center gap-1 px-2 text-sm text-muted-foreground"><VideoIcon className="size-4" aria-hidden="true" />Video {i + 1}</span>
                  <IconBtn label="Remove video" danger onClick={() => onChange(value.filter((v) => v.url !== m.url))}><Trash2 className="size-4" /></IconBtn>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn("inline-flex size-9 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30", danger && "text-danger")}
    >
      {children}
    </button>
  );
}
