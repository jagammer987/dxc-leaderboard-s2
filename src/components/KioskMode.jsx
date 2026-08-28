import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flame, 
  Crown, 
  Activity,
  ArrowLeft
} from 'lucide-react';
import { TEAMS, TYRE_COMPOUNDS, TOURNAMENT_INFO } from '../utils/constants';

export default function KioskMode({
  leaderboard,
  currentTrack,
  onExitKiosk,
  isMuted,
  customLogo
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const itemsPerPage = 8;
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage) || 1;

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-cycle pages if more than itemsPerPage
  useEffect(() => {
    if (totalPages <= 1) return;
    const pageTimer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 10000);

    return () => clearInterval(pageTimer);
  }, [totalPages]);

  const pagedLaps = leaderboard.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const getTeamColor = (teamName) => {
    const t = TEAMS.find(team => team.name.toLowerCase() === (teamName || '').toLowerCase());
    return t ? t.color : '#FF1E27';
  };

  const getTyreBadge = (compoundId) => {
    return TYRE_COMPOUNDS.find(c => c.id === compoundId) || TYRE_COMPOUNDS[0];
  };

  const p1 = leaderboard.length > 0 ? leaderboard[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between overflow-y-auto select-none font-tech">
      
      {/* Floating Exit Button for Mobile & Desktop */}
      <button
        onClick={onExitKiosk}
        className="fixed top-3 right-3 z-50 flex items-center space-x-1.5 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase shadow-2xl border border-red-500 transition active:scale-95 cursor-pointer"
      >
        <X className="w-4 h-4" />
        <span>EXIT TV MODE</span>
      </button>

      {/* Top TV Broadcast Header */}
      <div className="w-full bg-[#050505] border-b border-red-600/40 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
        
        {/* Brand & Track Info */}
        <div className="flex items-center space-x-3 sm:space-x-6 pr-28">
          <div className="flex items-center space-x-3">
            {customLogo ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black border-2 border-red-600 p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img src={customLogo} alt="DriftxCommune" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black border-2 border-red-600 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black font-display tracking-widest text-white truncate">
                DRIFT<span className="text-red-600">x</span>COMMUNE
              </h1>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-red-500 tracking-widest uppercase block truncate">
                {currentTrack.stageBadge} // {currentTrack.name}
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock (Hidden on very small screens to give room) */}
        <div className="hidden md:block text-right pr-28">
          <div className="text-lg sm:text-xl font-black font-mono-num text-red-500">
            {currentTime}
          </div>
          <div className="text-[10px] font-tech text-neutral-400 tracking-wider">
            OVERHEAD BROADCAST
          </div>
        </div>
      </div>

      {/* Main Broadcast Grid */}
      <div className="flex-1 p-3 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 sm:gap-6 bg-[#000000]">
        
        {/* Left Column: Timing Tower List */}
        <div className="flex-1 flex flex-col justify-between bg-[#080808] border border-neutral-900 rounded-2xl p-3 sm:p-6 shadow-2xl">
          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-900">
            <span className="font-display font-black text-xs sm:text-sm uppercase tracking-widest text-white flex items-center">
              <Activity className="w-4 h-4 mr-2 text-red-600" /> LIVE TIME TRIAL STANDINGS
            </span>
            <span className="font-tech text-xs text-neutral-400">
              PAGE {currentPage + 1} OF {totalPages}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-around space-y-2">
            {pagedLaps.map((lap) => {
              const isP1 = lap.position === 1;
              const isP2 = lap.position === 2;
              const isP3 = lap.position === 3;
              const tyre = getTyreBadge(lap.tyre);
              const teamColor = getTeamColor(lap.team);

              return (
                <div
                  key={lap.id}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-300 ${
                    isP1 ? 'border-red-600/60 bg-[#0F0506]' : 'border-neutral-900 bg-[#000000]'
                  }`}
                >
                  {/* Position & Driver */}
                  <div className="flex items-center space-x-2.5 sm:space-x-4 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-display font-black text-xs sm:text-sm shrink-0 ${
                      isP1 ? 'bg-red-600 text-white' : isP2 ? 'bg-neutral-200 text-black font-bold' : isP3 ? 'bg-neutral-400 text-black font-bold' : 'bg-neutral-900 text-white'
                    }`}>
                      {lap.position}
                    </div>

                    <div 
                      className="w-1.5 h-6 sm:h-7 rounded-full shrink-0"
                      style={{ backgroundColor: teamColor }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-display font-extrabold text-sm sm:text-base text-white truncate">
                          {lap.driver}
                        </span>
                        {isP1 && <Crown className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      </div>
                      <div className="text-[10px] sm:text-xs font-tech text-neutral-400 flex items-center space-x-1.5 truncate">
                        <span className="text-neutral-300 truncate">{lap.team}</span>
                        <span>•</span>
                        <span className="text-neutral-400 shrink-0">{lap.rig}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sectors */}
                  <div className="hidden md:flex items-center space-x-2 font-mono-num text-xs">
                    <span className={`px-2 py-0.5 rounded ${lap.isS1Purple ? 'bg-red-950/80 text-red-500 font-bold border border-red-600' : 'text-neutral-400'}`}>
                      S1: {lap.s1 || '--.---'}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${lap.isS2Purple ? 'bg-red-950/80 text-red-500 font-bold border border-red-600' : 'text-neutral-400'}`}>
                      S2: {lap.s2 || '--.---'}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${lap.isS3Purple ? 'bg-red-950/80 text-red-500 font-bold border border-red-600' : 'text-neutral-400'}`}>
                      S3: {lap.s3 || '--.---'}
                    </span>
                  </div>

                  {/* Tyre */}
                  <div className="hidden sm:block mx-2 sm:mx-4 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold border ${tyre.bg} ${tyre.border} ${tyre.text}`}>
                      {tyre.badge} {tyre.id}
                    </span>
                  </div>

                  {/* Lap Time & Delta */}
                  <div className="text-right pl-3 font-mono-num shrink-0">
                    <div className={`text-base sm:text-xl font-black ${isP1 ? 'text-red-500 text-glow-red' : 'text-white'}`}>
                      {lap.lapTime}
                    </div>
                    <div className="text-[10px] sm:text-xs font-tech text-neutral-400">
                      {lap.gapToLeader}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Page Indicators */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-1.5 pt-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentPage ? 'w-8 bg-red-600' : 'w-2 bg-neutral-800'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Leader Highlight */}
        <div className="w-full lg:w-80 flex flex-col justify-between gap-4">
          {p1 && (
            <div className="bg-[#0F0506] border border-red-600/70 rounded-2xl p-4 sm:p-6 shadow-2xl glow-red">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs font-display font-black text-red-500 uppercase tracking-wider flex items-center">
                  <Crown className="w-4 h-4 mr-1 text-red-500" /> PACESETTER
                </span>
                <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded">
                  P1
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-display text-white truncate">
                {p1.driver}
              </h2>
              <p className="text-xs font-tech text-neutral-400 mb-3 sm:mb-4">
                {p1.team}
              </p>

              <div className="bg-[#000000] border border-red-600/40 rounded-xl p-3 sm:p-4 text-center mb-3">
                <span className="text-[10px] font-tech text-neutral-400 uppercase block">BEST LAP TIME</span>
                <span className="text-2xl sm:text-3xl font-black font-mono-num text-red-500 text-glow-red">
                  {p1.lapTime}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-tech text-center">
                <div className="bg-[#000000] p-2 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">SPEED</span>
                  <span className="font-bold text-white">{p1.topSpeed} km/h</span>
                </div>
                <div className="bg-[#000000] p-2 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block text-[10px]">RIG</span>
                  <span className="font-bold text-red-400">{p1.rig}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tournament Stages Banner */}
          <div className="bg-[#080808] border border-neutral-900 rounded-2xl p-4 text-xs font-tech text-neutral-300">
            <div className="font-bold text-white uppercase mb-1">DRIFTxCOMMUNE F1 SIM CUP</div>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              {TOURNAMENT_INFO.stages}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Exit Bar for Mobile */}
      <div className="w-full bg-[#050505] border-t border-neutral-900 px-4 py-2.5 flex items-center justify-between text-xs font-tech text-neutral-300">
        <span className="text-neutral-400 truncate">DRIFTxCOMMUNE // BROADCAST MODE</span>
        <button
          onClick={onExitKiosk}
          className="text-red-500 hover:text-white font-bold flex items-center space-x-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit TV View</span>
        </button>
      </div>
    </div>
  );
}
