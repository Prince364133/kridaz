import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";

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

    const decoded = jwt.verify(token, getAccessSecret());
    if (decoded) {
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
