import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createTelemetryRouter } from './src/routes/telemetryRoutes.js';
import F1UdpListener from './src/services/f1UdpListener.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const udpPort = parseInt(process.env.UDP_PORT || '20777', 10);

app.use(cors());
app.use(express.json());

// Initialize F1 UDP Telemetry Listener
const udpListener = new F1UdpListener(udpPort);
udpListener.start();

// Mount telemetry routes
app.use('/api/telemetry', createTelemetryRouter(udpListener));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    udpListenerPort: udpPort
  });
});

app.listen(port, () => {
  console.log(`[Express API] Server running on http://localhost:${port}`);
});
