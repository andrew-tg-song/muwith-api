export interface GetArtistResponse {
  followers: {
    total: number;
  };
  genres: string[];
  id: string;
  images: {
    url: string;
  }[];
  name: string;
  popularity: number;
}
