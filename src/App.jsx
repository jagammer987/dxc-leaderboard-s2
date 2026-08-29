import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import PodiumTop3 from './components/PodiumTop3';
import LeaderboardTable from './components/LeaderboardTable';
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
import { analyzeLeaderboard } from './utils/timeUtils';
import { fetchLiveSheetData, pushLapToGoogleSheet } from './utils/excelUtils';
import { isAdminAuthenticated, logoutAdminSession } from './utils/securityUtils';
import { soundEffects } from './utils/soundFx';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // 1. Initial Track State
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
    return TOURNAMENT_INFO.defaultGoogleSheetUrl;
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

  // Instant 0ms Cache Hydration: Load cached data immediately, then update from Cloud
  const [laps, setLaps] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('driftx_f1_laps_v4');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_LEADERBOARD;
  });

  // Auto-refresh every 4 seconds for instant real-time sync
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(4);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

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
      if (e.key === 'Escape' && isKioskMode) {
        setIsKioskMode(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        soundEffects.playClick();
        setShowLoginModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKioskMode]);

  // 4. Clean Shareable URL sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('track', selectedTrack);
      url.searchParams.delete('sheet');
      url.searchParams.delete('admin');
      url.searchParams.delete('marshal');
      url.searchParams.delete('d');
      window.history.replaceState({}, '', url);
    }
  }, [selectedTrack]);

  // 5. Fast Cloud Google Sheet Polling
  const syncSheetData = useCallback(async () => {
    const targetUrl = sheetSyncUrl || TOURNAMENT_INFO.defaultGoogleSheetUrl;
    if (!targetUrl) return;

    try {
      setIsSyncing(true);
      const fetchedLaps = await fetchLiveSheetData(targetUrl, selectedTrack);
      if (fetchedLaps && Array.isArray(fetchedLaps)) {
        setLaps(fetchedLaps);
        try {
          localStorage.setItem('driftx_f1_laps_v4', JSON.stringify(fetchedLaps));
        } catch (e) {}
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Sheet sync warning:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [sheetSyncUrl, selectedTrack]);

  // Run on mount immediately
  useEffect(() => {
    syncSheetData();
  }, [syncSheetData]);

  // 4-Second Live Cloud Polling Loop
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const intervalId = setInterval(() => {
        syncSheetData();
      }, autoRefreshInterval * 1000);

      return () => clearInterval(intervalId);
    }
  }, [autoRefreshInterval, syncSheetData]);

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

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Record Lap Action (Optimistic UI Update + Background Google Sheet Push)
  const handleAddLap = async (newLap) => {
    if (newLap.trackId) {
      setSelectedTrack(newLap.trackId);
    }

    // 1. Optimistic update
    setLaps(prev => {
      const driverLower = newLap.driver.toLowerCase().trim();
      const phoneClean = newLap.phone ? newLap.phone.replace(/[^0-9]/g, '') : '';
      
      const filtered = prev.filter(l => {
        if (l.trackId !== newLap.trackId) return true;
        if (phoneClean && l.phone && l.phone.replace(/[^0-9]/g, '') === phoneClean) return false;
        if (l.driver.toLowerCase().trim() === driverLower) return false;
        return true;
      });

      const updated = [newLap, ...filtered];
      try {
        localStorage.setItem('driftx_f1_laps_v4', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    showToast(`⏱️ Lap recorded: ${newLap.driver} (${newLap.lapTime})`);

    // 2. Push to Google Sheet in background
    const targetUrl = sheetSyncUrl || TOURNAMENT_INFO.defaultGoogleSheetUrl;
    if (targetUrl) {
      await pushLapToGoogleSheet(targetUrl, newLap);
      setTimeout(() => syncSheetData(), 1200);
    }
  };

  const handleDeleteLap = (lapId) => {
    if (!isAdmin) return;
    setLaps(prev => {
      const updated = prev.filter(l => l.id !== lapId);
      try {
        localStorage.setItem('driftx_f1_laps_v4', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });
    showToast('🗑️ Lap entry deleted');
  };

  const handleToggleLapValidity = (lapId) => {
    if (!isAdmin) return;
    setLaps(prev => {
      const updated = prev.map(l => {
        if (l.id === lapId) {
          const nextValid = !l.validLap;
          showToast(nextValid ? '✅ Lap validated' : '⚠️ Lap invalidated');
          return { ...l, validLap: nextValid };
        }
        return l;
      });
      try {
        localStorage.setItem('driftx_f1_laps_v4', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });
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
          merged[idx] = newLap;
        } else {
          merged.push(newLap);
        }
      });
      try {
        localStorage.setItem('driftx_f1_laps_v4', JSON.stringify(merged));
      } catch(e) {}
      return merged;
    });
    showToast(`📥 Imported ${importedLaps.length} laps`);
  };

  const handleResetToDefault = () => {
    if (!isAdmin) return;
    setLaps([]);
    localStorage.removeItem('driftx_f1_laps_v4');
    showToast('🔄 Cleared leaderboard');
  };

  const handleLogoutAdmin = () => {
    logoutAdminSession();
    setIsAdmin(false);
    showToast('🔒 Locked Marshal Console');
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
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between selection:bg-red-600 selection:text-white pb-12 sm:pb-0 font-tech">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#0D0506] border-2 border-red-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 font-tech text-xs animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
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

      {/* Main Content: Top 3 Cards + Standings Table */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full flex-1 space-y-5">
        
        {/* Stage Info Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080808] border border-neutral-900 rounded-2xl p-4 shadow-xl">
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

        {/* 1. TOP 3 IN CARD FORM */}
        <PodiumTop3
          top3={top3Drivers}
          onSelectDriver={(driver) => setSelectedDriverTelemetry(driver)}
        />

        {/* 2. FULL STANDINGS IN TABLE FORM (DESKTOP & MOBILE) */}
        <LeaderboardTable
          leaderboard={trackLeaderboard}
          onSelectDriver={(driver) => setSelectedDriverTelemetry(driver)}
          onDeleteLap={handleDeleteLap}
          onToggleLapValidity={handleToggleLapValidity}
          currentTrack={currentTrackData}
          isAdmin={isAdmin}
        />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full bg-[#050505] border-t border-neutral-900 py-4 text-xs font-tech text-neutral-500 text-center mt-6">
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
