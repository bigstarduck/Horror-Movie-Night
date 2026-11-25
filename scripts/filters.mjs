export function filter(moviesList,filterType,filterList=[]) {

    if (filterType === 'excludeWatchedMovies') {
        return moviesList.filter(movie => !filterList.includes(movie.imdbID));
    }else {
        console.log('You tried to filter with a filter that doesn\'t exist');
        return moviesList;
    }
}

// OMDb gives runtimes like "105 min" and years like "1978" (or "2011–2018" for series)
export function runtimeMinutes(movie) {
    return parseInt(movie.Runtime, 10) || 0;
}

export function startYear(movie) {
    return parseInt(movie.Year, 10) || 0;
}

export function genresOf(movie) {
    if (!movie.Genre || movie.Genre === 'N/A') return [];
    return movie.Genre.split(',').map(g => g.trim());
}

// Applies every filter on the page. Any criteria left empty is ignored.
// criteria: { search, genre, minRating, maxRuntime, decade }
export function applyFilters(moviesList, criteria) {
    const search = (criteria.search || '').trim().toLowerCase();

    return moviesList.filter(movie => {
        if (search && !movie.Title.toLowerCase().includes(search)) return false;

        if (criteria.genre && !genresOf(movie).includes(criteria.genre)) return false;

        if (criteria.minRating) {
            const rating = parseFloat(movie.imdbRating);
            if (!(rating >= Number(criteria.minRating))) return false;
        }

        if (criteria.maxRuntime) {
            const minutes = runtimeMinutes(movie);
            if (!minutes || minutes > Number(criteria.maxRuntime)) return false;
        }

        if (criteria.decade) {
            const decade = Number(criteria.decade);
            const year = startYear(movie);
            if (year < decade || year >= decade + 10) return false;
        }

        return true;
    });
}

export function sort(moviesList,sortType) {

    if (sortType === 'title') {
        moviesList.sort((a, b) => a.Title.localeCompare(b.Title));
    }else if (sortType === 'runtime') {
        moviesList.sort((a, b) => runtimeMinutes(a) - runtimeMinutes(b));
    }else if (sortType === 'year') {
        moviesList.sort((a, b) => startYear(b) - startYear(a));
    }else if (sortType === 'rating') {
        moviesList.sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0));
    }else {
        console.log('You tried to sort with an option that doesn\'t exist');
    }
    return moviesList;
}
