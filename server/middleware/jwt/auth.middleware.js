import jwt from "jsonwebtoken";

const verifyAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Determine if it's an owner or user based on the decoded payload or role field
    // Usually, TurfSpot tokens have a 'role' field
    if (["owner", "coach", "umpire", "admin"].includes(decoded.role)) {
      req.owner = decoded;
      req.owner.id = decoded.id || decoded._id;
    } else {
      req.user = decoded;
      req.user.id = decoded.id || decoded._id;
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Session expired or invalid" });
  }
};

export default verifyAuth;
