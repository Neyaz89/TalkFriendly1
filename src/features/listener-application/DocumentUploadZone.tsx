"use client";

import React, { useCallback } from "react";
import { Upload, FileText } from "lucide-react";

interface DocumentUploadZoneProps {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  maxFiles: number;
}

export function DocumentUploadZone({ onUpload, isUploading, maxFiles }: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onUpload(files.slice(0, maxFiles));
    }
  }, [onUpload, maxFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files.slice(0, maxFiles));
    }
  };

  if (maxFiles <= 0) {
    return (
      <div className="border-2 border-border rounded-xl p-6 text-center bg-gray-50">
        <p className="text-sm text-muted">Maximum documents uploaded</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={handleFileInput}
        className="hidden"
        id="document-upload"
        disabled={isUploading}
      />
      <label htmlFor="document-upload" className="cursor-pointer">
        {isUploading ? (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium text-text">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-text mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted">
              PDF, JPG, PNG (Max 10MB per file, up to {maxFiles} file{maxFiles !== 1 ? 's' : ''})
            </p>
          </>
        )}
      </label>
    </div>
  );
}
