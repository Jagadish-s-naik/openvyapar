import { Router, type Request, type Response } from 'express';
import { db } from '../db/connection.js';
import { seedDatabase } from '../db/seed.js';
import { sendError } from '../utils/errors.js';

export const adminRouter = Router();

/**
 * POST /admin/reset
 * Resets database back to default initial seed fixtures (or empty if ?empty=true)
 */
adminRouter.post('/reset', async (req: Request<{}, {}, {}, { empty?: string }>, res: Response) => {
  try {
    const isEmpty = req.query.empty === 'true';
    if (isEmpty) {
      await db.reset();
    } else {
      await seedDatabase();
    }

    const stats = await db.getStats();

    res.json({
      success: true,
      message: isEmpty
        ? 'Database reset to empty state successfully'
        : 'Database reset to initial demo seed state successfully',
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Failed to process admin request');
  }
});

/**
 * POST /admin/snapshot
 * Creates an instant persistent snapshot of current database state
 */
adminRouter.post('/snapshot', async (req: Request<{}, {}, { name?: string; description?: string }>, res: Response) => {
  try {
    const { name, description } = req.body || {};
    const snapshot = await db.createSnapshot(name, description);

    res.status(201).json({
      success: true,
      message: `Snapshot '${snapshot.name}' created successfully`,
      snapshot,
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Failed to create snapshot');
  }
});

/**
 * GET /admin/snapshots
 * Lists all available state snapshots
 */
adminRouter.get('/snapshots', async (_req: Request, res: Response) => {
  try {
    const snapshots = await db.listSnapshots();
    res.json({
      success: true,
      count: snapshots.length,
      snapshots,
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Failed to list snapshots');
  }
});

/**
 * POST /admin/restore
 * Restores database state from a specified snapshot ID or name
 */
adminRouter.post('/restore', async (req: Request<{}, {}, { snapshot_id?: string; name?: string }>, res: Response) => {
  try {
    const target = req.body.snapshot_id || req.body.name;
    if (!target) {
      return sendError(res, 400, 'snapshot_id or name is required in request body');
    }

    const result = await db.restoreSnapshot(target);
    if (!result.success || !result.snapshot) {
      return sendError(res, 404, result.error || `Snapshot '${target}' not found`);
    }

    const stats = await db.getStats();

    res.json({
      success: true,
      message: `Snapshot '${result.snapshot.name}' restored successfully`,
      snapshot: result.snapshot,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Failed to restore snapshot');
  }
});

/**
 * DELETE /admin/snapshot/:id
 * Deletes a saved snapshot
 */
adminRouter.delete('/snapshot/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const target = req.params.id;
    const deleted = await db.deleteSnapshot(target);
    if (!deleted) {
      return sendError(res, 404, `Snapshot '${target}' not found`);
    }

    res.json({
      success: true,
      message: `Snapshot '${target}' deleted successfully`,
    });
  } catch (err: unknown) {
    sendError(res, 500, (err as Error).message || 'Failed to delete snapshot');
  }
});
