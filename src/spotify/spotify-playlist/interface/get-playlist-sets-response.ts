export interface GetPlaylistSetsResponse {
  categories: {
    items: {
      id: string;
      icons: {
        url: string;
      }[];
      name: string;
    }[];
    total: number;
  };
}
