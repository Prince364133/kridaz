import jwt from "jsonwebtoken";
<<<<<<< Updated upstream
import { UnauthorizedError, ForbiddenError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
=======
import { isTokenVersionStale } from "../../utils/tokenVersion.js";
>>>>>>> Stashed changes

const verifyAdminToken = async (req, res, next) => {
  const header = req.headers.authorization;
  let token = null;

<<<<<<< Updated upstream
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
=======
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

    if (await isTokenVersionStale(decoded)) {
      return res.status(401).json({ success: false, code: "TOKEN_REVOKED", message: "Session revoked. Please log in again." });
    }

    // Support both {id, role} and {user: {role}} or similar structures
    const role = decoded.role || (decoded.user && decoded.user.role);
    
    if (role?.toUpperCase() !== "ADMIN") {
      console.warn("Admin Access Denied. Token Role:", role);
      return res.status(403).json({ success: false, message: "Unauthorized: Admin privileges required" });
    }

    // Normalize for controllers expecting req.user or specific id/role placement
    const normalizedUser = {
      ...decoded,
      id: decoded.id || (decoded.user && decoded.user.id),
      role: role
    };

    req.admin = normalizedUser;
    req.user = normalizedUser;
    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "TOKEN_EXPIRED" });
    }
    return res.status(403).json({ success: false, message: "Session expired or invalid token", error: "Invalid or expired token" });
>>>>>>> Stashed changes
  }

  if (!token) {
    return next(new UnauthorizedError("No token provided", { code: "NO_TOKEN" }));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getAccessSecret());
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Session expired", { code: "TOKEN_EXPIRED" }));
    }
    return next(new UnauthorizedError("Invalid token", { code: "INVALID_TOKEN" }));
  }

  if (!decoded) {
    return next(new UnauthorizedError("Invalid token", { code: "INVALID_TOKEN" }));
  }

  // Support both {id, role} and {user: {role}} or similar structures
  const role = decoded.role || (decoded.user && decoded.user.role);

  if (role?.toUpperCase() !== "ADMIN") {
    return next(new ForbiddenError(
      "Admin privileges required",
      { code: "FORBIDDEN_ROLE", required: ["ADMIN"], actual: role || null }
    ));
  }

  // Normalize for controllers expecting req.user or specific id/role placement
  const normalizedUser = {
    ...decoded,
    id: decoded.id || (decoded.user && decoded.user.id),
    role: role
  };

  req.admin = normalizedUser;
  req.user = normalizedUser;
  next();
};

export default verifyAdminToken;
