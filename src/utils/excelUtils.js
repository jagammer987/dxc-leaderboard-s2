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
    var headers = data[0];
    
    var phone = String(contents.phone || '').replace(/[^0-9]/g, '');
    var driver = String(contents.driver || '').trim().toLowerCase();
    var trackId = String(contents.trackId || '').trim().toLowerCase();
    
    // Find row if existing
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      var rowTrack = String(data[i][2] || '').trim().toLowerCase();
      var rowPhone = String(data[i][1] || '').replace(/[^0-9]/g, '');
      var rowDriver = String(data[i][0] || '').trim().toLowerCase();
      
      if (rowTrack === trackId && ((phone && rowPhone === phone) || (!phone && rowDriver === driver))) {
        foundIndex = i + 1; // 1-based index in sheets
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
 * Normalizes headers from Excel/CSV to standardize keys
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
 * Maps a single row object from Excel/CSV/JSON to our standard Lap schema
 */
export function mapRowToLap(row, defaultTrackId = 'redbullring') {
  const norm = normalizeRowKeys(row);

  // Driver Name
  const driver = norm.drivername || norm.driver || norm.name || norm.pilot || norm.player || 'Unknown Driver';

  // Mobile / Phone
  let phone = norm.mobilenumber || norm.mobile || norm.phone || norm.phonenumber || norm.contact || norm.tel || '';
  phone = String(phone).replace(/[^0-9]/g, '').trim();

  // Track ID
  let trackId = norm.trackid || norm.track || norm.circuit || norm.stage || defaultTrackId;
  trackId = String(trackId).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (trackId.includes('redbull') || trackId.includes('austria') || trackId.includes('spielberg') || trackId.includes('timetrial')) {
    trackId = 'redbullring';
  } else if (trackId.includes('bahrain') || trackId.includes('sakhir') || trackId.includes('eliminator')) {
    trackId = 'bahrain';
  } else if (trackId.includes('silverstone') || trackId.includes('final') || trackId.includes('uk') || trackId.includes('britain')) {
    trackId = 'silverstone';
  } else if (!trackId) {
    trackId = defaultTrackId;
  }

  // Lap Time
  let lapTime = norm.laptime || norm.time || norm.lap || norm.bestlap || '--:--.---';
  lapTime = String(lapTime).trim();

  // Sectors
  const s1 = norm.sector1 || norm.s1 || norm.sec1 || '';
  const s2 = norm.sector2 || norm.s2 || norm.sec2 || '';
  const s3 = norm.sector3 || norm.s3 || norm.sec3 || '';

  // Tyre
  let tyre = (norm.tyre || norm.tire || norm.compound || 'SOFT').toUpperCase();
  if (tyre.includes('MED')) tyre = 'MEDIUM';
  else if (tyre.includes('HARD')) tyre = 'HARD';
  else if (tyre.includes('INT')) tyre = 'INTER';
  else if (tyre.includes('WET')) tyre = 'WET';
  else tyre = 'SOFT';

  // Rig
  let rig = norm.rig || norm.simrig || norm.rigsetup || norm.rigid || 'Rig 1';
  if (typeof rig === 'number') rig = `Rig ${rig}`;

  // Assists
  let assists = (norm.assists || norm.assist || norm.assistlevel || 'NONE').toUpperCase();
  if (assists.includes('FULL') || assists.includes('CASUAL')) assists = 'FULL';
  else if (assists.includes('MED') || assists.includes('PRO')) assists = 'MEDIUM';
  else assists = 'NONE';

  // Team
  const team = norm.team || norm.f1team || norm.livery || 'DriftxCommune Racing';

  // Top Speed
  const topSpeed = parseFloat(norm.topspeed || norm.speed || norm.maxspeed || norm.kmh) || 325.0;

  // Valid Lap
  let validLap = true;
  if (norm.valid !== undefined) {
    const v = String(norm.valid).toLowerCase().trim();
    if (v === 'false' || v === '0' || v === 'no' || v === 'dnf' || v === 'invalid') validLap = false;
  }
  if (norm.validlap !== undefined) {
    const v = String(norm.validlap).toLowerCase().trim();
    if (v === 'false' || v === '0' || v === 'no' || v === 'dnf' || v === 'invalid') validLap = false;
  }
  if (norm.status && String(norm.status).toLowerCase().includes('inv')) validLap = false;

  // Notes & Timestamp
  const notes = norm.notes || norm.remarks || norm.comment || '';
  const timestamp = norm.timestamp || norm.date || norm.timeofday || new Date().toISOString().slice(0, 16).replace('T', ' ');

  return {
    id: `lap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    driver: String(driver).trim(),
    phone,
    trackId,
    team: String(team).trim(),
    lapTime,
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
 * Transforms standard Google Sheet links to reliable GViz CSV URLs or Apps Script URLs
 */
export function normalizeGoogleSheetUrl(url) {
  if (!url) return '';
  let clean = url.trim();

  // If it's a Google Apps Script Web App URL
  if (clean.includes('script.google.com/macros/s/')) {
    return clean;
  }

  // If it's a standard Google Sheet URL
  const match = clean.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = clean.match(/gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }
    // GViz output=csv endpoint bypasses CORS and works seamlessly across all browsers
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }

  return clean;
}

/**
 * Fetches and parses a live Google Sheet or online CSV/Excel/Apps Script URL
 */
export async function fetchLiveSheetData(sheetUrl, defaultTrackId = 'redbullring') {
  const exportUrl = normalizeGoogleSheetUrl(sheetUrl);
  if (!exportUrl) throw new Error('Invalid sheet URL provided');

  // Handle Google Apps Script JSON endpoint
  if (exportUrl.includes('script.google.com/macros/s/')) {
    const res = await fetch(exportUrl);
    if (!res.ok) throw new Error(`Google Apps Script returned status ${res.status}`);
    const jsonRows = await res.json();
    if (!Array.isArray(jsonRows)) throw new Error('Invalid response from Google Apps Script');
    return jsonRows
      .map(row => mapRowToLap(row, defaultTrackId))
      .filter(lap => lap.driver && lap.driver !== 'Unknown Driver');
  }

  // Handle Google Sheet GViz CSV endpoint
  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google Sheet (${response.status}: ${response.statusText}). Make sure the Google Sheet is shared with "Anyone with the link can view".`);
  }

  const textOrBuffer = await response.text();
  const workbook = XLSX.read(textOrBuffer, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('Google Sheet is empty or contains no readable rows');
  }

  return jsonData
    .map(row => mapRowToLap(row, defaultTrackId))
    .filter(lap => lap.driver && lap.driver !== 'Unknown Driver');
}

/**
 * Pushes a new/updated lap from the Web App to Google Sheets via Apps Script Webhook
 */
export async function pushLapToGoogleSheet(scriptUrl, lapData) {
  if (!scriptUrl || !scriptUrl.includes('script.google.com/macros/s/')) {
    return false;
  }

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // allows cross-origin POST to Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lapData)
    });
    return true;
  } catch (err) {
    console.warn('Failed to push lap to Google Sheet:', err);
    return false;
  }
}

/**
 * Parses an Excel / CSV File buffer or ArrayBuffer
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
  const formattedData = laps.map((lap, idx) => {
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
 * Generates an official downloadable Excel template for DriftxCommune tournaments
 */
export function downloadTournamentExcelTemplate() {
  const sampleData = [
    {
      'Driver Name': 'Aarav Sharma',
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
    },
    {
      'Driver Name': 'Vikramaditya Rao',
      'Mobile Number': '9812345678',
      'Track': 'bahrain',
      'Team': 'Scuderia Ferrari',
      'Lap Time': '1:31.840',
      'Sector 1': '28.920',
      'Sector 2': '39.410',
      'Sector 3': '23.510',
      'Tyre': 'SOFT',
      'Sim Rig': 'Rig 1',
      'Assists': 'NONE',
      'Top Speed': 334.2,
      'Valid Lap': 'YES',
      'Notes': 'Eliminators Round',
      'Timestamp': '2026-08-28 16:10'
    },
    {
      'Driver Name': 'Kabir Mehta',
      'Mobile Number': '9923456789',
      'Track': 'silverstone',
      'Team': 'Red Bull Racing',
      'Lap Time': '1:25.112',
      'Sector 1': '27.420',
      'Sector 2': '34.892',
      'Sector 3': '22.800',
      'Tyre': 'SOFT',
      'Sim Rig': 'Rig 4 (VR)',
      'Assists': 'NONE',
      'Top Speed': 321.5,
      'Valid Lap': 'YES',
      'Notes': 'Grand Finals',
      'Timestamp': '2026-08-28 17:00'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 22 }, // Driver Name
    { wch: 16 }, // Mobile Number
    { wch: 14 }, // Track
    { wch: 24 }, // Team
    { wch: 12 }, // Lap Time
    { wch: 10 }, // S1
    { wch: 10 }, // S2
    { wch: 10 }, // S3
    { wch: 10 }, // Tyre
    { wch: 12 }, // Sim Rig
    { wch: 10 }, // Assists
    { wch: 12 }, // Top Speed
    { wch: 10 }, // Valid
    { wch: 25 }, // Notes
    { wch: 18 }, // Timestamp
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TimeTrials');

  XLSX.writeFile(workbook, 'DriftxCommune_F1_Template.xlsx');
}
