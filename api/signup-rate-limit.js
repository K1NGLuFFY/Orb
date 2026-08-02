// Simple in-memory rate limit store for Vercel Serverless Functions
// Preserved across warm invocations.
const rateLimitCache = new Map();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour for signups
const MAX_ATTEMPTS = 3; // Max 3 signups per IP per hour

const cleanupCache = (now) => {
  for (const [key, data] of rateLimitCache.entries()) {
    if (now - data.firstAttempt > WINDOW_MS) {
      rateLimitCache.delete(key);
    }
  }
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  // Use IP only to prevent mass dummy account creation from the same source
  const key = `signup-${ip}`;

  const now = Date.now();
  if (rateLimitCache.size > 1000) cleanupCache(now);

  let record = rateLimitCache.get(key);
  
  if (record && (now - record.firstAttempt > WINDOW_MS)) {
    rateLimitCache.delete(key);
    record = undefined;
  }

  if (action === 'check') {
    if (record && record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ 
        allowed: false, 
        message: 'Too many accounts created from this IP. Please try again later.' 
      });
    }
    return res.status(200).json({ allowed: true });
  }

  if (action === 'record_signup') {
    if (!record) {
      record = { attempts: 1, firstAttempt: now };
    } else {
      record.attempts += 1;
    }
    rateLimitCache.set(key, record);
    return res.status(200).json({ success: true, attempts: record.attempts });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
