#!/usr/bin/env node
import { networkInterfaces } from "node:os";

const nets = networkInterfaces();
const ips = [];
for (const entries of Object.values(nets)) {
  for (const net of entries || []) {
    if (net.family === "IPv4" && !net.internal) ips.push(net.address);
  }
}

const ip = ips[0] || "YOUR-MAC-IP";

console.log(`
┌─────────────────────────────────────────────────────────┐
│  BiyeFlow — test on your iPhone (NO deploy needed)      │
├─────────────────────────────────────────────────────────┤
│  1. Mac + iPhone on the SAME Wi‑Fi                      │
│  2. Keep this terminal running                          │
│  3. On iPhone Safari open:                              │
│                                                         │
│     http://${ip}:5173/people/guests
│                                                         │
│  Desktop phone frame:                                   │
│     http://localhost:5173/mobile-preview.html           │
│                                                         │
│  API (optional, same Wi‑Fi):                            │
│     npm run dev:api   → then use port 8788              │
│                                                         │
│  Deploy ONLY when you say the phone build looks good.   │
└─────────────────────────────────────────────────────────┘
`);
