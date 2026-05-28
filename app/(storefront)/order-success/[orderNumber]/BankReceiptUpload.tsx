"use client";

import { useState } from "react";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Props {
  orderId: string;
  orderNumber: string;
}

export function BankReceiptUpload({ orderId, orderNumber }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or PDF file");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `receipts/${orderNumber}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        toast.error("Upload failed. Please try again.");
        return;
      }

      // Receipts bucket is private — store the path; admin generates signed URLs when viewing
      const res = await fetch("/api/orders/upload-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, storagePath: path }),
      });

      if (!res.ok) {
        toast.error("Failed to save receipt. Please contact us.");
        return;
      }

      setUploaded(true);
      toast.success("Receipt uploaded! We'll verify your payment shortly.");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
      {uploading ? (
        <Loader2 className="w-7 h-7 text-wine animate-spin" aria-hidden="true" />
      ) : (
        <Upload className="w-7 h-7 text-wine/60" aria-hidden="true" />
      )}
      <div className="text-center">
        <p className="text-sm font-body font-medium text-ink">
          {uploading ? "Uploading…" : "Upload payment receipt"}
        </p>
        <p className="text-xs text-ink-light mt-0.5">JPG, PNG or PDF · Max 5 MB</p>
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="sr-only"
        onChange={handleChange}
        disabled={uploading}
        aria-label="Upload bank transfer receipt"
      />
    </label>
  );
}
