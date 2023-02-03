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
    originalTitle: string;
    alternateTitles: AlternateTitle[];
    secondaryYearSourceId: number;
    sizeOnDisk: number;
    status: 'announced' | 'released';
    inCinemas?: string;
    physicalRelease?: string;
    digitalRelease?: string;
    website: string;
    remotePoster?: string;
    year: number;
    hasFile: boolean;
    youTubeTrailerId: string;
    studio: string;
    isAvailable: boolean;
    folderName: string;
    runtime: number;
    cleanTitle: string;
    imdbId?: string;
    titleSlug: string;
    folder: string;
    genres: string[];
    tags: any[];
    added: string;
    ratings: Ratings;
    collection?: Collection;
    popularity: number;
    id: number;
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

export interface AlternateTitle {
    sourceType: 'tmdb';
    movieMetadataId: number;
    title: string;
    sourceId: number;
    votes: number;
    voteCount: number;
}

export interface Collection {
    title: string;
    tmdbId: number;
    monitored: boolean;
    qualityProfileId: number;
    searchOnAdd: boolean;
    minimumAvailability: 'tba';
    images: any[];
    added: string;
    id: number;
}

export interface Image {
    coverType: 'fanart' | 'poster';
    url: string;
    remoteUrl: string;
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
