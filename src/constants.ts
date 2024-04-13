export enum ObjectType {
  TRACK = 'track',
  ALBUM = 'album',
  ARTIST = 'artist',
  PLAYLIST = 'playlist',
  USER = 'user',
}

export enum ListenableObjectType {
  TRACK = 'track',
  ALBUM = 'album',
  ARTIST = 'artist',
  PLAYLIST = 'playlist',
}

export const IS_PRODUCTION_MODE = process.env.NODE_ENV === 'production';
