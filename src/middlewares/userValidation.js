import {body, param} from "express-validator";
import User from "../models/user.js";
/**
 * validate function: validate and sanitize the input provided by the user in the request (body or params)
 * @param {Object} req
 * @param {Object} res
 * @author Tristan Muhader
 * the error message has the JSON format:
 * err{
   // status inherited from parent prototype
            "status": 400,
            "stack": "error stacktrace",
  //this is what is returned to the consumer
            "errors": {
                   "globalMessage": "no email template configured" //in case of error message not associated with any path/parameter like system errors "Server error occurred!"
                    or
                     "name": {
                    "msg": "name is invalid",
                    "value": "",
                    "param": "name"
                    },
                    "password": {
                        "msg": "please enter a valid password",
                        "value": "",
                        "param": "password"
                     }
            }
         }
 */
const validate =  (method) => {
    switch (method) {
        case 'createUser': {
            // return an array of middleware validator methods (Validation Chain) to the routing method.
            // The router method takes a single callback, as many callback arguments as you want, or an array of
            // callback functions. Each function is part of the middleware chain, and will be called in the order it is
            // added to the chain (unless a preceding function completes the request).
            return [
                body('name', 'name is invalid')
                    .exists()
                    .withMessage('Please enter your name')
                    .trim()
                    .isLength({min:2, max:100})
                    .escape(),
                body('userName','userName is invalid')
                    .exists()
                    .withMessage('Please enter your username')
                    .trim()
                    .isLength({min:2, max:100})
                    .escape(),
                body('password', 'password is invalid')
                    .exists()
                    .withMessage('Please enter your password')
                    .isStrongPassword()
                    .withMessage('The password must be 8+ chars long and contain a number, an uppercase and special character'),
                body('email', 'Email is invalid')
                    .exists()
                    .withMessage('Please enter your email')
                    .normalizeEmail()
                    .isEmail(),
                body('confirmPassword','Please re-enter your password')
                    .exists()
                    .withMessage('Please re-enter your passwor')
                    .custom((value, { req })=>{
                        if(value !== req.body.password) {
                            throw new Error('Password confirmation does not match password');
                        }
                        return true;
                    }),
                body('gender', 'please select gender')
                    .optional({checkFalsy: true})
                    // return an array with the values of the Genders object (object.values()) and check if the value provided is within that array
                    .isIn(Object.values(User.Genders)),
                body('dob', 'Date of birth is invalid')
                    .optional({checkFalsy: true})
                    .isISO8601()
                    .toDate()
            ]
        }

        case 'verifyUser': {
            return [
                param('userID', 'Invalid URL')
                    .exists()
                    .isMongoId(),
                param('code' , 'Invalid URL')
                    .exists()
            ]
        }

        case 'resendCode': {
            return [
                param('userName')
                    .exists()
                    .withMessage('Please enter your userName')
            ]
        }

        case 'login': {
            return [
                body('userName')
                    .exists()
                    .withMessage('Please enter your username')
                    .escape(),
                body('password')
                    .exists()
                    .withMessage('please enter your password')
            ]
        }
        case 'delete':{
            return[
                param('userID', 'Invalid URL')
                    .exists()
                    .isMongoId(),
            ]
        }
        case 'forgotPassword': {
            return [
                body('userName')
                    .exists()
                    .withMessage('Please enter your username')
                    .trim()
                    .isLength({min:2,max:100})
                    .escape()
            ]
        }
        case 'resetPassword': {
            return[
                param('code','Invalid URL')
                    .exists()
            ]
        }
    }
}

export default validate;