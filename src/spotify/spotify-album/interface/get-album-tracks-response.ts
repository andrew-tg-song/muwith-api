export interface GetAlbumTracksResponse {
  items: [
    {
      artists: {
        id: string;
        name: string;
      }[];
      disc_number: number;
      duration_ms: number;
      explicit: boolean;
      id: string;
      name: string;
      track_number: number;
    },
  ];
  total: number;
}
