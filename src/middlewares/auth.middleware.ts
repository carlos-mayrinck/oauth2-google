import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export class AuthMiddleware {
  static handle(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorization } = req.headers;

      if (!authorization)
        throw new Error('Authorization header is missing');

      const [type, token] = authorization.split(' ');

      if (!token || !type || type.toLowerCase() !== 'bearer')
        throw new Error('Invalid token sent');

      try {
        jwt.verify(
          token,
          process.env.JWT_SECRET_KEY ?? 'secretkey',
        );
      } catch (error: any) {
        throw new Error('Invalid token sent');
      }

      const decode = jwt.decode(token) as {
        userId: string;
        iat: number;
        exp: number;
      };

      req.user = {
        userId: decode.userId,
      }

      return next();
    } catch (error: any) {
      return res.status(401).json({ error: error.message })
    }
  }
}