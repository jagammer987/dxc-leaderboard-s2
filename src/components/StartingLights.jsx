import React, { useState, useEffect } from 'react';
import { X, Flame, Sparkles } from 'lucide-react';
import { soundEffects } from '../utils/soundFx';

export default function StartingLights({ onClose }) {
  const [lightsCount, setLightsCount] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);

  useEffect(() => {
    let timeouts = [];

    // Step 1 to 5: Turn on red lights sequentially
    for (let i = 1; i <= 5; i++) {
      const t = setTimeout(() => {
        setLightsCount(i);
        soundEffects.playStartLight(i);
      }, i * 900);
      timeouts.push(t);
    }

    // Step 6: Random delay for lights out
    const randomDelay = 5 * 900 + (800 + Math.random() * 1200);
    const outTimeout = setTimeout(() => {
      setLightsOut(true);
      soundEffects.playStartLight('lights-out');
    }, randomDelay);
    timeouts.push(outTimeout);

    // Auto-close after celebration
    const closeTimeout = setTimeout(() => {
      onClose();
    }, randomDelay + 3000);
    timeouts.push(closeTimeout);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="relative w-full max-w-2xl bg-[#090C12] border-2 border-red-600/60 rounded-3xl p-8 shadow-2xl shadow-red-950/80 text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
            DRIFTX COMMUNE // RACE START SYSTEM
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-1">
            {lightsOut ? 'LIGHTS OUT AND AWAY WE GO!' : 'STAND BY FOR START...'}
          </h2>
        </div>

        {/* 5 F1 Starting Gantry Lights */}
        <div className="bg-[#05070A] border-4 border-slate-800 rounded-2xl p-6 mb-6 shadow-inner flex items-center justify-center space-x-3 sm:space-x-6">
          {[1, 2, 3, 4, 5].map((lightIdx) => {
            const isLit = !lightsOut && lightsCount >= lightIdx;
            return (
              <div 
                key={lightIdx}
                className="flex flex-col items-center space-y-2 bg-[#10141D] p-3 sm:p-4 rounded-xl border border-slate-800"
              >
                {/* 2 Red LED Bulbs per column */}
                <div 
                  className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-150 ${
                    isLit 
                      ? 'bg-red-600 border-red-300 shadow-[0_0_25px_#ff0000] scale-105' 
                      : 'bg-[#180A0A] border-red-950/40'
                  }`}
                />
                <div 
                  className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-150 ${
                    isLit 
                      ? 'bg-red-600 border-red-300 shadow-[0_0_25px_#ff0000] scale-105' 
                      : 'bg-[#180A0A] border-red-950/40'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        <div className="font-tech text-sm">
          {lightsOut ? (
            <div className="text-emerald-400 font-black text-xl tracking-wider animate-bounce flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>TIME TRIALS SESSION IS NOW GREEN!</span>
            </div>
          ) : (
            <div className="text-slate-400">
              Rev up your engines. Flying lap timing active on all rigs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
