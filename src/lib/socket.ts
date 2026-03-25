import { io } from "socket.io-client";

const url = import.meta.env.API_URL
const socket = io(url); // Point to your server

export const ObjSync = {
  generateCode: async (): Promise<string> => {
    // 1. Capture high-precision time + random salt
    const time = Date.now().toString();
    const perf = performance.now().toString();
    const salt = Math.random().toString(36);
    const input = `${time}-${perf}-${salt}`;

    // 2. Generate SHA-256 Hash
    const msgUint8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 3. Complex Sharding & Extraction
    // We take shards from specific positions to ensure high entropy
    const shard1 = hashHex.substring(0, 4);
    const shard2 = hashHex.substring(
      hashHex.length / 2,
      hashHex.length / 2 + 4,
    );
    const shard3 = hashHex.substring(hashHex.length - 4);

    // 4. Combine and format (e.g., "ABCD-1234")
    const combined = parseInt(shard1 + shard2 + shard3, 16);
    const finalCode = combined.toString(36).toUpperCase().substring(0, 8);

    // Insert a hyphen in the middle for readability
    return `${finalCode.slice(0, 4)}-${finalCode.slice(4)}`;
  },
  
  emit: (event: string, data: any) => {
    socket.emit(event, data);
  },

  on: (event: string, callback: (data: any) => void) => {
    socket.on(event, callback);
  },

  off: (event: string) => {
    socket.off(event);
  },
};
