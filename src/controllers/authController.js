import {requestValidationResult} from "./controllerHelpers.js";
import createError from 'http-errors';
import User from '../models/user.js';
import {signToken,verifyToken} from "../utils/tokenService.js";
import debugLib from "debug";
import createLogger from "../utils/logger.js";
const debug = debugLib('controller:auth');

    /**
     *
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     * 1)Error validation (userName and PWD sent in request)
     2)get userName and PWD from the request and check if exist
     3)hash the received PWD and check if PWD match
     4)Generates JWT Token
     */
 export async function login(req, res, next) {
        const session = await User.startSession();
        try {
            requestValidationResult(req);
            const {userName, password} = req.body;
            const logger = createLogger('server.endpoint.post.register.authController.login');
            logger.info({
                message: 'enter login',
                remoteAddress: req.connection.remoteAddress,
                body:JSON.stringify({userName, password}),
                correlation: session.id
            })
            /*
            Sometimes you want to omit certain felds from a query result. MongoDB supports projections, which let you select which fields to include or exclude from the result documents.
            Mongoose queries have a select() function that let you add a projection to your query. A projection is either inclusive or exclusive. That means either all the values in the object must be truthy, or they must all be falsy
            You can define default projections on your schema.For example, you may want to exclude a user's email from query results by default. If you want to include email without excluding all other fields, use .select('+email').
            (Mongoose 53)
             */
            const user = await User.findOne({userName}).select('+password');
            if(!(user instanceof User) || !(await User.validatePassword(password,user.password)) ) {
                throw createError(401,'User or Password is incorrect');
            }
            const token = await signToken({id:user._id});
            logger.info({
                message: 'exit login',
                remoteAddress: req.connection.remoteAddress,
                body:JSON.stringify({userName, password}),
                correlation: session.id
            })
            res.send({token});

        } catch (e) {
            e.label= 'server.endpoint.post.register.authController.login';
            e.correlation= session.id;
            debug(`error in auth controller ${e.message} `)
            if (!(e.errors instanceof Object))
                e.errors = {
                    globalMessage: e.message,
                };
            // For errors returned from asynchronous functions invoked by route handlers and middleware, you must pass
            // them to the next() function, where Express or your custom error handler will catch and process them
            next(e);
        }finally {
            session.endSession();
        }
    }
    /**
     *
     * @param req
     * @param res
     * @param next
     * @returns {Promise<void>}
     * 1)fetch the token from the header and ensure it exists
     * 2)Verify token
     * 3)check user still exist. we search for this user._id who has still the passed token (perhaps he logged out and this token does not exist anymore or the user has been deleted)
     * 4)check user did not change his password after obtaining the token. if yes, logout the user
     */
export async function validateToken(req, res, next) {
        const session = await User.startSession();
        try {
            let token = req.headers.authorization;
            if (typeof token === 'string' && token.startsWith('Bearer')) {
                token = token.split(' ')[1];
            } else {
                throw createError(401,'you are not logged in');
            }
            const decoded = await verifyToken(token);
            const freshUser = await User.findById(decoded.id);
            if(!(freshUser instanceof User)){
                throw createError(401,'user does not exist');
            }
            if(freshUser.isChangedPWDAfter(decoded.iat))
                throw createError(401,'user recently changed password. Please re-login ');
            req.user = freshUser;
            next();
        }catch (e) {
            if (!(e.errors instanceof Object))
                e.errors = {
                    globalMessage: e.message,
                };
            // For errors returned from asynchronous functions invoked by route handlers and middleware, you must pass
            // them to the next() function, where Express or your custom error handler will catch and process them
            next(e);
        }finally {
            session.endSession();
        }
    }

export function authorize(...roles) {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            let error = createError(403);
            error.errors = {
                globalMessage: 'Access not allowed',
            };
            next(error);
        }
        next();
    }
}



