import jwt from "jsonwebtoken";
<<<<<<< Updated upstream
import { UnauthorizedError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
=======
import { isTokenVersionStale } from "../../utils/tokenVersion.js";
>>>>>>> Stashed changes

const verifyUserToken = async (req, res, next) => {
  const header = req.headers.authorization;
  let token = null;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return next(new UnauthorizedError("No token provided", { code: "NO_TOKEN" }));
  }

  let decoded;
  try {
<<<<<<< Updated upstream
    decoded = jwt.verify(token, getAccessSecret());
=======
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      // No token provided
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      // Invalid token
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    if (await isTokenVersionStale(decoded)) {
      return res.status(401).json({ success: false, code: "TOKEN_REVOKED", message: "Session revoked. Please log in again." });
    }
    // Attach the decoded user information to the request with normalization
    req.user = {
      ...decoded,
      id: decoded.id || (decoded.user && decoded.user.id)
    };
    next();
>>>>>>> Stashed changes
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Session expired", { code: "TOKEN_EXPIRED" }));
    }
    return next(new UnauthorizedError("Invalid token", { code: "INVALID_TOKEN" }));
  }

  if (!decoded) {
    return next(new UnauthorizedError("Invalid token", { code: "INVALID_TOKEN" }));
  }

  // Attach the decoded user information to the request with normalization
  req.user = {
    ...decoded,
    id: decoded.id || (decoded.user && decoded.user.id)
  };
  next();
};

export const optionalUserAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return next(); // Proceed without req.user
    }

<<<<<<< Updated upstream
    const decoded = jwt.verify(token, getAccessSecret());
    if (decoded) {
=======
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && !(await isTokenVersionStale(decoded))) {
>>>>>>> Stashed changes
      req.user = {
        ...decoded,
        id: decoded.id || (decoded.user && decoded.user.id)
      };
    }
    next();
  } catch (err) {
    // If token is invalid/expired, still proceed as unauthenticated
    next();
  }
};

export default verifyUserToken;
