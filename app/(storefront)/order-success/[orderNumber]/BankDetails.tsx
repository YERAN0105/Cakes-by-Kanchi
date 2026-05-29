"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Field {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  copyable?: boolean;
}

interface Props {
  fields: Field[];
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className="ml-2 p-1 rounded text-ink-light hover:text-wine hover:bg-wine/10 transition-colors shrink-0"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-green-600" />
        : <Copy className="w-3.5 h-3.5" />
      }
    </button>
  );
}

export function BankDetails({ fields }: Props) {
  return (
    <div className="space-y-2 text-sm font-body bg-blush-light/60 rounded-lg p-4">
      {fields.map((field) => (
        <div key={field.label} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-ink-light shrink-0">{field.label}:</span>
            <span className={`font-medium truncate ${field.highlight ? "text-wine font-mono" : field.mono ? "text-ink font-mono" : "text-ink"}`}>
              {field.value}
            </span>
          </div>
          {field.copyable && <CopyButton value={field.value} />}
        </div>
      ))}
    </div>
  );
}
