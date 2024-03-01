export interface GetPlaylistSetPlaylistsResponseItem {
  description: string;
  id: string;
  images: {
    url: string;
    width?: number;
    height?: number;
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
