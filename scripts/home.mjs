'use strict';
import { loadMovieIDs, loadWatchedMovieIDs, getMoviesData, revealRandomMovie } from "./movie-data.mjs";

const calendarList = document.getElementById('calendar-list');
const lastMovieFigure = document.getElementById('last-movie');
const randMovieBtn = document.getElementById('randMovie');
const randMovieResult = document.getElementById('random-movie-result');

// Calendar entries live in data/calendar.json.
// Each entry: { "date": "3/14", "event": "Pie Day", "url": "optional link" }
async function showCalendar() {
    try {
        const response = await fetch('data/calendar.json');
        const events = await response.json();

        calendarList.replaceChildren(...events.map(({ date, event, url }) => {
            const li = document.createElement('li');
            li.append(`${date} - `);
            if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.textContent = event;
                li.appendChild(link);
            } else {
                li.append(event);
            }
            return li;
        }));
    } catch (error) {
        console.error('Could not load the calendar', error);
        calendarList.innerHTML = '<li>Calendar couldn\'t be loaded.</li>';
    }
}

// "Last Week's Movie" is the last movie added to data/watched.json
async function showLastWatchedMovie() {
    try {
        const watched = await loadWatchedMovieIDs();
        const [movie] = await getMoviesData(watched.slice(-1));
        if (!movie) throw new Error('No movie data for last watched movie');

        const link = document.createElement('a');
        link.href = `https://www.imdb.com/title/${movie.imdbID}/`;
        link.rel = 'noopener noreferrer';
        link.target = '_blank';
        const img = document.createElement('img');
        img.src = movie.Poster;
        img.alt = `${movie.Title} poster`;
        link.appendChild(img);

        const caption = document.createElement('figcaption');
        caption.className = 'bold-text';
        caption.textContent = movie.Title;

        lastMovieFigure.replaceChildren(link, caption);
    } catch (error) {
        console.error('Could not load last week\'s movie', error);
        lastMovieFigure.innerHTML = '<figcaption>Couldn\'t load last week\'s movie.</figcaption>';
    }
}

async function pickRandomMovie() {
    randMovieBtn.disabled = true;
    randMovieResult.innerHTML = '<p class="loading">Loading movies…</p>';
    try {
        const [movieIDs, watched] = await Promise.all([loadMovieIDs(), loadWatchedMovieIDs()]);
        const unwatchedIDs = movieIDs.filter(id => !watched.includes(id));
        const movies = await getMoviesData(unwatchedIDs);
        if (movies.length === 0) {
            randMovieResult.innerHTML = '<p>No unwatched movies left on the list!</p>';
            return;
        }
        await revealRandomMovie(randMovieResult, movies);
    } catch (error) {
        console.error('An error occurred while picking a random movie:', error);
        randMovieResult.innerHTML = '<p>Sorry, something went wrong picking a movie. Try again.</p>';
    } finally {
        randMovieBtn.disabled = false;
    }
}

randMovieBtn.addEventListener('click', pickRandomMovie);
showCalendar();
showLastWatchedMovie();
