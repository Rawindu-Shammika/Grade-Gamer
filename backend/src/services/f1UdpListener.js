import dgram from 'dgram';

class F1UdpListener {
  constructor(port = 20777) {
    this.port = port;
    this.server = dgram.createSocket('udp4');
    this.latestTelemetry = null;

    this.server.on('error', (err) => {
      console.error(`UDP Server error:\n${err.stack}`);
      this.server.close();
    });

    this.server.on('message', (msg, rinfo) => {
      try {
        // Parse basic header or log packet size. F1 telemetry packets contain various data structures.
        // We'll extract some mock metadata for simple telemetry processing:
        const packetSize = msg.length;
        const timestamp = new Date().toISOString();
        
        // Save parsed frame reference
        this.latestTelemetry = {
          packetSize,
          timestamp,
          sender: `${rinfo.address}:${rinfo.port}`,
          // Simulated metrics based on buffer content length or random walk
          speed: Math.floor(Math.random() * 120) + 180, // mph / kmh
          gear: Math.floor(Math.random() * 8) + 1,
          engineRPM: Math.floor(Math.random() * 3000) + 9000,
          throttle: Math.floor(Math.random() * 100),
          brake: Math.floor(Math.random() * 100)
        };

        console.log(`[F1 UDP] Received ${packetSize} bytes from ${rinfo.address}:${rinfo.port}`);
      } catch (err) {
        console.error('Error processing UDP packet:', err);
      }
    });

    this.server.on('listening', () => {
      const address = this.server.address();
      console.log(`[F1 UDP] Socket listening on ${address.address}:${address.port}`);
    });
  }

  start() {
    this.server.bind(this.port);
  }

  stop() {
    this.server.close();
  }

  getLatestTelemetry() {
    return this.latestTelemetry || {
      status: 'No packet received yet',
      speed: 0,
      gear: 0,
      engineRPM: 0,
      throttle: 0,
      brake: 0,
      timestamp: new Date().toISOString()
    };
  }
}

export default F1UdpListener;
