import AuditLog from "../../models/auditLog.model.js";

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
