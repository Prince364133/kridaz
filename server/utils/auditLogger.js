import AuditLog from "../models/auditLog.model.js";

/**
 * Log an administrative action to the database.
 * @param {Object} req - Express request object
 * @param {String} action - Name of the action (e.g. "APPROVE_PROFESSIONAL")
 * @param {String} module - Module name (e.g. "USER_MANAGEMENT")
 * @param {String} targetId - ID of the affected resource
 * @param {Object} details - Additional metadata
 */
export const logAdminAction = async (req, action, module, targetId = null, details = {}) => {
  try {
    const adminId = req.user.id; // Assuming req.user is populated by admin middleware
    
    await AuditLog.create({
      admin: adminId,
      action,
      module,
      targetId,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error("FAILED_TO_LOG_AUDIT_ACTION:", error);
  }
};
