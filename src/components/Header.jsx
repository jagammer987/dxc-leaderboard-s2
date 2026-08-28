import React, { useRef } from 'react';
import { 
  Tv, 
  Share2, 
  FileSpreadsheet, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  Flame, 
  CloudLightning, 
  Sparkles, 
  Camera, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { TRACKS } from '../utils/constants';
import { soundEffects } from '../utils/soundFx';

export default function Header({
  selectedTrack,
  setSelectedTrack,
  onOpenAdminModal,
  onOpenExcelModal,
  onOpenShareModal,
  onOpenLogoModal,
  onOpenLoginModal,
  onToggleKiosk,
  onTriggerStartLights,
  isMuted,
  toggleMute,
  isSyncing,
  autoRefreshInterval,
  totalDriversCount,
  customLogo,
  isAdmin,
  onLogoutAdmin
}) {
  const currentTrackData = TRACKS.find(t => t.id === selectedTrack) || TRACKS[0];
  
  // Secret Triple-Click on Logo to open Stealth Admin PIN modal
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const handleLogoClick = () => {
    if (isAdmin) {
      soundEffects.playClick();
      onOpenLogoModal();
      return;
    }

    clickCountRef.current += 1;
    if (clickCountRef.current === 1) {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    } else if (clickCountRef.current >= 3) {
      clearTimeout(clickTimerRef.current);
      clickCountRef.current = 0;
      soundEffects.playClick();
      onOpenLoginModal();
    }
  };

  const handleTrackChange = (trackId) => {
    soundEffects.playClick();
    setSelectedTrack(trackId);
  };

  return (
    <header className="w-full bg-[#000000] border-b border-red-600/40 sticky top-0 z-30 shadow-2xl">
      <div className="scanline"></div>

      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        
        {/* Brand & Logo (With Stealth 3-Click Admin Trigger) */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div 
            onClick={handleLogoClick}
            className="relative cursor-pointer select-none"
            title={isAdmin ? 'Change Logo' : 'DriftxCommune'}
          >
            {customLogo ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#000000] border-2 border-red-600 p-1 flex items-center justify-center overflow-hidden shadow-lg shadow-red-600/30">
                <img src={customLogo} alt="DriftxCommune" className="max-w-full max-h-full object-contain filter drop-shadow" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#000000] border-2 border-red-600 flex items-center justify-center">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            )}
            {isAdmin && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-black flex items-center justify-center">
                <Camera className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 
                onClick={handleLogoClick}
                className="text-lg sm:text-2xl font-black font-display tracking-wider text-white cursor-pointer select-none"
              >
                DRIFT<span className="text-red-600">x</span>COMMUNE
              </h1>
              {isAdmin ? (
                <span className="bg-red-600 text-white font-mono text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-sm flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>MARSHAL CONSOLE</span>
                </span>
              ) : (
                <span className="bg-red-600/20 text-red-500 border border-red-600/50 text-[9px] sm:text-[10px] font-mono font-extrabold px-1.5 sm:px-2 py-0.5 rounded uppercase">
                  LIVE TIMING
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] font-tech text-neutral-300">
              <span className="text-red-500 font-bold">{totalDriversCount} DRIVERS</span> • TIME TRIALS
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Admin-Only Action Buttons (Rendered ONLY when logged in as Marshal) */}
          {isAdmin && (
            <>
              {autoRefreshInterval > 0 && (
                <span className="hidden lg:flex items-center text-red-500 font-tech font-bold text-xs bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-600/40">
                  <CloudLightning className={`w-3.5 h-3.5 mr-1 ${isSyncing ? 'animate-spin' : 'animate-pulse'}`} />
                  SYNC ({autoRefreshInterval}s)
                </span>
              )}

              {/* Start Lights */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onTriggerStartLights();
                }}
                className="hidden sm:flex p-2 rounded-lg bg-[#0D0D0D] hover:bg-[#1A1A1A] text-red-500 hover:text-white border border-neutral-800 text-xs font-tech font-bold transition"
                title="Start Lights Sequence"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Excel Sync */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onOpenExcelModal();
                }}
                className="hidden sm:flex items-center space-x-1.5 bg-[#0D0D0D] hover:bg-[#1A1A1A] text-white border border-neutral-800 hover:border-red-600 px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-red-500" />
                <span>EXCEL SYNC</span>
              </button>

              {/* Log Lap Primary Button */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onOpenAdminModal();
                }}
                className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white font-tech font-bold px-3.5 py-1.5 rounded-lg text-xs tracking-wider transition shadow-lg shadow-red-600/40 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ LOG LAP</span>
              </button>

              {/* Lock / Exit Admin Button */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onLogoutAdmin();
                }}
                className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white border border-red-600/40 transition"
                title="Lock / Logout Marshal Console"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Clean Public Tools: Share, TV Mode & Audio */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenShareModal();
            }}
            className="flex items-center space-x-1.5 bg-[#0D0D0D] hover:bg-[#1A1A1A] text-white border border-neutral-800 hover:border-red-600 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition"
            title="Share Public Link & QR Code"
          >
            <Share2 className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">SHARE</span>
          </button>

          {/* TV Broadcast Mode */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onToggleKiosk();
            }}
            className="p-2 rounded-lg bg-[#0D0D0D] hover:bg-[#1A1A1A] text-neutral-300 hover:text-white border border-neutral-800 transition"
            title="Overhead TV Kiosk Display Mode"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Audio */}
          <button 
            onClick={toggleMute}
            className="p-2 rounded-lg bg-[#0D0D0D] hover:bg-[#1A1A1A] text-neutral-400 hover:text-white border border-neutral-800 transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Stage Navigation Bar */}
      <div className="bg-[#050505] border-t border-neutral-900 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* The 3 Stage Tabs */}
          <div className="flex items-center space-x-2 shrink-0">
            {TRACKS.map((track) => {
              const isSelected = track.id === selectedTrack;
              return (
                <button
                  key={track.id}
                  onClick={() => handleTrackChange(track.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-tech font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-500'
                      : 'bg-[#0F0F0F] hover:bg-[#1A1A1A] text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  <span>{track.flag}</span>
                  <span>{track.stageBadge}</span>
                </button>
              );
            })}
          </div>

          {/* Benchmark Record */}
          <div className="hidden sm:flex text-[11px] font-tech text-neutral-400 items-center space-x-3 shrink-0">
            <span className="text-white font-semibold">{currentTrackData.name} ({currentTrackData.length})</span>
            <span className="text-neutral-600">•</span>
            <span className="text-red-500 font-mono-num font-bold">RECORD: {currentTrackData.record}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
