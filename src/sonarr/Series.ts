export interface Series {
    id?: number;
    title: string;
    sortTitle: string;
    status: Status;
    ended: boolean;
    overview: string;
    network?: string;
    airTime?: string;
    images: Image[];
    seasons: Season[];
    year: number;
    qualityProfileId: number;
    languageProfileId: number;
    seasonFolder: boolean;
    monitored: boolean;
    useSceneNumbering: boolean;
    runtime: number;
    tvdbId: number;
    tvRageId: number;
    tvMazeId: number;
    firstAired?: string;
    seriesType: SeriesType;
    cleanTitle: string;
    imdbId?: string;
    titleSlug: string;
    folder: string;
    genres: string[];
    tags: any[];
    added: string;
    ratings: Ratings;
    statistics: Statistics;
    remotePoster?: string;
    certification?: string;
    nextAiring?: string;
    previousAiring?: string;
}

export interface Image {
    coverType: CoverType;
    url: string;
    remoteUrl: string;
}

export enum CoverType {
    Banner = 'banner',
    Fanart = 'fanart',
    Poster = 'poster',
}

export interface Ratings {
    votes: number;
    value: number;
}

export interface Season {
    seasonNumber: number;
    monitored: boolean;
}

export enum SeriesType {
    Standard = 'standard',
}

export interface Statistics {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
}

export enum Status {
    Continuing = 'continuing',
    Ended = 'ended',
    Upcoming = 'upcoming',
}

export interface AddOptions {
    //TODO check for more valid options
    searchForMissingEpisodes: true;
    searchForCutoffUnmetEpisodes: false;
    ignoreEpisodesWithFiles?: false;
    ignoreEpisodesWithoutFiles?: false;
    monitor: 'all';
}
