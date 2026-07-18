const fallbackComics = [
  { title: "Watchmen (2019 Edition)", author: "Alan Moore", genre: "Superhero, Mystery, Drama", year: "1986", desc: "A world-class adventure, Watchmen is the story of a group of masked vigilantes who discover a massive, deadly conspiracy that threatens the entire globe.", imageUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1442239393i/472.jpg" },
  { title: "Batman: The Dark Knight Returns", author: "Frank Miller", genre: "Superhero, Dark Hero, Action", year: "1986", desc: "It is ten years after an aging Batman has retired. Gotham City has sunk deep into lawlessness, prompting the fifty-five-year-old Bruce Wayne to slip back into the cape and cowl.", imageUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327938318i/49931.jpg" },
  { title: "The Sandman Vol. 1: Preludes & Nocturnes", author: "Neil Gaiman", genre: "Dark Fantasy, Mythology, Drama", year: "1989", desc: "An occultist attempting to capture Death to bargain for eternal life traps her younger brother Dream instead. After seventy years of imprisonment, Dream escapes to rebuild his ruined kingdom of the Dreaming.", imageUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327885741i/24792.jpg" },
  { title: "Saga, Vol. 1", author: "Brian K. Vaughan", genre: "Sci-Fi, Space Opera, Romance", year: "2012", desc: "The sweeping story of two soldiers from opposite sides of a never-ending galactic war, who fall in love and risk everything to bring an fragile new life into a dangerous universe.", imageUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1435260172i/15704307.jpg" }
];

const unsplashUrls = [
  'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=500&auto=format&fit=crop'
];

const searchCache = new Map();
const detailsCache = new Map();

function getApiKey() {
  const key1 = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
  const key2 = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  const key = key1 || key2;
  if (!key || key === 'your_real_key_here' || key.startsWith('YOUR_')) {
    return null;
  }
  return key;
}

function normalizeGoogleComic(item, index = 0) {
  const googleBookId = item.id;
  const info = item.volumeInfo || {};

  let imageUrl = unsplashUrls[index % unsplashUrls.length];
  if (info.imageLinks) {
    const rawUrl = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '';
    if (rawUrl) imageUrl = rawUrl.replace(/^http:\/\//i, 'https://');
  }

  const price = parseFloat((14.99 + (index * 1.83) % 25).toFixed(2));
  const stock = (index * 7) % 15 + 3;
  const rating = info.averageRating ? parseFloat(info.averageRating.toFixed(1)) : parseFloat((4.2 + (index * 0.11) % 0.8).toFixed(1));
  const releaseYear = info.publishedDate ? info.publishedDate.split('-')[0] : 'N/A';

  return {
    id: `api-comic-${googleBookId}`,
    title: info.title || 'Untitled Comic',
    category: 'Comic',
    creator: info.authors ? info.authors.join(', ') : 'Unknown Author',
    description: info.description || 'A graphic comic book release.',
    imageUrl,
    genre: info.categories ? info.categories.map(c => c.trim()).join(', ') : 'Comics, Superhero',
    releaseYear,
    language: info.language === 'en' ? 'English' : info.language || 'English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-13T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

function normalizeOpenLibraryComic(item, index = 0) {
  const workId = item.key.split('/').pop();
  const coverId = item.cover_i;
  const imageUrl = coverId 
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : unsplashUrls[index % unsplashUrls.length];

  const price = parseFloat((14.99 + (index * 1.83) % 25).toFixed(2));
  const stock = (index * 7) % 15 + 3;
  const rating = parseFloat((4.3 + (index * 0.08) % 0.7).toFixed(1));
  const releaseYear = item.first_publish_year ? item.first_publish_year.toString() : 'N/A';

  return {
    id: `api-comic-ol-${workId}`,
    title: item.title || 'Untitled Comic',
    category: 'Comic',
    creator: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
    description: 'An open library cataloged graphic novel.',
    imageUrl,
    genre: item.subject ? item.subject.slice(0, 3).join(', ') : 'Comics, Superhero',
    releaseYear,
    language: 'English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-13T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

function getLocalFallbacks(query = '') {
  const list = fallbackComics.map((c, i) => ({
    id: `api-comic-mock-${i + 1}`,
    title: c.title,
    category: 'Comic',
    creator: c.author,
    description: c.desc,
    imageUrl: c.imageUrl,
    genre: c.genre,
    releaseYear: c.year,
    language: 'English',
    price: parseFloat((14.99 + (i * 1.83) % 25).toFixed(2)),
    stock: (i * 7) % 15 + 3,
    rating: parseFloat((4.5 + (i * 0.09) % 0.5).toFixed(1)),
    createdAt: new Date(new Date('2026-06-13T12:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
  }));

  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(c => 
    c.title.toLowerCase().includes(q) || 
    c.creator.toLowerCase().includes(q) || 
    c.genre.toLowerCase().includes(q)
  );
}

export async function getPopularComics(signal) {
  const apiKey = getApiKey();
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:comics&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Google Books status ${res.status}`);
    const data = await res.json();
    return (data.items || []).map((item, idx) => normalizeGoogleComic(item, idx));
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error('Failed to fetch popular comics from Google Books API, falling back to Open Library:', err);
    return getPopularComicsFromOpenLibrary(signal);
  }
}

async function getPopularComicsFromOpenLibrary(signal) {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=subject:comics&limit=20`, { signal });
    if (!res.ok) throw new Error(`Open Library status ${res.status}`);
    const data = await res.json();
    return (data.docs || []).map((item, idx) => normalizeOpenLibraryComic(item, idx));
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error('Failed to fetch popular comics from Open Library, falling back to seed data:', err);
    return getLocalFallbacks();
  }
}

export async function searchComics(query, signal) {
  if (!query || !query.trim()) return [];
  const normalizedQuery = query.trim().toLowerCase();

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery);
  }

  const apiKey = getApiKey();
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:comics+${encodeURIComponent(query)}&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Google Books status ${res.status}`);
    const data = await res.json();
    const results = (data.items || []).map((item, idx) => normalizeGoogleComic(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to search comics from Google Books API for "${query}", falling back to Open Library:`, err);
    return searchComicsFromOpenLibrary(query, signal);
  }
}

async function searchComicsFromOpenLibrary(query, signal) {
  const normalizedQuery = query.trim().toLowerCase();
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=subject:comics+${encodeURIComponent(query)}&limit=20`, { signal });
    if (!res.ok) throw new Error(`Open Library search status ${res.status}`);
    const data = await res.json();
    const results = (data.docs || []).map((item, idx) => normalizeOpenLibraryComic(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to search comics from Open Library for "${query}", falling back to seed data:`, err);
    return getLocalFallbacks(query);
  }
}

export async function getComicDetails(id, signal) {
  if (detailsCache.has(id)) {
    return detailsCache.get(id);
  }

  if (id.startsWith('api-comic-ol-')) {
    return getComicDetailsFromOpenLibrary(id, signal);
  }

  const googleId = id.replace('api-comic-', '');
  const apiKey = getApiKey();
  try {
    const url = `https://www.googleapis.com/books/v1/volumes/${googleId}${apiKey ? `?key=${apiKey}` : ''}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Google Books detail status ${res.status}`);
    const data = await res.json();
    const result = normalizeGoogleComic(data);
    detailsCache.set(id, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to fetch comic details from Google Books for "${id}":`, err);
    const fallback = getLocalFallbacks().find(c => c.id === id);
    if (fallback) return fallback;
    throw err;
  }
}

async function getComicDetailsFromOpenLibrary(id, signal) {
  const workId = id.replace('api-comic-ol-', '');
  try {
    const res = await fetch(`https://openlibrary.org/works/${workId}.json`, { signal });
    if (!res.ok) throw new Error(`Open Library detail status ${res.status}`);
    const data = await res.json();
    
    // Normalize Open Library Work object to our format
    const coverId = data.covers && data.covers.length > 0 ? data.covers.find(c => c > 0) : null;
    const imageUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : unsplashUrls[0];
    
    const desc = data.description 
      ? (typeof data.description === 'object' ? data.description.value : data.description)
      : 'An open library cataloged graphic novel.';

    const result = {
      id,
      title: data.title || 'Untitled Comic',
      category: 'Comic',
      creator: 'Open Library Creator',
      description: desc,
      imageUrl,
      genre: data.subjects ? data.subjects.slice(0, 3).join(', ') : 'Comics, Superhero',
      releaseYear: data.created ? data.created.value.split('-')[0] : 'N/A',
      language: 'English',
      price: 19.99,
      stock: 8,
      rating: 4.8,
      createdAt: new Date().toISOString()
    };
    detailsCache.set(id, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to fetch comic details from Open Library for "${id}":`, err);
    const fallback = getLocalFallbacks().find(c => c.id === id);
    if (fallback) return fallback;
    throw err;
  }
}
