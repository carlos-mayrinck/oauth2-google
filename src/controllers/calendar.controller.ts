import type { Request, Response } from 'express';
import { CalendarService } from '../services/calendar.service.ts';

export class CalendarController {
  static async list(req: Request, res: Response): Promise<any> {
    const { calendarId } = req.query;
    if (!calendarId || !calendarId.length)
      return res.status(400).json({ error: 'Required param is missing "calendarId"' });

    try {
      const service = new CalendarService();

      const result = await service.listEvents(
        req.user.userId,
        String(calendarId),
      );

      return res.status(200).json(result);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: error.message ?? 'Internal Server Error' });
    }
  }
}