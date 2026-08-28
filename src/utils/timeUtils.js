/**
 * Universal, Ultra-Robust F1 Lap Time Parser.
 * Handles ANY user input format seamlessly:
 * - "1:03.412" -> 63412 ms
 * - "1:03:412" -> 63412 ms
 * - "1.03.412" -> 63412 ms
 * - "1 03 412" -> 63412 ms
 * - "103412"   -> 63412 ms
 * - "63.412"   -> 63412 ms
 * - "1:03"     -> 63000 ms
 * - "1:3.4"    -> 63400 ms
 * - "103.412"  -> 63412 ms
 */
export function parseTimeToMs(timeStr) {
  if (timeStr === null || timeStr === undefined) return null;
  let str = String(timeStr).trim();
  if (!str || str.toLowerCase() === 'dnf' || str.toLowerCase() === 'invalid' || str === '--:--.---') {
    return null;
  }

  // Replace spaces, commas, and dashes
  str = str.replace(/,/g, '.').replace(/[\s-_]+/g, ':');

  // 1. Check for shorthand like "103412" (6 digits: 1m 03s 412ms)
  if (/^\d{6}$/.test(str)) {
    const mins = parseInt(str.slice(0, 1), 10);
    const secs = parseInt(str.slice(1, 3), 10);
    const ms = parseInt(str.slice(3, 6), 10);
    return mins * 60000 + secs * 1000 + ms;
  }

  // 2. Check for shorthand like "10341" (5 digits: 1m 03s 410ms)
  if (/^\d{5}$/.test(str)) {
    const mins = parseInt(str.slice(0, 1), 10);
    const secs = parseInt(str.slice(1, 3), 10);
    const ms = parseInt(str.slice(3, 5).padEnd(3, '0'), 10);
    return mins * 60000 + secs * 1000 + ms;
  }

  // 3. Check for format with 3 dot parts like "1.03.412" or "1.31.840"
  if (str.split('.').length === 3) {
    const p = str.split('.');
    const mins = parseInt(p[0], 10);
    const secs = parseInt(p[1], 10);
    const ms = parseInt(p[2].padEnd(3, '0').slice(0, 3), 10);
    if (!isNaN(mins) && !isNaN(secs) && !isNaN(ms)) {
      return mins * 60000 + secs * 1000 + ms;
    }
  }

  // 4. Standard Colon-separated format "1:03.412" or "01:03.412"
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const secPart = parts[1];
      const seconds = parseFloat(secPart);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return Math.round((minutes * 60 + seconds) * 1000);
      }
    } else if (parts.length >= 3) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const millis = parseInt(parts[2].padEnd(3, '0').slice(0, 3), 10);
      if (!isNaN(minutes) && !isNaN(seconds) && !isNaN(millis)) {
        return minutes * 60000 + seconds * 1000 + millis;
      }
    }
  }

  // 5. Raw decimal number (e.g. 63.412 or 91.840)
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    // If entered as 63.412 (seconds)
    if (num < 500) {
      return Math.round(num * 1000);
    }
  }

  return null;
}

// Alias for backwards compatibility
export const parseLapInput = parseTimeToMs;

/**
 * Converts milliseconds to standard F1 lap time string: "m:ss.sss" (e.g. "1:03.412")
 */
export function formatMsToLapTime(ms) {
  if (ms === null || ms === undefined || ms === Infinity || isNaN(ms) || ms <= 0) {
    return '--:--.---';
  }

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const remSec = totalSeconds % 60;
  const secFormatted = remSec.toFixed(3);
  const paddedSec = remSec < 10 ? `0${secFormatted}` : secFormatted;

  return `${minutes}:${paddedSec}`;
}

// Alias for backwards compatibility
export const formatLapTime = formatMsToLapTime;

/**
 * Converts sector milliseconds to sector string: "ss.sss" (e.g. "26.810")
 */
export function formatSectorMs(ms) {
  if (ms === null || ms === undefined || ms === Infinity || isNaN(ms) || ms <= 0) {
    return '--.---';
  }
  return (ms / 1000).toFixed(3);
}

/**
 * Converts sector string (e.g. "26.810" or "0:26.810") to ms.
 */
export function parseSectorToMs(sectorStr) {
  if (!sectorStr) return Infinity;
  const ms = parseTimeToMs(sectorStr);
  return ms !== null ? ms : Infinity;
}

/**
 * Formats time difference in seconds with sign: "+0.232" or "LEADER" or "-".
 */
export function formatDelta(currentMs, leaderMs) {
  if (currentMs === leaderMs) return 'LEADER';
  if (!currentMs || !leaderMs || currentMs === Infinity || leaderMs === Infinity) return '+--.---';

  const diffMs = currentMs - leaderMs;
  const diffSec = (diffMs / 1000).toFixed(3);
  return `+${diffSec}`;
}

/**
 * Calculates theoretical optimal lap combining fastest S1, S2, S3 across all valid drivers
 */
export function calculateTheoreticalOptimalLap(laps) {
  if (!Array.isArray(laps) || laps.length === 0) {
    return { optimalLapTime: null, s1Best: null, s2Best: null, s3Best: null };
  }

  let minS1 = Infinity;
  let minS2 = Infinity;
  let minS3 = Infinity;

  laps.forEach(lap => {
    if (lap.validLap) {
      const s1 = parseSectorToMs(lap.s1);
      const s2 = parseSectorToMs(lap.s2);
      const s3 = parseSectorToMs(lap.s3);

      if (s1 < minS1) minS1 = s1;
      if (s2 < minS2) minS2 = s2;
      if (s3 < minS3) minS3 = s3;
    }
  });

  if (minS1 !== Infinity && minS2 !== Infinity && minS3 !== Infinity) {
    const totalOptimalMs = minS1 + minS2 + minS3;
    return {
      optimalLapTime: formatMsToLapTime(totalOptimalMs),
      optimalLapMs: totalOptimalMs,
      s1Best: formatSectorMs(minS1),
      s2Best: formatSectorMs(minS2),
      s3Best: formatSectorMs(minS3),
    };
  }

  return { optimalLapTime: null, s1Best: null, s2Best: null, s3Best: null };
}

/**
 * Processes a list of laps for a track and calculates:
 * - Sorted positions
 * - Session-fastest sectors across all drivers (highlighted in red)
 * - Theoretical best lap for each driver
 * - Gaps to leader and interval to car ahead
 */
export function analyzeLeaderboard(laps) {
  if (!Array.isArray(laps) || laps.length === 0) return [];

  // Parse each lap
  const parsed = laps.map(lap => {
    const rawMs = parseTimeToMs(lap.lapTime);
    const lapMs = (rawMs !== null && rawMs > 0) ? rawMs : (lap.lapMs || Infinity);
    const s1Ms = parseSectorToMs(lap.s1);
    const s2Ms = parseSectorToMs(lap.s2);
    const s3Ms = parseSectorToMs(lap.s3);

    return {
      ...lap,
      lapMs,
      s1Ms,
      s2Ms,
      s3Ms,
    };
  });

  // Filter valid and sort by fastest lapMs ascending
  parsed.sort((a, b) => {
    if (a.validLap !== b.validLap) return a.validLap ? -1 : 1;
    return a.lapMs - b.lapMs;
  });

  // Calculate session fastest sectors
  let bestS1 = Infinity;
  let bestS2 = Infinity;
  let bestS3 = Infinity;

  parsed.forEach(lap => {
    if (lap.validLap && lap.lapMs !== Infinity) {
      if (lap.s1Ms < bestS1) bestS1 = lap.s1Ms;
      if (lap.s2Ms < bestS2) bestS2 = lap.s2Ms;
      if (lap.s3Ms < bestS3) bestS3 = lap.s3Ms;
    }
  });

  const leaderLapMs = parsed.length > 0 && parsed[0].validLap ? parsed[0].lapMs : Infinity;

  return parsed.map((lap, index) => {
    const pos = index + 1;
    const gapToLeader = formatDelta(lap.lapMs, leaderLapMs);

    const prevLap = index > 0 ? parsed[index - 1] : null;
    const interval = prevLap && prevLap.lapMs !== Infinity && lap.lapMs !== Infinity
      ? `+${((lap.lapMs - prevLap.lapMs) / 1000).toFixed(3)}`
      : 'LEADER';

    // Sector status: fastest overall
    const isS1Purple = lap.s1Ms !== Infinity && lap.s1Ms === bestS1;
    const isS2Purple = lap.s2Ms !== Infinity && lap.s2Ms === bestS2;
    const isS3Purple = lap.s3Ms !== Infinity && lap.s3Ms === bestS3;

    // Theoretical best for this driver
    const theoreticalBestMs = (lap.s1Ms !== Infinity && lap.s2Ms !== Infinity && lap.s3Ms !== Infinity)
      ? lap.s1Ms + lap.s2Ms + lap.s3Ms
      : lap.lapMs;

    return {
      ...lap,
      position: pos,
      gapToLeader,
      interval: pos === 1 ? 'LEADER' : interval,
      isS1Purple,
      isS2Purple,
      isS3Purple,
      theoreticalBest: formatMsToLapTime(theoreticalBestMs),
      theoreticalBestMs,
      potentialGainMs: lap.lapMs !== Infinity && theoreticalBestMs < lap.lapMs ? lap.lapMs - theoreticalBestMs : 0
    };
  });
}
