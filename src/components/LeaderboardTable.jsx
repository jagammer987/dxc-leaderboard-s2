import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Phone,
  Timer
} from 'lucide-react';
import { TYRE_COMPOUNDS, TEAMS } from '../utils/constants';
import { soundEffects } from '../utils/soundFx';

export default function LeaderboardTable({
  leaderboard,
  onSelectDriver,
  onDeleteLap,
  onToggleLapValidity,
  currentTrack,
  isAdmin
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tyreFilter, setTyreFilter] = useState('ALL');

  const filteredLaps = leaderboard.filter(lap => {
    const matchesSearch = 
      lap.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isAdmin && lap.phone && lap.phone.includes(searchTerm)) ||
      (lap.team && lap.team.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTyre = tyreFilter === 'ALL' || lap.tyre === tyreFilter;

    return matchesSearch && matchesTyre;
  });

  const getTeamColor = (teamName) => {
    const t = TEAMS.find(team => team.name.toLowerCase() === (teamName || '').toLowerCase());
    return t ? t.color : '#FF1E27';
  };

  const getTyreBadge = (compoundId) => {
    return TYRE_COMPOUNDS.find(c => c.id === compoundId) || TYRE_COMPOUNDS[0];
  };

  return (
    <div className="w-full bg-[#080808] border border-neutral-900 rounded-2xl p-3 sm:p-5 shadow-2xl font-tech">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-900">
        <div>
          <h2 className="text-sm sm:text-base font-black font-display tracking-wider text-white uppercase flex items-center">
            <span className="text-red-600 mr-2">///</span>
            TIMING TOWER: {currentTrack.stageBadge} ({currentTrack.name.toUpperCase()})
          </h2>
          <span className="text-[10px] sm:text-xs font-tech text-neutral-400">
            TAP ANY ROW TO VIEW FULL TELEMETRY & SECTORS
          </span>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAdmin ? "Search driver, phone..." : "Search driver..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#000000] border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 font-tech w-full sm:w-52"
            />
          </div>

          <select
            value={tyreFilter}
            onChange={(e) => setTyreFilter(e.target.value)}
            className="bg-[#000000] border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-600 font-tech"
          >
            <option value="ALL">All Tyres</option>
            <option value="SOFT">🔴 Soft</option>
            <option value="MEDIUM">⚪ Medium</option>
            <option value="HARD">⚫ Hard</option>
          </select>
        </div>
      </div>

      {/* Timing Table (Responsive with mobile horizontal scroll) */}
      <div className="overflow-x-auto rounded-xl border border-neutral-900 bg-[#000000] shadow-inner">
        <table className="w-full text-left border-collapse font-tech min-w-[620px] sm:min-w-full">
          <thead>
            <tr className="bg-[#050505] border-b border-neutral-900 text-[10px] sm:text-[11px] font-display uppercase tracking-wider text-neutral-400">
              <th className="py-2.5 px-3 w-12 text-center sticky left-0 bg-[#050505] z-10">POS</th>
              <th className="py-2.5 px-3 sm:px-4 sticky left-12 bg-[#050505] z-10">DRIVER / TEAM</th>
              {isAdmin && <th className="py-2.5 px-3 text-center">CONTACT</th>}
              <th className="py-2.5 px-3 sm:px-4 text-center">LAP TIME</th>
              <th className="py-2.5 px-2.5 text-center">S1</th>
              <th className="py-2.5 px-2.5 text-center">S2</th>
              <th className="py-2.5 px-2.5 text-center">S3</th>
              <th className="py-2.5 px-3 text-center">GAP</th>
              <th className="py-2.5 px-3 text-center">TYRE</th>
              <th className="py-2.5 px-3 text-center">RIG</th>
              {isAdmin && <th className="py-2.5 px-3 text-right">ADMIN</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 text-xs">
            {filteredLaps.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 11 : 10} className="py-10 text-center text-neutral-500">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Timer className="w-6 h-6 text-neutral-600" />
                    <p className="text-sm text-neutral-300 font-bold">No lap times recorded for this stage yet.</p>
                    <p className="text-xs text-neutral-500">Marshals are standing by at the sim rigs!</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLaps.map((lap) => {
                const isP1 = lap.position === 1;
                const isP2 = lap.position === 2;
                const isP3 = lap.position === 3;
                const tyre = getTyreBadge(lap.tyre);
                const teamColor = getTeamColor(lap.team);

                return (
                  <tr 
                    key={lap.id}
                    onClick={() => {
                      soundEffects.playClick();
                      onSelectDriver(lap);
                    }}
                    className={`hover:bg-[#121212] transition-colors cursor-pointer ${!lap.validLap ? 'opacity-40 line-through' : ''} ${isP1 ? 'bg-red-950/15' : ''}`}
                  >
                    {/* Position (Sticky on mobile scroll) */}
                    <td className="py-2.5 px-3 text-center sticky left-0 bg-[#000000] z-10">
                      <span className={`inline-block w-6 h-6 rounded-md font-display font-black text-xs leading-6 text-center ${
                        isP1 
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/40' 
                          : isP2 
                          ? 'bg-neutral-200 text-black font-bold' 
                          : isP3 
                          ? 'bg-neutral-400 text-black font-bold' 
                          : 'bg-neutral-900 text-white border border-neutral-800'
                      }`}>
                        {lap.position}
                      </span>
                    </td>

                    {/* Driver & Team (Sticky on mobile scroll) */}
                    <td className="py-2.5 px-3 sm:px-4 sticky left-12 bg-[#000000] z-10">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="w-1 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm hover:text-red-500 transition truncate max-w-[120px] sm:max-w-none">
                            {lap.driver}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate max-w-[120px] sm:max-w-none">
                            {lap.team}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Admin-Only Mobile Number */}
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-neutral-300">
                        {lap.phone ? (
                          <span className="bg-[#080808] border border-neutral-800 px-2 py-0.5 rounded text-red-400 font-bold">
                            📱 {lap.phone}
                          </span>
                        ) : (
                          <span className="text-neutral-600">--</span>
                        )}
                      </td>
                    )}

                    {/* Lap Time */}
                    <td className="py-2.5 px-3 sm:px-4 text-center font-mono-num">
                      <span className={`font-extrabold text-sm px-2 py-0.5 rounded ${
                        isP1 ? 'text-red-500 font-black text-glow-red' : 'text-white'
                      }`}>
                        {lap.lapTime}
                      </span>
                    </td>

                    {/* Sector 1 */}
                    <td className="py-2.5 px-2.5 text-center font-mono-num">
                      <span className={lap.isS1Purple ? 'text-red-500 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-600' : 'text-neutral-300'}>
                        {lap.s1 || '--.---'}
                      </span>
                    </td>

                    {/* Sector 2 */}
                    <td className="py-2.5 px-2.5 text-center font-mono-num">
                      <span className={lap.isS2Purple ? 'text-red-500 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-600' : 'text-neutral-300'}>
                        {lap.s2 || '--.---'}
                      </span>
                    </td>

                    {/* Sector 3 */}
                    <td className="py-2.5 px-2.5 text-center font-mono-num">
                      <span className={lap.isS3Purple ? 'text-red-500 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-600' : 'text-neutral-300'}>
                        {lap.s3 || '--.---'}
                      </span>
                    </td>

                    {/* Gap to Leader */}
                    <td className="py-2.5 px-3 text-center font-mono-num font-semibold text-neutral-300">
                      {lap.gapToLeader}
                    </td>

                    {/* Tyre Badge */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${tyre.bg} ${tyre.border} ${tyre.text}`}>
                        {tyre.badge} {tyre.id}
                      </span>
                    </td>

                    {/* Rig */}
                    <td className="py-2.5 px-3 text-center text-neutral-300 text-xs">
                      {lap.rig}
                    </td>

                    {/* Admin Moderation Actions */}
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              soundEffects.playClick();
                              onToggleLapValidity(lap.id);
                            }}
                            className="p-1 rounded bg-[#0D0D0D] hover:bg-neutral-800 text-neutral-400 border border-neutral-800 transition cursor-pointer"
                            title={lap.validLap ? 'Invalidate Lap' : 'Restore Lap'}
                          >
                            {lap.validLap ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              soundEffects.playClick();
                              onDeleteLap(lap.id);
                            }}
                            className="p-1 rounded bg-[#0D0D0D] hover:bg-red-950 text-neutral-400 hover:text-red-500 border border-neutral-800 transition cursor-pointer"
                            title="Delete Lap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-tech text-neutral-500">
        <div>
          Showing {filteredLaps.length} drivers recorded for {currentTrack.name}
        </div>
        <div className="text-white font-bold">
          DRIFT<span className="text-red-600">x</span>COMMUNE
        </div>
      </div>
    </div>
  );
}
