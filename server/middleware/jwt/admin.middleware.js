import jwt from "jsonwebtoken";

const verifyAdminToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(403).json({ success: false, message: "Invalid token, authorization denied" });
    }

    // Support both {id, role} and {user: {role}} or similar structures
    const role = decoded.role || (decoded.user && decoded.user.role);
    
    if (role !== "admin") {
      console.warn("Admin Access Denied. Token Role:", role, "Full Payload:", decoded);
      return res.status(403).json({ success: false, message: "Unauthorized: Admin privileges required" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error.message);
    return res.status(401).json({ message: "Session expired or invalid token", error: error.message });
  }
};

export default verifyAdminToken;
