export interface GetArtistResponse {
  followers: {
    total: number;
  };
  genres: string[];
  id: string;
  images: {
    url: string;
    width?: number;
    height?: number;
  }[];
  name: string;
  popularity: number;
}
