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
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    // Attach the decoded user information to the request
    req.user = decoded;
    next();
  } catch (err) {
    // Internal server error
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default verifyUserToken;
