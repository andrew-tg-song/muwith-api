import { GetArtistAlbumsResponse } from 'src/spotify/spotify-artist/interface/get-artist-albums-response';
import { GetArtistResponse } from 'src/spotify/spotify-artist/interface/get-artist-response';
import { GetPlaylistSetPlaylistsResponseItem } from 'src/spotify/spotify-playlist/interface/get-playlist-set-playlists-response';
import { GetTrackResponse } from 'src/spotify/spotify-track/interface/get-track-response';

export interface SearchResponse {
  tracks?: {
    items: GetTrackResponse[];
    total: number;
    total_page?: number;
  };
  albums?: GetArtistAlbumsResponse & { total_page?: number };
  artists?: {
    items: GetArtistResponse[];
    total: number;
    total_page?: number;
  };
  playlists?: {
    items: (GetPlaylistSetPlaylistsResponseItem & { tracks: { total: number } })[];
    total: number;
    total_page?: number;
  };
}
