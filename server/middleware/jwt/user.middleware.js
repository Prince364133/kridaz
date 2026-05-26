import jwt from "jsonwebtoken";

const verifyUserToken = async (req, res, next) => {
  try {
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
    // Attach the decoded user information to the request with normalization
    req.user = {
      ...decoded,
      id: decoded.id || (decoded.user && decoded.user.id)
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "TOKEN_EXPIRED" });
    }
    // Return 403 on verification error (malformed or tampered token)
    return res.status(403).json({ success: false, message: "Unauthorized: Session invalid" });
  }
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
