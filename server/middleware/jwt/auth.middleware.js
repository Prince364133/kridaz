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

    const role = decoded.role?.toLowerCase() || "";
    
    // Check if it's a partner/business role
    const isBusinessRole = ["owner", "coach", "umpire", "admin"].some(r => role.includes(r));

    // Unified Identity: Always use 'id' as User ID, and 'ownerId' for business document reference
    const normalizedUser = {
      id: decoded.id,
      userId: decoded.id, // Alias for clarity
      ownerId: decoded.ownerId,
      role: role,
      ...decoded
    };

    // Attach to request
    req.user = normalizedUser;
    
    if (isBusinessRole) {
      req.owner = normalizedUser;
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Session expired or invalid" });
  }
};

export default verifyAuth;
