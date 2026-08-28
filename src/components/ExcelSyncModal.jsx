import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Link, 
  Copy, 
  Check, 
  Code2, 
  HelpCircle,
  Zap
} from 'lucide-react';
import { 
  parseExcelFile, 
  exportLeaderboardToExcel, 
  downloadTournamentExcelTemplate,
  GOOGLE_APPS_SCRIPT_CODE
} from '../utils/excelUtils';
import { soundEffects } from '../utils/soundFx';

export default function ExcelSyncModal({
  onClose,
  onImportLaps,
  onResetToDefault,
  currentLeaderboard,
  currentTrackName,
  sheetSyncUrl,
  setSheetSyncUrl,
  autoRefreshInterval,
  setAutoRefreshInterval,
  onManualSyncSheet,
  isSyncing,
  lastSyncTime
}) {
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [inputUrl, setInputUrl] = useState(sheetSyncUrl || '');
  const [showGuide, setShowGuide] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    try {
      setImportStatus({ type: 'loading', message: `Parsing ${file.name}...` });
      const laps = await parseExcelFile(file);
      onImportLaps(laps);
      soundEffects.playRadioChime();
      setImportStatus({
        type: 'success',
        message: `Successfully loaded ${laps.length} driver laps from ${file.name}!`
      });
    } catch (err) {
      console.error(err);
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to parse Excel/CSV file'
      });
    }
  };

  const handleSaveSheetUrl = () => {
    soundEffects.playClick();
    setSheetSyncUrl(inputUrl);
    if (inputUrl) {
      onManualSyncSheet(inputUrl);
      setImportStatus({
        type: 'success',
        message: 'Google Sheet linked successfully! Auto-sync is active.'
      });
    }
  };

  const handleCopyScript = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto font-tech">
      <div className="relative w-full max-w-2xl bg-[#080808] border border-red-600/50 rounded-2xl p-6 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white uppercase tracking-wider">
                GOOGLE SHEETS 2-WAY LIVE SYNC
              </h2>
              <p className="text-xs font-tech text-neutral-400">
                CENTRAL TOURNAMENT CLOUD DATABASE // DRIFT<span className="text-red-600">x</span>COMMUNE
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

        {/* Status Alerts */}
        {importStatus && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
            importStatus.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300'
              : importStatus.type === 'error'
              ? 'bg-red-950/60 border border-red-500/60 text-red-300'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
          }`}>
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="space-y-5 mt-5">
          
          {/* 1. Live Google Sheets Auto-Sync (PRIMARY METHOD) */}
          <div className="bg-[#000000] border-2 border-red-600/60 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black font-display uppercase tracking-wider text-white flex items-center">
                <Link className="w-4 h-4 mr-1.5 text-red-500" />
                Live Google Sheet Connection
              </h3>
              
              <div className="flex items-center space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowScript(!showScript)}
                  className="text-red-400 hover:text-white flex items-center space-x-1 font-bold"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{showScript ? 'Hide 2-Way Script' : 'Enable 2-Way Sync'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-neutral-400 hover:text-white flex items-center space-x-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showGuide ? 'Hide Guide' : 'Setup Guide'}</span>
                </button>
              </div>
            </div>

            {/* 2-Way Sync Script Helper */}
            {showScript && (
              <div className="bg-[#0D0506] border border-red-600/60 rounded-xl p-4 mb-3 text-xs space-y-2 text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center">
                    <Code2 className="w-4 h-4 mr-1.5 text-red-500" />
                    Google Apps Script (Enables 2-Way Push from Web to Sheet)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition shadow"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'COPIED!' : 'Copy Script'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Inside your Google Sheet, go to <strong>Extensions ➔ Apps Script</strong>, paste this code, and click <strong>Deploy ➔ New Deployment ➔ Web App ➔ Who has access: Anyone</strong>. Paste the generated Web App URL into the box below!
                </p>
              </div>
            )}

            {/* Quick 3-Step Setup Guide */}
            {showGuide && (
              <div className="bg-[#0D0506] border border-red-600/40 rounded-xl p-3.5 mb-3 text-xs space-y-2 text-neutral-300">
                <div className="font-bold text-white uppercase text-[11px]">How to connect in 30 seconds:</div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                  <span>Click <strong className="text-red-400 cursor-pointer underline" onClick={downloadTournamentExcelTemplate}>"Get Blank Excel Template"</strong> below and upload it to your Google Drive.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                  <span>In Google Sheets, click <strong>Share ➔ General Access ➔ Set to "Anyone with the link can view"</strong>.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                  <span>Copy that link and paste it into the box below. Click <strong>Connect & Sync</strong>.</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Google Sheet Share Link or Apps Script Webhook URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 bg-[#080808] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 font-mono"
                  />
                  <button
                    onClick={handleSaveSheetUrl}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-lg shadow-red-600/30 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Connect & Sync</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-neutral-400">Live Auto-Refresh:</span>
                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                    className="bg-[#080808] border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-600"
                  >
                    <option value={10}>Every 10 seconds (Recommended)</option>
                    <option value={15}>Every 15 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every 60 seconds</option>
                    <option value={0}>Off (Manual refresh only)</option>
                  </select>
                </div>

                {lastSyncTime && (
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                    Last synced: {lastSyncTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Drag & Drop Local Excel Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                2. Upload Local Excel File (.xlsx, .csv)
              </h3>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  downloadTournamentExcelTemplate();
                }}
                className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Blank Excel Template</span>
              </button>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-red-500 bg-red-950/30'
                  : 'border-neutral-800 hover:border-red-600/60 bg-[#000000]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-7 h-7 mx-auto text-red-500 mb-1.5" />
              <p className="text-xs text-white font-bold">
                Drop your tournament Excel file here, or <span className="text-red-500 underline">browse</span>
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Auto-sorts by lap time, calculates best sectors and gaps
              </p>
            </div>
          </div>

          {/* 3. Export & Database Reset */}
          <div className="pt-3 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                soundEffects.playClick();
                exportLeaderboardToExcel(currentLeaderboard, currentTrackName);
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#141414] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold border border-neutral-700 transition"
            >
              <Download className="w-4 h-4 text-red-500" />
              <span>Export {currentTrackName} to .XLSX</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset all tournament laps back to default seed data?')) {
                  soundEffects.playClick();
                  onResetToDefault();
                  setImportStatus({ type: 'success', message: 'Leaderboard reset to official seed data.' });
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-1 px-3 py-2 text-neutral-500 hover:text-red-400 text-xs font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Data</span>
            </button>
          </div>
        </div>

        {/* Modal Close */}
        <div className="mt-6 pt-3 border-t border-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
