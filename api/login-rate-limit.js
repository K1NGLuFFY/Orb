// Simple in-memory rate limit store for Vercel Serverless Functions
// Preserved across warm invocations.
const rateLimitCache = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

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

  const { email, action } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  // Use email and IP to prevent distributed attacks on a single account
  const key = `${email}-${ip}`;

  const now = Date.now();
  // Small optimization: occasionally clean cache
  if (rateLimitCache.size > 1000) cleanupCache(now);

  let record = rateLimitCache.get(key);
  // Reset record if window has passed
  if (record && (now - record.firstAttempt > WINDOW_MS)) {
    rateLimitCache.delete(key);
    record = undefined;
  }

  if (action === 'check') {
    if (record && record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ 
        allowed: false, 
        message: 'Too many failed login attempts. Please try again in 15 minutes.' 
      });
    }
    return res.status(200).json({ allowed: true });
  }

  if (action === 'record_failure') {
    if (!record) {
      record = { attempts: 1, firstAttempt: now };
    } else {
      record.attempts += 1;
    }
    rateLimitCache.set(key, record);
    return res.status(200).json({ success: true, attempts: record.attempts });
  }

  if (action === 'reset') {
    rateLimitCache.delete(key);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
