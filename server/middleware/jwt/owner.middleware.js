import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";

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
    let role = decoded.role?.toLowerCase() || "";
    let isAllowed = ["venu_owners", "coach", "umpire", "admin", "streamer", "scorer"].some(r => role.includes(r));

    // Fallback: If role in token is not allowed, check the database for the current role
    // This handles cases where the user's role was upgraded but their token is stale.
    if (!isAllowed && decoded.id) {
        console.log(`DEBUG: Token role '${role}' for user ${decoded.id} not allowed. Checking database...`);
        const dbUser = await User.findById(decoded.id).select("role");
        if (dbUser && dbUser.role) {
            const dbRole = dbUser.role.toLowerCase();
            const isDbAllowed = ["venu_owners", "coach", "umpire", "admin", "streamer", "scorer"].some(r => dbRole.includes(r));
            if (isDbAllowed) {
                console.log(`DEBUG: Found valid partner role '${dbRole}' in database. Allowing access.`);
                role = dbRole;
                isAllowed = true;
            }
        }
    }

    if (!isAllowed) {
        console.warn(`DEBUG: Unauthorized role access attempt. Role in token: '${role}', User ID: ${decoded.id}`);
        return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    const normalizedUser = {
      ...decoded,
      id: decoded.id,
      userId: decoded.id, // Alias for clarity
      ownerId: decoded.ownerId,
      role: role
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
