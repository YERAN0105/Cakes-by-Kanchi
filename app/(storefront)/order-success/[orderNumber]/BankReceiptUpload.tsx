"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle2, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  orderId: string;
  alreadyUploaded?: boolean;
}

export function BankReceiptUpload({ orderId, alreadyUploaded = false }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(alreadyUploaded);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndPreview = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or PDF file");
      return;
    }
    setSelectedFile(file);
    if (file.type !== "application/pdf") {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndPreview(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndPreview(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("orderId", orderId);

      const res = await fetch("/api/orders/upload-receipt", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Upload failed. Please try again.");
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setUploaded(true);
      toast.success("Receipt uploaded! We'll verify your payment shortly.");
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
        <div className="text-sm font-body">
          <p className="font-medium text-green-800">Receipt uploaded successfully</p>
          <p className="text-green-700">We&apos;ll verify your payment and update your order.</p>
        </div>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="rounded-xl border border-border bg-blush-light/40 p-4 space-y-4">
        {/* Preview */}
        <div className="flex items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg border border-border bg-cream flex items-center justify-center shrink-0">
              <FileText className="w-7 h-7 text-wine/60" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-ink truncate">{selectedFile.name}</p>
            <p className="text-xs text-ink-light mt-0.5">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove selected file"
            className="p-1.5 text-ink-light hover:text-destructive transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-wine text-cream text-sm font-body font-medium hover:bg-wine/90 disabled:opacity-60 transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload Receipt
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={uploading}
            className="px-4 py-2.5 rounded-lg border border-border text-sm font-body text-ink-light hover:text-ink hover:border-wine/40 disabled:opacity-60 transition-colors"
          >
            Change File
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      className={`flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        dragOver
          ? "border-wine bg-wine/5"
          : "border-border hover:border-wine/50 hover:bg-blush-light/40"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className="w-7 h-7 text-wine/60" aria-hidden="true" />
      <div className="text-center">
        <p className="text-sm font-body font-medium text-ink">Upload payment receipt</p>
        <p className="text-xs text-ink-light mt-0.5">JPG, PNG or PDF · Max 5 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="sr-only"
        onChange={handleChange}
        aria-label="Upload bank transfer receipt"
      />
    </label>
  );
}
