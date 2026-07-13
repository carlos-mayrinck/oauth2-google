import { Router } from 'express';
import { CalendarController } from '../../controllers/calendar.controller.ts';
import { AuthMiddleware } from '../../middlewares/auth.middleware.ts';

const router = Router();

router.get(
  '/calendar/events/list',
  AuthMiddleware.handle,
  CalendarController.list.bind(CalendarController),
);

export default router;