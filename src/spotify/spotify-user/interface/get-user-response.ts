export interface GetUserResponse {
  display_name?: string;
  followers: {
    total: number;
  };
  id: string;
  images: {
    url: string;
    height?: number;
    width?: number;
  }[];
}
