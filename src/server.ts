import express from 'express';
import http from 'node:http';
import rootRouter from './routes/root.routes.ts';
import appRouter from './routes/app.routes.ts';
import { redisClient } from './clients/redis.ts';

export class Server {
  private readonly _app: express.Application = express();
  private readonly _port = process.env.PORT || 3000;
  private _server: http.Server | null = null;

  start(): void {
    this._app.use(express.json());

    this._app.use(rootRouter);
    this._app.use(appRouter);

    redisClient
      .connect()
      .then(() => {
        console.log('[Cache] Redis cache connected');

        this._server = this._app.listen(this._port, () => {
          console.log(`Server is running on port: ${this._port}`);
        });
      }).catch((error: any) => {
        console.error(`Error while connecting to Redis cache: ${error}`);
      });
  }

  shutdown(signal: string): void {
    console.log(`${signal} received. Shuting down application...`);

    if (this._server) {
      this._server.close(async () => {
        try {
          // Close cache/database connections, stop pooling sqs messages
          redisClient.destroy();
          process.exit(0);
        } catch (error: any) {
          console.error(`Error while shutting down the application on ${signal} signal:`, error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error(`Forcing shutdown, connections is taking too long to be closed: ${signal} signal`);
        process.exit(1);
      }, 10000);
    }
  }
}