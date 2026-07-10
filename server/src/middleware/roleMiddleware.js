import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.AUTH.NO_TOKEN,
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: MESSAGES.ROLE.FORBIDDEN,
            });
        }

        next();
    };
};

export default authorizeRoles;