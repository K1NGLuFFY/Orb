export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB API key not configured server-side' });
  }

  const { action, query, id } = req.query;

  try {
    let url = '';
    if (action === 'discover') {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=1`;
    } else if (action === 'search') {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`;
    } else if (action === 'details') {
      url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `TMDB error ${response.status}` });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
}
