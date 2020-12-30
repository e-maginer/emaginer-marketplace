// Main router entry point, sets up all route modules  for all resources
import express from 'express';
import userRouter from './usersRouter.js';
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/users',userRouter);

export default router;
