export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_BOOKS_KEY || process.env.GOOGLE_BOOKS_API_KEY;
  const keyParam = apiKey ? `&key=${apiKey}` : '';

  const { action, query, id } = req.query;

  try {
    let url = '';
    if (action === 'popular') {
      url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=20${keyParam}`;
    } else if (action === 'search') {
      url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20${keyParam}`;
    } else if (action === 'details') {
      url = `https://www.googleapis.com/books/v1/volumes/${id}?${keyParam ? keyParam.replace('&', '') : ''}`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Books API] Error ${response.status}:`, errorText);
      console.error(`[Google Books API] URL attempted:`, apiKey ? url.replace(apiKey, 'HIDDEN_KEY') : url);
      return res.status(response.status).json({ error: `Google Books error ${response.status}`, details: errorText });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Google Books' });
  }
}
