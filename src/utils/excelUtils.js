import * as XLSX from 'xlsx';

/**
 * Google Apps Script Code for 2-Way Live Sync
 * Marshals can paste this into Google Sheet > Extensions > Apps Script and click Deploy!
 */
export const GOOGLE_APPS_SCRIPT_CODE = `function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    var phone = String(contents.phone || '').replace(/[^0-9]/g, '');
    var driver = String(contents.driver || '').trim().toLowerCase();
    var trackId = String(contents.trackId || 'redbullring').trim().toLowerCase();
    
    // Check existing driver row
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      var rowDriver = String(data[i][0] || data[i][1] || '').trim().toLowerCase();
      var rowPhone = String(data[i][1] || data[i][2] || '').replace(/[^0-9]/g, '');
      
      if ((phone && rowPhone === phone) || (rowDriver === driver)) {
        foundIndex = i + 1;
        break;
      }
    }
    
    var rowData = [
      contents.driver || '',
      contents.phone || '',
      contents.trackId || 'redbullring',
      contents.team || 'DriftxCommune Racing',
      contents.lapTime || '--:--.---',
      contents.s1 || '',
      contents.s2 || '',
      contents.s3 || '',
      contents.tyre || 'SOFT',
      contents.rig || 'Rig 1',
      contents.assists || 'NONE',
      contents.topSpeed || 320,
      contents.validLap !== false ? 'YES' : 'NO',
      contents.notes || '',
      contents.timestamp || new Date().toISOString()
    ];
    
    if (foundIndex !== -1) {
      sheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Normalizes headers from Excel/CSV/JSON to standardize keys
 */
function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    normalized[cleanKey] = val;
  }
  return normalized;
}

/**
 * Smart Adaptive Mapper: Handles both standard column layout and shifted layouts
 */
export function mapRowToLap(row, defaultTrackId = 'redbullring') {
  let driver = '';
  let phone = '';
  let trackId = defaultTrackId;
  let team = 'DriftxCommune Racing';
  let lapTime = '--:--.---';
  let s1 = '';
  let s2 = '';
  let s3 = '';
  let tyre = 'SOFT';
  let rig = 'Rig 1';
  let assists = 'NONE';
  let topSpeed = 320.0;
  let validLap = true;
  let timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  let notes = '';

  // 1. Shifted layout detection: Pos contains driver name (e.g. "amyn", "amisha", "Rishabh Na")
  if (row.Pos && isNaN(Number(row.Pos))) {
    driver = String(row.Pos).trim();
    phone = String(row['Driver Name'] || row.drivername || '').replace(/[^0-9]/g, '');
    
    const rawTrack = String(row['Mobile Number (Admin)'] || row['Stage / Track'] || defaultTrackId).toLowerCase();
    if (rawTrack.includes('redbull') || rawTrack.includes('austria')) trackId = 'redbullring';
    else if (rawTrack.includes('bahrain')) trackId = 'bahrain';
    else if (rawTrack.includes('silverstone')) trackId = 'silverstone';
    else trackId = 'redbullring';

    team = String(row['Stage / Track'] || 'DriftxCommune Racing').trim();
    lapTime = String(row['F1 Team'] || row['Lap Time'] || '--:--.---').trim();
    tyre = String(row['Sector 3'] || row.Tyre || 'SOFT').toUpperCase();
    rig = String(row['Gap to P1'] || row['Sim Rig'] || 'Rig 1').trim();
    assists = String(row.Tyre || 'NONE').toUpperCase();
    topSpeed = parseFloat(row['Sim Rig']) || 320.0;
    
    const vStr = String(row.Assists || row['Valid Lap'] || 'YES').toUpperCase().trim();
    validLap = vStr === 'YES' || vStr === 'TRUE' || vStr === '1';
    timestamp = String(row['Valid Lap'] || row['Date & Time'] || timestamp).trim();
  } else {
    // 2. Standard layout
    const norm = normalizeRowKeys(row);
    driver = norm.drivername || norm.driver || norm.name || norm.pilot || norm.player || '';
    phone = String(norm.mobilenumber || norm.mobile || norm.phone || norm.phonenumber || '').replace(/[^0-9]/g, '');
    
    const rawTrack = String(norm.trackid || norm.track || norm.stage || defaultTrackId).toLowerCase();
    if (rawTrack.includes('redbull') || rawTrack.includes('austria')) trackId = 'redbullring';
    else if (rawTrack.includes('bahrain')) trackId = 'bahrain';
    else if (rawTrack.includes('silverstone')) trackId = 'silverstone';
    else trackId = defaultTrackId;

    team = norm.team || norm.f1team || 'DriftxCommune Racing';
    lapTime = norm.laptime || norm.time || norm.lap || '--:--.---';
    s1 = norm.sector1 || norm.s1 || '';
    s2 = norm.sector2 || norm.s2 || '';
    s3 = norm.sector3 || norm.s3 || '';
    tyre = String(norm.tyre || norm.tire || 'SOFT').toUpperCase();
    rig = norm.rig || norm.simrig || 'Rig 1';
    assists = String(norm.assists || 'NONE').toUpperCase();
    topSpeed = parseFloat(norm.topspeed || norm.speed) || 320.0;
    
    const v = String(norm.validlap !== undefined ? norm.validlap : (norm.valid || 'YES')).toUpperCase().trim();
    validLap = v !== 'NO' && v !== 'FALSE' && v !== '0' && v !== 'DNF' && v !== 'INVALID';
    timestamp = norm.timestamp || norm.datetime || timestamp;
    notes = norm.notes || '';
  }

  // Clean tyre
  if (tyre.includes('MED')) tyre = 'MEDIUM';
  else if (tyre.includes('HARD')) tyre = 'HARD';
  else if (tyre.includes('INT')) tyre = 'INTER';
  else if (tyre.includes('WET')) tyre = 'WET';
  else tyre = 'SOFT';

  return {
    id: `lap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    driver: String(driver).trim(),
    phone,
    trackId,
    team: String(team).trim(),
    lapTime: String(lapTime).trim(),
    s1: String(s1).trim(),
    s2: String(s2).trim(),
    s3: String(s3).trim(),
    tyre,
    rig: String(rig).trim(),
    assists,
    topSpeed,
    validLap,
    timestamp: String(timestamp).trim(),
    notes: String(notes).trim()
  };
}

/**
 * Extracts clean Google Sheet ID and GID from any URL
 */
export function extractGoogleSheetId(url) {
  if (!url) return null;
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = url.match(/gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    return { sheetId, gid };
  }
  return null;
}

/**
 * Fetches and parses live Google Sheet / Webhook data
 */
export async function fetchLiveSheetData(sheetUrl, defaultTrackId = 'redbullring') {
  if (!sheetUrl) throw new Error('No Google Sheet URL provided');
  const clean = sheetUrl.trim();

  // 1. Google Apps Script Web App JSON endpoint
  if (clean.includes('script.google.com/macros/s/')) {
    const res = await fetch(clean);
    if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
    const jsonRows = await res.json();
    if (Array.isArray(jsonRows) && jsonRows.length > 0) {
      return jsonRows
        .map(row => mapRowToLap(row, defaultTrackId))
        .filter(lap => lap.driver && lap.driver !== 'Unknown Driver' && lap.lapTime !== '--:--.---');
    }
    return [];
  }

  // 2. Standard Google Sheet URL
  const sheetInfo = extractGoogleSheetId(clean);
  if (!sheetInfo) {
    throw new Error('Invalid Google Sheet URL format');
  }

  const { sheetId, gid } = sheetInfo;

  const candidateUrls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`)}`
  ];

  let rawCsvText = null;
  for (const endpoint of candidateUrls) {
    try {
      const resp = await fetch(endpoint, { method: 'GET' });
      if (resp.ok) {
        const text = await resp.text();
        if (text && !text.includes('<!DOCTYPE html>') && text.length > 10) {
          rawCsvText = text;
          break;
        }
      }
    } catch (e) {}
  }

  if (!rawCsvText) {
    throw new Error('Could not access Google Sheet.');
  }

  const workbook = XLSX.read(rawCsvText, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!jsonData || jsonData.length === 0) {
    return [];
  }

  return jsonData
    .map(row => mapRowToLap(row, defaultTrackId))
    .filter(lap => lap.driver && lap.driver !== 'Unknown Driver' && lap.lapTime !== '--:--.---');
}

/**
 * Pushes a new/updated lap to Google Sheets via Apps Script Webhook
 */
export async function pushLapToGoogleSheet(scriptUrl, lapData) {
  if (!scriptUrl || !scriptUrl.includes('script.google.com/macros/s/')) {
    return false;
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lapData)
    });
    return true;
  } catch (err) {
    console.warn('Google Sheet webhook push warning:', err);
    return false;
  }
}

/**
 * Parses an Excel / CSV File buffer
 */
export async function parseExcelFile(file, defaultTrackId = 'redbullring') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('No data found in uploaded Excel sheet');
        }

        const laps = jsonData
          .map(row => mapRowToLap(row, defaultTrackId))
          .filter(lap => lap.driver && lap.driver !== 'Unknown Driver' && lap.lapTime !== '--:--.---');

        resolve(laps);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports current leaderboard to a styled .xlsx file
 */
export function exportLeaderboardToExcel(laps, trackName = 'All Stages', includeAdminData = true) {
  const formattedData = laps.map((lap) => {
    const row = {
      'Driver Name': lap.driver,
    };

    if (includeAdminData && lap.phone) {
      row['Mobile Number'] = lap.phone;
    }

    row['Track'] = lap.trackId;
    row['Team'] = lap.team;
    row['Lap Time'] = lap.lapTime;
    row['Sector 1'] = lap.s1 || '--';
    row['Sector 2'] = lap.s2 || '--';
    row['Sector 3'] = lap.s3 || '--';
    row['Tyre'] = lap.tyre;
    row['Sim Rig'] = lap.rig;
    row['Assists'] = lap.assists;
    row['Top Speed'] = lap.topSpeed || '--';
    row['Valid Lap'] = lap.validLap ? 'YES' : 'NO';
    row['Notes'] = lap.notes || '';
    row['Timestamp'] = lap.timestamp;

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard');

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanTrack = trackName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `DriftxCommune_${cleanTrack}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates an official downloadable Excel template
 */
export function downloadTournamentExcelTemplate() {
  const sampleData = [
    {
      'Driver Name': 'Driver 1',
      'Mobile Number': '9876543210',
      'Track': 'redbullring',
      'Team': 'DriftxCommune Racing',
      'Lap Time': '1:03.412',
      'Sector 1': '16.210',
      'Sector 2': '28.650',
      'Sector 3': '18.552',
      'Tyre': 'SOFT',
      'Sim Rig': 'Rig 3',
      'Assists': 'NONE',
      'Top Speed': 326.4,
      'Valid Lap': 'YES',
      'Notes': 'Time Trials Round',
      'Timestamp': '2026-08-28 15:40'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TimeTrials');
  XLSX.writeFile(workbook, 'DriftxCommune_F1_Template.xlsx');
}
