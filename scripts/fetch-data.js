import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedFilePath = path.join(__dirname, '../src/data/seed.json');

// Helper function to pause execution (respect Jikan's API rate limits)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Curated Local Fallbacks with real cover image URLs
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
  { title: "Things Fall Apart", author: "Chinua Achebe", genre: "Post-Colonial Fiction", year: "1958", desc: "Chronicles pre-colonial life in the southeastern part of Nigeria and the arrival of Europeans during the late 19th century.", imageUrl: "https://covers.openlibrary.org/b/id/8231990-L.jpg" },
  { title: "Jane Eyre", author: "Charlotte Brontë", genre: "Gothic Romance", year: "1847", desc: "Follows the emotions and experiences of Jane Eyre, including her growth to adulthood and her love for Mr. Rochester.", imageUrl: "https://covers.openlibrary.org/b/id/8282361-L.jpg" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Coming-of-Age", year: "1951", desc: "A novel about Holden Caulfield's struggles with alienation and identity in New York City after being expelled from his prep school.", imageUrl: "https://covers.openlibrary.org/b/id/8230689-L.jpg" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", genre: "Psychological Fiction", year: "1866", desc: "Follows the mental anguish and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student who plans to kill a pawnbroker.", imageUrl: "https://covers.openlibrary.org/b/id/8224792-L.jpg" },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", genre: "Philosophical Fiction", year: "1890", desc: "A philosophical novel about Dorian Gray, a young man who sells his soul so that a portrait of him will age instead of him.", imageUrl: "https://covers.openlibrary.org/b/id/9292850-L.jpg" },
  { title: "Brave New World", author: "Aldous Huxley", genre: "Sci-Fi, Dystopian", year: "1932", desc: "Anticipates developments in reproductive technology, sleep-learning, psychological manipulation, and classical conditioning.", imageUrl: "https://covers.openlibrary.org/b/id/8228490-L.jpg" },
  { title: "The Odyssey", author: "Homer", genre: "Epic Poetry", year: "1700", desc: "An ancient Greek epic poem that details Odysseus' ten-year journey home to Ithaca after the fall of Troy.", imageUrl: "https://covers.openlibrary.org/b/id/12061036-L.jpg" },
  { title: "Frankenstein", author: "Mary Shelley", genre: "Gothic Fiction, Sci-Fi", year: "1818", desc: "Tells the story of Victor Frankenstein, a young scientist who creates a sapient creature in an unorthodox scientific experiment.", imageUrl: "https://covers.openlibrary.org/b/id/8306354-L.jpg" },
  { title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance, Satire", year: "1813", desc: "Follows the turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy, a rich aristocratic landowner.", imageUrl: "https://covers.openlibrary.org/b/id/12818987-L.jpg" },
  { title: "Wuthering Heights", author: "Emily Brontë", genre: "Gothic Romance", year: "1847", desc: "A tale of the intense and almost demonic love between Catherine Earnshaw and Heathcliff, a foundling adopted by Catherine's father.", imageUrl: "https://covers.openlibrary.org/b/id/9253457-L.jpg" },
  { title: "The Grapes of Wrath", author: "John Steinbeck", genre: "Social Realism", year: "1939", desc: "Set during the Great Depression, the novel focuses on the Joads, a poor family of tenant farmers driven from their Oklahoma home.", imageUrl: "https://covers.openlibrary.org/b/id/8751508-L.jpg" },
  { title: "Lolita", author: "Vladimir Nabokov", genre: "Literary Fiction", year: "1955", desc: "A controversial masterpiece detailing the dark obsession of the narrator, Humbert Humbert.", imageUrl: "https://covers.openlibrary.org/b/id/10543265-L.jpg" },
  { title: "Catch-22", author: "Joseph Heller", genre: "Satire, War Fiction", year: "1961", desc: "Set during World War II, it follows Captain John Yossarian, a US Army Air Forces B-25 bombardier, and his attempts to stay alive.", imageUrl: "https://covers.openlibrary.org/b/id/8404845-L.jpg" },
  { title: "The Sound and the Fury", author: "William Faulkner", genre: "Modernist Literature", year: "1929", desc: "Employing stream of consciousness, it details the history of the Compson family, former Southern aristocrats.", imageUrl: "https://covers.openlibrary.org/b/id/9324021-L.jpg" },
  { title: "Heart of Darkness", author: "Joseph Conrad", genre: "Literary Fiction", year: "1899", desc: "Follows Charles Marlow, a sailor, as he travels up the Congo River to meet Kurtz, an ivory trader who has established a fiefdom.", imageUrl: "https://covers.openlibrary.org/b/id/8226199-L.jpg" },
  { title: "The Stranger", author: "Albert Camus", genre: "Absurdist Fiction", year: "1942", desc: "Presents the story of Meursault, an indifferent French Algerian who, after attending his mother's funeral, apathetically kills an Arab man.", imageUrl: "https://covers.openlibrary.org/b/id/8231758-L.jpg" },
  { title: "Moby-Dick", author: "Herman Melville", genre: "Adventure Fiction", year: "1851", desc: "Follows the quest of Ahab, captain of the whaling ship Pequod, for revenge against Moby Dick, the giant white whale.", imageUrl: "https://covers.openlibrary.org/b/id/12818903-L.jpg" },
  { title: "The Trial", author: "Franz Kafka", genre: "Philosophical Fiction", year: "1925", desc: "Tells the story of Josef K., a man arrested and prosecuted by a remote, inaccessible authority, with the nature of his crime kept secret.", imageUrl: "https://covers.openlibrary.org/b/id/8231980-L.jpg" },
  { title: "The Sun Also Rises", author: "Ernest Hemingway", genre: "Modernist Literature", year: "1926", desc: "Portrays a group of American and British expatriates who travel from Paris to the Festival of San Fermín in Pamplona.", imageUrl: "https://covers.openlibrary.org/b/id/8741026-L.jpg" },
  { title: "Madame Bovary", author: "Gustave Flaubert", genre: "Realism", year: "1856", desc: "Focuses on Emma Bovary, who lives beyond her means in order to escape the banalities and emptiness of provincial life.", imageUrl: "https://covers.openlibrary.org/b/id/8225010-L.jpg" },
  { title: "Ulysses", author: "James Joyce", genre: "Modernist Literature", year: "1922", desc: "Chronicles the perambulations of Leopold Bloom in Dublin in the course of an ordinary day, 16 June 1904.", imageUrl: "https://covers.openlibrary.org/b/id/12818956-L.jpg" },
  { title: "Fahrenheit 451", author: "Ray Bradbury", genre: "Sci-Fi, Dystopian", year: "1953", desc: "Presents a future American society where books are outlawed and 'firemen' burn any that are found.", imageUrl: "https://covers.openlibrary.org/b/id/8226081-L.jpg" },
  { title: "Slaughterhouse-Five", author: "Kurt Vonnegut", genre: "Sci-Fi, Satire", year: "1969", desc: "Follows the life and experiences of Billy Pilgrim, from his early years to his time as an American soldier and assistant chaplain.", imageUrl: "https://covers.openlibrary.org/b/id/8225792-L.jpg" },
  { title: "The Handmaid's Tale", author: "Margaret Atwood", genre: "Dystopian Fiction", year: "1985", desc: "Set in a near-future New England, in a patriarchal, totalitarian state known as the Republic of Gilead.", imageUrl: "https://covers.openlibrary.org/b/id/8225574-L.jpg" },
  { title: "The Alchemist", author: "Paulo Coelho", genre: "Adventure, Quest", year: "1988", desc: "Follows a young Andalusian shepherd in his journey to Egypt, after having a recurring dream of finding a treasure there.", imageUrl: "https://covers.openlibrary.org/b/id/8225434-L.jpg" },
  { title: "Lord of the Flies", author: "William Golding", genre: "Allegorical Fiction", year: "1954", desc: "Focuses on a group of British boys stranded on an uninhabited island and their disastrous attempt to govern themselves.", imageUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg" },
  { title: "The Road", author: "Cormac McCarthy", genre: "Post-Apocalyptic", year: "2006", desc: "Details the journey of a father and his young son over a period of several months across a landscape blasted by an unspecified cataclysm.", imageUrl: "https://covers.openlibrary.org/b/id/8226252-L.jpg" },
  { title: "Life of Pi", author: "Yann Martel", genre: "Adventure, Fantasy", year: "2001", desc: "Follows Piscine Molitor 'Pi' Patel, an Indian boy from Pondicherry, who survives 227 days shipwrecked in the Pacific Ocean with a Bengal tiger.", imageUrl: "https://covers.openlibrary.org/b/id/8231802-L.jpg" },
  { title: "A Game of Thrones", author: "George R.R. Martin", genre: "Epic Fantasy", year: "1996", desc: "Follows several noble houses in a medieval fantasy setting as they fight for control of the Iron Throne of Westeros.", imageUrl: "https://covers.openlibrary.org/b/id/8282928-L.jpg" },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Epic Fantasy", year: "2007", desc: "Tells the story of Kvothe, a famous wizard and musician, who relates his early life to a scribe in his inn.", imageUrl: "https://covers.openlibrary.org/b/id/8226162-L.jpg" },
  { title: "Dune", author: "Frank Herbert", genre: "Sci-Fi, Space Opera", year: "1965", desc: "The epic story of Paul Atreides and his family on the dangerous desert planet Arrakis.", imageUrl: "https://covers.openlibrary.org/b/id/10499252-L.jpg" }
];

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
  { title: "Princess Mononoke", director: "Hayao Miyazaki", genre: "Animation, Fantasy, Adventure", year: "1997", desc: "On a journey to find the cure for a Tatarigami's curse, Ashitaka finds himself in the middle of a war between the forest gods and Tatara, a mining colony.", imageUrl: "https://image.tmdb.org/t/p/w500/qG3RYlIVpU6FGg7PJw346z1n3Zg.jpg" },
  { title: "The Lord of the Rings: The Fellowship of the Ring", director: "Peter Jackson", genre: "Fantasy, Adventure", year: "2001", desc: "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.", imageUrl: "https://image.tmdb.org/t/p/w500/6oom5QDN208035w66wTEk6KG1gA.jpg" },
  { title: "Gladiator", director: "Ridley Scott", genre: "Action, Drama, History", year: "2000", desc: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.", imageUrl: "https://image.tmdb.org/t/p/w500/ty87Lu1bHtyr58avWz651G1z6ld.jpg" },
  { title: "Fight Club", director: "David Fincher", genre: "Drama, Thriller", year: "1999", desc: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.", imageUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6GgbI7AaFp2V0Yq.jpg" },
  { title: "Alien", director: "Ridley Scott", genre: "Sci-Fi, Horror", year: "1979", desc: "The crew of a commercial spacecraft encounter a deadly lifeform after investigating an unknown transmission.", imageUrl: "https://image.tmdb.org/t/p/w500/vfrQk5IPaa2v8XWvC4TMu2I3FOc.jpg" },
  { title: "Terminator 2: Judgment Day", director: "James Cameron", genre: "Sci-Fi, Action", year: "1991", desc: "A cyborg, identical to the one who failed to kill Sarah Connor, must now protect her ten-year-old son John from a more advanced and powerful cyborg.", imageUrl: "https://image.tmdb.org/t/p/w500/5M0rbwWhZ67JGE5u2YkR4xp5C09.jpg" },
  { title: "The Godfather", director: "Francis Ford Coppola", genre: "Crime, Drama", year: "1972", desc: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.", imageUrl: "https://image.tmdb.org/t/p/w500/3bhkrj6PMMn799icw2BzR5th85A.jpg" },
  { title: "Goodfellas", director: "Martin Scorsese", genre: "Crime, Biography, Drama", year: "1990", desc: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito.", imageUrl: "https://image.tmdb.org/t/p/w500/aKuFi14FG7U6N4GPGL56ICjQf72.jpg" },
  { title: "Seven", director: "David Fincher", genre: "Crime, Mystery, Thriller", year: "1995", desc: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.", imageUrl: "https://image.tmdb.org/t/p/w500/69CzZg0WDr94y4RZ7i4HQfg4v7Y.jpg" },
  { title: "The Departed", director: "Martin Scorsese", genre: "Crime, Thriller, Drama", year: "2006", desc: "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.", imageUrl: "https://image.tmdb.org/t/p/w500/1e9oZ026VpqTVglIBR7h4l49rXy.jpg" },
  { title: "Whiplash", director: "Damien Chazelle", genre: "Drama, Music", year: "2014", desc: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.", imageUrl: "https://image.tmdb.org/t/p/w500/71CX8nKSCc7hWvC2pLpC72Y6w6.jpg" },
  { title: "Arrival", director: "Denis Villeneuve", genre: "Sci-Fi, Drama, Mystery", year: "2016", desc: "A linguist works with the military to communicate with alien-creatures that have arrived on Earth.", imageUrl: "https://image.tmdb.org/t/p/w500/x2FJCrw36J3mZ5jCl58VMtqYvXy.jpg" },
  { title: "Dune: Part One", director: "Denis Villeneuve", genre: "Sci-Fi, Space Opera", year: "2021", desc: "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset on a dangerous desert planet.", imageUrl: "https://image.tmdb.org/t/p/w500/d5NXSklXkiLBlW5u2UiGth8v68r.jpg" },
  { title: "The Prestige", director: "Christopher Nolan", genre: "Drama, Mystery, Sci-Fi", year: "2006", desc: "After a tragic accident, two stage magicians in London engage in a battle to create the ultimate illusion.", imageUrl: "https://image.tmdb.org/t/p/w500/bdN3gXu4402aXvC462J00Gb9Rrk.jpg" },
  { title: "Shutter Island", director: "Martin Scorsese", genre: "Thriller, Mystery, Psychological", year: "2010", desc: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.", imageUrl: "https://image.tmdb.org/t/p/w500/kve20tXwUZV512J6t4PgZuR42gl.jpg" },
  { title: "Eternal Sunshine of the Spotless Mind", director: "Michel Gondry", genre: "Romance, Sci-Fi, Drama", year: "2004", desc: "When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.", imageUrl: "https://image.tmdb.org/t/p/w500/5gvaIEqF4zoN3n3hj26260zBh7F.jpg" },
  { title: "No Country for Old Men", director: "Joel Coen, Ethan Coen", genre: "Crime, Drama, Thriller", year: "2007", desc: "Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash.", imageUrl: "https://image.tmdb.org/t/p/w500/ke4STy546UygBnj6v2xFD6uZsNh.jpg" },
  { title: "Django Unchained", director: "Quentin Tarantino", genre: "Western, Action, Drama", year: "2012", desc: "With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.", imageUrl: "https://image.tmdb.org/t/p/w500/7oWYmUz7FS9w4Hi6hPr24Wg65Uj.jpg" },
  { title: "Inglourious Basterds", director: "Quentin Tarantino", genre: "War, Action, Drama", year: "2009", desc: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans.", imageUrl: "https://image.tmdb.org/t/p/w500/7sfbE5mg63XIClnp4V7z57fPd2L.jpg" },
  { title: "Inside Out", director: "Pete Docter", genre: "Animation, Family, Comedy", year: "2015", desc: "After a young girl is uprooted from her Midwest life and moved to San Francisco, her emotions conflict on how best to navigate a new city.", imageUrl: "https://image.tmdb.org/t/p/w500/lRGExt42e2012Y5cx6n61L4YFDg.jpg" },
  { title: "Spider-Man: Into the Spider-Verse", director: "Bob Persichetti", genre: "Animation, Action, Sci-Fi", year: "2018", desc: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat.", imageUrl: "https://image.tmdb.org/t/p/w500/iiZrTy9zbWaaR1Al9nPx5j98uCl.jpg" },
  { title: "The Grand Budapest Hotel", director: "Wes Anderson", genre: "Comedy, Drama", year: "2014", desc: "A writer relates his adventures at a renowned European resort hotel between the first and second World Wars.", imageUrl: "https://image.tmdb.org/t/p/w500/nXSSwT2ntJ0j41sV6965mi55Q9P.jpg" },
  { title: "The Truman Show", director: "Peter Weir", genre: "Comedy, Drama", year: "1998", desc: "An insurance salesman discovers his whole life is actually a reality TV show.", imageUrl: "https://image.tmdb.org/t/p/w500/ddDs6y0EUgqy29U32r4QA2nsXRx.jpg" },
  { title: "Jurassic Park", director: "Steven Spielberg", genre: "Adventure, Sci-Fi", year: "1993", desc: "A pragmatic paleontologist visiting an almost complete theme park is tasked with protecting a couple of kids after a power failure.", imageUrl: "https://image.tmdb.org/t/p/w500/oU7wzu4vAlNE2yOIcZ46I4N2mRz.jpg" },
  { title: "Schindler's List", director: "Steven Spielberg", genre: "Biography, Drama, History", year: "1993", desc: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.", imageUrl: "https://image.tmdb.org/t/p/w500/sF1w4MIv5q2Z2N37R9AQUspt0eW.jpg" },
  { title: "Saving Private Ryan", director: "Steven Spielberg", genre: "War, Action, Drama", year: "1998", desc: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.", imageUrl: "https://image.tmdb.org/t/p/w500/1bgKuE9G964H195c646Vp89V66L.jpg" },
  { title: "Back to the Future", director: "Robert Zemeckis", genre: "Sci-Fi, Comedy, Adventure", year: "1985", desc: "Marty McFly, a 17-year-old high school student, is accidentally sent thirty years into the past in a time-traveling DeLorean.", imageUrl: "https://image.tmdb.org/t/p/w500/fN5JBFnm2wU6J6mOIzuOCnegW75.jpg" },
  { title: "Raiders of the Lost Ark", director: "Steven Spielberg", genre: "Action, Adventure", year: "1981", desc: "In 1936, archaeologist and adventurer Indiana Jones is hired by the U.S. government to find the Ark of the Covenant.", imageUrl: "https://image.tmdb.org/t/p/w500/ceG9V8qVw8QPJv25mZ1N86562J9.jpg" },
  { title: "Star Wars: A New Hope", director: "George Lucas", genre: "Sci-Fi, Space Opera", year: "1977", desc: "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy.", imageUrl: "https://image.tmdb.org/t/p/w500/6FfCtAuVAFG1IASII76W1Z02K75.jpg" },
  { title: "Star Wars: The Empire Strikes Back", director: "Irvin Kershner", genre: "Sci-Fi, Space Opera", year: "1980", desc: "After the Rebels are brutally overpowered by the Empire on the ice planet Hoth, Luke Skywalker begins Jedi training with Yoda.", imageUrl: "https://image.tmdb.org/t/p/w500/2u76uVnzBZu2360Zxt0w4dxqux1.jpg" },
  { title: "Blade Runner (Final Cut)", director: "Ridley Scott", genre: "Sci-Fi, Cyberpunk", year: "1982", desc: "A blade runner must pursue and terminate four replicants who stole a ship in space and have returned to Earth to find their creator.", imageUrl: "https://image.tmdb.org/t/p/w500/vfz7xZqS57729vS4URK64fsGzPv.jpg" }
];

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
  { title: "One Punch Man", studio: "Madhouse", genre: "Action, Comedy, Superhero", year: "2015", desc: "A superhero who can defeat any opponent with a single punch seeks a worthy adversary.", imageUrl: "https://cdn.myanimelist.net/images/anime/12/76049.jpg" },
  { title: "Monster", studio: "Madhouse", genre: "Mystery, Psychological, Thriller", year: "2004", desc: "A brilliant neurosurgeon gets caught in a web of murder and mystery after saving a young boy's life.", imageUrl: "https://cdn.myanimelist.net/images/anime/10/18793.jpg" },
  { title: "Samurai Champloo", studio: "Manglobe", genre: "Action, Adventure, Comedy", year: "2004", desc: "A young woman, a rogue swordsman, and a stoic ronin travel across Japan in search of a samurai who smells of sunflowers.", imageUrl: "https://cdn.myanimelist.net/images/anime/1375/121599.jpg" },
  { title: "FLCL", studio: "Gainax", genre: "Sci-Fi, Comedy, Surreal", year: "2000", desc: "An ordinary boy's life is disrupted by a bizarre Vespa-riding woman wielding a bass guitar.", imageUrl: "https://cdn.myanimelist.net/images/anime/8/38115.jpg" },
  { title: "Akira", studio: "Tokyo Movie Shinsha", genre: "Sci-Fi, Cyberpunk", year: "1988", desc: "A secret military project in Neo-Tokyo threatens to destroy the city when it awakens a motorcycle gang member's psychic powers.", imageUrl: "https://cdn.myanimelist.net/images/anime/1819/122041.jpg" },
  { title: "Ghost in the Shell", studio: "Production I.G", genre: "Sci-Fi, Cyberpunk, Philosophical", year: "1995", desc: "A cyborg policewoman and her partner hunt for a mysterious hacker known as the Puppet Master.", imageUrl: "https://cdn.myanimelist.net/images/anime/10/18622.jpg" },
  { title: "Gurren Lagann", studio: "Gainax", genre: "Sci-Fi, Mecha, Action", year: "2007", desc: "Two boys escape their underground village and lead humanity's rebellion against beastmen surface rulers.", imageUrl: "https://cdn.myanimelist.net/images/anime/4/5123.jpg" },
  { title: "Bleach: Thousand-Year Blood War", studio: "Studio Pierrot", genre: "Action, Fantasy", year: "2022", desc: "Soul Reaper Ichigo Kurosaki returns to the battlefield with his zanpakuto to fight the Quincy King.", imageUrl: "https://cdn.myanimelist.net/images/anime/1764/126627.jpg" },
  { title: "Chainsaw Man", studio: "MAPPA", genre: "Action, Dark Fantasy", year: "2022", desc: "A destitute young man merges with a chainsaw devil to become a devil hunter for public safety.", imageUrl: "https://cdn.myanimelist.net/images/anime/1806/126216.jpg" },
  { title: "Cyberpunk: Edgerunners", studio: "Studio Trigger", genre: "Sci-Fi, Cyberpunk", year: "2022", desc: "A street kid trying to survive in a technology and body modification-obsessed city of the future decides to become an edgerunner.", imageUrl: "https://cdn.myanimelist.net/images/anime/1818/126435.jpg" },
  { title: "Bocchi the Rock!", studio: "CloverWorks", genre: "Comedy, Music", year: "2022", desc: "An extremely anxious and socially awkward girl learns to play guitar and joins a band.", imageUrl: "https://cdn.myanimelist.net/images/anime/1448/127956.jpg" },
  { title: "Kaguya-sama: Love is War", studio: "A-1 Pictures", genre: "Comedy, Romance", year: "2019", desc: "Two elite student council leaders engage in a series of mind games to force the other to confess their love.", imageUrl: "https://cdn.myanimelist.net/images/anime/1295/99088.jpg" },
  { title: "Violet Evergarden", studio: "Kyoto Animation", genre: "Drama, Fantasy", year: "2018", desc: "An ex-soldier begins working as an Auto Memory Doll to write letters for others and understand the words 'I love you'.", imageUrl: "https://cdn.myanimelist.net/images/anime/1795/95088.jpg" },
  { title: "Made in Abyss", studio: "Kinema Citrus", genre: "Adventure, Fantasy, Dark Mystery", year: "2017", desc: "An orphaned girl and her robot friend descend into a massive, mysterious pit in search of her mother.", imageUrl: "https://cdn.myanimelist.net/images/anime/8/86603.jpg" },
  { title: "Clannad: After Story", studio: "Kyoto Animation", genre: "Drama, Romance", year: "2008", desc: "A young couple navigates the joys and heartaches of adulthood, family, and loss.", imageUrl: "https://cdn.myanimelist.net/images/anime/13/11009.jpg" },
  { title: "Haikyu!!", studio: "Production I.G", genre: "Sports, Comedy, Drama", year: "2014", desc: "A determined high school volleyball player builds a team to restore their school's former athletic glory.", imageUrl: "https://cdn.myanimelist.net/images/anime/7/76014.jpg" },
  { title: "Toradora!", studio: "J.C.Staff", genre: "Comedy, Romance", year: "2008", desc: "Two high school students form an alliance to help each other get closer to their respective crushes.", imageUrl: "https://cdn.myanimelist.net/images/anime/13/22128.jpg" },
  { title: "Re:Zero - Starting Life in Another World", studio: "White Fox", genre: "Fantasy, Thriller, Psychological", year: "2016", desc: "A boy transported to a fantasy world discovers he has the power to rewind time by dying.", imageUrl: "https://cdn.myanimelist.net/images/anime/1522/117998.jpg" },
  { title: "Puella Magi Madoka Magica", studio: "Shaft", genre: "Fantasy, Dark Magical Girl", year: "2011", desc: "A group of middle school girls make contracts with a strange cat-like creature to become magical girls, uncovering a dark secret.", imageUrl: "https://cdn.myanimelist.net/images/anime/11/29144.jpg" },
  { title: "Fate/Zero", studio: "ufotable", genre: "Action, Fantasy, Thriller", year: "2011", desc: "Seven mages and their summoned historic spirits fight in a secret war for the wish-granting Holy Grail.", imageUrl: "https://cdn.myanimelist.net/images/anime/2/32975.jpg" },
  { title: "Psycho-Pass", studio: "Production I.G", genre: "Sci-Fi, Cyberpunk, Crime", year: "2012", desc: "In a future where mental states can be measured, a rookie inspector hunts criminals using lethal guns.", imageUrl: "https://cdn.myanimelist.net/images/anime/11/41833.jpg" },
  { title: "Erased", studio: "A-1 Pictures", genre: "Mystery, Thriller, Supernatural", year: "2016", desc: "A young manga artist travels back in time to prevent a series of kidnappings and save his mother.", imageUrl: "https://cdn.myanimelist.net/images/anime/10/77957.jpg" },
  { title: "Parasyte: The Maxim", studio: "Madhouse", genre: "Sci-Fi, Horror, Action", year: "2014", desc: "A teenager's right hand is taken over by an alien parasite, forcing them into a struggle for survival.", imageUrl: "https://cdn.myanimelist.net/images/anime/9/68039.jpg" },
  { title: "Kill la Kill", studio: "Studio Trigger", genre: "Action, Comedy, Fantasy", year: "2013", desc: "A schoolgirl searches for her father's killer wielding a giant half-scissors blade and a living school uniform.", imageUrl: "https://cdn.myanimelist.net/images/anime/8/52631.jpg" },
  { title: "Your Lie in April", studio: "A-1 Pictures", genre: "Drama, Romance, Music", year: "2014", desc: "A piano prodigy who lost his ability to play after his mother's death is inspired by a free-spirited violinist.", imageUrl: "https://cdn.myanimelist.net/images/anime/3/67631.jpg" },
  { title: "A Silent Voice", studio: "Kyoto Animation", genre: "Drama, Coming-of-Age", year: "2016", desc: "A former elementary school bully attempts to make amends with a deaf girl he used to torment.", imageUrl: "https://cdn.myanimelist.net/images/anime/1114/90823.jpg" },
  { title: "Mushishi", studio: "Artland", genre: "Fantasy, Mystery, Slice-of-Life", year: "2005", desc: "A researcher travels around Japan studying strange, primitive lifeforms known as Mushi that affect humans.", imageUrl: "https://cdn.myanimelist.net/images/anime/2/73862.jpg" },
  { title: "The Promised Neverland", studio: "CloverWorks", genre: "Mystery, Thriller, Dark Fantasy", year: "2019", desc: "Orphaned children discover a terrifying secret about their orphanage and plan a daring escape.", imageUrl: "https://cdn.myanimelist.net/images/anime/1125/96924.jpg" },
  { title: "Anohana: The Flower We Saw That Day", studio: "A-1 Pictures", genre: "Drama, Supernatural", year: "2011", desc: "A group of estranged childhood friends reunite after the ghost of their deceased friend appears.", imageUrl: "https://cdn.myanimelist.net/images/anime/5/29571.jpg" },
  { title: "Hyouka", studio: "Kyoto Animation", genre: "Mystery, Slice-of-Life", year: "2012", desc: "A passive high school student joins the Classic Literature Club and solves small everyday mysteries.", imageUrl: "https://cdn.myanimelist.net/images/anime/13/75127.jpg" },
  { title: "Slam Dunk", studio: "Toei Animation", genre: "Sports, Comedy", year: "1993", desc: "A delinquent high school student joins the basketball team to impress a girl, falling in love with the sport.", imageUrl: "https://cdn.myanimelist.net/images/anime/11/49827.jpg" }
];

const unsplashUrls = [
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1629992101753-56d196c8aabb?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=500&auto=format&fit=crop'
];

const tmdbGenreMap = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

const topStudios = ['Gainax', 'Studio Ghibli', 'Madhouse', 'Bones', 'MAPPA', 'Wit Studio', 'Kyoto Animation', 'ufotable', 'Sunrise', 'Shaft'];

async function fetchBooks() {
  console.log('Fetching books from Google Books API...');
  const booksUrl = 'https://www.googleapis.com/books/v1/volumes?q=subject:fiction&maxResults=40';
  
  try {
    const response = await fetch(booksUrl);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    if (!data.items || data.items.length === 0) throw new Error('No items returned');
    console.log(`Fetched ${data.items.length} books from API.`);
    
    return data.items.map((item, index) => {
      const info = item.volumeInfo || {};
      let imageUrl = unsplashUrls[index % unsplashUrls.length];
      if (info.imageLinks) {
        const rawUrl = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '';
        if (rawUrl) imageUrl = rawUrl.replace(/^http:\/\//i, 'https://');
      }
      
      const price = parseFloat((8.99 + (index * 1.63) % 20).toFixed(2));
      const stock = (index * 7) % 15 + 3;
      const rating = parseFloat((4.1 + (index * 0.13) % 0.9).toFixed(1));
      
      return {
        id: `prod-book-${index + 1}`,
        title: info.title || 'Untitled Fiction',
        category: 'Book',
        creator: info.authors ? info.authors.join(', ') : 'Unknown Author',
        description: info.description || 'A compelling work of modern fiction.',
        imageUrl,
        genre: info.categories ? info.categories.map(c => c.trim()).join(', ') : 'Fiction',
        releaseYear: info.publishedDate ? info.publishedDate.split('-')[0] : 'N/A',
        language: info.language === 'en' ? 'English' : info.language || 'English',
        sellerId: index % 2 === 0 ? 'user-seller-1' : 'user-seller-2',
        sellerName: index % 2 === 0 ? 'Tokyo Media Imports' : 'Nostalgia Books & Films',
        price,
        stock,
        rating,
        createdAt: new Date(new Date('2026-06-09T08:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
      };
    });
  } catch (error) {
    console.warn(`Google Books API failed (${error.message}). Falling back to local book dataset.`);
    return fallbackBooks.map((b, i) => ({
      id: `prod-book-${i + 1}`,
      title: b.title,
      category: 'Book',
      creator: b.author,
      description: b.desc,
      imageUrl: b.imageUrl,
      genre: b.genre,
      releaseYear: b.year,
      language: 'English',
      sellerId: i % 2 === 0 ? 'user-seller-1' : 'user-seller-2',
      sellerName: i % 2 === 0 ? 'Tokyo Media Imports' : 'Nostalgia Books & Films',
      price: parseFloat((8.99 + (i * 1.63) % 20).toFixed(2)),
      stock: (i * 7) % 15 + 3,
      rating: parseFloat((4.1 + (i * 0.13) % 0.9).toFixed(1)),
      createdAt: new Date(new Date('2026-06-09T08:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
    }));
  }
}

async function fetchMovies() {
  console.log('Fetching movies from TMDB API...');
  const API_KEY = "YOUR_TMDB_API_KEY"; // Placeholder from prompt
  
  if (API_KEY.startsWith("YOUR_")) {
    console.log('No valid TMDB API key provided. Using local movies dataset.');
    return generateFallbackMovies();
  }

  try {
    const [res1, res2] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=1`),
      fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=2`)
    ]);

    if (!res1.ok || !res2.ok) throw new Error('API request failed');

    const data1 = await res1.json();
    const data2 = await res2.json();
    const combined = [...(data1.results || []), ...(data2.results || [])].slice(0, 40);
    
    if (combined.length === 0) throw new Error('No results returned');
    console.log(`Fetched ${combined.length} movies from TMDB.`);

    return combined.map((item, index) => {
      const imageUrl = item.poster_path 
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=500&auto=format&fit=crop';
        
      const genreNames = item.genre_ids 
        ? item.genre_ids.map(id => tmdbGenreMap[id]).filter(Boolean).join(', ') 
        : 'Movie';

      return {
        id: `prod-movie-${index + 1}`,
        title: `${item.title || item.original_title || 'Untitled Movie'} Blu-ray`,
        category: 'Movie',
        creator: index % 3 === 0 ? 'Denis Villeneuve' : index % 3 === 1 ? 'Christopher Nolan' : 'Quentin Tarantino',
        description: item.overview || 'A premium physical media movie release.',
        imageUrl,
        genre: genreNames,
        releaseYear: item.release_date ? item.release_date.split('-')[0] : 'N/A',
        language: item.original_language === 'en' ? 'English' : item.original_language || 'English',
        sellerId: index % 2 === 0 ? 'user-seller-1' : 'user-seller-2',
        sellerName: index % 2 === 0 ? 'Tokyo Media Imports' : 'Nostalgia Books & Films',
        price: parseFloat((9.99 + (index * 1.49) % 25).toFixed(2)),
        stock: (index * 4) % 15 + 2,
        rating: parseFloat((item.vote_average ? item.vote_average / 2 : 4.0).toFixed(1)),
        createdAt: new Date(new Date('2026-06-17T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
      };
    });
  } catch (error) {
    console.warn(`TMDB API request failed (${error.message}). Falling back to local movies dataset.`);
    return generateFallbackMovies();
  }
}

async function fetchAnime() {
  console.log('Fetching anime from Jikan API...');
  try {
    // Page 1 (Top 25 Anime)
    const res1 = await fetch("https://api.jikan.moe/v4/top/anime?page=1");
    if (!res1.ok) throw new Error(`Page 1 returned status ${res1.status}`);
    const data1 = await res1.json();
    
    // Delay 1.5 seconds to respect rate limiting
    console.log('Waiting 1.5 seconds to respect Jikan API rate limit...');
    await delay(1500);
    
    // Page 2 (Next 25 Anime)
    const res2 = await fetch("https://api.jikan.moe/v4/top/anime?page=2");
    if (!res2.ok) throw new Error(`Page 2 returned status ${res2.status}`);
    const data2 = await res2.json();

    const combined = [...(data1.data || []), ...(data2.data || [])];
    if (combined.length === 0) throw new Error('No data returned');
    console.log(`Fetched ${combined.length} anime from Jikan API.`);

    return combined.map((item, index) => {
      const creator = item.studios && item.studios.length > 0 
        ? item.studios.map(s => s.name).join(', ') 
        : topStudios[index % topStudios.length];

      const genreNames = item.genres 
        ? item.genres.map(g => g.name).join(', ') 
        : 'Anime, Action';

      const releaseYear = item.aired && item.aired.prop && item.aired.prop.from && item.aired.prop.from.year
        ? item.aired.prop.from.year.toString()
        : item.year ? item.year.toString() : 'N/A';

      const rating = item.score ? parseFloat((item.score / 2).toFixed(1)) : 4.5;

      return {
        id: `prod-anime-${index + 1}`,
        title: `${item.title_english || item.title || 'Untitled Anime'} Blu-ray Box Set`,
        category: 'Anime',
        creator,
        description: item.synopsis || 'A high-definition physical anime release.',
        imageUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500&auto=format&fit=crop',
        genre: genreNames,
        releaseYear,
        language: 'Japanese / English',
        sellerId: index % 2 === 0 ? 'user-seller-1' : 'user-seller-2',
        sellerName: index % 2 === 0 ? 'Tokyo Media Imports' : 'Nostalgia Books & Films',
        price: parseFloat((19.99 + (index * 2.37) % 50).toFixed(2)),
        stock: (index * 5) % 12 + 3,
        rating,
        createdAt: new Date(new Date('2026-06-01T12:00:00Z').getTime() + index * 6 * 3600 * 1000).toISOString()
      };
    });
  } catch (error) {
    console.warn(`Jikan API failed (${error.message}). Falling back to local anime dataset.`);
    return generateFallbackAnime();
  }
}

function generateFallbackMovies() {
  return fallbackMovies.map((m, i) => ({
    id: `prod-movie-${i + 1}`,
    title: `${m.title} Blu-ray`,
    category: 'Movie',
    creator: m.director,
    description: m.desc,
    imageUrl: m.imageUrl,
    genre: m.genre,
    releaseYear: m.year,
    language: 'English',
    sellerId: i % 2 === 0 ? 'user-seller-1' : 'user-seller-2',
    sellerName: i % 2 === 0 ? 'Tokyo Media Imports' : 'Nostalgia Books & Films',
    price: parseFloat((9.99 + (i * 1.49) % 25).toFixed(2)),
    stock: (i * 4) % 15 + 2,
    rating: parseFloat((4.3 + (i * 0.08) % 0.7).toFixed(1)),
    createdAt: new Date(new Date('2026-06-17T12:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
  }));
}

function generateFallbackAnime() {
  // Generate 50 items by duplicating/cycling our fallbackAnime array
  const fullAnimeList = [];
  for (let i = 0; i < 50; i++) {
    const item = fallbackAnime[i % fallbackAnime.length];
    fullAnimeList.push({
      id: `prod-anime-${i + 1}`,
      title: `${item.title} Blu-ray Box Set`,
      category: 'Anime',
      creator: item.studio,
      description: item.desc,
      imageUrl: item.imageUrl,
      genre: item.genre,
      releaseYear: item.year,
      language: 'Japanese / English',
      sellerId: i % 2 === 0 ? 'user-seller-1' : 'user-seller-2',
      sellerName: i % 2 === 0 ? 'Tokyo Media Imports' : 'Nostalgia Books & Films',
      price: parseFloat((19.99 + (i * 2.37) % 50).toFixed(2)),
      stock: (i * 5) % 12 + 3,
      rating: parseFloat((4.4 + (i * 0.07) % 0.6).toFixed(1)),
      createdAt: new Date(new Date('2026-06-01T12:00:00Z').getTime() + i * 6 * 3600 * 1000).toISOString()
    });
  }
  return fullAnimeList;
}

async function runSeed() {
  console.log('Starting Unified Data Seeding script...');
  
  try {
    const books = await fetchBooks();
    const movies = await fetchMovies();
    const anime = await fetchAnime();
    
    // Read current products to retain manga and comics
    console.log(`Reading existing seed data from ${seedFilePath}...`);
    const seedDataRaw = fs.readFileSync(seedFilePath, 'utf8');
    const existingProducts = JSON.parse(seedDataRaw);
    
    const mangaAndComics = existingProducts.filter(p => p.category === 'Manga' || p.category === 'Comic');
    console.log(`Preserved ${mangaAndComics.filter(p => p.category === 'Manga').length} manga and ${mangaAndComics.filter(p => p.category === 'Comic').length} comics.`);

    // Combine all
    const updatedProducts = [
      ...anime,
      ...mangaAndComics.filter(p => p.category === 'Manga'),
      ...books,
      ...mangaAndComics.filter(p => p.category === 'Comic'),
      ...movies
    ];

    fs.writeFileSync(seedFilePath, JSON.stringify(updatedProducts, null, 2), 'utf8');
    console.log(`Successfully completed seeding! Wrote a total of ${updatedProducts.length} items to seed.json.`);
  } catch (error) {
    console.error('Data seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
