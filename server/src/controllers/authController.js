import bcrypt from "bcrypt";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.AUTH.FIELDS_REQUIRED,
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: MESSAGES.AUTH.USER_EXISTS,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: MESSAGES.AUTH.REGISTERED,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            },
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.AUTH.EMAIL_PASSWORD_REQUIRED,
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.AUTH.INVALID_CREDENTIALS,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.AUTH.INVALID_CREDENTIALS,
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.AUTH.LOGGED_IN,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            },
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export { registerUser, loginUser };