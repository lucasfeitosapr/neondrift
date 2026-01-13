#!/usr/bin/env node
// Minimal telemetry WebSocket server for Neon Drift
// Usage: npm run telemetry-server

const WebSocket = require('ws');
const PORT = process.env.PORT ? Number(process.env.PORT) : 8964;

const wss = new WebSocket.Server({ port: PORT });
console.log(`[telemetry] WebSocket server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('[telemetry] client connected');
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg && msg.type === 'telemetry') {
        // Log some key metrics; in a real setup you could persist or visualize
        console.log(`[telemetry] fps=${msg.fps} particles=${msg.particles} score=${msg.score} inputs=${(msg.activeInputs||[]).join(',')}`);
      } else {
        console.log('[telemetry] message:', data.toString());
      }
    } catch (e) {
      console.warn('[telemetry] invalid JSON:', data.toString());
    }
  });
  ws.on('close', () => console.log('[telemetry] client disconnected'));
});

wss.on('error', (err) => {
  console.error('[telemetry] server error:', err);
});
