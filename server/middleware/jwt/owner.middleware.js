import jwt from "jsonwebtoken";

const verifyOwnerToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

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

    // Support both {id, role} and {user: {role}} or similar structures
    const role = decoded.role?.toLowerCase() || "";
    const isAllowed = ["owner", "coach", "umpire", "admin"].some(r => role.includes(r));

    if (!isAllowed) {
        return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    // Normalize for controllers expecting req.user or req.owner
    const normalizedUser = {
      id: decoded.id,
      userId: decoded.id, // Alias for clarity
      ownerId: decoded.ownerId,
      role: role,
      ...decoded
    };

    req.owner = normalizedUser;
    req.user = normalizedUser;
    
    next();
  } catch (err) {
    console.error("Partner Middleware Error:", err.message);
    return res.status(401).json({ success: false, message: "Unauthorized: " + err.message });
  }
};

export default verifyOwnerToken;
