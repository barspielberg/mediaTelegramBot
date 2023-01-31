export interface Movie {
    title: string;
    sortTitle: string;
    tmdbId: number;
    images: Image[];
    overview: string;
    monitored: boolean;
    rootFolderPath: string;
    qualityProfileId: number;
    searchOnAdd: boolean;
    minimumAvailability: string;
    movies: MovieElement[];
    id: number;
}

export interface Image {
    coverType: 'fanart' | 'poster';
    url: string;
}

export interface MovieElement {
    tmdbId: number;
    imdbId: string;
    title: string;
    cleanTitle: string;
    sortTitle: string;
    overview: string;
    runtime: number;
    images: Image[];
    year: number;
    ratings: Ratings;
    genres: string[];
    folder: string;
}

export interface Ratings {
    imdb?: Imdb;
    tmdb: Imdb;
    metacritic?: Imdb;
    rottenTomatoes?: Imdb;
}

export interface Imdb {
    votes: number;
    value: number;
    type: 'user';
}
