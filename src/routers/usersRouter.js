import createError from 'http-errors';
// import {createRequire} from 'module';
// const require = createRequire(import.meta.url);
import express from 'express';
import usersController from '../controllers/usersController.js';
import validate from '../middlewares/userValidation.js';
import { body } from 'express-validator';
import * as authController from "../controllers/authController.js";
import User from '../models/user.js'
//@todo check difference between express.Router(); and new express.Router(); as we're supposed to create a new instance of Router() class/function (call the function as constructor) as in the nodecourse project or as a normal function
const router = express.Router();

// #route:  POST /register
// #desc:   Register a new user
// #access: Public
//this line represents a route (routing method). It has an endpoint/path, middleware function/s  and route handler (function executed when the route is matched)
//There is a special routing method, app.all(), which will be called in response to any HTTP method. This is used
// for loading middleware functions at a particular path for all request methods: app.all('/secret', function(req, res, next) {..}
// the validate middleware does not follow the Express middleware signature (req,res,next) because it returns an array of validators (Validation Chain) to the routing method.
// that will be inserted in the route method call and those validators wil call next(). the validate method here is actually called to return the actual middlewares.
// and not registered to be called in async mode. Likewise the middleware authController.authorize return a middleware function.
router.post('/register', validate('createUser'), usersController.createUser);
// #route:  POST /verify-account
// #desc:   activate user account
//Route parameters are named URL segments that are used to capture the values specified at their position in the URL.
// The captured values are populated in the req.params object (req.params.userID), with the name of the route parameter specified in the path as their respective keys.
//Route path: /users/:userId/books/:bookId
// Request URL: http://localhost:3000/users/34/books/8989
// req.params: { "userId": "34", "bookId": "8989" }\
//To define routes with route parameters, simply specify the route parameters in the path of the route as shown below.
//app.get('/users/:userId/books/:bookId', function (req, res) {
//   res.send(req.params)
// })
////The URL /users/me will be matched by a route like /users/:Id (which will extract a "Id" value of 'me').
// // The first route that matches an incoming URL will be used, so if you want to process /users/me URLs separately,
// // their route must be defined before your /users/:Id route. https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes
// //Express allows you to construct your URLs any way you like — you can encode information in the body of the URL as above (/users/:id)
// // or use URL GET parameters (e.g. /book/?id=6) which can be fetched using request.query.paramname. Whichever approach you use,
// // the URLs should be kept clean, logical and readable

// #access: Public
router.post('/verify-account/:userID/:code', validate('verifyUser'), usersController.verifyUser);
/**
 #route:  GET /resend-code
 #desc:   Register a new activation email
 #access: Public
 */
router.get('/resend-code/:userName', validate('resendCode'), usersController.resendCode);

router.post('/login', validate('login'), authController.login);

router.get('/:id', authController.validateToken, usersController.getMyProfile);

router.post('/forgot-password', validate('forgotPassword'), usersController.forgotPassword);
router.patch('/reset-password/:code',validate('resetPassword',usersController.resetPassword()));

router.delete('/:id', authController.validateToken, authController.authorize(User.Roles.ADMIN), validate('delete'), usersController.deleteUser);

router.get('/error', (req, res) => {
    throw createError(500, 'error in entered data');
})

export default router;
