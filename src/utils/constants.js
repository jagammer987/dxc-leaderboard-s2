export const TRACKS = [
  {
    id: 'redbullring',
    name: 'Red Bull Ring',
    stageName: 'STAGE 1: TIME TRIALS',
    stageBadge: 'TIME TRIALS',
    country: 'Austria',
    flag: '🇦🇹',
    length: '4.318 km',
    turns: 10,
    record: '1:02.939 (V. Bottas)',
    weather: 'Dry / 26°C',
    themeColor: '#FF1E27',
  },
  {
    id: 'bahrain',
    name: 'Bahrain International',
    stageName: 'STAGE 2: ELIMINATORS',
    stageBadge: 'ELIMINATORS',
    country: 'Bahrain',
    flag: '🇧🇭',
    length: '5.412 km',
    turns: 15,
    record: '1:31.447 (P. Gasly)',
    weather: 'Night / 24°C',
    themeColor: '#FF1E27',
  },
  {
    id: 'silverstone',
    name: 'Silverstone Grand Prix',
    stageName: 'STAGE 3: GRAND FINALS',
    stageBadge: 'GRAND FINALS',
    country: 'United Kingdom',
    flag: '🇬🇧',
    length: '5.891 km',
    turns: 18,
    record: '1:24.303 (M. Verstappen)',
    weather: 'Overcast / 21°C',
    themeColor: '#FF1E27',
  }
];

export const TEAMS = [
  { name: 'DriftxCommune Racing', color: '#FF1E27' },
  { name: 'Scuderia Ferrari', color: '#E80020' },
  { name: 'Red Bull Racing', color: '#FF1E27' },
  { name: 'Mercedes-AMG Petronas', color: '#FFFFFF' },
  { name: 'McLaren F1 Team', color: '#FF5500' },
  { name: 'Aston Martin Aramco', color: '#00D2BE' },
  { name: 'Alpine F1 Team', color: '#FF1E27' },
  { name: 'Williams Racing', color: '#FFFFFF' },
  { name: 'Kick Sauber', color: '#52E252' },
  { name: 'MoneyGram Haas', color: '#B6BABD' }
];

export const TYRE_COMPOUNDS = [
  { id: 'SOFT', label: 'Soft', color: '#FF1E27', bg: 'bg-red-600/20', border: 'border-red-600', text: 'text-red-500', badge: '🔴' },
  { id: 'MEDIUM', label: 'Medium', color: '#FFFFFF', bg: 'bg-white/10', border: 'border-white/40', text: 'text-white', badge: '⚪' },
  { id: 'HARD', label: 'Hard', color: '#888888', bg: 'bg-neutral-800', border: 'border-neutral-700', text: 'text-neutral-300', badge: '⚫' },
  { id: 'INTER', label: 'Inter', color: '#00E676', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', badge: '🟢' },
  { id: 'WET', label: 'Wet', color: '#00B0FF', bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400', badge: '🔵' },
];

export const RIGS = [
  { id: 'Rig 1', name: 'Rig 1 // Fanatec DD2' },
  { id: 'Rig 2', name: 'Rig 2 // Moza R9' },
  { id: 'Rig 3', name: 'Rig 3 // Simucube 2' },
  { id: 'Rig 4 (VR)', name: 'Rig 4 // VR Motion' },
  { id: 'Rig 5', name: 'Rig 5 // Thrustmaster' },
];

export const ASSISTS_LEVELS = [
  { id: 'NONE', label: 'Elite (No Assists)', badge: 'ELITE', color: 'text-white border-red-600/60 bg-red-600/20' },
  { id: 'MEDIUM', label: 'Pro (Med Assists)', badge: 'PRO', color: 'text-neutral-300 border-neutral-700 bg-neutral-900' },
  { id: 'FULL', label: 'Casual (Assists On)', badge: 'CASUAL', color: 'text-neutral-400 border-neutral-800 bg-neutral-950' },
];

export const TOURNAMENT_INFO = {
  name: 'DriftxCommune F1 SIM TOURNAMENT',
  season: 'SEASON 2026',
  location: 'DriftxCommune ARENA',
  stages: 'Time Trials (Red Bull Ring) ➔ Eliminators (Bahrain) ➔ Grand Finals (Silverstone)',
  // You can set your default public Google Sheet URL here to load automatically for everyone:
  defaultGoogleSheetUrl: ''
};

// Clean initial leaderboard - only real data logged by marshals or loaded from Google Sheet will display
export const INITIAL_LEADERBOARD = [];
