'use strict';
import { filter, sort } from "./filters.mjs";

const API_KEY = 'f6a4ead9';
const CACHE_KEY = 'cachedMovies';
const swmCheckbox = document.getElementById('show-watched-movies');
const sortSelect = document.getElementById('movie-filter');

async function loadMovieIDs() {
    const response = await fetch('data/movies.json');
    return await response.json();
}

async function loadWatchedMovieIDs() {
    const response = await fetch('data/watched.json');
    return await response.json();
}

async function fetchMovieData(imdbID) {
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`);
    console.log("New Move");
    return await response.json();
}

async function getMoviesData(movieIDs) {
    const cachedMovies = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    const moviesData = [];

    for (const id of movieIDs) {
        if (cachedMovies[id] && cachedMovies[id].Poster && cachedMovies[id].Poster !== "N/A") {
            moviesData.push(cachedMovies[id]);
        } else {
            const data = await fetchMovieData(id);
            moviesData.push(data);
            cachedMovies[id] = data;
        }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedMovies));
    return moviesData;
}

function createMovieCard(movie,watchedMovies) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const poster = document.createElement('a');
    poster.href = `https://www.imdb.com/title/${movie.imdbID}/`;
    poster.rel = "noopener noreferrer";
    poster.target = "_blank";
    poster.innerHTML = `<img src="${movie.Poster}" alt="${movie.Title}" loading = "lazy">`;
    card.appendChild(poster);
    
    const info = document.createElement('div');
    info.className = 'card-info';
    info.innerHTML = `
    <h3>${movie.Title} (${movie.Year})</h3>
    <p>Rating: ${movie.Rated}</p>
    <p>Runtime: ${movie.Runtime}</p>
    `;

    if (Object.values(watchedMovies).includes(movie.imdbID)) {
        card.classList.add('watched');
    }

    card.appendChild(info);

    return card;
}

async function displayMovies() {
    let watchedMovies = []
    try {
        watchedMovies = await loadWatchedMovieIDs();        
    } catch (error) {
        console.log("There was an error while trying to load watched movies",error);        
    }
    try {
        const movieIDs = await loadMovieIDs();
        let movies = await getMoviesData(movieIDs);

        // Filter out the watched moves if checkbox is unchecked
        if (!swmCheckbox.checked) {
            movies = filter(movies,'excludeWatchedMovies',watchedMovies);
        }

        // Sort the movies       
        sort(movies, sortSelect.value);

        const grid = document.getElementById('movies-grid');
        grid.innerHTML = ''; // Clear existing movies

        // Generate and display movie cards
        movies.forEach(movie => {
            const card = createMovieCard(movie,watchedMovies);
            grid.appendChild(card);
        });
    } 
    catch (error) {
        console.error("An error occurred while displaying movies:", error);
    }
}

sortSelect.addEventListener('change', (event) => {
    displayMovies();
});

swmCheckbox.addEventListener('change', (event) => {
    displayMovies();
});

displayMovies();
