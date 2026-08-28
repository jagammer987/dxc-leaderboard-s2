import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Timer, 
  Flame, 
  Award, 
  GitCompare, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { TEAMS, TYRE_COMPOUNDS } from '../utils/constants';
import { calculateTheoreticalOptimalLap, parseLapInput, formatLapTime } from '../utils/timeUtils';
import { soundEffects } from '../utils/soundFx';

export default function TelemetryModal({
  driver,
  leaderboard,
  onClose,
  currentTrack
}) {
  const [rivalId, setRivalId] = useState('');

  if (!driver) return null;

  const rivalDriver = rivalId ? leaderboard.find(l => l.id === rivalId) : null;
  const optimalLap = calculateTheoreticalOptimalLap(leaderboard);

  const getTeamColor = (teamName) => {
    const t = TEAMS.find(team => team.name.toLowerCase() === (teamName || '').toLowerCase());
    return t ? t.color : '#FF1E27';
  };

  const getTyreBadge = (compoundId) => {
    return TYRE_COMPOUNDS.find(c => c.id === compoundId) || TYRE_COMPOUNDS[0];
  };

  const tyre = getTyreBadge(driver.tyre);
  const teamColor = getTeamColor(driver.team);

  // Sector difference calculation
  const getSectorDelta = (sec1, sec2) => {
    const s1 = parseFloat(sec1);
    const s2 = parseFloat(sec2);
    if (isNaN(s1) || isNaN(s2)) return null;
    const diff = s1 - s2;
    if (diff === 0) return '0.000s';
    return diff > 0 ? `+${diff.toFixed(3)}s` : `${diff.toFixed(3)}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-tech">
      <div className="relative w-full max-w-2xl bg-[#080808] border border-red-600/50 rounded-2xl p-6 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-display font-black text-base flex items-center justify-center shadow-lg shadow-red-600/30">
              P{driver.position}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-4 rounded-full" style={{ backgroundColor: teamColor }} />
                <h2 className="text-xl font-black font-display text-white">
                  {driver.driver}
                </h2>
              </div>
              <p className="text-xs text-neutral-400">
                {driver.team} • <span className="text-white">{currentTrack.name}</span>
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

        {/* Lap Hero Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-[#000000] border border-neutral-900 p-3 rounded-xl">
            <span className="text-[10px] text-neutral-400 uppercase block">LAP TIME</span>
            <span className="text-xl font-black font-mono-num text-red-500">
              {driver.lapTime}
            </span>
          </div>

          <div className="bg-[#000000] border border-neutral-900 p-3 rounded-xl">
            <span className="text-[10px] text-neutral-400 uppercase block">GAP TO P1</span>
            <span className="text-base font-bold font-mono-num text-white">
              {driver.gapToLeader}
            </span>
          </div>

          <div className="bg-[#000000] border border-neutral-900 p-3 rounded-xl">
            <span className="text-[10px] text-neutral-400 uppercase block">TYRE COMPOUND</span>
            <span className="text-xs font-bold text-white flex items-center mt-1">
              {tyre.badge} {tyre.label}
            </span>
          </div>

          <div className="bg-[#000000] border border-neutral-900 p-3 rounded-xl">
            <span className="text-[10px] text-neutral-400 uppercase block">SIM RIG</span>
            <span className="text-xs font-bold text-white mt-1 block truncate">
              {driver.rig}
            </span>
          </div>
        </div>

        {/* Micro Sectors Analysis (Red Accent for Best) */}
        <div className="bg-[#000000] border border-neutral-900 rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white mb-3 flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1.5 text-red-600" /> SECTOR BREAKDOWN & BENCHMARKS
          </h3>

          <div className="grid grid-cols-3 gap-3 font-mono-num text-center">
            {/* Sector 1 */}
            <div className={`p-2.5 rounded-lg border ${
              driver.isS1Purple ? 'bg-red-950/80 border-red-600 text-red-400' : 'bg-[#080808] border-neutral-800 text-white'
            }`}>
              <span className="text-[10px] text-neutral-400 block font-tech">SECTOR 1</span>
              <span className="text-base font-black">{driver.s1 || '--.---'}</span>
              {driver.isS1Purple && (
                <span className="text-[9px] block text-red-500 font-tech font-bold uppercase mt-0.5">
                  ★ SESSION BEST
                </span>
              )}
            </div>

            {/* Sector 2 */}
            <div className={`p-2.5 rounded-lg border ${
              driver.isS2Purple ? 'bg-red-950/80 border-red-600 text-red-400' : 'bg-[#080808] border-neutral-800 text-white'
            }`}>
              <span className="text-[10px] text-neutral-400 block font-tech">SECTOR 2</span>
              <span className="text-base font-black">{driver.s2 || '--.---'}</span>
              {driver.isS2Purple && (
                <span className="text-[9px] block text-red-500 font-tech font-bold uppercase mt-0.5">
                  ★ SESSION BEST
                </span>
              )}
            </div>

            {/* Sector 3 */}
            <div className={`p-2.5 rounded-lg border ${
              driver.isS3Purple ? 'bg-red-950/80 border-red-600 text-red-400' : 'bg-[#080808] border-neutral-800 text-white'
            }`}>
              <span className="text-[10px] text-neutral-400 block font-tech">SECTOR 3</span>
              <span className="text-base font-black">{driver.s3 || '--.---'}</span>
              {driver.isS3Purple && (
                <span className="text-[9px] block text-red-500 font-tech font-bold uppercase mt-0.5">
                  ★ SESSION BEST
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Theoretical Optimal Lap Benchmark */}
        {optimalLap.optimalLapTime && (
          <div className="bg-[#0D0506] border border-red-600/40 rounded-xl p-3.5 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                THEORETICAL OPTIMAL LAP (BEST COMBINED SECTORS)
              </span>
              <span className="text-xs text-neutral-400 font-tech">
                S1: {optimalLap.s1Best || '--'} • S2: {optimalLap.s2Best || '--'} • S3: {optimalLap.s3Best || '--'}
              </span>
            </div>
            <span className="text-lg font-black font-mono-num text-red-500">
              {optimalLap.optimalLapTime}
            </span>
          </div>
        )}

        {/* Head-to-Head Rival Comparison */}
        <div className="bg-[#000000] border border-neutral-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center">
              <GitCompare className="w-3.5 h-3.5 mr-1.5 text-red-600" /> HEAD-TO-HEAD RIVAL COMPARISON
            </h3>

            <select
              value={rivalId}
              onChange={(e) => setRivalId(e.target.value)}
              className="bg-[#080808] border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-600 font-tech"
            >
              <option value="">Select Rival Driver...</option>
              {leaderboard.filter(l => l.id !== driver.id).map(r => (
                <option key={r.id} value={r.id}>
                  P{r.position} • {r.driver} ({r.lapTime})
                </option>
              ))}
            </select>
          </div>

          {rivalDriver ? (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center py-2 bg-[#080808] rounded-lg border border-neutral-800">
                <div className="font-bold text-white">{driver.driver}</div>
                <div className="text-neutral-500 font-tech font-bold uppercase">METRIC</div>
                <div className="font-bold text-red-500">{rivalDriver.driver}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1.5 font-mono-num">
                <div className="font-bold text-white">{driver.lapTime}</div>
                <div className="text-neutral-400 font-tech">LAP TIME</div>
                <div className="font-bold text-white">{rivalDriver.lapTime}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1.5 font-mono-num">
                <div>{driver.s1 || '--'}</div>
                <div className="text-neutral-400 font-tech">SECTOR 1</div>
                <div>{rivalDriver.s1 || '--'}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1.5 font-mono-num">
                <div>{driver.s2 || '--'}</div>
                <div className="text-neutral-400 font-tech">SECTOR 2</div>
                <div>{rivalDriver.s2 || '--'}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1.5 font-mono-num">
                <div>{driver.s3 || '--'}</div>
                <div className="text-neutral-400 font-tech">SECTOR 3</div>
                <div>{rivalDriver.s3 || '--'}</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-2 font-tech">
              Select a rival driver from the dropdown to compare sector deltas.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
}
