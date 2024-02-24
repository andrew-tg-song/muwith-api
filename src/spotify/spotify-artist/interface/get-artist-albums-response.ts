export interface GetArtistAlbumsResponse {
  items: {
    album_type: 'album' | 'single' | 'compilation';
    total_tracks: number;
    id: string;
    images: {
      url: string;
    }[];
    name: string;
    release_date: string;
    release_date_precision: string;
  }[];
  total: number;
}
