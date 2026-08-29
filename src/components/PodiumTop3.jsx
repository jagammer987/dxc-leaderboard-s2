import React from 'react';
import { Trophy, Crown } from 'lucide-react';
import { TYRE_COMPOUNDS, TEAMS } from '../utils/constants';
import { soundEffects } from '../utils/soundFx';

export default function PodiumTop3({ top3, onSelectDriver }) {
  if (!top3 || top3.length === 0) return null;

  const p1 = top3[0];
  const p2 = top3.length > 1 ? top3[1] : null;
  const p3 = top3.length > 2 ? top3[2] : null;

  const getTeamColor = (teamName) => {
    const t = TEAMS.find(team => team.name.toLowerCase() === (teamName || '').toLowerCase());
    return t ? t.color : '#FF1E27';
  };

  const getTyreBadge = (compoundId) => {
    return TYRE_COMPOUNDS.find(c => c.id === compoundId) || TYRE_COMPOUNDS[0];
  };

  // Rich Desktop Cards
  const renderCard = (driver, rank, badge, borderClass, bgClass) => {
    if (!driver) return null;

    const tyre = getTyreBadge(driver.tyre);
    const teamColor = getTeamColor(driver.team);
    const isP1 = rank === 1;

    return (
      <div
        onClick={() => {
          soundEffects.playClick();
          onSelectDriver(driver);
        }}
        className={`flex-1 ${bgClass} border ${borderClass} rounded-2xl p-4 cursor-pointer hover:border-red-600 transition-all group flex flex-col justify-between shadow-xl`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-display font-black text-xs ${
              isP1 ? 'bg-red-600 text-white shadow-md shadow-red-600/40' : 'bg-neutral-800 text-white'
            }`}>
              P{rank}
            </span>
            <span className={`font-display font-black text-xs uppercase tracking-wider ${
              isP1 ? 'text-red-500' : 'text-neutral-400'
            }`}>
              {isP1 ? 'PACESETTER' : `RANK ${rank}`}
            </span>
          </div>

          <div 
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: teamColor }}
            title={driver.team}
          />
        </div>

        <div className="my-1">
          <h3 className="text-lg font-black font-display text-white group-hover:text-red-500 transition truncate">
            {driver.driver}
          </h3>
          <p className="text-xs font-tech text-neutral-400 truncate">
            {driver.team}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-tech text-neutral-400 uppercase">
              {isP1 ? 'FASTEST LAP' : `GAP: ${driver.gapToLeader}`}
            </div>
            <div className={`text-xl font-black font-mono-num ${isP1 ? 'text-red-500 text-glow-red' : 'text-white'}`}>
              {driver.lapTime}
            </div>
          </div>

          <div className="text-right">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tyre.bg} ${tyre.border} ${tyre.text}`}>
              {tyre.badge} {tyre.id}
            </span>
            <div className="text-[10px] font-tech text-neutral-400 mt-1">
              {driver.rig}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      
      {/* 1. COMPACT MOBILE VIEW (Top 3 Names & Times Strip) */}
      <div className="block sm:hidden bg-[#080808] border border-neutral-900 rounded-2xl p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-neutral-900">
          <span className="text-[11px] font-display font-black uppercase tracking-wider text-neutral-300 flex items-center">
            <Trophy className="w-3.5 h-3.5 mr-1.5 text-red-500" /> TOP 3 PACESETTERS
          </span>
          <span className="text-[10px] font-tech text-neutral-500">PROVISIONAL PODIUM</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-tech">
          {/* P1 */}
          {p1 && (
            <div 
              onClick={() => { soundEffects.playClick(); onSelectDriver(p1); }}
              className="bg-[#0F0506] border border-red-600/70 rounded-xl p-2 cursor-pointer shadow-md shadow-red-600/10 flex flex-col justify-between"
            >
              <div className="flex items-center justify-center space-x-1 mb-0.5">
                <span className="w-4 h-4 rounded bg-red-600 text-white font-display font-black text-[10px] flex items-center justify-center">
                  1
                </span>
                <Crown className="w-3 h-3 text-red-500" />
              </div>
              <div className="font-extrabold text-white text-xs truncate">
                {p1.driver}
              </div>
              <div className="font-mono-num font-black text-red-500 text-xs mt-0.5">
                {p1.lapTime}
              </div>
            </div>
          )}

          {/* P2 */}
          {p2 ? (
            <div 
              onClick={() => { soundEffects.playClick(); onSelectDriver(p2); }}
              className="bg-[#000000] border border-neutral-800 rounded-xl p-2 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-center space-x-1 mb-0.5">
                <span className="w-4 h-4 rounded bg-neutral-200 text-black font-display font-bold text-[10px] flex items-center justify-center">
                  2
                </span>
              </div>
              <div className="font-bold text-neutral-200 text-xs truncate">
                {p2.driver}
              </div>
              <div className="font-mono-num font-bold text-white text-xs mt-0.5">
                {p2.lapTime}
              </div>
            </div>
          ) : (
            <div className="bg-[#000000] border border-neutral-900 rounded-xl p-2 text-neutral-600 text-[10px] flex items-center justify-center">
              P2 Pending
            </div>
          )}

          {/* P3 */}
          {p3 ? (
            <div 
              onClick={() => { soundEffects.playClick(); onSelectDriver(p3); }}
              className="bg-[#000000] border border-neutral-800 rounded-xl p-2 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-center space-x-1 mb-0.5">
                <span className="w-4 h-4 rounded bg-neutral-400 text-black font-display font-bold text-[10px] flex items-center justify-center">
                  3
                </span>
              </div>
              <div className="font-bold text-neutral-300 text-xs truncate">
                {p3.driver}
              </div>
              <div className="font-mono-num font-bold text-white text-xs mt-0.5">
                {p3.lapTime}
              </div>
            </div>
          ) : (
            <div className="bg-[#000000] border border-neutral-900 rounded-xl p-2 text-neutral-600 text-[10px] flex items-center justify-center">
              P3 Pending
            </div>
          )}
        </div>
      </div>

      {/* 2. DESKTOP / TABLET VIEW (Full 3 Rich Cards) */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-neutral-400 flex items-center">
            <Trophy className="w-4 h-4 mr-1.5 text-red-500" /> TOP 3 PACESETTERS
          </h2>
          <span className="text-[11px] font-tech text-neutral-400">CLICK TO VIEW TELEMETRY</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* P2 */}
          {renderCard(p2, 2, 'P2', 'border-neutral-800 hover:border-neutral-600', 'bg-[#080808]')}
          {/* P1 */}
          {renderCard(p1, 1, 'P1', 'border-red-600/70 hover:border-red-500 glow-red', 'bg-[#0D0506]')}
          {/* P3 */}
          {renderCard(p3, 3, 'P3', 'border-neutral-800 hover:border-neutral-600', 'bg-[#080808]')}
        </div>
      </div>

    </div>
  );
}
