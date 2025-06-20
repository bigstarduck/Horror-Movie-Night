export function filter(moviesList,filterType,filterList=[]) {
    
    if (filterType === 'excludeWatchedMovies') {
        let filteredList = [];
        moviesList.forEach(movie => {
            if (!filterList.includes(movie.imdbID)) {
                filteredList.push(movie);
            }
        });
        return filteredList;
    }else {
        console.log('You tried to filter with a filter that doesn\'t exist');        
    }
}

export function sort(moviesList,sortType) {    
    
    if (sortType === 'title') {
        moviesList.sort((a, b) => a.Title.localeCompare(b.Title));

        return moviesList;
    }else if (sortType === 'runtime') {
        moviesList.sort((a, b) => b.runtime - a.runtime);

        return moviesList;
    }else if (sortType === 'year') {
        moviesList.sort((a, b) => b.Year - a.Year);

        return moviesList;
    }else {
        console.log('You tried to sort with an option that doesn\'t exist');        
    }
}