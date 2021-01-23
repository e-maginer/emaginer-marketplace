import createError from 'http-errors';
// import {createRequire} from 'module';
// const require = createRequire(import.meta.url);
import express from 'express';
import usersController from '../controllers/usersController.js';
import { body } from 'express-validator';

const router = express.Router();

// #route:  POST /register
// #desc:   Register a new user
// #access: Public
router.post('/register', usersController.validate('createUser'), usersController.createUser);
// #route:  POST /register
// #desc:   activate user account
// #access: Public
router.post('/verify-account/:userID/:code', usersController.validate('verifyUser'), usersController.verifyUser);

router.get('/error', (req, res) => {
    throw createError(500, 'error in entered data');
})


export default router;
