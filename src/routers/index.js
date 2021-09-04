// Main router entry point, sets up all route modules  for all resources
import express from 'express';
import userRouter from './usersRouter.js';
import createLogger from "../utils/logger.js";
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const logger = createLogger('server.endpoint.get.index');
  logger.info({
    message: '************enter the index route*************',
    remoteAddress: req.connection.remoteAddress,
  });
  res.render('index', { title: 'Express' });
});
//we created a router file for each resource and used them here
// Alternatively, we can use Application-level middleware such as app.use('/users/register',usersController.validate('createUser'), usersController.createUser)
//but using Router-level middleware is more concise and modular way (http://expressjs.com/en/guide/using-middleware.html)
router.use('/users',userRouter);

export default router;
