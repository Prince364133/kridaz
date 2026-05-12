import jwt from "jsonwebtoken";

export function generateUserToken(userId, role = "user", ownerId = null) {
    return jwt.sign({ 
        id: userId, 
        user: userId, 
        role: role,
        ownerId: ownerId 
    }, process.env.JWT_SECRET, {
         expiresIn: "30d"
    })
}

export const generateOwnerToken = (userId, role, ownerId) => {
    return jwt.sign({ 
        id: userId, 
        user: userId, 
        ownerId: ownerId, 
        role: role || "owner" 
    }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })
}