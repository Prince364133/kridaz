import express from "express";
import { getAdminDashboardData } from "../admin.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: High-level platform statistics and reporting for admins
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get administrative dashboard overview
 *     tags: [Admin Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Consolidated stats for users, turfs, bookings, and revenue
 */
router.get("/", getAdminDashboardData);

export default router;
