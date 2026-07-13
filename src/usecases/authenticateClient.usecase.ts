import { OAuth2Client } from 'google-auth-library';
import http from 'node:http';
import url from 'node:url';
import open from 'open'
import destroyer from 'server-destroy';

export class AuthenticateClientUsecase {

  constructor(
    private readonly client: OAuth2Client,
    private readonly redirectPort: string,
    private readonly redirectHost: string,
    private readonly redirectPath: string,
  ) { }

  async execute(scopes: string[]): Promise<OAuth2Client> {
    return new Promise((resolve, reject) => {
      let scope = '';

      scopes.forEach(val => {
        if (!val) return;
        if (scope.length) scope += ' ';
        scope += val;
      });

      const authorizationUrl = this.client.generateAuthUrl({
        scope,
        include_granted_scopes: true,
        response_type: 'code',
        access_type: 'offline',
      });

      const server = http
        .createServer(async (req, res) => {
          try {
            if (req.url && req.url.indexOf(this.redirectPath) > -1) {
              const querystring = new url.URL(req.url, this.redirectHost).searchParams;
              const code = querystring.get('code');

              if (!code)
                throw new Error('Authorization code is missing');

              res.end('Successfully authenticated! You can close this window now.');

              server.close((error?: Error) => {
                if (error) return console.error(`Error while closing the auth callback server:`, error);
                console.log('Auth callback server closed successfully');
              });

              const accessToken = await this.client.getToken(code)
              this.client.setCredentials(accessToken.tokens);

              resolve(this.client);
            }
          } catch (error: any) {
            console.error(error);
            reject(error);
          }
        })
        .listen(this.redirectPort, () => {
          open(authorizationUrl, { wait: false }).then(cp => cp.unref());
        });
      destroyer(server);
    });
  }
}