import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Smartphone, 
  Flame, 
  ExternalLink 
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
  const canvasRef = useRef(null);

  const currentTrackData = TRACKS.find(t => t.id === selectedTrack) || TRACKS[0];

  // Construct Clean Shareable Public URL
  const getShareableUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set('track', selectedTrack);
    if (sheetSyncUrl) {
      params.set('sheet', encodeURIComponent(sheetSyncUrl));
    }
    return `${baseUrl}?${params.toString()}`;
  };

  const shareUrl = getShareableUrl();

  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#E81728', // DriftxCommune Red
          light: '#000000'  // Pure Black
        },
        errorCorrectionLevel: 'H'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
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
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div className="p-3 bg-[#000000] border-2 border-red-600/60 rounded-2xl shadow-xl shadow-red-600/20">
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

          <div className="mt-3 text-center">
            <span className="text-xs font-display font-bold text-white flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5 mr-1 text-red-500" />
              SCAN TO VIEW ON MOBILE
            </span>
            <span className="text-[11px] font-tech text-neutral-400">
              Opens {currentTrackData.stageBadge} Live Standings
            </span>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-2 font-tech">
          <label className="text-xs font-bold text-neutral-300 block uppercase">
            Shareable URL (Public Read-Only)
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
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold font-tech transition shadow-md ${
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
            className="px-4 py-2 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition font-tech"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
