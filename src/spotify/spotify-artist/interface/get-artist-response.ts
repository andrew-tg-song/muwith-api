export interface GetArtistResponse {
  followers: {
    total: number;
  };
  genres: string[];
  id: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
  name: string;
  popularity: number;
}
