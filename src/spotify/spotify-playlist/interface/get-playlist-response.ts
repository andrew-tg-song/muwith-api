export interface GetPlaylistResponse {
  id: string;
  name: string;
  public: boolean;
  description: string;
  followers: {
    total: number;
  };
  images: {
    url: string;
    width?: number;
    height?: number;
  }[];
  owner: {
    display_name?: string;
    id: string;
  };
  tracks: {
    items: {
      added_at?: string;
      track: {
        explicit: boolean;
        episode: boolean;
        type: 'track' | 'episode';
        album: {
          album_type: 'album' | 'single' | 'compilation';
          total_tracks: number;
          id: string;
          images: {
            url: string;
          }[];
          name: string;
          release_date: string;
          release_date_precision: string;
          artists: {
            id: string;
            name: string;
          }[];
        };
        artists: {
          id: string;
          name: string;
        }[];
        disc_number: number;
        track_number: number;
        duration_ms: number;
        id: string;
        name: string;
        popularity: number;
      };
    }[];
  };
}
