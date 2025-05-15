'use strict';

// const paragraph = document.getElementById('paragraph');
// const imdbId = 'tt0079714'
// const insidious = document.getElementById('insidious');

// const request = new XMLHttpRequest();
// request.open('GET',`http://www.omdbapi.com/?i=${imdbId}&apikey=f6a4ead9`);
// // request.send();

// request.addEventListener('load',function () {
//     const data = JSON.parse(this.responseText);
//     console.log(data);
//     insidious.innerHTML = 
//         `<img src="${data.Poster}" alt=${data.Title} (${data.Year})>
//         <h3>${data.Title} (${data.Year})</h3>
//         <h3>Rating: ${data.Rated}    Runtime: ${data.Runtime})</h3>`;
// });


// const MOVIE_IDS = ["tt0111161", "tt0068646", "tt0071562"];
const API_KEY = 'f6a4ead9';
const CACHE_KEY = 'cachedMovies';

async function loadMovieIDs() {
    const response = await fetch('static/movies.json');
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
        if (cachedMovies[id]) {
            moviesData.push(cachedMovies[id]);
            console.log(cachedMovies[id])
        } else {
            const data = await fetchMovieData(id);
            console.log(data)
            moviesData.push(data);
            cachedMovies[id] = data;
        }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedMovies));
    return moviesData;
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const poster = document.createElement('a');
    poster.href = `https://www.imdb.com/title/${movie.imdbID}/`;
    poster.rel = "noopener noreferrer";
    poster.target = "_blank";
    poster.innerHTML = `<img src="${movie.Poster}" alt="${movie.Title}" loading ="lazy">`;
    card.appendChild(poster);

    const info = document.createElement('div');
    info.className = 'card-info';
    info.innerHTML = `
        <h3>${movie.Title} (${movie.Year})</h3>
        <p>Rating: ${movie.Rated}</p>
        <p>Runtime: ${movie.Runtime}</p>
    `;
    card.appendChild(info);

    return card;
}

async function displayMovies() {
    try {
        const movieIDs = await loadMovieIDs();
        let movies = await getMoviesData(movieIDs);

        // Sort the movies alphabetically by the Title
        movies.sort((a, b) => a.Title.localeCompare(b.Title));

        const grid = document.getElementById('movies-grid');
        grid.innerHTML = ''; // Clear existing movies

        // Generate and display movie cards
        movies.forEach(movie => {
            const card = createMovieCard(movie);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("An error occurred while displaying movies:", error);
    }
    // const movieIDs = await loadMovieIDs();
    // const movies = await getMoviesData(movieIDs);
    // const grid = document.getElementById('movies-grid');
    // grid.innerHTML = ''; // Clear existing movies

    // movies.forEach(movie => {
    //     const card = createMovieCard(movie);
    //     grid.appendChild(card);
    // });
}

function sortList(containerId) {
    const listContainer = document.getElementByc(containerId);
    const listItems = Array.from(listContainer.querySelectorAll('div.movie-card'));
    
    listItems.sort((a, b) => {
        const textA = a.textContent.trim().toLowerCase();
        const textB = b.textContent.trim().toLowerCase();
        return textA.localeCompare(textB);
    });
    
    listItems.forEach(item => listContainer.appendChild(item));
}

displayMovies();
sortList('movies-grid');