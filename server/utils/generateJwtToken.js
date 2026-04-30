import jwt from "jsonwebtoken";

export function generateUserToken(user) {
    return jwt.sign({user}, process.env.JWT_SECRET,{
         expiresIn: "1d"
    })
}

export const generateOwnerToken = (owner) => {
    const role = owner.role;
    const id = owner._id || owner.id;
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    })
}