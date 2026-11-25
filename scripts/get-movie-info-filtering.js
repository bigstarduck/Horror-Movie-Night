'use strict';
import { filter, sort, applyFilters, genresOf, startYear } from "./filters.mjs";
import { loadMovieIDs, loadWatchedMovieIDs, getMoviesData, createMovieCard, revealRandomMovie } from "./movie-data.mjs";

const swmCheckbox = document.getElementById('show-watched-movies');
const sortSelect = document.getElementById('movie-filter');
const searchInput = document.getElementById('movie-search');
const genreSelect = document.getElementById('genre-filter');
const ratingSelect = document.getElementById('rating-filter');
const runtimeSelect = document.getElementById('runtime-filter');
const decadeSelect = document.getElementById('decade-filter');
const movieStatsH2 = document.getElementById('movie-count');
const resultsCount = document.getElementById('results-count');
const grid = document.getElementById('movies-grid');
const randMovieBtn = document.getElementById('randMovie');
const randMovieResult = document.getElementById('random-movie-result');

// Loaded once when the page opens; filters and sorting reuse this data.
let allMovies = [];
let watchedMovies = [];

function currentCriteria() {
    return {
        search: searchInput.value,
        genre: genreSelect.value,
        minRating: ratingSelect.value,
        maxRuntime: runtimeSelect.value,
        decade: decadeSelect.value,
    };
}

function addOptions(select, values, labelFor = v => v) {
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = labelFor(value);
        select.appendChild(option);
    });
}

// Fill the genre and decade dropdowns with what's actually on the list
function populateFilterOptions() {
    const genres = new Set(allMovies.flatMap(genresOf));
    addOptions(genreSelect, [...genres].sort());

    const decades = new Set(allMovies.map(m => Math.floor(startYear(m) / 10) * 10).filter(Boolean));
    addOptions(decadeSelect, [...decades].sort(), d => `${d}s`);
}

function unwatchedMatchingMovies() {
    const unwatched = filter(allMovies, 'excludeWatchedMovies', watchedMovies);
    return applyFilters(unwatched, currentCriteria());
}

function renderMovies() {
    let movies = allMovies;

    if (!swmCheckbox.checked) {
        movies = filter(movies, 'excludeWatchedMovies', watchedMovies);
    }
    movies = sort(applyFilters(movies, currentCriteria()), sortSelect.value);

    grid.replaceChildren(...movies.map(movie => createMovieCard(movie, watchedMovies)));

    resultsCount.textContent = movies.length === 0
        ? 'No movies match those filters.'
        : `Showing ${movies.length} movie${movies.length === 1 ? '' : 's'}`;
}

async function displayRandMovie() {
    randMovieBtn.disabled = true;
    try {
        const choices = unwatchedMatchingMovies();
        if (choices.length === 0) {
            randMovieResult.innerHTML = '<p>No unwatched movies match your filters.</p>';
            return;
        }
        await revealRandomMovie(randMovieResult, choices);
    } catch (error) {
        console.error("An error occurred while picking a random movie:", error);
        randMovieResult.innerHTML = '<p>Sorry, something went wrong picking a movie. Try again.</p>';
    } finally {
        randMovieBtn.disabled = false;
    }
}

async function init() {
    grid.innerHTML = '<p class="loading">Loading movies…</p>';
    try {
        try {
            watchedMovies = await loadWatchedMovieIDs();
        } catch (error) {
            console.log("There was an error while trying to load watched movies", error);
        }
        const movieIDs = await loadMovieIDs();
        allMovies = await getMoviesData(movieIDs);

        const unwatchedCount = movieIDs.filter(id => !watchedMovies.includes(id)).length;
        movieStatsH2.textContent = `There are currently ${unwatchedCount} unwatched movies and ${watchedMovies.length} watched movies on the list`;

        populateFilterOptions();
        renderMovies();
        randMovieBtn.disabled = false;
    } catch (error) {
        console.error("An error occurred while displaying movies:", error);
        grid.innerHTML = '<p class="loading">Sorry, the movie list couldn\'t be loaded. Try refreshing the page.</p>';
    }
}

[swmCheckbox, sortSelect, genreSelect, ratingSelect, runtimeSelect, decadeSelect]
    .forEach(control => control.addEventListener('change', renderMovies));
searchInput.addEventListener('input', renderMovies);
randMovieBtn.addEventListener('click', displayRandMovie);

init();
