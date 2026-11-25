// Shared movie data helpers used by the horror list and the home page.

const API_KEY = 'f6a4ead9';
const CACHE_KEY = 'cachedMovies-v2';
const OLD_CACHE_KEY = 'cachedMovies';
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // refresh movie info every 30 days

// Lists of IMDb IDs. Duplicates are removed so counts stay accurate.
export async function loadMovieIDs() {
    const response = await fetch('data/movies.json');
    return [...new Set(await response.json())];
}

export async function loadWatchedMovieIDs() {
    const response = await fetch('data/watched.json');
    return [...new Set(await response.json())];
}

function readCache() {
    try {
        localStorage.removeItem(OLD_CACHE_KEY); // old cache format had no timestamps
        return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch {
        return {};
    }
}

function writeCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('Could not save movie cache', error);
    }
}

async function fetchMovieData(imdbID) {
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=short&apikey=${API_KEY}`);
    const data = await response.json();
    if (data.Response === 'False') {
        throw new Error(`OMDb error for ${imdbID}: ${data.Error}`);
    }
    return data;
}

// Returns movie info for each ID. Uses the cache when it's fresh and
// fetches everything else from OMDb at the same time (not one by one).
export async function getMoviesData(movieIDs) {
    const cache = readCache();
    const now = Date.now();

    const results = await Promise.all(movieIDs.map(async (id) => {
        const cached = cache[id];
        const isFresh = cached && now - cached.fetchedAt < CACHE_MAX_AGE_MS;
        if (isFresh) {
            return cached.data;
        }
        try {
            const data = await fetchMovieData(id);
            cache[id] = { data, fetchedAt: now };
            return data;
        } catch (error) {
            console.error(error);
            return cached ? cached.data : null; // fall back to old info if we have it
        }
    }));

    writeCache(cache);
    return results.filter(Boolean);
}

function hasPoster(movie) {
    return movie.Poster && movie.Poster !== 'N/A';
}

function addText(parent, tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    parent.appendChild(el);
    return el;
}

export function createMovieCard(movie, watchedMovies = []) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    if (watchedMovies.includes(movie.imdbID)) {
        card.classList.add('watched');
    }

    const posterLink = document.createElement('a');
    posterLink.href = `https://www.imdb.com/title/${movie.imdbID}/`;
    posterLink.rel = 'noopener noreferrer';
    posterLink.target = '_blank';
    if (hasPoster(movie)) {
        const img = document.createElement('img');
        img.src = movie.Poster;
        img.alt = movie.Title;
        img.loading = 'lazy';
        posterLink.appendChild(img);
    } else {
        addText(posterLink, 'span', movie.Title, 'no-poster');
    }
    card.appendChild(posterLink);

    const info = document.createElement('div');
    info.className = 'card-info';
    addText(info, 'h3', `${movie.Title} (${movie.Year})`);
    addText(info, 'p', `Rated: ${movie.Rated}`);
    addText(info, 'p', `Runtime: ${movie.Runtime}`);
    if (movie.imdbRating && movie.imdbRating !== 'N/A') {
        addText(info, 'p', `IMDb: ⭐ ${movie.imdbRating}`);
    }
    if (movie.Genre && movie.Genre !== 'N/A') {
        addText(info, 'p', movie.Genre, 'genre');
    }
    if (movie.Plot && movie.Plot !== 'N/A') {
        const details = document.createElement('details');
        addText(details, 'summary', 'Plot');
        addText(details, 'p', movie.Plot);
        info.appendChild(details);
    }
    card.appendChild(info);

    return card;
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function preload(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = resolve;
        img.src = src;
    });
}

// Flashes through posters, slowing down like a slot machine, before the pick
// is shown. Skipped for people who prefer reduced motion.
async function playShuffle(container, movies) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const posters = movies.filter(hasPoster).map(m => m.Poster);
    if (reduceMotion || posters.length < 2) return;

    const sample = posters.sort(() => Math.random() - 0.5).slice(0, 12);
    await Promise.race([Promise.all(sample.map(preload)), wait(1500)]);

    const img = document.createElement('img');
    img.className = 'shuffle-poster';
    img.alt = '';
    container.replaceChildren(img);

    let i = 0;
    for (let delay = 60; delay < 350; delay *= 1.15) {
        img.src = sample[i++ % sample.length];
        await wait(delay);
    }
}

let lastPickID = null;

// Picks a random movie from the list (avoiding a repeat when possible),
// plays the shuffle animation, then shows the picked movie's card.
export async function revealRandomMovie(container, movies) {
    let choices = movies;
    if (movies.length > 1) {
        choices = movies.filter(movie => movie.imdbID !== lastPickID);
    }
    const pick = choices[Math.floor(Math.random() * choices.length)];
    lastPickID = pick.imdbID;

    await playShuffle(container, movies);

    container.replaceChildren();
    addText(container, 'h2', 'Tonight\'s Pick');
    const card = createMovieCard(pick);
    card.classList.add('picked');
    container.appendChild(card);
    return pick;
}
