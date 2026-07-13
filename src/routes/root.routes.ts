import { Router } from 'express';
import { redisClient } from '../clients/redis.ts';

const router = Router();

router.get('/', (req, res) => {
  return res.send('Ok!');
});

router.get('/cache/clear', async (req, res) => {
  try {
    await redisClient.flushDb();
    return res.send('Done');
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
})

export default router;