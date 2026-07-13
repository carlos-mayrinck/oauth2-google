import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.ts';

export class AuthController {
  static async authorize(req: Request, res: Response): Promise<any> {
    const { scope } = req.query;
    // scope is a comma-separated list of scopes, e.g. 'openid,https://www.googleapis.com/auth/drive.metadata.readonly,https://www.googleapis.com/auth/calendar.readonly'
    try {
      const service = new AuthService();

      const result = await service.execute(String(scope).split(','));

      return res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}