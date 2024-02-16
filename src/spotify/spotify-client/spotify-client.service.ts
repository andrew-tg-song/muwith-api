import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as qs from 'qs';

interface SpotifyCredentialIdentity {
  clientId: string;
  clientSecret: string;
}

interface SpotifyCredential {
  accessToken: string;
  expiresAt: number;
}

@Injectable()
export class SpotifyClientService {
  private readonly credentialIdentity: SpotifyCredentialIdentity;
  private credential: SpotifyCredential;

  constructor(private readonly configService: ConfigService) {
    this.credentialIdentity = {
      clientId: configService.get<string>('SPOTIFY_CLIENT_ID'),
      clientSecret: configService.get<string>('SPOTIFY_CLIENT_SECRET'),
    };
    this.credential = {
      accessToken: '',
      expiresAt: 0,
    };
  }

  private async validateCredential() {
    if (this.credential.expiresAt > Date.now()) {
      return;
    }

    // https://developer.spotify.com/documentation/web-api/tutorials/getting-started
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'client_credentials',
        client_id: this.credentialIdentity.clientId,
        client_secret: this.credentialIdentity.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const spotifyTokenResponse: {
      access_token: string;
      expires_in: number;
    } = response.data;

    this.credential = {
      accessToken: spotifyTokenResponse.access_token,
      expiresAt: Date.now() + spotifyTokenResponse.expires_in * 1000 - 60 * 1000,
    };
  }

  async get<T>(url: string, params: Record<string, string>) {
    await this.validateCredential();
    const response = await axios.get(url, {
      baseURL: 'https://api.spotify.com/v1',
      headers: {
        Authorization: `Bearer ${this.credential.accessToken}`,
      },
      params,
    });
    return response.data as T;
  }
}
