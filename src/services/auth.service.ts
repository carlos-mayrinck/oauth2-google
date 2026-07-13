import { OAuth2Client } from 'google-auth-library';
import { AuthenticateClientUsecase } from '../usecases/authenticateClient.usecase.ts';
import { redisClient } from '../clients/redis.ts';
import jwt from 'jsonwebtoken';

export class AuthService {
  private readonly _client: OAuth2Client = new OAuth2Client({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '',
  });

  async execute(scopes: string[]): Promise<{ accessToken: string; expiresIn: number }> {
    const usecase = new AuthenticateClientUsecase(
      this._client,
      process.env.REDIRECT_PORT ?? '',
      process.env.REDIRECT_HOST ?? '',
      process.env.REDIRECT_PATH ?? '',
    );

    const client = await usecase.execute(scopes);

    if (!client.credentials.id_token)
      throw new Error('You must authorize openid scope integration');

    const idToken = await client.verifyIdToken({
      idToken: client.credentials.id_token,
    });

    const userId = idToken.getUserId();
    if (!userId)
      throw new Error('You must authorize openid scope integration');

    await redisClient.set(userId, JSON.stringify(client.credentials));

    const token = jwt.sign({
      userId,
    },
      process.env.JWT_SECRET_KEY ?? 'secretkey', {
      expiresIn: client.credentials.expiry_date ?? 1200,
    });

    return {
      accessToken: token,
      expiresIn: client.credentials.expiry_date ?? 1200,
    };
  }
}