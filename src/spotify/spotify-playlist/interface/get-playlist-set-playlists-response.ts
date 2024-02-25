export interface GetPlaylistSetPlaylistsResponseItem {
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
}

export interface GetPlaylistSetPlaylistsResponse {
  playlists: {
    items: GetPlaylistSetPlaylistsResponseItem[];
    total: number;
  };
}
