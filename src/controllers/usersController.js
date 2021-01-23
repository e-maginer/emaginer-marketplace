import User from '../models/user.js';
import createError from 'http-errors';
import debugLib from 'debug';
import cryptoRandomString from 'crypto-random-string';
import SecretCode from '../models/secretCode.js';
import emailService from "../utils/emailService.js";
import {formattedValidationResult} from "./controllerHelpers.js";
import {body, param, validationResult} from "express-validator";

const debug = debugLib('controller:user');


// export an anonymous object literal exposing all the controller API functions. This instance is cached by ES module system
// and shared across all clients
// This is convenient and encourage the single-responsibility principle and
// expose only one clear interface, which provides an entry point for the module.
export default {
    /**
     * validate function: validate and sanitize the input provided by the user in the request (body or params)
     * @param {Object} req
     * @param {Object} res
     * @author Tristan Muhader
     * the error message has the JSON format:
     * err{
  "status": 400,
  "stack": "error stacktrace",
  "errors": {
    "globalMessage": "The provided details is registered already." //in case of error message not associated with any path/parameter
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
    validate(method) {
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
        }
    },

    async createUser(req, res, next) {
        const session = await User.startSession();
        session.startTransaction();
        try {
            const validationError = formattedValidationResult(req);
            if (!validationError.isEmpty()) {
                const error = createError(400);
                // .mapped() gets the first validation error of each failed field in the form of an object. it returns
                // an object where the keys are the field names, and the values are the validation errors
                error.errors = validationError.mapped();
                throw error;
            }
            const user = new User(req.body);
            const existingUser = await User.findOne({email: user.email});
            if (existingUser instanceof User) {
                const error = createError(400);
                error.errors = {
                    'email': 'The provided email is registered already.'
                }
                throw error;
            }
            let savedUser = await user.save({ session });
            //${req.protocol}://${req.hostname}${req.originalUrl}
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            //todo create a function to return a secretcode
            const code = cryptoRandomString({length: 6, type: 'url-safe'});
            let url = `${baseUrl}/users/verify-account/${savedUser._id}/${code}`;
            /*const activationCode = new SecretCode({email: savedUser.email,code});
            activationCode.$session(session);
            await activationCode.save();*/
            await SecretCode.create([{email: savedUser.email, code}], {session});
            await emailService.sendEmail(savedUser.email, emailService.templates.REGISTRATION, {activationUrl: url});
            await session.commitTransaction();
            session.endSession();
            res.status(201).send({savedUser});
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            debug(`error in user controller ${e.message} `)
            // For errors returned from asynchronous functions invoked by route handlers and middleware, you must pass
            // them to the next() function, where Express or your custom error handler will catch and process them
            if (!(e.errors instanceof Object))
                e.errors = {
                    globalMessage: e.message
                };
            next(e);
        }
    },

    async verifyUser(req, res, next) {
        const session = await User.startSession();
        session.startTransaction();
        try {
            const validationError = formattedValidationResult(req);
            if (!validationError.isEmpty()) {
                const error = createError(400);
                error.errors = validationError.mapped();
                throw error;
            }
            const filter = {_id: req.params.userID};
            const update = {updatedAt: new Date()};
            const opts = {session};
            // using findOneAndUpdate to enable a "write Lock" to avoid concurrent transactions from modifying the user document
            const existingUser = await User.findOneAndUpdate(filter, update, opts);
            if (!(existingUser instanceof User))
                throw createError(401, 'the provided user does not exist');
            if (typeof existingUser.status !== 'string' || existingUser.status !== User.Statuses.NOT_INITIALIZED)
                throw createError(401, 'incorrect user status');
            // If you get a Mongoose document from findOne() or find() using a session, the document will keep
            // a reference to the session and use that session for save(). To get/set the session associated with
            // a given document, use doc.$session().
            const existingCode = await SecretCode.findOne({
                email: existingUser.email,
                code: req.params.code
            }, null, {session});
            if (!(existingCode instanceof SecretCode))
                throw createError(401, 'the provided code does not exist, please generate a new code');
            // update user status to active
            existingUser.status = User.Statuses.ACTIVE;
            await existingUser.save();
            // delete all codes related to user
            await SecretCode.deleteMany({
                email: existingUser.email,
            }, {session});
            // send confirmation email
            await emailService.sendEmail(existingUser.email, emailService.templates.ACTIVATION);
            await session.commitTransaction();
            res.send({existingUser});
        } catch (e) {
            await session.abortTransaction();
            session.endSession();
            debug(`error in user controller ${e.message} `)
            // For errors returned from asynchronous functions invoked by route handlers and middleware, you must pass
            // them to the next() function, where Express or your custom error handler will catch and process them
            if (!(e.errors instanceof Object))
                e.errors = {
                    globalMessage: e.message
                };
            next(e);
        }


    }
}