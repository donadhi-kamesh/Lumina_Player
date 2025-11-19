import React from 'react';
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  VolumeMuteIcon,
  MaximizeIcon,
  MinimizeIcon,
  SettingsIcon,
  RotateCcwIcon,
  RotateCwIcon
} from './Icons';
import { PlaybackState } from '../types';

interface ControlBarProps {
  state: PlaybackState;
  onPlayPause: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeekRelative: (seconds: number) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onSpeedChange: (rate: number) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  state,
  onPlayPause,
  onSeek,
  onSeekRelative,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onSpeedChange,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${state.showControls || !state.playing ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicking controls from toggling Play/Pause via video click
    >
      {/* Progress Bar */}
      <div className="group relative w-full h-1.5 bg-zinc-600/40 cursor-pointer rounded-full mb-4 hover:h-2.5 transition-all duration-200">
         <div 
           className="absolute top-0 left-0 h-full bg-violet-500 rounded-full transition-all duration-100 relative" 
           style={{ width: `${(state.currentTime / (state.duration || 1)) * 100}%` }}
         >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all" />
         </div>
         <input
          type="range"
          min={0}
          max={state.duration || 100}
          step="any"
          value={state.currentTime}
          onChange={onSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onPlayPause} className="text-white hover:text-violet-400 transition-colors p-1">
            {state.playing ? <PauseIcon className="w-7 h-7 md:w-8 md:h-8" /> : <PlayIcon className="w-7 h-7 md:w-8 md:h-8" />}
          </button>

          {/* Seek Buttons - Visible on all screens, but very useful for touch */}
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => onSeekRelative(-10)} className="text-zinc-300 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-all active:scale-90">
                <RotateCcwIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onSeekRelative(10)} className="text-zinc-300 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-all active:scale-90">
                <RotateCwIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 group group/vol relative">
            <button onClick={onToggleMute} className="text-zinc-200 hover:text-white transition-colors p-1">
              {state.muted || state.volume === 0 ? <VolumeMuteIcon className="w-6 h-6" /> : <VolumeIcon className="w-6 h-6" />}
            </button>
            <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 ease-out hidden md:block">
               <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.muted ? 0 : state.volume}
                onChange={onVolumeChange}
                className="w-20 ml-2 accent-violet-500 h-1"
              />
            </div>
          </div>

          <span className="text-xs md:text-sm font-medium text-zinc-300 tabular-nums">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
            {/* Speed Settings */}
            <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="text-zinc-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                    <SettingsIcon className="w-5 h-5" />
                </button>
                {showSettings && (
                    <div className="absolute bottom-12 right-[-10px] md:right-0 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-xl p-2 shadow-2xl min-w-[140px] flex flex-col gap-1 z-50">
                        <div className="text-xs text-zinc-500 px-2 py-1 uppercase font-bold tracking-wider">Playback Speed</div>
                        {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                             <button 
                                key={rate}
                                onClick={() => { onSpeedChange(rate); setShowSettings(false); }}
                                className={`text-sm px-3 py-2 rounded-lg text-left hover:bg-white/10 transition-colors flex justify-between items-center ${state.playbackRate === rate ? 'text-violet-400 font-bold bg-violet-500/10' : 'text-zinc-300'}`}
                             >
                                <span>{rate}x</span>
                                {state.playbackRate === rate && <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>}
                             </button>
                        ))}
                    </div>
                )}
            </div>

          <button onClick={onToggleFullscreen} className="text-zinc-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full hidden sm:block">
             {state.isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};