import jwt from "jsonwebtoken";

export function generateUserToken(userId) {
    return jwt.sign({ id: userId, user: userId, role: "user" }, process.env.JWT_SECRET, {
         expiresIn: "1d"
    })
}

export const generateOwnerToken = (owner) => {
    const role = owner.role || "owner";
    const id = owner._id || owner.id;
    return jwt.sign({ id, user: id, role }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    })
}