-- Optimized Indexing Strategy for Kridaz Platform
-- Objectives: Eliminate full collection scans on high-traffic modules.
-- Safety: Uses CREATE INDEX CONCURRENTLY to avoid locking tables in production.
-- NOTE: CONCURRENTLY cannot be executed inside a transaction block.

-- 1. Booking Module Optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Booking_turfId_status_playStartTime_idx" ON "Booking"("turfId", "status", "playStartTime");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Booking_orderId_idx" ON "Booking"("orderId");

-- 2. Reels Module Optimizations
-- Replace standard status/creatorId indexes with compound ones for pagination and filtering
DROP INDEX IF EXISTS "Reel_status_idx";
DROP INDEX IF EXISTS "Reel_creatorId_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reel_status_isPrivate_id_idx" ON "Reel"("status", "isPrivate", "id" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reel_creatorId_status_idx" ON "Reel"("creatorId", "status");

-- 3. Chat & Communication Optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Chat_parentCommunityId_idx" ON "Chat"("parentCommunityId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChatParticipant_chatId_idx" ON "ChatParticipant"("chatId");

-- 4. Wallet & Transaction Optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WalletTransaction_razorpayOrderId_idx" ON "WalletTransaction"("razorpayOrderId");

-- 5. Partner & Withdrawal Optimizations
DROP INDEX IF EXISTS "WithdrawalRequest_ownerId_idx";
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WithdrawalRequest_ownerId_createdAt_idx" ON "WithdrawalRequest"("ownerId", "createdAt" DESC);

-- 6. Turf & Search Optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Turf_slug_idx" ON "Turf"("slug");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Turf_status_isActive_state_city_idx" ON "Turf"("status", "isActive", "state", "city");

-- 7. Team & Spatial Proximity Optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Team_geoPoint_idx" ON "Team" USING GIST ("geoPoint");

