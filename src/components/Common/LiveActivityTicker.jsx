import React, { useState, useEffect } from 'react';
import { readStorage, KEYS } from '../../utils/localStorage';

const cities = [
  'Lagos', 'Tokyo', 'London', 'New York', 'Berlin', 'Paris', 'Sydney', 
  'Toronto', 'Cape Town', 'Cairo', 'Nairobi', 'Rio de Janeiro', 'Mumbai',
  'Yokohama', 'Chicago', 'Melbourne', 'Frankfurt', 'São Paulo'
];

const actions = [
  'just added to cart',
  'just purchased',
  'added to their wishlist',
  'is viewing details of',
  'left a 5-star review on'
];

const fallbackItems = [
  { title: 'Berserk Deluxe Vol. 1', category: 'Manga' },
  { title: 'Blade Runner 2049 BR', category: 'Movie' },
  { title: 'Neon Genesis Evangelion Boxset', category: 'Anime' },
  { title: 'Dune First Edition', category: 'Book' },
  { title: 'Akira Volume 1 (Mint)', category: 'Manga' }
];

const LiveActivityTicker = () => {
  const [activity, setActivity] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    const generateActivity = () => {
      // 1. Fetch catalog products dynamically
      const products = readStorage(KEYS.PRODUCTS) || [];
      const itemPool = products.length > 0 ? products : fallbackItems;
      
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];

      setActivity({
        city: randomCity,
        action: randomAction,
        title: randomItem.title || randomItem.volumeInfo?.title || 'Unknown Item'
      });

      // 2. Trigger slide in
      setIsVisible(true);
      setAnimationClass('ticker-enter');

      // 3. Trigger slide out after 4.5 seconds
      setTimeout(() => {
        setAnimationClass('ticker-exit');
      }, 4500);

      // 4. Mark completely hidden after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Initial delay, then cycle every 9 seconds
    const initialTimeout = setTimeout(generateActivity, 3000);
    const interval = setInterval(generateActivity, 9000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible || !activity) return null;

  return (
    <div 
      className={animationClass}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 998,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: 'rgba(15, 16, 18, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--hairline)',
        borderRadius: '30px',
        padding: '0.6rem 1.2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none',
        transition: 'all 0.5s ease'
      }}
    >
      {/* CSS Keyframes for live activity ticker widget */}
      <style>{`
        @keyframes ticker-in {
          0% { transform: translateY(150%) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes ticker-out {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(150%) scale(0.9); opacity: 0; }
        }
        @keyframes dot-pulse {
          0% { transform: scale(0.9); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.4; }
        }
        .ticker-enter {
          animation: ticker-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ticker-exit {
          animation: ticker-out 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .live-dot {
          animation: dot-pulse 1.8s infinite ease-in-out;
        }
      `}</style>

      {/* Pulsing Green dot representing live status */}
      <div 
        className="live-dot"
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#00D9C0',
          boxShadow: '0 0 8px #00D9C0'
        }}
      />

      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.8rem',
        color: 'var(--text)',
        whiteSpace: 'nowrap'
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          color: '#00D9C0',
          fontSize: '0.7rem',
          marginRight: '6px',
          letterSpacing: '0.1em'
        }}>LIVE //</span>
        A collector in <span style={{ fontWeight: 'bold' }}>{activity.city}</span> {activity.action} <span style={{ color: 'var(--signal)', fontWeight: '600' }}>{activity.title}</span>
      </div>
    </div>
  );
};

export default LiveActivityTicker;
