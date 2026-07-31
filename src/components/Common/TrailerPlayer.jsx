import React, { useState } from 'react';
import { Play } from 'lucide-react';

const TrailerPlayer = ({ trailerId }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!trailerId) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      {!isPlaying ? (
        <button
          onClick={() => setIsPlaying(true)}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            border: '1px solid var(--signal)',
            color: 'var(--signal)',
            background: 'rgba(255, 106, 61, 0.1)',
            borderRadius: '6px'
          }}
        >
          <Play size={18} fill="currentColor" />
          Watch Trailer
        </button>
      ) : (
        <div style={{
          position: 'relative',
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid var(--hairline)',
          background: '#000',
          marginTop: '1rem'
        }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
            title="Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};

export default TrailerPlayer;
