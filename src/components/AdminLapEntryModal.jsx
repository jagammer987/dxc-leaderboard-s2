import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Timer, 
  Phone, 
  ShieldAlert, 
  UserCheck,
  CheckCircle2,
  Sliders,
  Type,
  Zap,
  Gauge
} from 'lucide-react';
import { 
  TRACKS, 
  TEAMS, 
  TYRE_COMPOUNDS, 
  RIGS 
} from '../utils/constants';
import { parseLapInput, formatLapTime, parseSectorToMs, formatSectorMs } from '../utils/timeUtils';
import { soundEffects } from '../utils/soundFx';

export default function AdminLapEntryModal({
  onClose,
  onAddLap,
  defaultTrackId = 'redbullring',
  currentP1LapMs = Infinity,
  existingLaps = []
}) {
  const [driver, setDriver] = useState('');
  const [phone, setPhone] = useState('');
  const [trackId, setTrackId] = useState(defaultTrackId || 'redbullring');
  const [team, setTeam] = useState(TEAMS[0]?.name || 'DriftxCommune Racing');

  // Time Entry Mode: 'split' (3 simple number boxes) or 'single' (Text box)
  const [inputMode, setInputMode] = useState('split');
  
  // Split time state (default: 1 min 03 sec 400 ms)
  const [mins, setMins] = useState('1');
  const [secs, setSecs] = useState('03');
  const [millis, setMillis] = useState('400');

  // Single text state
  const [singleText, setSingleText] = useState('1:03.400');

  // Sector Times (Optional)
  const [showSectors, setShowSectors] = useState(false);
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');

  const [tyre, setTyre] = useState('SOFT');
  const [rig, setRig] = useState('Rig 1');
  const [validLap, setValidLap] = useState(true);
  const [error, setError] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // Sync defaultTrackId if changed from parent
  useEffect(() => {
    if (defaultTrackId) {
      setTrackId(defaultTrackId);
    }
  }, [defaultTrackId]);

  // Safe real-time calculation of milliseconds
  const getCalculatedMs = () => {
    if (inputMode === 'split') {
      const m = parseInt(mins || '0', 10);
      const s = parseInt(secs || '0', 10);
      const rawMsStr = String(millis || '0');
      const ms = parseInt(rawMsStr.padEnd(3, '0').slice(0, 3), 10);
      
      const total = (isNaN(m) ? 0 : m) * 60000 + (isNaN(s) ? 0 : s) * 1000 + (isNaN(ms) ? 0 : ms);
      return total > 0 ? total : null;
    } else {
      return parseLapInput(singleText);
    }
  };

  const calculatedMs = getCalculatedMs();

  // Auto-calculate Lap Time from S1 + S2 + S3 if all 3 provided
  const handleAutoCalcFromSectors = () => {
    const s1Ms = parseSectorToMs(s1);
    const s2Ms = parseSectorToMs(s2);
    const s3Ms = parseSectorToMs(s3);

    if (s1Ms !== Infinity && s2Ms !== Infinity && s3Ms !== Infinity) {
      const totalMs = s1Ms + s2Ms + s3Ms;
      const totalSeconds = totalMs / 1000;
      const m = Math.floor(totalSeconds / 60);
      const remSec = totalSeconds % 60;
      const secInt = Math.floor(remSec);
      const msInt = Math.round((remSec - secInt) * 1000);

      setMins(String(m));
      setSecs(secInt < 10 ? `0${secInt}` : String(secInt));
      setMillis(msInt < 100 ? String(msInt).padStart(3, '0') : String(msInt));
      setSingleText(formatLapTime(totalMs));
      soundEffects.playClick();
    }
  };

  // Auto-detect existing driver by mobile number or name for this stage
  useEffect(() => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').trim();
    const cleanDriver = driver.trim().toLowerCase();

    if (!cleanPhone && !cleanDriver) {
      setDuplicateInfo(null);
      return;
    }

    const match = existingLaps.find(l => 
      l.trackId === trackId && (
        (cleanPhone && l.phone && l.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
        (cleanDriver && l.driver && l.driver.toLowerCase().trim() === cleanDriver)
      )
    );

    if (match) {
      setDuplicateInfo(match);
      if (!driver && match.driver) {
        setDriver(match.driver);
      }
      if (match.team) {
        setTeam(match.team);
      }
      if (match.s1 && !s1) setS1(match.s1);
      if (match.s2 && !s2) setS2(match.s2);
      if (match.s3 && !s3) setS3(match.s3);
    } else {
      setDuplicateInfo(null);
    }
  }, [phone, driver, trackId, existingLaps]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError('');

    if (!driver.trim()) {
      setError('Please enter driver name');
      return;
    }

    const ms = getCalculatedMs();
    if (!ms || isNaN(ms) || ms <= 0) {
      setError('Please enter a valid lap time (e.g. 1 min 03 sec 400 ms)');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '').trim();
    const formattedTime = formatLapTime(ms);

    // Format clean sector strings if entered
    const cleanS1 = s1.trim() ? (parseSectorToMs(s1) !== Infinity ? formatSectorMs(parseSectorToMs(s1)) : s1.trim()) : '';
    const cleanS2 = s2.trim() ? (parseSectorToMs(s2) !== Infinity ? formatSectorMs(parseSectorToMs(s2)) : s2.trim()) : '';
    const cleanS3 = s3.trim() ? (parseSectorToMs(s3) !== Infinity ? formatSectorMs(parseSectorToMs(s3)) : s3.trim()) : '';

    const newLap = {
      id: `lap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      driver: driver.trim(),
      phone: cleanPhone,
      trackId: trackId || 'redbullring',
      team: team || 'DriftxCommune Racing',
      lapTime: formattedTime,
      lapMs: ms,
      s1: cleanS1,
      s2: cleanS2,
      s3: cleanS3,
      tyre: tyre || 'SOFT',
      rig: rig || 'Rig 1',
      assists: 'NONE',
      topSpeed: 320.0,
      validLap: Boolean(validLap),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes: ''
    };

    try {
      if (ms < currentP1LapMs && validLap) {
        soundEffects.playP1VictoryFanfare();
      } else {
        soundEffects.playRadioChime();
      }
    } catch (err) {}

    // Invoke callback to add lap to App state & push to Google Sheet
    onAddLap(newLap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto font-tech">
      <div className="relative w-full max-w-lg bg-[#080808] border-2 border-red-600/80 rounded-2xl p-5 sm:p-6 shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display text-white uppercase tracking-wider">
                LOG HOTLAP // DRIFT<span className="text-red-600">x</span>COMMUNE
              </h2>
              <p className="text-[11px] font-tech text-neutral-400">
                OFFICIAL MARSHAL ENTRY
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Driver PB Notice */}
        {duplicateInfo && (
          <div className="mt-3.5 p-3 bg-red-950/50 border border-red-600/70 rounded-xl text-xs font-tech text-white flex items-start space-x-2">
            <UserCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-400 block uppercase">
                Existing Driver: {duplicateInfo.driver}
              </span>
              <span className="text-neutral-300">
                Current Best: <strong className="text-white font-mono">{duplicateInfo.lapTime}</strong>. Submitting will update their Personal Best!
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-3.5 p-3 bg-red-950 border border-red-600 text-red-200 rounded-xl text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Entry Form */}
        <div className="mt-3.5 space-y-3.5">
          
          {/* 1. Track Stage */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1">
              Tournament Stage / Track
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TRACKS.map(t => {
                const isSel = t.id === trackId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrackId(t.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition cursor-pointer ${
                      isSel 
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/40' 
                        : 'bg-[#000000] text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span className="block text-sm">{t.flag}</span>
                    <span className="text-[10px] uppercase block truncate">{t.stageBadge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Driver Name */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">
              Driver Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Rishabh Sharma"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="w-full bg-[#000000] border-2 border-neutral-700 focus:border-red-600 rounded-xl px-3.5 py-2 text-sm text-white font-bold placeholder-neutral-600 focus:outline-none"
            />
          </div>

          {/* 3. LAP TIME ENTRY (3 NUMBER BOXES) */}
          <div className="bg-[#000000] border-2 border-red-600/60 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-red-500 uppercase tracking-wider flex items-center">
                <Timer className="w-4 h-4 mr-1.5" />
                Lap Time *
              </label>

              {/* Toggle Input Mode */}
              <div className="flex items-center bg-[#0D0D0D] border border-neutral-800 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setInputMode('split')}
                  className={`px-2 py-0.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer ${
                    inputMode === 'split' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>3 Boxes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('single')}
                  className={`px-2 py-0.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer ${
                    inputMode === 'single' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  <span>Single Box</span>
                </button>
              </div>
            </div>

            {/* Mode A: 3 Simple Number Boxes (Min : Sec . Ms) */}
            {inputMode === 'split' ? (
              <div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1 font-bold">MINUTES</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={mins}
                      onChange={(e) => setMins(e.target.value)}
                      className="w-full bg-[#080808] border-2 border-neutral-700 focus:border-red-600 rounded-xl py-2 text-center text-lg sm:text-xl text-white font-mono-num font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1 font-bold">SECONDS</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={secs}
                      onChange={(e) => setSecs(e.target.value)}
                      className="w-full bg-[#080808] border-2 border-neutral-700 focus:border-red-600 rounded-xl py-2 text-center text-lg sm:text-xl text-white font-mono-num font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1 font-bold">MILLIS (.ms)</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={millis}
                      onChange={(e) => setMillis(e.target.value)}
                      className="w-full bg-[#080808] border-2 border-neutral-700 focus:border-red-600 rounded-xl py-2 text-center text-lg sm:text-xl text-white font-mono-num font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Formatted Output */}
                <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Result Lap Time:</span>
                  <span className="text-red-400 font-black text-sm">
                    {formatLapTime(calculatedMs)}
                  </span>
                </div>
              </div>
            ) : (
              /* Mode B: Single Fast Input */
              <div>
                <input
                  type="text"
                  placeholder="e.g. 1:03.412 or 63.412 or 103412"
                  value={singleText}
                  onChange={(e) => setSingleText(e.target.value)}
                  className="w-full bg-[#080808] border-2 border-neutral-700 focus:border-red-600 rounded-xl px-4 py-2 text-base text-white font-mono-num font-bold focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Parsed Preview:</span>
                  <span className={calculatedMs ? "text-emerald-400 font-bold" : "text-red-500 font-bold"}>
                    {calculatedMs ? `${formatLapTime(calculatedMs)} ✅` : 'Invalid format ❌'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. SECTOR TIMES (OPTIONAL / EXPANDABLE) */}
          <div className="bg-[#000000] border border-neutral-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSectors(!showSectors)}
                className="flex items-center space-x-1.5 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <Gauge className="w-3.5 h-3.5 text-red-500" />
                <span>Sector Times (S1 / S2 / S3)</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  {showSectors ? '▲ Hide' : '▼ Add (Optional)'}
                </span>
              </button>

              {showSectors && s1 && s2 && s3 && (
                <button
                  type="button"
                  onClick={handleAutoCalcFromSectors}
                  className="text-[10px] bg-red-950/80 border border-red-600 text-red-400 hover:text-white px-2 py-0.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer"
                  title="Sum S1 + S2 + S3 into Lap Time"
                >
                  <Zap className="w-3 h-3" />
                  <span>Sum Sectors to Lap</span>
                </button>
              )}
            </div>

            {showSectors && (
              <div className="mt-2.5 pt-2 border-t border-neutral-900">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1 font-bold">SECTOR 1 (s)</span>
                    <input
                      type="text"
                      placeholder="e.g. 16.210"
                      value={s1}
                      onChange={(e) => setS1(e.target.value)}
                      className="w-full bg-[#080808] border border-neutral-700 focus:border-red-600 rounded-lg py-1.5 text-center text-xs text-white font-mono placeholder-neutral-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1 font-bold">SECTOR 2 (s)</span>
                    <input
                      type="text"
                      placeholder="e.g. 28.650"
                      value={s2}
                      onChange={(e) => setS2(e.target.value)}
                      className="w-full bg-[#080808] border border-neutral-700 focus:border-red-600 rounded-lg py-1.5 text-center text-xs text-white font-mono placeholder-neutral-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 block mb-1 font-bold">SECTOR 3 (s)</span>
                    <input
                      type="text"
                      placeholder="e.g. 18.552"
                      value={s3}
                      onChange={(e) => setS3(e.target.value)}
                      className="w-full bg-[#080808] border border-neutral-700 focus:border-red-600 rounded-lg py-1.5 text-center text-xs text-white font-mono placeholder-neutral-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Optional: Mobile Number & Sim Rig */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Mobile No. <span className="text-neutral-500 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Sim Rig
              </label>
              <select
                value={rig}
                onChange={(e) => setRig(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
              >
                {RIGS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Lap Track Limits Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-[#000000] border border-neutral-800 rounded-xl">
            <span className="text-xs text-neutral-300 font-bold">Track Limits:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={validLap}
                onChange={(e) => setValidLap(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-neutral-900 border-neutral-700 cursor-pointer"
              />
              <span className={`text-xs font-bold ${validLap ? 'text-emerald-400' : 'text-red-500'}`}>
                {validLap ? 'VALID LAP' : 'INVALIDATED'}
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center space-x-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black font-display tracking-wider transition shadow-lg shadow-red-600/40 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{duplicateInfo ? 'UPDATE DRIVER PB' : 'RECORD LAP TIME'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
