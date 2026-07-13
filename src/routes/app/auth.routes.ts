import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller.ts';

const router = Router();

router.get('/oauth/google', AuthController.authorize.bind(AuthController));

export default router;