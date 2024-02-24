export interface GetPlaylistSetPlaylistsResponse {
  playlists: {
    items: [
      {
        description: string;
        id: string;
        images: {
          url: string;
        }[];
        name: string;
        owner: {
          display_name: string;
          id: string;
        };
      },
    ];
    total: number;
  };
}
