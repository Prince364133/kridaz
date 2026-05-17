import { Emitter } from "@socket.io/redis-emitter";
import { pubClient } from "./redis.js";
import logger from "../utils/logger.js";

let emitter;

/**
 * Initializes and returns a Socket.io Redis Emitter
 * This allows broadcasting events from separate processes (like workers) 
 * through the main Socket.io instance via Redis.
 */
export const getEmitter = () => {
  if (!emitter) {
    if (!pubClient) {
      logger.warn("[EMITTER] Redis pubClient not initialized. Emitter unavailable.");
      return null;
    }
    emitter = new Emitter(pubClient);
    logger.info("[EMITTER] Redis-backed Socket.io Emitter initialized.");
  }
  return emitter;
};

export default getEmitter;
