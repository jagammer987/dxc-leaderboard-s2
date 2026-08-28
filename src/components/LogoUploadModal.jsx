import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  Trash2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { soundEffects } from '../utils/soundFx';

export default function LogoUploadModal({
  currentLogo,
  onSaveLogo,
  onResetLogo,
  onClose
}) {
  const [previewLogo, setPreviewLogo] = useState(currentLogo || '/logo.png');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setErrorMsg('');

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewLogo(e.target.result);
      soundEffects.playClick();
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    soundEffects.playRadioChime();
    onSaveLogo(previewLogo);
    onClose();
  };

  const handleReset = () => {
    soundEffects.playClick();
    setPreviewLogo('/logo.png');
    onResetLogo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#080808] border border-red-600/50 rounded-2xl p-6 shadow-2xl my-8 font-tech">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white uppercase tracking-wider">
                LOGO // DRIFT<span className="text-red-600">x</span>COMMUNE
              </h2>
              <p className="text-xs text-neutral-400">
                CUSTOMIZE EMBLEM & BROADCAST WATERMARK
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-600/60 text-red-300 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Logo Preview */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="w-32 h-32 rounded-2xl bg-black border-2 border-red-600/70 p-2 flex items-center justify-center overflow-hidden shadow-xl shadow-red-600/20 mb-3">
            {previewLogo ? (
              <img 
                src={previewLogo} 
                alt="DriftxCommune Preview" 
                className="max-w-full max-h-full object-contain filter drop-shadow"
              />
            ) : (
              <span className="text-xs text-neutral-500">No logo</span>
            )}
          </div>
          <span className="text-xs text-neutral-400">
            Active Logo Preview
          </span>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-red-500 bg-red-950/30'
              : 'border-neutral-800 hover:border-red-600/60 bg-[#000000]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <UploadCloud className="w-7 h-7 mx-auto text-red-500 mb-1.5" />
          <p className="text-xs text-white font-bold">
            Drop new logo image here, or <span className="text-red-500 underline">browse</span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            PNG (transparent recommended), JPG, SVG or WebP (max 5MB)
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-3 border-t border-neutral-900 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs text-neutral-500 hover:text-red-400 font-bold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-md shadow-red-600/30"
            >
              <Check className="w-4 h-4" />
              <span>Apply Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
