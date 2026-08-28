import React, { useEffect, useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone
} from 'lucide-react';
import QRCode from 'qrcode';
import { TRACKS } from '../utils/constants';
import { soundEffects } from '../utils/soundFx';

export default function ShareQrModal({
  onClose,
  selectedTrack,
  sheetSyncUrl
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const currentTrackData = TRACKS.find(t => t.id === selectedTrack) || TRACKS[0];

  // Clean Shareable Public URL (Point directly to live leaderboard with active track)
  const getShareableUrl = () => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}?track=${selectedTrack}`;
    }
    return '';
  };

  const shareUrl = getShareableUrl();

  useEffect(() => {
    if (shareUrl) {
      // High-contrast clean QR code for 100% instant phone scanning
      QRCode.toDataURL(shareUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#E81728', // DriftxCommune Red
          light: '#FFFFFF'  // White background
        },
        errorCorrectionLevel: 'M'
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
    }
  }, [shareUrl]);

  const handleCopyLink = () => {
    soundEffects.playClick();
    if (navigator.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-tech">
      <div className="relative w-full max-w-md bg-[#080808] border border-red-600/50 rounded-2xl p-6 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
            <div>
              <h2 className="text-lg font-black font-display text-white uppercase tracking-wider">
                SHARE // DRIFT<span className="text-red-600">x</span>COMMUNE
              </h2>
              <p className="text-xs font-tech text-neutral-400">
                INSTANT MOBILE QR & PUBLIC TIMING LINK
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="p-3 bg-white border-4 border-red-600 rounded-2xl shadow-2xl shadow-red-600/30">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="DriftxCommune QR Code" 
                className="w-56 h-56 rounded-xl object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-neutral-500 font-tech text-xs">
                Generating QR...
              </div>
            )}
          </div>

          <div className="mt-3.5 text-center">
            <span className="text-sm font-display font-bold text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4 mr-1.5 text-red-500" />
              SCAN WITH ANY SMARTPHONE CAMERA
            </span>
            <span className="text-xs font-tech text-neutral-400 mt-0.5 block">
              Live Cloud Standings for <strong className="text-white">{currentTrackData.stageBadge}</strong>
            </span>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-2 font-tech">
          <label className="text-xs font-bold text-neutral-300 block uppercase">
            Live Public Leaderboard Link
          </label>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#000000] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold font-tech transition shadow-md cursor-pointer ${
                copied
                  ? 'bg-red-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED!' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-3 border-t border-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition font-tech cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
