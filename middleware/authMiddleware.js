import jwt from 'jsonwebtoken';

export const authorize = (roles = []) => (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status().json({ error: "Unauthorized"});
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(roles.length && !roles.includes(decoded.role)){
            return res.status(403).json({ error: "Access denied"});
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token"});
    }
};