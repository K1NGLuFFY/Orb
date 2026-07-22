import { throttleJikan, fetchWithRetry } from './jikanApi';

const fallbackManga = [
  { title: "Berserk Deluxe Edition, Vol. 1", author: "Kentaro Miura", genre: "Dark Fantasy, Action, Tragedy", year: "1989", desc: "The reigning king of adult fantasy manga now in deluxe oversized library editions. Guts, the Black Swordsman, seeks vengeance against the hand that branded him, fighting his way through a brutal world.", imageUrl: "https://cdn.myanimelist.net/images/manga/1/157897.jpg" },
  { title: "One Piece, Vol. 1: Romance Dawn", author: "Eiichiro Oda", genre: "Adventure, Action, Comedy", year: "1997", desc: "Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the King of all Pirates. With a course charted for the treacherous waters of the Grand Line, this is the boy who will never give up.", imageUrl: "https://cdn.myanimelist.net/images/manga/2/253146.jpg" },
  { title: "Akira, Vol. 1", author: "Katsuhiro Otomo", genre: "Sci-Fi, Cyberpunk, Dystopian", year: "1982", desc: "In Neo-Tokyo, built on the ashes of Tokyo after World War III, two teenage motorcycle gang members, Kaneda and Tetsuo, get caught up in a secret military project that threatens to destroy the city.", imageUrl: "https://cdn.myanimelist.net/images/manga/2/250313.jpg" },
  { title: "Monster: The Perfect Edition, Vol. 1", author: "Naoki Urasawa", genre: "Thriller, Mystery, Psychological", year: "1994", desc: "Johan Liebert is a monster. Dr. Kenzo Tenma is the brilliant neurosurgeon who saved Johan's life, only to discover years later that the boy he saved has grown up to become a terrifying serial killer.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/258224.jpg" },
  { title: "Death Note, Vol. 1", author: "Tsugumi Ohba, Takeshi Obata", genre: "Mystery, Psychological, Supernatural", year: "2003", desc: "A high school student discovers a supernatural notebook that grants him the ability to kill anyone whose name he writes in it.", imageUrl: "https://cdn.myanimelist.net/images/manga/1/258245.jpg" },
  { title: "Attack on Titan, Vol. 1", author: "Hajime Isayama", genre: "Action, Dark Fantasy, Drama", year: "2009", desc: "In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, giant humanoid creatures who devour humans.", imageUrl: "https://cdn.myanimelist.net/images/manga/2/37846.jpg" },
  { title: "Naruto, Vol. 1", author: "Masashi Kishimoto", genre: "Action, Adventure, Fantasy", year: "1999", desc: "Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition and dreams of becoming the Hokage.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/249658.jpg" },
  { title: "Bleach, Vol. 1", author: "Tite Kubo", genre: "Action, Adventure, Supernatural", year: "2001", desc: "Follow the adventures of Ichigo Kurosaki after he obtains the powers of a Soul Reaper from Rukia Kuchiki.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/180031.jpg" },
  { title: "Fullmetal Alchemist, Vol. 1", author: "Hiromu Arakawa", genre: "Action, Adventure, Fantasy", year: "2001", desc: "Two brothers search for the Philosopher's Stone to restore their bodies after a failed attempt to resurrect their mother.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/243675.jpg" },
  { title: "Demon Slayer: Kimetsu no Yaiba, Vol. 1", author: "Koyoharu Gotouge", genre: "Action, Historical Fantasy, Adventure", year: "2016", desc: "Tanjiro Kamado sets out to become a demon slayer after his family is slaughtered and his sister is turned into a demon.", imageUrl: "https://cdn.myanimelist.net/images/manga/2/237884.jpg" },
  { title: "Jujutsu Kaisen, Vol. 1", author: "Gege Akutami", genre: "Action, Supernatural, Fantasy", year: "2018", desc: "A high school student joins a secret school of Jujutsu Sorcerers to destroy a powerful curse of which he has become the host.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/210341.jpg" },
  { title: "Chainsaw Man, Vol. 1", author: "Tatsuki Fujimoto", genre: "Action, Dark Fantasy, Comedy", year: "2018", desc: "A destitute young man merges with a chainsaw devil to become a devil hunter for public safety.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/216464.jpg" },
  { title: "My Hero Academia, Vol. 1", author: "Kohei Horikoshi", genre: "Action, Superhero, Comedy", year: "2014", desc: "In a world where most of the human population has developed superpowers, a boy without them inherits the power of the greatest hero.", imageUrl: "https://cdn.myanimelist.net/images/manga/1/209370.jpg" },
  { title: "Tokyo Ghoul, Vol. 1", author: "Sui Ishida", genre: "Action, Dark Fantasy, Horror", year: "2011", desc: "A college student barely survives a deadly encounter with a ghoul, and becomes a half-ghoul in a world where they must feed on human flesh.", imageUrl: "https://cdn.myanimelist.net/images/manga/3/114037.jpg" },
  { title: "Hunter x Hunter, Vol. 1", author: "Yoshihiro Togashi", genre: "Action, Adventure, Fantasy", year: "1998", desc: "A young boy seeks to become a licensed Hunter to find his father, encountering dangerous trials and friends.", imageUrl: "https://cdn.myanimelist.net/images/manga/2/253119.jpg" }
];

const topMangaAuthors = ['Kentaro Miura', 'Eiichiro Oda', 'Katsuhiro Otomo', 'Naoki Urasawa', 'Akira Toriyama', 'Hajime Isayama', 'Masashi Kishimoto', 'Sui Ishida'];

const searchCache = new Map();
const detailsCache = new Map();

function normalizeManga(item, index = 0) {
  const malId = item.mal_id;
  const creator = item.authors && item.authors.length > 0
    ? item.authors.map(a => a.name).join(', ')
    : topMangaAuthors[malId % topMangaAuthors.length];

  const genreNames = item.genres
    ? item.genres.map(g => g.name).join(', ')
    : 'Manga, Action';

  const releaseYear = item.published && item.published.prop && item.published.prop.from && item.published.prop.from.year
    ? item.published.prop.from.year.toString()
    : 'N/A';

  const rating = item.score ? parseFloat((item.score / 2).toFixed(1)) : 4.5;
  const price = parseFloat((9.99 + (malId % 20) * 1.49).toFixed(2));
  const stock = (malId % 10) + 3;

  // Prefer large jpg, then regular jpg, then webp fallbacks
  const imageUrl = item.images?.jpg?.large_image_url
    || item.images?.jpg?.image_url
    || item.images?.webp?.large_image_url
    || item.images?.webp?.image_url
    || '';

  return {
    id: `api-manga-${malId}`,
    // Use English title when available, else the default romaji title
    title: item.title_english || item.title || 'Untitled Manga',
    category: 'Manga',
    creator,
    description: item.synopsis || 'A physical print manga publication.',
    imageUrl,
    genre: genreNames,
    releaseYear,
    language: 'English',
    price,
    stock,
    rating,
    createdAt: new Date(new Date('2026-06-05T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
  };
}

// Return only the unique seed entries on API failure — never loop/duplicate them
function getLocalFallbacks(query = '') {
  const list = fallbackManga.map((item, i) => ({
    id: `api-manga-mock-${i + 1}`,
    title: item.title,
    category: 'Manga',
    creator: item.author,
    description: item.desc,
    imageUrl: item.imageUrl,
    genre: item.genre,
    releaseYear: item.year,
    language: 'English',
    price: parseFloat((9.99 + i * 1.49).toFixed(2)),
    stock: (i * 5) % 12 + 3,
    rating: parseFloat((4.4 + i * 0.07).toFixed(1)),
    createdAt: new Date(new Date('2026-06-05T12:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
  }));

  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.creator.toLowerCase().includes(q) ||
    m.genre.toLowerCase().includes(q)
  );
}

export async function getPopularManga(signal) {
  await throttleJikan();
  try {
    const res = await fetchWithRetry("https://api.jikan.moe/v4/top/manga?page=1", { signal });
    if (!res.ok) throw new Error(`Jikan manga top status ${res.status}`);
    const data = await res.json();
    console.log('[mangaApi] getPopularManga — received', (data.data || []).length, 'items; first:', data.data?.[0]?.title);
    return (data.data || []).slice(0, 20).map((item, idx) => normalizeManga(item, idx));
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to fetch popular manga from Jikan API:', err);
    return getLocalFallbacks();
  }
}

export async function searchManga(query, signal) {
  if (!query || !query.trim()) return [];
  const normalizedQuery = query.trim().toLowerCase();

  if (searchCache.has(normalizedQuery)) {
    return searchCache.get(normalizedQuery);
  }

  await throttleJikan();
  try {
    const res = await fetchWithRetry(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&page=1`, { signal });
    if (!res.ok) throw new Error(`Jikan manga search status ${res.status}`);
    const data = await res.json();
    console.log('[mangaApi] searchManga("' + query + '") — received', (data.data || []).length, 'items');
    const results = (data.data || []).slice(0, 20).map((item, idx) => normalizeManga(item, idx));
    searchCache.set(normalizedQuery, results);
    return results;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to search manga from Jikan API:', err);
    return getLocalFallbacks(query);
  }
}

export async function getMangaDetails(id, signal) {
  const apiId = id.replace('api-manga-', '');
  if (detailsCache.has(apiId)) {
    return detailsCache.get(apiId);
  }

  await throttleJikan();
  try {
    const res = await fetchWithRetry(`https://api.jikan.moe/v4/manga/${apiId}`, { signal });
    if (!res.ok) throw new Error(`Jikan manga detail status ${res.status}`);
    const data = await res.json();
    const result = normalizeManga(data.data);
    detailsCache.set(apiId, result);
    return result;
  } catch (err) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.error('Failed to fetch manga details from Jikan:', err);
    const fallback = getLocalFallbacks().find(m => m.id === id);
    if (fallback) return fallback;
    throw err;
  }
}
