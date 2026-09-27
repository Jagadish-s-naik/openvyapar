import { Router, type Request, type Response } from 'express';
import { db } from '../db/connection.js';

export const authRouter = Router();

/**
 * GET /auth/personas
 * List all available personas for fast demo persona switching
 */
authRouter.get('/personas', async (_req: Request, res: Response) => {
  const persons = await db.getAllPersons();
  res.json({
    success: true,
    count: persons.length,
    personas: persons,
  });
});

/**
 * GET /auth/me
 * Returns the active actor context derived from x-openvyapar-actor-id header or query
 */
authRouter.get('/me', (req: Request, res: Response) => {
  const actorId = req.actor?.actorId;
  if (!actorId) {
    return res.json({
      success: true,
      authenticated: false,
      actor_id: null,
      person: null,
      roles: [],
    });
  }

  res.json({
    success: true,
    authenticated: true,
    actor_id: actorId,
    person: req.actor?.person || null,
    roles: req.actor?.roles || [],
  });
});
