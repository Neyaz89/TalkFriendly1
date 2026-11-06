"use client";

import React from "react";
import { FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewProps {
  document: {
    type: string;
    url: string;
    file_name: string;
    uploaded_at: string;
  };
  onRemove: () => void;
}

export function DocumentPreview({ document, onRemove }: DocumentPreviewProps) {
  const isImage = document.file_name.match(/\.(jpg|jpeg|png|gif)$/i);

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-xl bg-background hover:bg-gray-50 transition-colors">
      {/* Preview Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img src={document.url} alt={document.file_name} className="w-full h-full object-cover" />
        ) : (
          <FileText className="h-6 w-6 text-muted" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{document.file_name}</p>
        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Uploaded successfully
        </p>
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
