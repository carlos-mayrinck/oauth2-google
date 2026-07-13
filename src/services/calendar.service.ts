import calendar, { calendar_v3 } from '@googleapis/calendar';
import { redisClient } from '../clients/redis.ts';
import { OAuth2Client } from 'google-auth-library';

export class CalendarService {
  async listEvents(clientId: string, calendarId: string): Promise<calendar_v3.Schema$Event[]> {
    try {
      const credentials = await redisClient.get(clientId);

      if (!credentials)
        throw new Error(
          'There is no valid credentials stored for the given user. Please authenticate before requesting protected content',
        );

      const oauth2Client = new OAuth2Client({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
        credentials: JSON.parse(credentials),
      });

      const client = calendar.calendar({
        version: 'v3',
        auth: oauth2Client as any, // Type assertion to any to bypass type incompatibility
      });

      const res = await client.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return res.data.items ?? [];
    } catch (error: any) {
      throw new Error(`Could not list events: ${error.message}`);
    }
  }
}