import { Router } from 'express';
import authRouter from './app/auth.routes.ts'
import calendarRouter from './app/calendar.routes.ts'

const router = Router();

router.use('/', authRouter);
router.use('/', calendarRouter);

export default router;