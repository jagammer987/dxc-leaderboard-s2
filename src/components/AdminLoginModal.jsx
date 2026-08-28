import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { 
  verifyAdminPin, 
  setAdminPin, 
  getAdminPin, 
  loginAdminSession, 
  logoutAdminSession,
  getLockoutRemainingSeconds 
} from '../utils/securityUtils';
import { soundEffects } from '../utils/soundFx';

export default function AdminLoginModal({
  isAdmin,
  onLoginSuccess,
  onLogoutSuccess,
  onClose
}) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lockoutSec, setLockoutSec] = useState(0);

  // Change PIN mode
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Lockout countdown timer
  useEffect(() => {
    const checkLockout = () => {
      const remaining = getLockoutRemainingSeconds();
      setLockoutSec(remaining);
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (verifyAdminPin(pin)) {
        soundEffects.playRadioChime();
        loginAdminSession();
        onLoginSuccess();
        onClose();
      }
    } catch (err) {
      soundEffects.playClick();
      setErrorMsg(err.message);
      setPin('');
      setLockoutSec(getLockoutRemainingSeconds());
    }
  };

  const handleLogout = () => {
    soundEffects.playClick();
    logoutAdminSession();
    onLogoutSuccess();
    onClose();
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPin.length < 4) {
      setErrorMsg('New PIN must be at least 4 characters');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and confirmation do not match');
      return;
    }

    try {
      setAdminPin(newPin);
      soundEffects.playRadioChime();
      setSuccessMsg('Admin PIN updated successfully!');
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto font-tech">
      <div className="relative w-full max-w-md bg-[#080808] border border-red-600/60 rounded-2xl p-6 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isAdmin ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-neutral-900 border-neutral-700 text-neutral-400'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white uppercase tracking-wider">
                {isAdmin ? 'MARSHAL CONSOLE ACTIVE' : 'MARSHAL / ADMIN ACCESS'}
              </h2>
              <p className="text-xs font-tech text-neutral-400">
                {isAdmin ? 'TOURNAMENT MANAGEMENT UNLOCKED' : 'ENTER SECURE PIN TO LOG HOTLAPS'}
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

        {/* Lockout Warning */}
        {lockoutSec > 0 && (
          <div className="mt-4 p-3.5 bg-red-950 border border-red-600 text-red-200 rounded-xl text-xs flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="font-bold block uppercase text-red-400">Security Lockout Active</span>
              <span>Brute force protection triggered. Try again in {Math.floor(lockoutSec / 60)}m {lockoutSec % 60}s.</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && lockoutSec === 0 && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-600/60 text-red-300 rounded-xl text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* State 1: PIN Entry */}
        {!isAdmin ? (
          <form onSubmit={handleLogin} className="mt-5 space-y-4 font-tech">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5 uppercase tracking-wider">
                Enter Admin / Marshal PIN
              </label>
              
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  disabled={lockoutSec > 0}
                  autoFocus
                  placeholder="Enter PIN (Default: driftx2026)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                Default PIN: <code className="bg-neutral-900 px-1.5 py-0.5 rounded text-red-500 font-mono">driftx2026</code>
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={lockoutSec > 0}
                className="flex items-center space-x-1.5 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-black font-display tracking-wider transition shadow-lg shadow-red-600/30"
              >
                <Unlock className="w-4 h-4" />
                <span>UNLOCK ADMIN</span>
              </button>
            </div>
          </form>
        ) : (
          /* State 2: Active Admin Console */
          <div className="mt-5 space-y-4 font-tech">
            
            {!isChangingPin ? (
              <div className="space-y-4">
                <div className="bg-black border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-bold">Admin Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> Authenticated
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-neutral-900 pt-2">
                    <span className="text-neutral-400">Security Mode:</span>
                    <span className="text-white">Public Visitors are locked in Read-Only</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="flex items-center justify-center space-x-2 p-2.5 rounded-lg bg-[#0E121A] hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-bold transition"
                  >
                    <KeyRound className="w-4 h-4 text-red-500" />
                    <span>Change Admin PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center space-x-2 p-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-600/40 text-xs font-bold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Lock / Logout Admin Console</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Change PIN Form */
              <form onSubmit={handleChangePin} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    New Admin PIN (Min 4 characters)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Confirm New Admin PIN
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setErrorMsg('');
                    }}
                    className="px-3 py-1.5 bg-[#141414] hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-bold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Save New PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
