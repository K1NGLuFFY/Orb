const tmdbGenreMap = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const fallbackMovies = [
  { title: "Blade Runner 2049", director: "Denis Villeneuve", genre: "Sci-Fi, Cyberpunk, Drama", year: "2017", desc: "Officer K, a new blade runner for the Los Angeles Police Department, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.", imageUrl: "https://image.tmdb.org/t/p/w500/gB0619SjUIv22B6HUjSNj6t4wzV.jpg" },
  { title: "Interstellar", director: "Christopher Nolan", genre: "Sci-Fi, Adventure, Drama", year: "2014", desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival on a dying Earth in this modern science fiction epic.", imageUrl: "https://image.tmdb.org/t/p/w500/gEU2Qv4w3Fg7vJUxsZ5jR6ky6mA.jpg" },
  { title: "Mad Max: Fury Road", director: "George Miller", genre: "Action, Sci-Fi, Adventure", year: "2015", desc: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.", imageUrl: "https://image.tmdb.org/t/p/w500/hQrgh1pbClw2wY5EUuJZBO9jQ76.jpg" },
  { title: "Pulp Fiction", director: "Quentin Tarantino", genre: "Crime, Drama", year: "1994", desc: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption in Los Angeles.", imageUrl: "https://image.tmdb.org/t/p/w500/fIE3lAGuSZd6f67Y1PP36wG24Ls.jpg" },
  { title: "Inception", director: "Christopher Nolan", genre: "Sci-Fi, Action, Thriller", year: "2010", desc: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.", imageUrl: "https://image.tmdb.org/t/p/w500/ljsQgJ042h6tEQFAywH7r7CYvYi.jpg" },
  { title: "The Dark Knight", director: "Christopher Nolan", genre: "Action, Crime, Drama", year: "2008", desc: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.", imageUrl: "https://image.tmdb.org/t/p/w500/qJ2tWw3YiO1NMLm9tECFtP6Z1lE.jpg" },
  { title: "The Matrix", director: "Lana Wachowski, Lilly Wachowski", genre: "Sci-Fi, Action", year: "1999", desc: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.", imageUrl: "https://image.tmdb.org/t/p/w500/f89U3w7R2mqONDbgjWdDY9eA66D.jpg" },
  { title: "Parasite", director: "Bong Joon Ho", genre: "Thriller, Drama, Comedy", year: "2019", desc: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.", imageUrl: "https://image.tmdb.org/t/p/w500/7IiTT05EXLYw7ie4Gld50v95ihs.jpg" },
  { title: "Spirited Away", director: "Hayao Miyazaki", genre: "Animation, Fantasy, Adventure", year: "2001", desc: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.", imageUrl: "https://image.tmdb.org/t/p/w500/393Mt24G6v2nKy4uGHiXC7t7mR7.jpg" },
  { title: "Princess Mononoke", director: "Hayao Miyazaki", genre: "Animation, Fantasy, Adventure", year: "1997", desc: "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony.", imageUrl: "https://image.tmdb.org/t/p/w500/qG3RYlIVpU6FGg7PJw346z1n3Zg.jpg" }
];

const searchCache = new Map();
const detailsCache = new Map();

function getApiKey() {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key || key === 'your_real_key_here' || key.startsWith('YOUR_')) {
    return null;
  }
  return key;
}

function normalizeMovie(item, index = 0) {
  const tmdbId = item.id;
  const imageUrl = item.poster_path 
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : '';

  const genreNames = item.genre_ids 
    ? item.genre_ids.map(id => tmdbGenreMap[id]).filter(Boolean).join(', ') 
    : item.genres 
      ? item.genres.map(g => g.name).join(', ')
      : 'Movie';

  // Deterministic director assignment if not provided
  let director = 'Unknown Director';
  if (item.credits?.crew) {
    const dir = item.credits.crew.find(person => person.job === 'Director');
    if (dir) director = dir.name;
  } else {
    const directors = ['Denis Villeneuve', 'Christopher Nolan', 'Quentin Tarantino', 'Stanley Kubrick', 'Martin Scorsese', 'Steven Spielberg'];
    director = directors[tmdbId % directors.length];
  }

  const price = parseFloat((9.99 + (tmdbId % 15) * 1.49).toFixed(2));
  const stock = (tmdbId % 12) + 3;
  const rating = item.vote_average ? parseFloat((item.vote_average / 2).toFixed(1)) : 4.0;
  const releaseYear = item.release_date ? item.release_date.split('-')[0] : 'N/A';

  return {
    id: `api-movie-${tmdbId}`,
    title: `${item.title || item.original_title || 'Untitled Movie'} Blu-ray`,
    category: 'Movie',
    creator: director,
    description: item.overview || 'A premium physical media movie release.',
    imageUrl,
    genre: genreNames,
    releaseYear,
    language: item.original_language === 'en' ? 'English' : item.original_language || 'English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-17T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

function getLocalFallbacks(query = '') {
  const list = fallbackMovies.map((m, i) => ({
    id: `api-movie-mock-${i + 1}`,
    title: `${m.title} Blu-ray`,
    category: 'Movie',
    creator: m.director,
    description: m.desc,
    imageUrl: m.imageUrl,
    genre: m.genre,
    releaseYear: m.year,
    language: 'English',
    price: parseFloat((9.99 + (i * 1.49) % 25).toFixed(2)),
    stock: (i * 4) % 15 + 2,
    rating: parseFloat((4.3 + (i * 0.08) % 0.7).toFixed(1)),
    createdAt: new Date(new Date('2026-06-17T12:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
  }));

  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(m => 
    m.title.toLowerCase().includes(q) || 
    m.creator.toLowerCase().includes(q) || 
    m.genre.toLowerCase().includes(q)
  );
}

export async function getPopularMovies(signal) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('TMDB API Key missing. Returning fallback movies.');
    return getLocalFallbacks();
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&page=1`, { signal });
    if (!res.ok) throw new Error(`TMDB error status ${res.status}`);
    const data = await res.json();
    return (data.results || []).slice(0, 20).map((item, idx) => normalizeMovie(item, idx));
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to fetch popular movies from TMDB API:', err);
    return getLocalFallbacks();
  }
}

export async function searchMovies(query, signal) {
  if (!query || !query.trim()) return [];
  const normalizedQuery = query.trim().toLowerCase();

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('TMDB API Key missing. Filtering local fallbacks.');
    return getLocalFallbacks(query);
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`, { signal });
    if (!res.ok) throw new Error(`TMDB error status ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).slice(0, 20).map((item, idx) => normalizeMovie(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to search movies from TMDB API:', err);
    return getLocalFallbacks(query);
  }
}

export async function getMovieDetails(id, signal) {
  const apiId = id.replace('api-movie-', '');
  if (detailsCache.has(apiId)) {
    return detailsCache.get(apiId);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    // Look up in fallbacks
    const fallback = getLocalFallbacks().find(m => m.id === id);
    if (fallback) return fallback;
    throw new Error('TMDB API key not configured.');
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${apiId}?api_key=${apiKey}&append_to_response=credits`, { signal });
    if (!res.ok) throw new Error(`TMDB details error status ${res.status}`);
    const data = await res.json();
    const result = normalizeMovie(data);
    detailsCache.set(apiId, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to fetch movie details:', err);
    // Try to find in cache or fallbacks
    const fallback = getLocalFallbacks().find(m => m.id === id);
    if (fallback) return fallback;
    throw err;
  }
}
