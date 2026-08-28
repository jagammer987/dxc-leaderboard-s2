import React from 'react';
import { 
  Crown, 
  Bookmark, 
  BookmarkCheck,
  Phone
} from 'lucide-react';
import { TEAMS, TYRE_COMPOUNDS } from '../utils/constants';
import { soundEffects } from '../utils/soundFx';

export default function MobileRacerCards({
  leaderboard,
  onSelectDriver,
  pinnedDriverId,
  onTogglePinDriver,
  isAdmin,
  onDeleteLap,
  onToggleLapValidity
}) {
  const getTeamColor = (teamName) => {
    const t = TEAMS.find(team => team.name.toLowerCase() === (teamName || '').toLowerCase());
    return t ? t.color : '#FF1E27';
  };

  const getTyreBadge = (compoundId) => {
    return TYRE_COMPOUNDS.find(c => c.id === compoundId) || TYRE_COMPOUNDS[0];
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="p-8 text-center bg-[#080808] border border-neutral-900 rounded-2xl my-4 text-neutral-400 font-tech">
        <p className="text-sm text-white">No lap times recorded for this stage yet.</p>
        <p className="text-xs text-neutral-500 mt-1">Check back once hotlaps are underway!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-tech">
      {leaderboard.map((lap) => {
        const isP1 = lap.position === 1;
        const isP2 = lap.position === 2;
        const isP3 = lap.position === 3;
        const tyre = getTyreBadge(lap.tyre);
        const teamColor = getTeamColor(lap.team);
        const isPinned = pinnedDriverId === lap.id;

        let cardBorder = 'border-neutral-900 bg-[#080808]';
        if (isPinned) cardBorder = 'border-red-600 bg-[#0D0506] shadow-lg shadow-red-600/30 ring-1 ring-red-600';
        else if (isP1) cardBorder = 'border-red-600/60 bg-[#0D0506] shadow-md shadow-red-600/20';
        else if (isP2) cardBorder = 'border-neutral-800 bg-[#080808]';
        else if (isP3) cardBorder = 'border-neutral-800 bg-[#080808]';

        return (
          <div
            key={lap.id}
            id={`driver-card-${lap.id}`}
            className={`rounded-2xl border p-4 transition-all duration-200 ${cardBorder} ${!lap.validLap ? 'opacity-40 line-through' : ''}`}
          >
            {/* Top Row: Rank, Driver Name & Pin */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Position Badge */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-xs shrink-0 shadow-md ${
                  isP1 
                    ? 'bg-red-600 text-white' 
                    : isP2 
                    ? 'bg-neutral-200 text-black font-extrabold' 
                    : isP3 
                    ? 'bg-neutral-400 text-black font-extrabold' 
                    : 'bg-neutral-900 text-white border border-neutral-800'
                }`}>
                  {lap.position}
                </div>

                {/* Team Livery Stripe & Driver Name */}
                <div 
                  className="w-1.5 h-8 rounded-full shrink-0" 
                  style={{ backgroundColor: teamColor }} 
                  title={lap.team} 
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span 
                      onClick={() => {
                        soundEffects.playClick();
                        onSelectDriver(lap);
                      }}
                      className="font-display font-extrabold text-sm sm:text-base text-white hover:text-red-500 transition truncate cursor-pointer"
                    >
                      {lap.driver}
                    </span>
                    {isP1 && <Crown className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  </div>
                  <div className="text-xs text-neutral-400 flex items-center space-x-1.5 truncate">
                    <span>{lap.team}</span>
                    {isAdmin && lap.phone && (
                      <>
                        <span>•</span>
                        <span className="text-red-400 font-mono font-bold">📱 {lap.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pin My Driver Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playClick();
                  onTogglePinDriver(lap.id);
                }}
                className={`p-2 rounded-xl transition ${
                  isPinned 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/40' 
                    : 'bg-[#000000] text-neutral-400 hover:text-white border border-neutral-800'
                }`}
                title={isPinned ? 'Unpin Driver' : 'Pin Driver'}
              >
                {isPinned ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>

            {/* Middle Row: Lap Time & Gap */}
            <div 
              onClick={() => {
                soundEffects.playClick();
                onSelectDriver(lap);
              }}
              className="bg-[#000000] border border-neutral-900 rounded-xl p-3 my-2.5 flex items-center justify-between cursor-pointer hover:border-red-600/50 transition"
            >
              <div>
                <span className="text-[10px] uppercase text-neutral-400 font-tech block tracking-wider">
                  LAP TIME
                </span>
                <span className={`text-xl sm:text-2xl font-black font-mono-num ${isP1 ? 'text-red-500 text-glow-red' : 'text-white'}`}>
                  {lap.lapTime}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase text-neutral-400 font-tech block tracking-wider">
                  GAP TO P1
                </span>
                <span className="text-sm font-bold font-mono-num text-neutral-300">
                  {lap.gapToLeader}
                </span>
              </div>
            </div>

            {/* Bottom Row: S1, S2, S3 Sectors, Tyre & Rig */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center space-x-1.5 text-[11px] font-mono-num">
                <span className={`px-2 py-0.5 rounded border ${lap.isS1Purple ? 'bg-red-950/80 text-red-500 border-red-600 font-bold' : 'bg-[#000000] text-neutral-300 border-neutral-800'}`}>
                  S1: {lap.s1 || '--.---'}
                </span>
                <span className={`px-2 py-0.5 rounded border ${lap.isS2Purple ? 'bg-red-950/80 text-red-500 border-red-600 font-bold' : 'bg-[#000000] text-neutral-300 border-neutral-800'}`}>
                  S2: {lap.s2 || '--.---'}
                </span>
                <span className={`px-2 py-0.5 rounded border ${lap.isS3Purple ? 'bg-red-950/80 text-red-500 border-red-600 font-bold' : 'bg-[#000000] text-neutral-300 border-neutral-800'}`}>
                  S3: {lap.s3 || '--.---'}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tyre.bg} ${tyre.border} ${tyre.text}`}>
                  {tyre.badge} {tyre.id}
                </span>
                <span className="bg-[#000000] text-neutral-300 border border-neutral-800 px-1.5 py-0.5 rounded text-[10px]">
                  {lap.rig}
                </span>
              </div>
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-end space-x-2">
                <button
                  onClick={() => onToggleLapValidity(lap.id)}
                  className="px-2.5 py-1 rounded bg-[#000000] text-neutral-300 text-xs font-bold border border-neutral-800"
                >
                  {lap.validLap ? 'Invalidate' : 'Restore'}
                </button>
                <button
                  onClick={() => onDeleteLap(lap.id)}
                  className="px-2.5 py-1 rounded bg-red-950 text-red-400 text-xs font-bold border border-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
