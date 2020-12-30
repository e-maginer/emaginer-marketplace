import User from '../models/user.js';
import createError from 'http-errors';
import debugLib from 'debug';
import cryptoRandomString from 'crypto-random-string';
import SecretCode from '../models/secretCode.js';
import emailService from "../utils/emailService.js";

const debug = debugLib('controller:user');
//todo use express-validator package in our controllers to validate and sanitize input from users in addition to validator in the model
// (https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/forms)
/**
 * test function
 * @param {Object} req
 * @param {Object} res
 * @author Tristan Muhader
 */
// export an anonymous object literal exposing all the controller API functions. This instance is cached by ES module system
// and shared across all clients
// This is convenient and encourage the single-responsibility principle and
// expose only one clear interface, which provides an entry point for the module.
export default {
    //todo manage transaction in this function to rollback saved user in case if an error in email sending for example
    async createUser(req, res, next) {
        const session = await User.startSession();
        session.startTransaction();
        try {
            const user = new User(req.body);
            const existingUser = await User.findOne({email: user.email});
            if (existingUser instanceof User)
                throw createError(400, 'The provided email is registered already.');
            let savedUser = await user.save({session});
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
            e.errors = {
                message: e.message
            };
            next(e);
        }
    },

    async verifyUser(req, res, next) {
        const session = await User.startSession();
        session.startTransaction();
        try {
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
            e.errors = {
                message: e.message
            };
            next(e);
        }


    }
}