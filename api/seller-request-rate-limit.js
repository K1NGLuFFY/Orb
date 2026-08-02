// Simple in-memory rate limit store for Vercel Serverless Functions
// Preserved across warm invocations.
const rateLimitCache = new Map();
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours for seller requests
const MAX_ATTEMPTS = 3; // Max 3 seller requests per user/IP per 24 hours

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

  const { action, userId } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  // Use IP and optionally User ID to prevent spam
  const key = `seller-req-${userId || ip}`;

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
        message: 'Too many seller requests submitted. Please try again tomorrow.' 
      });
    }
    return res.status(200).json({ allowed: true });
  }

  if (action === 'record_request') {
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
