import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import PodiumTop3 from './components/PodiumTop3';
import LeaderboardTable from './components/LeaderboardTable';
import MobileRacerCards from './components/MobileRacerCards';
import TelemetryModal from './components/TelemetryModal';
import AdminLapEntryModal from './components/AdminLapEntryModal';
import AdminLoginModal from './components/AdminLoginModal';
import ExcelSyncModal from './components/ExcelSyncModal';
import ShareQrModal from './components/ShareQrModal';
import KioskMode from './components/KioskMode';
import StartingLights from './components/StartingLights';
import LogoUploadModal from './components/LogoUploadModal';

import { 
  TRACKS, 
  INITIAL_LEADERBOARD, 
  TOURNAMENT_INFO 
} from './utils/constants';
import { analyzeLeaderboard, parseLapInput } from './utils/timeUtils';
import { fetchLiveSheetData } from './utils/excelUtils';
import { isAdminAuthenticated, logoutAdminSession } from './utils/securityUtils';
import { soundEffects } from './utils/soundFx';
import { Search, X, ChevronUp, Layers, List } from 'lucide-react';

export default function App() {
  // 1. Initial State from URL params or LocalStorage
  const [selectedTrack, setSelectedTrack] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTrack = params.get('track');
      if (urlTrack && TRACKS.some(t => t.id === urlTrack.toLowerCase())) {
        return urlTrack.toLowerCase();
      }
    }
    return 'redbullring';
  });

  const [sheetSyncUrl, setSheetSyncUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSheet = params.get('sheet');
      if (urlSheet) return decodeURIComponent(urlSheet);
      return localStorage.getItem('driftx_sheet_url') || '';
    }
    return '';
  });

  const [customLogo, setCustomLogo] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('driftx_custom_logo') || '/logo.png';
    }
    return '/logo.png';
  });

  // Admin Mode (Strictly Authenticated Check)
  const [isAdmin, setIsAdmin] = useState(() => {
    return isAdminAuthenticated();
  });

  const [laps, setLaps] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('driftx_f1_laps_v4');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error('Error reading localStorage laps:', e);
        }
      }
    }
    return INITIAL_LEADERBOARD;
  });

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [pinnedDriverId, setPinnedDriverId] = useState(null);
  const [mobileSearch, setMobileSearch] = useState('');

  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStartLights, setShowStartLights] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [selectedDriverTelemetry, setSelectedDriverTelemetry] = useState(null);

  // 2. Secret URL / Route Trigger for Marshal Login (?admin=login or ?marshal=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'login' || params.get('marshal') === '1') {
        setShowLoginModal(true);
        params.delete('admin');
        params.delete('marshal');
        const cleanUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', cleanUrl.replace(/\?$/, ''));
      }
    }
  }, []);

  // 3. Secret Keyboard Shortcut (Ctrl + Shift + A) to open Marshal Login
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape for Kiosk
      if (e.key === 'Escape' && isKioskMode) {
        setIsKioskMode(false);
      }
      // Ctrl + Shift + A (or Command + Shift + A) triggers Stealth Admin Login
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        soundEffects.playClick();
        setShowLoginModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKioskMode]);

  // 4. Persist Laps & Logo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('driftx_f1_laps_v4', JSON.stringify(laps));
    }
  }, [laps]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (customLogo) {
        localStorage.setItem('driftx_custom_logo', customLogo);
      } else {
        localStorage.removeItem('driftx_custom_logo');
      }
    }
  }, [customLogo]);

  // Clean Shareable URL sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('driftx_sheet_url', sheetSyncUrl);
      const url = new URL(window.location);
      url.searchParams.set('track', selectedTrack);
      if (sheetSyncUrl) {
        url.searchParams.set('sheet', encodeURIComponent(sheetSyncUrl));
      } else {
        url.searchParams.delete('sheet');
      }
      url.searchParams.delete('admin');
      url.searchParams.delete('marshal');
      window.history.replaceState({}, '', url);
    }
  }, [selectedTrack, sheetSyncUrl]);

  // 5. Live Google Sheet Polling
  const syncSheetData = useCallback(async (urlToFetch) => {
    const targetUrl = urlToFetch || sheetSyncUrl;
    if (!targetUrl) return;

    try {
      setIsSyncing(true);
      const fetchedLaps = await fetchLiveSheetData(targetUrl, selectedTrack);
      if (fetchedLaps && fetchedLaps.length > 0) {
        setLaps(fetchedLaps);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Sheet sync warning:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [sheetSyncUrl, selectedTrack]);

  useEffect(() => {
    if (sheetSyncUrl) {
      syncSheetData(sheetSyncUrl);
    }
  }, []);

  useEffect(() => {
    if (autoRefreshInterval > 0 && sheetSyncUrl) {
      const intervalId = setInterval(() => {
        syncSheetData(sheetSyncUrl);
      }, autoRefreshInterval * 1000);

      return () => clearInterval(intervalId);
    }
  }, [autoRefreshInterval, sheetSyncUrl, syncSheetData]);

  // 6. Audio Toggle
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEffects.setMuted(nextMute);
    if (!nextMute) {
      soundEffects.playClick();
    }
  };

  // 7. Track & Leaderboard Calculations
  const currentTrackData = useMemo(() => {
    return TRACKS.find(t => t.id === selectedTrack) || TRACKS[0];
  }, [selectedTrack]);

  const trackLeaderboard = useMemo(() => {
    const trackLaps = laps.filter(l => l.trackId === selectedTrack);
    return analyzeLeaderboard(trackLaps);
  }, [laps, selectedTrack]);

  const top3Drivers = useMemo(() => {
    return trackLeaderboard.filter(l => l.validLap).slice(0, 3);
  }, [trackLeaderboard]);

  const currentP1LapMs = useMemo(() => {
    if (top3Drivers.length > 0) {
      return top3Drivers[0].lapMs;
    }
    return Infinity;
  }, [top3Drivers]);

  // Filtered leaderboard for search
  const filteredLeaderboard = useMemo(() => {
    if (!mobileSearch.trim()) return trackLeaderboard;
    const q = mobileSearch.toLowerCase().trim();
    return trackLeaderboard.filter(l => 
      l.driver.toLowerCase().includes(q) ||
      (isAdmin && l.phone && l.phone.includes(q)) ||
      (l.team && l.team.toLowerCase().includes(q))
    );
  }, [trackLeaderboard, mobileSearch, isAdmin]);

  const pinnedDriver = useMemo(() => {
    if (!pinnedDriverId) return null;
    return trackLeaderboard.find(l => l.id === pinnedDriverId) || null;
  }, [trackLeaderboard, pinnedDriverId]);

  // Lap Actions with Anti-Duplicate Logic
  const handleAddLap = (newLap, isUpdate = false) => {
    if (!isAdmin) return;

    setLaps(prev => {
      const cleanPhone = newLap.phone ? newLap.phone.replace(/[^0-9]/g, '') : '';
      
      const existingIndex = prev.findIndex(l => 
        l.trackId === newLap.trackId && (
          (cleanPhone && l.phone && l.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
          (!cleanPhone && l.driver.toLowerCase().trim() === newLap.driver.toLowerCase().trim())
        )
      );

      if (existingIndex !== -1) {
        const existingLap = prev[existingIndex];
        const existingMs = parseLapInput(existingLap.lapTime);
        const newMs = parseLapInput(newLap.lapTime);

        const updated = [...prev];
        updated[existingIndex] = {
          ...existingLap,
          ...newLap,
          id: existingLap.id,
          lapTime: (newLap.validLap && (newMs <= existingMs || !existingLap.validLap)) ? newLap.lapTime : existingLap.lapTime,
          s1: newLap.s1 || existingLap.s1,
          s2: newLap.s2 || existingLap.s2,
          s3: newLap.s3 || existingLap.s3,
        };
        return updated;
      }

      return [newLap, ...prev];
    });
  };

  const handleDeleteLap = (lapId) => {
    if (!isAdmin) return;
    setLaps(prev => prev.filter(l => l.id !== lapId));
  };

  const handleToggleLapValidity = (lapId) => {
    if (!isAdmin) return;
    setLaps(prev => prev.map(l => {
      if (l.id === lapId) {
        return { ...l, validLap: !l.validLap };
      }
      return l;
    }));
  };

  const handleImportLaps = (importedLaps) => {
    if (!isAdmin) return;
    
    setLaps(prev => {
      const merged = [...prev];
      importedLaps.forEach(newLap => {
        const cleanPhone = newLap.phone ? newLap.phone.replace(/[^0-9]/g, '') : '';
        const idx = merged.findIndex(l => 
          l.trackId === newLap.trackId && (
            (cleanPhone && l.phone && l.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
            (!cleanPhone && l.driver.toLowerCase().trim() === newLap.driver.toLowerCase().trim())
          )
        );

        if (idx !== -1) {
          const oldMs = parseLapInput(merged[idx].lapTime);
          const newMs = parseLapInput(newLap.lapTime);
          if (newMs <= oldMs) {
            merged[idx] = newLap;
          }
        } else {
          merged.push(newLap);
        }
      });
      return merged;
    });
  };

  const handleResetToDefault = () => {
    if (!isAdmin) return;
    setLaps(INITIAL_LEADERBOARD);
    localStorage.removeItem('driftx_f1_laps_v4');
  };

  const handleTogglePinDriver = (driverId) => {
    if (pinnedDriverId === driverId) {
      setPinnedDriverId(null);
    } else {
      setPinnedDriverId(driverId);
    }
  };

  const scrollToPinnedDriver = () => {
    if (pinnedDriverId) {
      const el = document.getElementById(`driver-card-${pinnedDriverId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleLogoutAdmin = () => {
    logoutAdminSession();
    setIsAdmin(false);
  };

  if (isKioskMode) {
    return (
      <KioskMode
        leaderboard={trackLeaderboard}
        currentTrack={currentTrackData}
        onExitKiosk={() => setIsKioskMode(false)}
        isMuted={isMuted}
        customLogo={customLogo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between selection:bg-red-600 selection:text-white pb-16 md:pb-0">
      
      {/* Header (Zero Admin Buttons visible in Public mode) */}
      <Header
        selectedTrack={selectedTrack}
        setSelectedTrack={setSelectedTrack}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onOpenExcelModal={() => setShowExcelModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenLogoModal={() => setShowLogoModal(true)}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onToggleKiosk={() => setIsKioskMode(true)}
        onTriggerStartLights={() => setShowStartLights(true)}
        isMuted={isMuted}
        toggleMute={toggleMute}
        isSyncing={isSyncing}
        autoRefreshInterval={autoRefreshInterval}
        totalDriversCount={trackLeaderboard.length}
        customLogo={customLogo}
        isAdmin={isAdmin}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full flex-1">
        
        {/* Stage Info Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-[#080808] border border-neutral-900 rounded-2xl p-4 shadow-xl">
          <div>
            <div className="text-[11px] sm:text-xs font-mono font-bold text-red-500 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>{currentTrackData.stageName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">
              {currentTrackData.flag} {currentTrackData.name}
            </h2>
          </div>

          <div className="flex items-center space-x-4 text-xs font-tech text-neutral-300">
            <div>
              <span className="text-neutral-500 block text-[10px]">LENGTH</span>
              <span className="font-mono-num text-white font-bold">{currentTrackData.length}</span>
            </div>
            <div className="border-l border-neutral-800 pl-4">
              <span className="text-neutral-500 block text-[10px]">TURNS</span>
              <span className="font-mono-num text-white font-bold">{currentTrackData.turns} Corners</span>
            </div>
            <div className="border-l border-neutral-800 pl-4">
              <span className="text-neutral-500 block text-[10px]">TRACK RECORD</span>
              <span className="text-red-500 font-mono-num font-bold">{currentTrackData.record}</span>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <PodiumTop3
          top3={top3Drivers}
          onSelectDriver={(driver) => setSelectedDriverTelemetry(driver)}
        />

        {/* Search & View Switcher */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAdmin ? "Search driver name, phone, team..." : "Search driver name or team..."}
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="w-full bg-[#080808] border border-neutral-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 font-tech"
            />
            {mobileSearch && (
              <button 
                onClick={() => setMobileSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop/Tablet View Switcher */}
          <div className="hidden sm:flex bg-[#080808] border border-neutral-900 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg text-xs font-tech font-bold transition flex items-center space-x-1 ${
                viewMode === 'cards' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-tech font-bold transition flex items-center space-x-1 ${
                viewMode === 'table' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Dynamic Leaderboard Rendering */}
        <div className="block sm:hidden">
          <MobileRacerCards
            leaderboard={filteredLeaderboard}
            onSelectDriver={(driver) => setSelectedDriverTelemetry(driver)}
            pinnedDriverId={pinnedDriverId}
            onTogglePinDriver={handleTogglePinDriver}
            isAdmin={isAdmin}
            onDeleteLap={handleDeleteLap}
            onToggleLapValidity={handleToggleLapValidity}
          />
        </div>

        <div className="hidden sm:block">
          {viewMode === 'table' ? (
            <LeaderboardTable
              leaderboard={filteredLeaderboard}
              onSelectDriver={(driver) => setSelectedDriverTelemetry(driver)}
              onDeleteLap={handleDeleteLap}
              onToggleLapValidity={handleToggleLapValidity}
              currentTrack={currentTrackData}
              isAdmin={isAdmin}
            />
          ) : (
            <MobileRacerCards
              leaderboard={filteredLeaderboard}
              onSelectDriver={(driver) => setSelectedDriverTelemetry(driver)}
              pinnedDriverId={pinnedDriverId}
              onTogglePinDriver={handleTogglePinDriver}
              isAdmin={isAdmin}
              onDeleteLap={handleDeleteLap}
              onToggleLapValidity={handleToggleLapValidity}
            />
          )}
        </div>
      </main>

      {/* Sticky Pinned Driver Bottom HUD */}
      {pinnedDriver && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#000000]/95 border-t border-red-600 p-3 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom">
          <div className="max-w-7xl mx-auto flex items-center justify-between font-tech">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-red-600 text-white font-display font-black text-xs flex items-center justify-center shrink-0">
                P{pinnedDriver.position}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-sm truncate">
                  {pinnedDriver.driver}
                </div>
                <div className="text-xs text-neutral-300 flex items-center space-x-2 font-mono-num">
                  <span className="text-white font-bold">{pinnedDriver.lapTime}</span>
                  <span>•</span>
                  <span>Gap: {pinnedDriver.gapToLeader}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={scrollToPinnedDriver}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/40"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Jump</span>
              </button>
              <button
                onClick={() => setPinnedDriverId(null)}
                className="p-1.5 rounded-lg bg-[#141414] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800"
                title="Unpin"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Minimal Footer */}
      <footer className="w-full bg-[#050505] border-t border-neutral-900 py-4 text-xs font-tech text-neutral-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DRIFT<span className="text-red-600 font-bold">x</span>COMMUNE // F1 SIM TOURNAMENT</span>
          <span className="text-neutral-400">{TOURNAMENT_INFO.stages}</span>
        </div>
      </footer>

      {/* Stealth Security Admin PIN Modal */}
      {showLoginModal && (
        <AdminLoginModal
          isAdmin={isAdmin}
          onLoginSuccess={() => setIsAdmin(true)}
          onLogoutSuccess={() => setIsAdmin(false)}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Admin-Only Modals */}
      {showLogoModal && isAdmin && (
        <LogoUploadModal
          currentLogo={customLogo}
          onSaveLogo={(newLogo) => setCustomLogo(newLogo)}
          onResetLogo={() => setCustomLogo(null)}
          onClose={() => setShowLogoModal(false)}
        />
      )}

      {showAdminModal && isAdmin && (
        <AdminLapEntryModal
          onClose={() => setShowAdminModal(false)}
          onAddLap={handleAddLap}
          defaultTrackId={selectedTrack}
          currentP1LapMs={currentP1LapMs}
          existingLaps={laps}
        />
      )}

      {showExcelModal && isAdmin && (
        <ExcelSyncModal
          onClose={() => setShowExcelModal(false)}
          onImportLaps={handleImportLaps}
          onResetToDefault={handleResetToDefault}
          currentLeaderboard={trackLeaderboard}
          currentTrackName={currentTrackData.name}
          sheetSyncUrl={sheetSyncUrl}
          setSheetSyncUrl={setSheetSyncUrl}
          autoRefreshInterval={autoRefreshInterval}
          setAutoRefreshInterval={setAutoRefreshInterval}
          onManualSyncSheet={syncSheetData}
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
        />
      )}

      {/* Public Share Modal */}
      {showShareModal && (
        <ShareQrModal
          onClose={() => setShowShareModal(false)}
          selectedTrack={selectedTrack}
          sheetSyncUrl={sheetSyncUrl}
        />
      )}

      {showStartLights && (
        <StartingLights
          onClose={() => setShowStartLights(false)}
        />
      )}

      {selectedDriverTelemetry && (
        <TelemetryModal
          driver={selectedDriverTelemetry}
          leaderboard={trackLeaderboard}
          onClose={() => setSelectedDriverTelemetry(null)}
          currentTrack={currentTrackData}
        />
      )}
    </div>
  );
}
