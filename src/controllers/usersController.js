import User from '../models/user.js';
import createError from 'http-errors';
import debugLib from 'debug';
import cryptoRandomString from 'crypto-random-string';
import SecretCode from '../models/secretCode.js';
import emailService from "../utils/emailService.js";
import {formattedValidationResult} from "./controllerHelpers.js";
import {body, param } from "express-validator";
import createLogger from "../utils/logger.js";
//todo replace debug with Winston debug commands
const debug = debugLib('controller:user');


// export an anonymous object literal exposing all the controller API functions. This instance is cached by ES module system
// and shared across all clients.
// When we import this default object, most module bundlers will consider the entire object being used and they won't be able
// to eliminate any unused code from the exported functionality. This is fine in this case, as the consumers (Routers)
// of the controllers are expected to use most of their APIs
export default {
    /**
     *
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
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
            //manually retrieving the relevant parameters sent by the user to avoid allowing the user to manipulate auto-computed parameters like status and role
            const user = new User({
                name: req.body.name,
                userName: req.body.userName,
                email: req.body.email,
                password: req.body.password,
                gender: req.body.gender,
                dob: req.body.dob
            });
            // logging the request params
            // To use delete on a Mongoose path (password), you would need to convert the model document into a plain JavaScript object
            // by calling toObject
            const loggedUser = user.toObject();
            delete loggedUser.password;
            const logger = createLogger('server.endpoint.post.register.userController.createUser');
            logger.info({
                message: 'enter createUser()',
                remoteAddress: req.connection.remoteAddress,
                body: JSON.stringify(loggedUser),
                correlation: session.id
            });
            //@todo we can use here Upsert to save the user in one query rather than calling findOne() then save(). User.updateOne({email:user.email},user,{upsert:true}) see page 46 in Mongo book
            const existingUser = await User.findOne({email: user.email});
            if (existingUser instanceof User) {
                const error = createError(400);
                error.errors = {
                    //@todo looks like this error format not aligned with the validation error (see formattedValidationResult shall be aligned with this error.errors from Mongoose)
                    //"name": {
                    //         "msg": "name is invalid",
                    //         "value": "",
                    //         "param": "name"
                    //     },
                    'email': 'The provided email is registered already.'
                }
                throw error;
            }
            // todo delete the password from the returned response object
            let savedUser = await user.save({ session });
            //${req.protocol}://${req.hostname}${req.originalUrl}
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            //todo create a function to return a secretcode
            const code = cryptoRandomString({length: 6, type: 'url-safe'});
            let url = `${baseUrl}/users/verify-account/${savedUser._id}/${code}`;
            /*const activationCode = new SecretCode({email: savedUser.email,code});
            // To get/set the session associated with a given document, use doc.$session().
            activationCode.$session(session);
            await activationCode.save();*/
            await SecretCode.create([{email: savedUser.email, code}], {session});
            await emailService.sendEmail(savedUser.email, emailService.templates.REGISTRATION, {activationUrl: url});
            await session.commitTransaction();
            session.endSession();
            logger.info({
                message: 'closing createUser()',
                remoteAddress: req.connection.remoteAddress,
                correlation: session.id
            })
            res.status(201).send({savedUser});
        } catch (e) {
            await session.abortTransaction();
            // add the session ID to the error so it can be logged
            e.correlation= session.id;
            // passing the label to be logged by the app.js module when creating the logger
            e.label= 'server.endpoint.post.register.userController.createUser';
            session.endSession();
            debug(`error in user controller ${e.message} `)
            if (!(e.errors instanceof Object))
                e.errors = {
                    globalMessage: e.message,
                };
            // For errors returned from asynchronous functions invoked by route handlers and middleware, you must pass
            // them to the next() function, where Express or your custom error handler will catch and process them
            next(e);
        }
    },

    /**
     *
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     */
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
            let filter = {_id: req.params.userID};
            const update = {updatedAt: new Date()};
            /*new:true allows to to return the document as it is after the MongoDB server applied the findOneAndUpdate ( By default, findOneAndUpdate(), findOneAndDelete(), and findOneAndReplace() return the
             document as it was before the MongoDB server applied the update.
            built-in validator are by default verified on save() but not on the update queries. but it can if you enable
            the runValidators option on your query.*/
            const opts = {session, new:true, runValidators:true};
            // using findOneAndUpdate to enable a "write Lock" (by updating the updatedAt property) to avoid concurrent
            // transactions from modifying the user document after being read inside the trx
            //@todo we can use here Upsert to update the user in one query rather than calling findOneAndUpdate() then save(). User.updateOne({email:user.email},user,{upsert:true}) see page 46 in Mongo book
            const existingUser = await User.findOneAndUpdate(filter, update, opts);
            if (!(existingUser instanceof User))
                throw createError(401, 'the provided user does not exist');
            if (typeof existingUser.status !== 'string' || existingUser.status !== User.Statuses.NOT_INITIALIZED)
                throw createError(401, 'incorrect user status');
            // If you get a Mongoose document from findOne() or find() using a session, the document will keep
            // a reference to the session and use that session for save(). To get/set the session associated with
            // a given document, use doc.$session().
            filter = {
                email: existingUser.email,
                code: req.params.code
            }
            const existingCode = await SecretCode.findOne(filter, null, {session});
            if (!(existingCode instanceof SecretCode))
                throw createError(401, 'the provided code does not exist, please generate a new code');

            // logging the request params
            const logger = createLogger('server.endpoint.post.verify-account.userController.verifyUser');
            logger.info({
                message: 'enter verifyUser()',
                remoteAddress: req.connection.remoteAddress,
                body: JSON.stringify(filter),
                correlation: session.id
            })

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
           // logging end function
            logger.info({
                message: 'closing verifyUser()',
                remoteAddress: req.connection.remoteAddress,
                correlation: session.id
            })
            res.send({existingUser});
        } catch (e) {
            await session.abortTransaction();
            // add the session ID to the error so it can be logged
            e.correlation= session.id;
            e.label= 'server.endpoint.post.verify-account.userController.verifyUser';
            session.endSession();
            debug(`error in user controller ${e.message} `)
            // For errors returned from asynchronous functions invoked by route handlers and middleware, you must pass
            // them to the next() function, where Express or your custom error handler will catch and process them
            if (!(e.errors instanceof Object))
                e.errors = {
                    globalMessage: e.message,
                };
            next(e);
        }

    },

    async resendCode(req,res,next) {
      try{
          const validationError =  formattedValidationResult(req);
          if(!validationError.isEmpty()){
              const error = createError(400);
              error.errors = validationError.mapped();
              throw error;
          }
          const email = req.params.email;
          const logger = createLogger('server.endpoint.get.resend-code.userController.resendCode')
          logger.info({
              message: 'enter resendCode()',
              remoteAddress: req.connection.remoteAddress,
              body: JSON.stringify(email)
          })
          const filter = {
              email,
              status:User.Statuses.NOT_INITIALIZED
          }
          const existingUser = await User.findOne(filter)
          if(!(existingUser instanceof User)){
              throw createError(401, 'the provided user does not exist or in invalid state');
          }
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const code = cryptoRandomString({length: 6, type: 'url-safe'});
          let url = `${baseUrl}/users/verify-account/${existingUser._id}/${code}`;
          await SecretCode.deleteMany({email});
          await SecretCode.create({code,email});
          await emailService.sendEmail(email, emailService.templates.RESEND_CODE, {activationUrl: url});
          logger.info({
              message: 'closing resendCode()',
              remoteAddress: req.connection.remoteAddress,
          })
          res.send();
      }catch (e) {
          e.label= 'server.endpoint.get.resend-code.userController.resendCode';
          debug(`error in user controller ${e.message} `)
          if (!(e.errors instanceof Object))
              e.errors = {
                  globalMessage: e.message,
              };
          next(e);
      }

    }
}