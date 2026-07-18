const fallbackBooks = [
  { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Classic Literature", year: "1960", desc: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.", imageUrl: "https://covers.openlibrary.org/b/id/8225266-L.jpg" },
  { title: "1984", author: "George Orwell", genre: "Sci-Fi, Dystopian", year: "1949", desc: "Winston Smith reins in his rebellion against Big Brother in a dystopian future where independent thought is a crime.", imageUrl: "https://covers.openlibrary.org/b/id/12818862-L.jpg" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic Literature", year: "1925", desc: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan on Long Island.", imageUrl: "https://covers.openlibrary.org/b/id/12711019-L.jpg" },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", genre: "Magical Realism", year: "1967", desc: "The multi-generational story of the Buendía family, whose patriarch, José Arcadio Buendía, founded the town of Macondo.", imageUrl: "https://covers.openlibrary.org/b/id/8226065-L.jpg" },
  { title: "A Passage to India", author: "E.M. Forster", genre: "Historical Fiction", year: "1924", desc: "A story set against the backdrop of the British Raj and the Indian independence movement in the 1920s.", imageUrl: "https://covers.openlibrary.org/b/id/9269894-L.jpg" },
  { title: "Invisible Man", author: "Ralph Ellison", genre: "Literary Fiction", year: "1952", desc: "A milestone in American literature, detailing the journey of an unnamed Black man as he navigates the racial tensions of the mid-20th century.", imageUrl: "https://covers.openlibrary.org/b/id/8228518-L.jpg" },
  { title: "Don Quixote", author: "Miguel de Cervantes", genre: "Classic Literature", year: "1605", desc: "The adventures of the noble knight-errant Don Quixote de la Mancha and his faithful squire, Sancho Panza.", imageUrl: "https://covers.openlibrary.org/b/id/11181283-L.jpg" },
  { title: "Beloved", author: "Toni Morrison", genre: "Historical Fiction", year: "1987", desc: "Set after the American Civil War, it tells the story of a family of former slaves whose Cincinnati home is haunted by a malevolent spirit.", imageUrl: "https://covers.openlibrary.org/b/id/8228723-L.jpg" },
  { title: "Mrs. Dalloway", author: "Virginia Woolf", genre: "Modernist Literature", year: "1925", desc: "Details a day in the life of Clarissa Dalloway, a high-society woman in post-World War I England.", imageUrl: "https://covers.openlibrary.org/b/id/8750849-L.jpg" },
  { title: "Things Fall Apart", author: "Chinua Achebe", genre: "Post-Colonial Fiction", year: "1958", desc: "Chronicles pre-colonial life in the southeastern part of Nigeria and the arrival of Europeans during the late 19th century.", imageUrl: "https://covers.openlibrary.org/b/id/8231990-L.jpg" }
];

const unsplashUrls = [
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500&auto=format&fit=crop'
];

const searchCache = new Map();
const detailsCache = new Map();

function normalizeBook(item, index = 0) {
  const googleBookId = item.id;
  const info = item.volumeInfo || {};

  let imageUrl = unsplashUrls[index % unsplashUrls.length];
  if (info.imageLinks) {
    const rawUrl = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '';
    if (rawUrl) imageUrl = rawUrl.replace(/^http:\/\//i, 'https://');
  }

  const price = parseFloat((8.99 + (index * 1.63) % 20).toFixed(2));
  const stock = (index * 7) % 15 + 3;
  const rating = info.averageRating ? parseFloat(info.averageRating.toFixed(1)) : parseFloat((4.1 + (index * 0.13) % 0.9).toFixed(1));
  const releaseYear = info.publishedDate ? info.publishedDate.split('-')[0] : 'N/A';

  return {
    id: `api-book-${googleBookId}`,
    title: info.title || 'Untitled Fiction',
    category: 'Book',
    creator: info.authors ? info.authors.join(', ') : 'Unknown Author',
    description: info.description || 'A compelling work of modern fiction.',
    imageUrl,
    genre: info.categories ? info.categories.map(c => c.trim()).join(', ') : 'Fiction',
    releaseYear,
    language: info.language === 'en' ? 'English' : info.language || 'English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-09T08:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

function getLocalFallbacks(query = '') {
  const list = fallbackBooks.map((b, i) => ({
    id: `api-book-mock-${i + 1}`,
    title: b.title,
    category: 'Book',
    creator: b.author,
    description: b.desc,
    imageUrl: b.imageUrl,
    genre: b.genre,
    releaseYear: b.year,
    language: 'English',
    price: parseFloat((8.99 + (i * 1.63) % 20).toFixed(2)),
    stock: (i * 7) % 15 + 3,
    rating: parseFloat((4.1 + (i * 0.13) % 0.9).toFixed(1)),
    createdAt: new Date(new Date('2026-06-09T08:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
  }));

  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(b => 
    b.title.toLowerCase().includes(q) || 
    b.creator.toLowerCase().includes(q) || 
    b.genre.toLowerCase().includes(q)
  );
}

function maskKey(key) {
  if (!key) return 'undefined/empty';
  if (typeof key !== 'string') return 'invalid-type';
  if (key.length <= 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)} (length: ${key.length})`;
}

function getApiKey() {
  const key1 = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
  const key2 = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  const key = key1 || key2;
  if (!key || key === 'your_real_key_here' || key.startsWith('YOUR_')) {
    return null;
  }
  return key;
}

function normalizeOpenLibraryBook(item, index = 0) {
  const workId = item.key.split('/').pop();
  const coverId = item.cover_i;
  const imageUrl = coverId 
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : unsplashUrls[index % unsplashUrls.length];

  const price = parseFloat((8.99 + (index * 1.63) % 20).toFixed(2));
  const stock = (index * 7) % 15 + 3;
  const rating = parseFloat((4.1 + (index * 0.13) % 0.9).toFixed(1));
  const releaseYear = item.first_publish_year ? item.first_publish_year.toString() : 'N/A';

  return {
    id: `api-book-ol-${workId}`,
    title: item.title || 'Untitled Fiction',
    category: 'Book',
    creator: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
    description: 'An open library cataloged novel.',
    imageUrl,
    genre: item.subject ? item.subject.slice(0, 3).join(', ') : 'Fiction',
    releaseYear,
    language: 'English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-09T08:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

export async function getPopularBooks(signal) {
  const apiKey = getApiKey();
  const rawKey1 = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
  const rawKey2 = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  console.log(`[Google Books API] getPopularBooks called. VITE_GOOGLE_BOOKS_KEY: ${maskKey(rawKey1)}, VITE_GOOGLE_BOOKS_API_KEY: ${maskKey(rawKey2)}. Effective Key: ${maskKey(apiKey)}`);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`;
    console.log(`[Google Books API] Fetching from URL: ${url.replace(apiKey, maskKey(apiKey))}`);
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Google Books status ${res.status}`);
    const data = await res.json();
    return (data.items || []).map((item, idx) => normalizeBook(item, idx));
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error('Failed to fetch popular books from Google Books API, trying Open Library:', err);
    return getPopularBooksFromOpenLibrary(signal);
  }
}

async function getPopularBooksFromOpenLibrary(signal) {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=subject:fiction&limit=20`, { signal });
    if (!res.ok) throw new Error(`Open Library status ${res.status}`);
    const data = await res.json();
    return (data.docs || []).map((item, idx) => normalizeOpenLibraryBook(item, idx));
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error('Failed to fetch popular books from Open Library, falling back to seed data:', err);
    return getLocalFallbacks();
  }
}

export async function searchBooks(query, signal) {
  if (!query || !query.trim()) return [];
  const normalizedQuery = query.trim().toLowerCase();

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery);
  }

  const apiKey = getApiKey();
  const rawKey1 = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
  const rawKey2 = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  console.log(`[Google Books API] searchBooks called. Query: "${query}". VITE_GOOGLE_BOOKS_KEY: ${maskKey(rawKey1)}, VITE_GOOGLE_BOOKS_API_KEY: ${maskKey(rawKey2)}. Effective Key: ${maskKey(apiKey)}`);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20${apiKey ? `&key=${apiKey}` : ''}`;
    console.log(`[Google Books API] Fetching from URL: ${url.replace(apiKey, maskKey(apiKey))}`);
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Google Books search status ${res.status}`);
    const data = await res.json();
    const results = (data.items || []).map((item, idx) => normalizeBook(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to search books from Google Books API for "${query}", trying Open Library:`, err);
    return searchBooksFromOpenLibrary(query, signal);
  }
}

async function searchBooksFromOpenLibrary(query, signal) {
  const normalizedQuery = query.trim().toLowerCase();
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`, { signal });
    if (!res.ok) throw new Error(`Open Library search status ${res.status}`);
    const data = await res.json();
    const results = (data.docs || []).map((item, idx) => normalizeOpenLibraryBook(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to search books from Open Library for "${query}", falling back to seed data:`, err);
    return getLocalFallbacks(query);
  }
}

export async function getBookDetails(id, signal) {
  if (detailsCache.has(id)) {
    return detailsCache.get(id);
  }

  if (id.startsWith('api-book-ol-')) {
    return getBookDetailsFromOpenLibrary(id, signal);
  }

  const apiId = id.replace('api-book-', '');
  const apiKey = getApiKey();
  const rawKey1 = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
  const rawKey2 = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  console.log(`[Google Books API] getBookDetails called. Book ID: ${apiId}. VITE_GOOGLE_BOOKS_KEY: ${maskKey(rawKey1)}, VITE_GOOGLE_BOOKS_API_KEY: ${maskKey(rawKey2)}. Effective Key: ${maskKey(apiKey)}`);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes/${apiId}${apiKey ? `?key=${apiKey}` : ''}`;
    console.log(`[Google Books API] Fetching from URL: ${url.replace(apiKey, maskKey(apiKey))}`);
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Google Books detail status ${res.status}`);
    const data = await res.json();
    const result = normalizeBook(data);
    detailsCache.set(id, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to fetch book details from Google Books API for "${id}", trying Open Library:`, err);
    return getBookDetailsFromOpenLibrary(id, signal);
  }
}

async function getBookDetailsFromOpenLibrary(id, signal) {
  const workId = id.replace('api-book-ol-', '').replace('api-book-', '');
  try {
    const res = await fetch(`https://openlibrary.org/works/${workId}.json`, { signal });
    if (!res.ok) throw new Error(`Open Library detail status ${res.status}`);
    const data = await res.json();
    
    const coverId = data.covers && data.covers.length > 0 ? data.covers.find(c => c > 0) : null;
    const imageUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : unsplashUrls[0];
    
    const desc = data.description 
      ? (typeof data.description === 'object' ? data.description.value : data.description)
      : 'An open library cataloged novel.';

    const result = {
      id: `api-book-ol-${workId}`,
      title: data.title || 'Untitled Book',
      category: 'Book',
      creator: 'Open Library Creator',
      description: desc,
      imageUrl,
      genre: data.subjects ? data.subjects.slice(0, 3).join(', ') : 'Fiction',
      releaseYear: data.created ? data.created.value.split('-')[0] : 'N/A',
      language: 'English',
      price: 12.99,
      stock: 6,
      rating: 4.3,
      createdAt: new Date().toISOString()
    };
    detailsCache.set(id, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.error(`Failed to fetch book details from Open Library for "${id}":`, err);
    const fallback = getLocalFallbacks().find(b => b.id === id) || getLocalFallbacks()[0];
    return fallback;
  }
}
