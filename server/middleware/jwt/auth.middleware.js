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
    const isBusinessRole = ["admin", "venu_owners", "coach", "umpire", "streamer", "scorer"].some(r => role.includes(r));
    


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

/**
 * Middleware to restrict access based on user roles.
 * @param {...string} roles - Allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden: No user role found" });
    }
    
    const userRole = req.user.role.toLowerCase();
    // Support exact role match. One intentional alias: 'limited_umpire' IS an umpire role.
    const hasRole = roles.some(r => {
      const targetRole = r.toLowerCase();
      // Exact match
      if (userRole === targetRole) return true;
      // Intentional product alias: limited_umpire satisfies umpire role checks
      if (targetRole === 'umpire' && userRole === 'limited_umpire') return true;
      return false;
    });
    
    if (!hasRole) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted to ${roles.join(", ")} roles` 
      });
    }
    
    next();
  };
};

export default verifyAuth;
