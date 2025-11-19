import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoSource, PlaybackState, VideoMetadata } from './types';
import { ControlBar } from './components/ControlBar';
import { MetadataSelector } from './components/MetadataSelector';
import { UploadIcon, LinkIcon, PlayIcon, LayoutIcon, SearchIcon, RotateCcwIcon, RotateCwIcon } from './components/Icons';

const App: React.FC = () => {
  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Metadata State
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  // State
  const [videoSrc, setVideoSrc] = useState<VideoSource | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [doubleTapAction, setDoubleTapAction] = useState<'forward' | 'backward' | null>(null);
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    playing: false,
    muted: false,
    volume: 1,
    playbackRate: 1,
    played: 0,
    duration: 0,
    currentTime: 0,
    isFullscreen: false,
    showControls: true,
    isBuffering: false,
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Playback Logic ---

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: videoRef.current!.currentTime,
        played: videoRef.current!.currentTime / videoRef.current!.duration,
        isBuffering: false,
      }));
    }
  };

  const handleWaiting = () => {
    setPlaybackState(prev => ({ ...prev, isBuffering: true }));
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setPlaybackState(prev => ({
        ...prev,
        duration: videoRef.current!.duration,
      }));
    }
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (playbackState.playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaybackState(prev => ({ ...prev, playing: !prev.playing, showControls: true }));
      resetControlsTimeout();
    }
  }, [playbackState.playing]);

  const seekRelative = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), videoRef.current.duration);
      videoRef.current.currentTime = newTime;
      setPlaybackState(prev => ({ ...prev, currentTime: newTime, showControls: true }));
      resetControlsTimeout();
    }
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlaybackState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement> | number) => {
    const vol = typeof e === 'number' ? e : parseFloat(e.target.value);
    if (videoRef.current) {
        const newVol = Math.min(Math.max(vol, 0), 1);
        videoRef.current.volume = newVol;
        videoRef.current.muted = newVol === 0;
        setPlaybackState(prev => ({ ...prev, volume: newVol, muted: newVol === 0 }));
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const newMuted = !playbackState.muted;
      videoRef.current.muted = newMuted;
      setPlaybackState(prev => ({ ...prev, muted: newMuted }));
    }
  };

  const handleSpeedChange = (rate: number) => {
      if (videoRef.current) {
          videoRef.current.playbackRate = rate;
          setPlaybackState(prev => ({...prev, playbackRate: rate}));
      }
  }

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setPlaybackState(prev => ({ ...prev, isFullscreen: true }));
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
      setPlaybackState(prev => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  // --- Input Handling (Keyboard & Touch) ---

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (!videoSrc) return;

      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          handleToggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekRelative(-5);
          break;
        case 'j':
          seekRelative(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekRelative(5);
          break;
        case 'l':
          seekRelative(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(playbackState.volume + 0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(playbackState.volume - 0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoSrc, playbackState.volume, togglePlay, seekRelative, handleToggleFullscreen]);

  // Controls Visibility Logic
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setPlaybackState(prev => ({ ...prev, showControls: true }));
    if (playbackState.playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setPlaybackState(prev => ({ ...prev, showControls: false }));
        }, 2500);
    }
  }, [playbackState.playing]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  // Touch / Click Logic for Container
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const tapDelay = 300;

    if (now - lastTap < tapDelay) {
      // DOUBLE TAP
      if (clickX < width * 0.35) {
        seekRelative(-10);
        setDoubleTapAction('backward');
        setTimeout(() => setDoubleTapAction(null), 500);
      } else if (clickX > width * 0.65) {
        seekRelative(10);
        setDoubleTapAction('forward');
        setTimeout(() => setDoubleTapAction(null), 500);
      } else {
        handleToggleFullscreen();
      }
      setLastTap(0); // Reset to prevent triple tap issues
    } else {
      // SINGLE TAP (Delayed to check for double)
      setLastTap(now);
      // Immediate toggle for controls feeling snappy
      if (playbackState.showControls) {
         // If controls are showing, waiting for double tap check isn't strictly necessary for hiding, but good for UX
         // But typically, single tap anywhere toggles controls
      }
      // Note: We let the native click propagate usually, but here we manage "Tap" areas
    }
  };

  // Source handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc({ type: 'file', src: url, name: file.name });
      setMetadata({ title: file.name, description: 'Local file playback' });
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setVideoSrc({ type: 'url', src: urlInput, name: urlInput });
      setMetadata({ title: 'Streamed URL', description: urlInput });
      setShowUrlInput(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-1.5 rounded-lg shadow-lg shadow-violet-900/20">
                <PlayIcon className="w-5 h-5 text-white" />
            </div>
          <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tight hidden sm:block">Lumina Player</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Metadata Toggle */}
          {videoSrc && (
             <button 
             onClick={() => setIsMetadataOpen(true)}
             className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 hover:border-zinc-700 transition-all text-zinc-400 hover:text-white"
           >
             <SearchIcon className="w-4 h-4" />
             <span className="text-xs md:text-sm font-medium hidden sm:inline">Identify</span>
           </button>
          )}

          {/* Local File Upload */}
          <label className="cursor-pointer group flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 hover:border-zinc-700 transition-all">
            <UploadIcon className="w-4 h-4 text-zinc-400 group-hover:text-white" />
            <span className="text-xs md:text-sm font-medium text-zinc-400 group-hover:text-white hidden sm:inline">Upload</span>
            <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* URL Input Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowUrlInput(!showUrlInput)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${showUrlInput ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            
            {showUrlInput && (
              <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] md:w-80 bg-zinc-900 border border-zinc-700 p-3 rounded-xl shadow-xl z-50">
                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none text-white placeholder-zinc-600"
                  />
                  <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white px-3 rounded-lg text-sm font-medium">Go</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-0 md:p-8 overflow-hidden relative">
        {!videoSrc ? (
            <div className="text-center space-y-6 max-w-lg p-4 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center border border-zinc-800 shadow-2xl ring-1 ring-white/5">
                    <LayoutIcon className="w-10 h-10 text-zinc-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Ready to Watch?</h2>
                    <p className="text-zinc-500">Upload a local video file or stream from a URL. <br/>Keyboard shortcuts and touch gestures enabled.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <label className="cursor-pointer flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-violet-500/50 hover:bg-zinc-800/80 transition-all group">
                        <UploadIcon className="w-8 h-8 text-zinc-500 mb-3 group-hover:text-violet-400 transition-colors" />
                        <span className="font-medium text-zinc-300 group-hover:text-white">Local File</span>
                        <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                     </label>
                     <button onClick={() => setShowUrlInput(true)} className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-violet-500/50 hover:bg-zinc-800/80 transition-all group">
                        <LinkIcon className="w-8 h-8 text-zinc-500 mb-3 group-hover:text-violet-400 transition-colors" />
                        <span className="font-medium text-zinc-300 group-hover:text-white">Direct URL</span>
                     </button>
                </div>
            </div>
        ) : (
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onClick={handleContainerClick}
            className={`relative w-full max-w-6xl aspect-video bg-black md:rounded-2xl overflow-hidden shadow-2xl group ring-1 ring-zinc-800 ${playbackState.isFullscreen ? 'ring-0 rounded-none w-screen h-screen max-w-none' : ''}`}
          >
            <video
              ref={videoRef}
              src={videoSrc.src}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={handleWaiting}
              onEnded={() => setPlaybackState(prev => ({...prev, playing: false, showControls: true}))}
              playsInline
            />

            {/* Double Tap Animations */}
            {doubleTapAction === 'forward' && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center animate-pulse pointer-events-none">
                    <RotateCwIcon className="w-10 h-10 text-white" />
                </div>
            )}
            {doubleTapAction === 'backward' && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center animate-pulse pointer-events-none">
                    <RotateCcwIcon className="w-10 h-10 text-white" />
                </div>
            )}

            {/* Big Play/Pause Animation Overlay */}
            {!playbackState.playing && playbackState.currentTime === 0 && !playbackState.isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                    <div className="w-20 h-20 rounded-full bg-violet-600/90 flex items-center justify-center backdrop-blur-sm shadow-2xl ring-4 ring-white/10">
                        <PlayIcon className="w-8 h-8 text-white ml-1" />
                    </div>
                </div>
            )}

             {/* Buffering Overlay */}
             {playbackState.isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Controls */}
            <ControlBar
              state={playbackState}
              onPlayPause={togglePlay}
              onSeek={handleSeek}
              onSeekRelative={seekRelative}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              onToggleFullscreen={handleToggleFullscreen}
              onSpeedChange={handleSpeedChange}
            />

            {/* Metadata Info Overlay (When controls visible & not identifying) */}
            {!isMetadataOpen && playbackState.showControls && metadata && (
                <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300">
                    <h2 className="text-white font-bold text-lg drop-shadow-md">{metadata.title}</h2>
                    {metadata.year && <span className="text-zinc-300 text-sm mr-2">{metadata.year}</span>}
                    {metadata.rating && <span className="text-violet-400 text-sm font-bold">★ {metadata.rating}</span>}
                </div>
            )}

            {/* Metadata Selector Panel */}
            <MetadataSelector
              isOpen={isMetadataOpen}
              onClose={() => setIsMetadataOpen(false)}
              onSelect={(meta) => {
                  setMetadata(meta);
              }}
            />
          </div>
        )}
        
        {/* Info Section below video if not fullscreen */}
        {videoSrc && metadata && !playbackState.isFullscreen && (
            <div className="w-full max-w-6xl mt-6 px-4 md:px-0 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
                 <div className="hidden md:block aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                     {metadata.poster ? (
                         <img src={metadata.poster} alt={metadata.title} className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-zinc-700">
                             <LayoutIcon className="w-12 h-12" />
                         </div>
                     )}
                 </div>
                 <div className="space-y-4">
                     <div>
                        <h2 className="text-2xl font-bold text-white">{metadata.title}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                            {metadata.year && <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700">{metadata.year}</span>}
                            {metadata.rating && <span className="text-violet-400 flex items-center gap-1"><span className="text-lg">★</span> {metadata.rating} / 10</span>}
                        </div>
                     </div>
                     <p className="text-zinc-400 leading-relaxed max-w-3xl">
                         {metadata.description || "No description available."}
                     </p>
                 </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;