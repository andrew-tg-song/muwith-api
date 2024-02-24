# M U W I T H
## Music Application REST API
This is a RESTful API built with NestJS that provides music-related functionalities based on Spotify and YouTube APIs.

## Introduction
The Music Application REST API is designed to provide a comprehensive set of endpoints for accessing music data from Spotify and YouTube. It allows users to search for songs, artists, albums, playlists, and more, as well as retrieve information about them.

## Project Overview
The project is built using NestJS, a progressive Node.js framework for building efficient and scalable server-side applications. It leverages the power of TypeScript and provides a robust set of features for building modern APIs.

## Features
Search for songs, artists, albums, playlists, and more on Spotify.
Retrieve detailed information about songs, artists, albums, and playlists.
Get recommendations based on user's preferences.
Access music metadata such as track name, artist name, album name, release date, and more.
Usage
To use the Music Application REST API, you will need to have an API key for both Spotify and YouTube. You can obtain these keys by signing up for the respective developer accounts. Once you have the keys, you can make requests to the API endpoints using an HTTP client of your choice.

**Please note that this project is intended for educational purposes only and must not be used for commercial purposes.**

## Contributing
Contributions are welcome! If you have any ideas or suggestions for improving the Music Application REST API, feel free to open a pull request or issue.

## Documents
- Korean: https://muwith-api-docs.vercel.app/start-here/getting-started/

## License
The Music Application REST API is licensed under the MIT license. See the LICENSE file for more information.

## Implementation List
- [x] Authentication
  - [x] JWT Guard
  - [x] Sign-up with Google OAuth
  - [ ] Sign-up with Kakao OAuth
  - [ ] Sign-up internally
  - [ ] Authorization system
  - [x] Documentation
- [x] Track
  - [x] Youtube link of the track (with headless browser)
  - [ ] Youtube API integration
  - [ ] Documentation
- [x] Album
  - [ ] Documentation
- [x] Artist
  - [ ] Documentation
- [x] Playlist
  - [x] Playlist set
  - [ ] Documentation
- [ ] Concurrent request
- [ ] Search
  - [ ] Documentation
- [ ] Users
  - [ ] Documentation
- [ ] Recommendation tracks
  - [ ] Documentation
- [ ] Transaction
- [ ] Performance Optimization
  - [ ] Indexing
  - [ ] Improve expensive queries 
