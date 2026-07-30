import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AudioContext = createContext();

import ambientLoop from '../assets/audio/fassounds-good-night-lofi-cozy-chill-music-160166.mp3';

const AUDIO_SOURCE_URL = ambientLoop;

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // We use a ref to hold the audio element so it persists across re-renders
  // and doesn't get recreated.
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio element only once
    if (!audioRef.current) {
      const audio = new Audio(AUDIO_SOURCE_URL);
      audio.loop = true;
      audio.volume = 0.5; // Default moderate volume
      audioRef.current = audio;
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Play returns a promise, catch potential autoplay restrictions
        audioRef.current.play().catch(error => {
          console.error("Audio playback failed:", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(prev => !prev);
  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <AudioContext.Provider value={{ isPlaying, isMuted, togglePlay, toggleMute }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
