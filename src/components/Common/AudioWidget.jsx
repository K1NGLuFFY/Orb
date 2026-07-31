import React from 'react';
import { Play, Pause, Volume2, VolumeX, Disc3 } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';
import './AudioWidget.css';

const AudioWidget = () => {
  const { isPlaying, isMuted, togglePlay, toggleMute } = useAudio();

  return (
    <div className="audio-widget-container">
      <button 
        onClick={togglePlay}
        className={`audio-play-btn ${isPlaying ? 'playing' : ''}`}
        aria-label={isPlaying ? 'Pause Background Music' : 'Play Background Music'}
      >
        {isPlaying ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
        )}
      </button>

      <button
        onClick={toggleMute}
        className="audio-mute-btn"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Decorative vinyl icon */}
      <div className={`vinyl-icon ${isPlaying ? 'playing' : ''}`}>
        <Disc3 size={24} />
      </div>
    </div>
  );
};

export default AudioWidget;
