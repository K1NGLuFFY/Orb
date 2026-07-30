import React from 'react';
import { Play, Pause, Volume2, VolumeX, Disc3 } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

const AudioWidget = () => {
  const { isPlaying, isMuted, togglePlay, toggleMute } = useAudio();

  return (
    <div 
      className="audio-widget-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        background: 'var(--surface-color, #1a1a1a)',
        padding: '8px',
        borderRadius: '50px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--border-color, #333)'
      }}
    >
      <button 
        onClick={togglePlay}
        className={`audio-play-btn ${isPlaying ? 'playing' : ''}`}
        aria-label={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--primary-color, #e0e0e0)',
          color: 'var(--bg-color, #000)',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPlaying ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
        )}
      </button>

      <button
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'transparent',
          color: 'var(--text-color, #e0e0e0)',
          border: 'none',
          cursor: 'pointer',
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* Decorative vinyl icon */}
      <div 
        className="vinyl-icon"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          marginLeft: '4px',
          color: 'var(--text-color, #e0e0e0)',
          animation: isPlaying ? 'spin 4s linear infinite' : 'none',
          opacity: 0.5
        }}
      >
        <Disc3 size={24} />
      </div>
    </div>
  );
};

export default AudioWidget;
