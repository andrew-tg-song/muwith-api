export interface GetAlbumResponse {
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
    id: string;
    name: string;
  }[];
  tracks: {
    total: number;
    items: {
      artists: {
        id: string;
        name: string;
      }[];
      disc_number: number;
      track_number: number;
      duration_ms: number;
      explicit: boolean;
      id: string;
      name: string;
    }[];
  };
  copyrights: {
    text: string;
    type: 'C' | 'P';
  }[];
  genres: string[];
  label: string;
  popularity: number;
}
