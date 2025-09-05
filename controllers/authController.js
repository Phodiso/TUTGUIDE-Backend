import { registerUserService, verifyUserService, loginUserService} from '../services/authServices.js'

export const registerUser = (req, res) => {
    const { fullName, email, password, role } = req.body;
    registerUserService(fullName, email,password, role, (error, result) => {
        if(error){
            return res.status(400).json(error);
        }

        res.status(200).json(result);
    });
};

export const verifyUser = (req, res) => {
    const {email, code} = req.body;
    verifyUserService(email, code, (error, result) => {
        if(error){
            return res.status(400).json(error);
        }
        res.status(200).json(result);
    });
};

export const loginUser = (req, res) => {
    const {email, password} = req.body;
    loginUserService(email, password, (error, result) => {
        if(error){
            return res.status(400).json(error);
        }

        res.status(200).json(result);
    });
};