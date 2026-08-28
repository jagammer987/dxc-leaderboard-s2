import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Timer, 
  Phone, 
  ShieldAlert, 
  Sparkles, 
  UserCheck, 
  CheckCircle2,
  RefreshCw 
} from 'lucide-react';
import { 
  TRACKS, 
  TEAMS, 
  TYRE_COMPOUNDS, 
  RIGS, 
  ASSISTS_LEVELS 
} from '../utils/constants';
import { parseLapInput, formatLapTime } from '../utils/timeUtils';
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
  const [trackId, setTrackId] = useState(defaultTrackId);
  const [team, setTeam] = useState(TEAMS[0].name);
  const [rawLapTime, setRawLapTime] = useState('');
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [tyre, setTyre] = useState('SOFT');
  const [rig, setRig] = useState('Rig 1');
  const [assists, setAssists] = useState('NONE');
  const [topSpeed, setTopSpeed] = useState('324.5');
  const [notes, setNotes] = useState('');
  const [validLap, setValidLap] = useState(true);
  const [error, setError] = useState('');
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  const currentTrack = TRACKS.find(t => t.id === trackId) || TRACKS[0];

  // Auto-detect existing driver by mobile number or name for this stage
  useEffect(() => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').trim();
    if (!cleanPhone && !driver.trim()) {
      setDuplicateInfo(null);
      return;
    }

    const match = existingLaps.find(l => 
      l.trackId === trackId && (
        (cleanPhone && l.phone && l.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
        (!cleanPhone && driver.trim() && l.driver.toLowerCase() === driver.trim().toLowerCase())
      )
    );

    if (match) {
      setDuplicateInfo(match);
      if (!driver && match.driver) {
        setDriver(match.driver);
      }
      if (!team && match.team) {
        setTeam(match.team);
      }
    } else {
      setDuplicateInfo(null);
    }
  }, [phone, driver, trackId, existingLaps]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!driver.trim()) {
      setError('Please enter driver name');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '').trim();

    const parsedMs = parseLapInput(rawLapTime);
    if (!parsedMs) {
      setError('Invalid Lap Time! Supported formats: 1:03.412, 63.412, or shorthand 103412');
      return;
    }

    const formattedTime = formatLapTime(parsedMs);

    const newLap = {
      id: duplicateInfo ? duplicateInfo.id : `lap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      driver: driver.trim(),
      phone: cleanPhone,
      trackId,
      team,
      lapTime: formattedTime,
      lapMs: parsedMs,
      s1: s1.trim(),
      s2: s2.trim(),
      s3: s3.trim(),
      tyre,
      rig,
      assists,
      topSpeed: parseFloat(topSpeed) || 320.0,
      validLap,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes: notes.trim()
    };

    if (parsedMs < currentP1LapMs && validLap) {
      soundEffects.playP1VictoryFanfare();
    } else {
      soundEffects.playRadioChime();
    }

    onAddLap(newLap, Boolean(duplicateInfo));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#080808] border border-red-600/50 rounded-2xl p-6 shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
            <div>
              <h2 className="text-lg font-black font-display text-white uppercase tracking-wider">
                LOG HOTLAP // DRIFT<span className="text-red-600">x</span>COMMUNE
              </h2>
              <p className="text-xs font-tech text-neutral-400">
                MARSHAL RAPID TIMING & ANTI-DUPLICATE SYSTEM
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

        {/* Duplicate Entry Warning / Upgrade Helper */}
        {duplicateInfo && (
          <div className="mt-4 p-3.5 bg-red-950/40 border border-red-600/70 rounded-xl text-xs font-tech text-white flex items-start space-x-2.5 shadow-lg">
            <UserCheck className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-red-400 block uppercase">
                Existing Driver Detected for this Stage:
              </span>
              <p className="text-neutral-300 mt-0.5">
                <span className="font-bold text-white">{duplicateInfo.driver}</span> currently holds a best lap of{' '}
                <span className="text-red-400 font-mono font-bold">{duplicateInfo.lapTime}</span>.
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                ⚡ Submitting this entry will <span className="text-white font-bold">update their personal best</span> instead of creating a duplicate row!
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-600/60 text-red-300 rounded-xl text-xs flex items-center space-x-2 font-tech">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Entry Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-tech">
          
          {/* Row 1: Stage & Driver Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Tournament Stage / Track
              </label>
              <select
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
              >
                {TRACKS.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.flag} {t.stageBadge}: {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Driver Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Sharma"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Row 2: Mobile Number (Admin-Only) & Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-300 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-red-500" />
                  Mobile Number (Admin-Only)
                </label>
                <span className="text-[10px] text-red-500 font-mono font-bold">
                  🔒 Hidden from Public
                </span>
              </div>
              <input
                type="tel"
                placeholder="e.g. 9876543210 (Prevents Double Entries)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                F1 Team / Livery
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
              >
                {TEAMS.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Primary Lap Time Input */}
          <div className="bg-[#000000] border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-red-500 uppercase tracking-wider flex items-center">
                <Timer className="w-3.5 h-3.5 mr-1" />
                Lap Time * (High Precision)
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                Shorthand format: 103412 ➔ 1:03.412
              </span>
            </div>

            <input
              type="text"
              required
              placeholder="e.g. 1:03.412 or 63.412 or 103412"
              value={rawLapTime}
              onChange={(e) => setRawLapTime(e.target.value)}
              className="w-full bg-[#080808] border border-neutral-700 rounded-xl px-4 py-3 text-lg text-white font-mono-num font-bold placeholder-neutral-600 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Row 4: Micro Sectors */}
          <div>
            <span className="text-xs font-bold text-neutral-300 block mb-1">
              Sector Breakdown (Optional, for red session-best sectors)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="S1 (e.g. 16.210)"
                  value={s1}
                  onChange={(e) => setS1(e.target.value)}
                  className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="S2 (e.g. 28.650)"
                  value={s2}
                  onChange={(e) => setS2(e.target.value)}
                  className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="S3 (e.g. 18.552)"
                  value={s3}
                  onChange={(e) => setS3(e.target.value)}
                  className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Tyre & Sim Rig */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Tyre Compound
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TYRE_COMPOUNDS.slice(0, 3).map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTyre(t.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                      tyre === t.id
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                        : 'bg-[#000000] text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {t.badge} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Simulator Rig
              </label>
              <select
                value={rig}
                onChange={(e) => setRig(e.target.value)}
                className="w-full bg-[#000000] border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600"
              >
                {RIGS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Lap Validity */}
          <div className="flex items-center justify-between p-3 bg-[#000000] border border-neutral-800 rounded-xl">
            <div>
              <span className="text-xs font-bold text-white block">Lap Track Limits</span>
              <span className="text-[11px] text-neutral-400">
                Check if lap adhered to track limits regulations
              </span>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={validLap}
                onChange={(e) => setValidLap(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-neutral-900 border-neutral-700"
              />
              <span className={`text-xs font-bold ${validLap ? 'text-white' : 'text-red-500'}`}>
                {validLap ? 'VALID LAP' : 'INVALIDATED'}
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-neutral-900 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black font-display tracking-wider transition shadow-lg shadow-red-600/40 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{duplicateInfo ? 'UPDATE DRIVER PB' : 'RECORD LAP TIME'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
