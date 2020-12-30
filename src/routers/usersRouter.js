import createError from 'http-errors';
// import {createRequire} from 'module';
// const require = createRequire(import.meta.url);
import express from 'express';
import usersController from '../controllers/usersController.js';
const router = express.Router();

// #route:  POST /register
// #desc:   Register a new user
// #access: Public
router.post('/register',usersController.createUser);
// #route:  POST /register
// #desc:   activate user account
// #access: Public
router.post('/verify-account/:userID/:code',usersController.verifyUser);

router.get('/error', (req,res)=>{
  throw createError(500,'error in entered data');
})


export default router;
