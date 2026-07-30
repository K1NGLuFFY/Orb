export function generatePriceFromId(id, category) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  switch (category) {
    case 'Book':
      return parseFloat((8.99 + (hash % 20) * 0.5).toFixed(2));
    case 'Comic':
      return parseFloat((14.99 + (hash % 25) * 0.5).toFixed(2));
    case 'Movie':
      return parseFloat((9.99 + (hash % 15) * 1.49).toFixed(2));
    case 'Anime':
    case 'Manga':
      return parseFloat((19.99 + (hash % 20) * 1.5).toFixed(2));
    default:
      return parseFloat((9.99 + (hash % 10)).toFixed(2));
  }
}
