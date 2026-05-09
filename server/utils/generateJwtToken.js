import jwt from "jsonwebtoken";

export function generateUserToken(userId) {
    return jwt.sign({ id: userId, user: userId, role: "user" }, process.env.JWT_SECRET, {
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