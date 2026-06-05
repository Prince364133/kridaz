import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";
<<<<<<< Updated upstream
import { UnauthorizedError, ForbiddenError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";

const ALLOWED_ROLES = ["VENUE_OWNER", "OWNER", "COACH", "UMPIRE", "ADMIN", "STREAMER", "SCORER"];
=======
import { isTokenVersionStale } from "../../utils/tokenVersion.js";
>>>>>>> Stashed changes

const verifyOwnerToken = async (req, res, next) => {
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
      return res
        .status(401)
        .json({ success: false, message: "No token, authorization denied" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Invalid token , authorization denied",
        });
    }

    if (await isTokenVersionStale(decoded)) {
      return res.status(401).json({ success: false, code: "TOKEN_REVOKED", message: "Session revoked. Please log in again." });
    }

    // Support both {id, role} and {user: {role}} or similar structures
    let role = decoded.role?.toUpperCase() || "";
    const allowedRoles = ["VENUE_OWNER", "OWNER", "COACH", "UMPIRE", "ADMIN", "STREAMER", "SCORER"];
    let isAllowed = allowedRoles.includes(role);

    // Fallback: If role in token is not allowed, check the database for the current role
    // This handles cases where the user's role was upgraded but their token is stale.
    if (!isAllowed && decoded.id) {
        logger.info(`DEBUG: Token role '${role}' for user ${decoded.id} not allowed. Checking database...`);
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { role: true }
        });
        if (dbUser && dbUser.role) {
            const dbRole = dbUser.role.toUpperCase();
            if (allowedRoles.includes(dbRole)) {
                logger.info(`DEBUG: Found valid partner role '${dbRole}' in database. Allowing access.`);
                role = dbRole;
                isAllowed = true;
            }
        }
    }

    if (!isAllowed) {
        logger.warn(`DEBUG: Unauthorized role access attempt. Role in token: '${role}', User ID: ${decoded.id}`);
        return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    const normalizedUser = {
      ...decoded,
      id: decoded.id,
      userId: decoded.id, // Alias for clarity
      ownerId: decoded.ownerId,
      role: role.toLowerCase() // Keep it lowercase for downstream compatibility if expected
    };

    req.owner = normalizedUser;
    req.user = normalizedUser;
    
    next();
  } catch (err) {
    logger.error("Partner Middleware Error", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "TOKEN_EXPIRED" });
    }
    return res.status(403).json({ success: false, message: "Unauthorized: Session invalid" });
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

  let role = decoded.role?.toUpperCase() || "";
  let isAllowed = ALLOWED_ROLES.includes(role);

  // Fallback: token role may be stale (user upgraded since token issued).
  // Re-check the database before rejecting.
  if (!isAllowed && decoded.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { role: true }
      });
      if (dbUser && dbUser.role) {
        const dbRole = dbUser.role.toUpperCase();
        if (ALLOWED_ROLES.includes(dbRole)) {
          role = dbRole;
          isAllowed = true;
        }
      }
    } catch (dbErr) {
      logger.warn("[owner.middleware] DB role check failed", { error: dbErr.message });
    }
  }

  if (!isAllowed) {
    return next(new ForbiddenError(
      `Access restricted to partner roles`,
      { code: "FORBIDDEN_ROLE", required: ALLOWED_ROLES, actual: role || null }
    ));
  }

  const normalizedUser = {
    ...decoded,
    id: decoded.id,
    userId: decoded.id, // Alias for clarity
    ownerId: decoded.ownerId,
    role: role.toLowerCase() // Keep it lowercase for downstream compatibility if expected
  };

  req.owner = normalizedUser;
  req.user = normalizedUser;

  next();
};

export default verifyOwnerToken;
