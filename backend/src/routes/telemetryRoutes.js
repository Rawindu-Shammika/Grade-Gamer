import express from 'express';
import { getLatestTelemetry, syncTelemetryToDatabase } from '../controllers/telemetryController.js';

export const createTelemetryRouter = (udpListener) => {
  const router = express.Router();

  router.get('/latest', getLatestTelemetry(udpListener));
  router.post('/sync', syncTelemetryToDatabase);

  return router;
};

export default createTelemetryRouter;
