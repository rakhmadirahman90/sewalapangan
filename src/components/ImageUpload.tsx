import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../lib/imageUtils';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Tolong unggah file gambar saja (JPG, PNG, WebP)');
      return;
    }

    setLoading(true);
    try {
      // High compression: 0.7 quality is visually indistinguishable for web but saves lots of space
      const compressed = await compressImage(file, 1080, 1080, 0.7);
      onChange(compressed);
    } catch (error) {
      console.error('Compression error:', error);
      alert('Gagal mengompres gambar. Silakan coba file lain.');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {value ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-gray-100 group">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Ganti Foto
            </button>
            <button
              onClick={() => onChange('')}
              className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "aspect-video w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all gap-2 p-6",
            isDragging 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-gray-100",
            loading && "pointer-events-none opacity-50"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-gray-500">Mengompres Gambar...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-900">Unggah Foto Lapangan</p>
                <p className="text-[10px] text-gray-500 font-medium">Klik atau tarik file ke sini (Maks 5MB)</p>
              </div>
            </>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
