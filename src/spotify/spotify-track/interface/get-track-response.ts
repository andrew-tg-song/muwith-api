export interface GetTrackResponse {
  album: {
    album_type: 'album' | 'single' | 'compilation';
    total_tracks: number;
    id: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
    name: string;
    release_date: string;
    release_date_precision: string;
    artists: {
      href: string;
      id: string;
      name: string;
    }[];
  };
  artists: {
    followers: {
      total: number;
    };
    genres: string[];
    id: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
    name: string;
    popularity: number;
  }[];
  id: string;
  name: string;
  explicit: boolean; // Whether or not the track has explicit lyrics (true = yes it does; false = no it does not OR unknown).
  disc_number: number;
  track_number: number;
  duration_ms: number; // in milliseconds
  popularity: number;
}
