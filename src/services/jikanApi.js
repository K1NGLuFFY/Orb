const fallbackAnime = [
  { title: "Neon Genesis Evangelion", studio: "Gainax", genre: "Sci-Fi, Mecha, Psychological", year: "1995", desc: "In the year 2015, humanity's last hope lies in the hands of Nerv and their Evangelions to defeat the Angels.", imageUrl: "https://cdn.myanimelist.net/images/anime/1404/122192.jpg" },
  { title: "Spirited Away", studio: "Studio Ghibli", genre: "Fantasy, Adventure, Drama", year: "2001", desc: "A young girl wanders into a world ruled by gods, beasts, and magic, where her parents are turned into beasts.", imageUrl: "https://cdn.myanimelist.net/images/anime/6/79597.jpg" },
  { title: "Cowboy Bebop", studio: "Sunrise", genre: "Sci-Fi, Action, Space Western", year: "1998", desc: "Follow Spike Spiegel and his crew of bounty hunters as they hunt criminals across the solar system.", imageUrl: "https://cdn.myanimelist.net/images/anime/4/19644.jpg" },
  { title: "Fullmetal Alchemist: Brotherhood", studio: "Bones", genre: "Action, Adventure, Fantasy", year: "2009", desc: "Two brothers search for the Philosopher's Stone to restore their bodies after a failed alchemical resurrection.", imageUrl: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg" },
  { title: "Death Note", studio: "Madhouse", genre: "Mystery, Psychological, Thriller", year: "2006", desc: "An intelligent high school student stumbles upon a notebook that kills anyone whose name is written in it.", imageUrl: "https://cdn.myanimelist.net/images/anime/9/9453.jpg" },
  { title: "Attack on Titan", studio: "Wit Studio / MAPPA", genre: "Action, Dark Fantasy, Drama", year: "2013", desc: "Humanity fights for survival against giant humanoid creatures known as Titans that devour humans.", imageUrl: "https://cdn.myanimelist.net/images/anime/10/47347.jpg" },
  { title: "Steins;Gate", studio: "White Fox", genre: "Sci-Fi, Thriller, Time Travel", year: "2011", desc: "A self-proclaimed mad scientist invents a device that can send text messages to the past, triggering unforeseen consequences.", imageUrl: "https://cdn.myanimelist.net/images/anime/15/35899.jpg" },
  { title: "Hunter x Hunter (2011)", studio: "Madhouse", genre: "Action, Adventure, Fantasy", year: "2011", desc: "A young boy seeks to become a licensed Hunter to find his father, encountering dangerous trials and friends.", imageUrl: "https://cdn.myanimelist.net/images/anime/1337/99013.jpg" },
  { title: "Your Name.", studio: "CoMix Wave Films", genre: "Romance, Drama, Supernatural", year: "2016", desc: "Two high school students, a girl in the countryside and a boy in Tokyo, suddenly begin swapping bytes.", imageUrl: "https://cdn.myanimelist.net/images/anime/5/87048.jpg" },
  { title: "Princess Mononoke", studio: "Studio Ghibli", genre: "Fantasy, Adventure, Drama", year: "1997", desc: "A prince becomes involved in a conflict between the forest gods and an industrial town.", imageUrl: "https://cdn.myanimelist.net/images/anime/7/75734.jpg" },
  { title: "Code Geass: Lelouch of the Rebellion", studio: "Sunrise", genre: "Sci-Fi, Mecha, Drama", year: "2006", desc: "An exiled prince gains the power of absolute obedience and leads a rebellion against an oppressive empire.", imageUrl: "https://cdn.myanimelist.net/images/anime/5/50331.jpg" },
  { title: "One Piece", studio: "Toei Animation", genre: "Action, Adventure, Comedy", year: "1999", desc: "Luffy and his pirate crew sail the Grand Line in search of the legendary treasure, the One Piece.", imageUrl: "https://cdn.myanimelist.net/images/anime/6/73245.jpg" },
  { title: "Naruto Shippuden", studio: "Studio Pierrot", genre: "Action, Adventure, Martial Arts", year: "2007", desc: "Naruto returns after years of training to protect his village and save his friend Sasuke.", imageUrl: "https://cdn.myanimelist.net/images/anime/1565/111305.jpg" },
  { title: "Demon Slayer: Kimetsu no Yaiba", studio: "ufotable", genre: "Action, Historical Fantasy", year: "2019", desc: "A kind-hearted boy sets out to become a demon slayer after his family is slaughtered and his sister turned.", imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg" },
  { title: "Jujutsu Kaisen", studio: "MAPPA", genre: "Action, Supernatural, Fantasy", year: "2020", desc: "A high school student joins a secret organization of Jujutsu Sorcerers to fight curses.", imageUrl: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg" },
  { title: "My Hero Academia", studio: "Bones", genre: "Action, Superhero, Comedy", year: "2016", desc: "A boy born without superpowers in a world of superheroes is chosen to inherit the power of the greatest hero.", imageUrl: "https://cdn.myanimelist.net/images/anime/10/78745.jpg" },
  { title: "Mononoke", studio: "Toei Animation", genre: "Mystery, Horror, Supernatural", year: "2007", desc: "A mysterious Medicine Seller travels Edo-period Japan to exorcise malevolent spirits known as Ayakashi.", imageUrl: "https://cdn.myanimelist.net/images/anime/3/17799.jpg" },
  { title: "Vinland Saga", studio: "Wit Studio / MAPPA", genre: "Action, Adventure, Drama", year: "2019", desc: "A young Viking warrior seeks vengeance for his father's death while navigating a war for England.", imageUrl: "https://cdn.myanimelist.net/images/anime/1500/101213.jpg" },
  { title: "Mob Psycho 100", studio: "Bones", genre: "Comedy, Action, Supernatural", year: "2016", desc: "A socially awkward middle school boy with immense psychic powers tries to live a normal life.", imageUrl: "https://cdn.myanimelist.net/images/anime/8/80356.jpg" },
  { title: "One Punch Man", studio: "Madhouse", genre: "Action, Comedy, Superhero", year: "2015", desc: "A superhero who can defeat any opponent with a single punch seeks a worthy adversary.", imageUrl: "https://cdn.myanimelist.net/images/anime/12/76049.jpg" }
];

const topStudios = ['Gainax', 'Studio Ghibli', 'Madhouse', 'Bones', 'MAPPA', 'Wit Studio', 'Kyoto Animation', 'ufotable', 'Sunrise', 'Shaft'];

const searchCache = new Map();
const detailsCache = new Map();

function normalizeAnime(item, index = 0) {
  const malId = item.mal_id;
  const creator = item.studios && item.studios.length > 0 
    ? item.studios.map(s => s.name).join(', ') 
    : topStudios[malId % topStudios.length];

  const genreNames = item.genres 
    ? item.genres.map(g => g.name).join(', ') 
    : 'Anime, Action';

  const releaseYear = item.aired && item.aired.prop && item.aired.prop.from && item.aired.prop.from.year
    ? item.aired.prop.from.year.toString()
    : item.year ? item.year.toString() : 'N/A';

  const rating = item.score ? parseFloat((item.score / 2).toFixed(1)) : 4.5;
  const price = parseFloat((19.99 + (malId % 20) * 2.37).toFixed(2));
  const stock = (malId % 10) + 3;

  return {
    id: `api-anime-${malId}`,
    title: `${item.title_english || item.title || 'Untitled Anime'} Blu-ray Box Set`,
    category: 'Anime',
    creator,
    description: item.synopsis || 'A high-definition physical anime release.',
    imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
    genre: genreNames,
    releaseYear,
    language: 'Japanese / English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-01T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

function getLocalFallbacks(query = '') {
  const list = fallbackAnime.map((item, i) => ({
    id: `api-anime-mock-${i + 1}`,
    title: `${item.title} Blu-ray Box Set`,
    category: 'Anime',
    creator: item.studio,
    description: item.desc,
    imageUrl: item.imageUrl,
    genre: item.genre,
    releaseYear: item.year,
    language: 'Japanese / English',
    price: parseFloat((19.99 + i * 2.37).toFixed(2)),
    stock: (i * 5) % 12 + 3,
    rating: parseFloat((4.4 + i * 0.07).toFixed(1)),
    createdAt: new Date(new Date('2026-06-01T12:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
  }));

  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.creator.toLowerCase().includes(q) ||
    a.genre.toLowerCase().includes(q)
  );
}

let lastRequestTime = 0;
const MIN_DELAY = 1400; // safe ms delay between Jikan calls

export async function throttleJikan() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_DELAY) {
    const delayTime = MIN_DELAY - timeSinceLast;
    lastRequestTime = now + delayTime;
    await new Promise(resolve => setTimeout(resolve, delayTime));
  } else {
    lastRequestTime = now;
  }
}

export async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const signal = options.signal 
      ? (options.signal.aborted ? options.signal : AbortSignal.any([options.signal, controller.signal]))
      : controller.signal;
    
    try {
      const res = await fetch(url, { ...options, signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        if (res.status >= 500 && i < retries - 1) {
          throw new Error(`Server Error ${res.status}`);
        }
        return res; // let the caller handle 4xx or throw
      }
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' && !options.signal?.aborted && i < retries - 1) {
        // This was our timeout, retry
      } else if (i === retries - 1 || (err.name === 'AbortError' && options.signal?.aborted)) {
        throw err;
      }
      // wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
    }
  }
}

export async function getPopularAnime(signal) {
  await throttleJikan();
  try {
    const res = await fetchWithRetry("https://api.jikan.moe/v4/top/anime?page=1", { signal });
    if (!res.ok) throw new Error(`Jikan status ${res.status}`);
    const data = await res.json();
    return (data.data || []).slice(0, 20).map((item, idx) => normalizeAnime(item, idx));
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to fetch popular anime from Jikan API:', err);
    return getLocalFallbacks();
  }
}

export async function searchAnime(query, signal) {
  if (!query || !query.trim()) return [];
  const normalizedQuery = query.trim().toLowerCase();

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery);
  }

  await throttleJikan();
  try {
    const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=1`, { signal });
    if (!res.ok) throw new Error(`Jikan search status ${res.status}`);
    const data = await res.json();
    const results = (data.data || []).slice(0, 20).map((item, idx) => normalizeAnime(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to search anime from Jikan API:', err);
    return getLocalFallbacks(query);
  }
}

export async function getAnimeDetails(id, signal) {
  const apiId = id.replace('api-anime-', '');
  if (detailsCache.has(apiId)) {
    return detailsCache.get(apiId);
  }

  await throttleJikan();
  try {
    const res = await fetchWithRetry(`https://api.jikan.moe/v4/anime/${apiId}`, { signal });
    if (!res.ok) throw new Error(`Jikan detail status ${res.status}`);
    const data = await res.json();
    const result = normalizeAnime(data.data);
    detailsCache.set(apiId, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to fetch anime details from Jikan:', err);
    const fallback = getLocalFallbacks().find(a => a.id === id);
    if (fallback) return fallback;
    throw err;
  }
}
