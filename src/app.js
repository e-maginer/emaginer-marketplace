
import express from 'express';
import createError from 'http-errors';
import indexRouter from './routers/index.js';
import {fileURLToPath} from 'url';
import {dirname,join} from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import createLogger from './utils/logger.js'
// import {createRequire} from 'module';
// const require = createRequire(import.meta.url);


//The express() function is a top-level function exported by the express module (substack pattern, NodeJS  deign patterns)
const app = express();
/*
to enable Node to read the env variables from the Env files during debugging in WS, add the following to
the 'Node parameters' field in the Debug configuration window
src/node_modules/.bin/env-cmd -f config/dev.env
@todo try the npx package instead as described here: https://nodejs.dev/learn/how-to-use-or-execute-a-package-installed-using-npm
 */
const isDevelopment = process.env.NODE_ENV === 'development';
// view engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');
/*
morgan allows for showing HTTP logs in the console which helps in debugging. we can use 'combined' instead
of 'tiny' or 'dev' to get more verbose logs.
todo use Winston to log messages from Morgan https://coralogix.com/log-analytics-blog/complete-winston-logger-guide-with-hands-on-examples/
*/
if(isDevelopment) {
  // middleware function added with use() for all routes and verbs
  // middleware Function added with use() can be for a specific route as follows. best practice is to add the middleware to specific route in the Router routes
  //app.use('/someroute', a_middleware_function);
  app.use(morgan('dev'));
}
//these are Application-level Middlewares that will run before all the route handlers.
//this is to enable express to automatically parse incoming JSON in the request into JS object that can be
// accessed using request.body and express.urlencoded() to parse forms fields into the body property.
// https://stackoverflow.com/questions/23259168/what-are-express-json-and-express-urlencoded/51844327#:~:text=a.-,express.,use(express.)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// built-in middleware function that serves static assets such as HTML files, images, and so on.
app.use(express.static(join(__dirname, 'public')));

app.use('/', indexRouter);


// Handling 404 errors (no route matching) and forward to error handler
// When you pass an argument to next(), Express will assume that this was an error and it will skip all other routes
// and send whatever was passed to next() to the error handling middleware that was defined
app.use(function(req, res, next){
  next(createError(404));
})

// error handler for API
//@todo relocate the handler function into the utils folder and separate the logic into 2 distinct functions
// app.use(logErrors)
// app.use(clientErrorHandler)
app.use(function(err, req, res, next) {
  /*
  If you pass an error to next() and you do not handle it in an error handler, it will be handled by the built-in error handler; the error will be written to the client
  with the stack trace.
  Note: The stack trace is not included in the production environment. To run the application in production mode you need to set the environment variable NODE_ENV to 'production'.

  If you call next() with an error after you have started writing the response (for example, if you encounter an error while streaming
  the response to the client) the Express default error handler closes the connection and fails the request. So when you add a custom
   error handler, you must delegate to the default Express error handler, when the headers have already been sent to the client:
   */
  if(res.headersSent) {
    next(err);
  }
  // If the error did not originate from createError, it will not have a status property. So set the HTTP res status code to 500 Internal Server Error
  //res.status(err.status||500).send({message:err.message});
  const status = err.status||500;
  res.status(status);
  if(status >= 500) {
    const logger = createLogger(err.label);
    logger.error({
      statusCode: err.status,
      message: err.message,
      trace: err.stack,
      remoteAddress: req.connection.remoteAddress,
      correlation: err.correlation
    })
    // in case of production, send error messages only in case the error is not a Server error
    if(!isDevelopment) {
      /*
        @todo replace the below code with a creation of a new Error as follows:
        expose - can be used to signal if message should be sent to the client, defaulting to false when status >= 500
         let errors = createError(`Error in connecting to database ${e}`, {expose: false});
         res.send(err.errors);
       */
      err.errors = {
        globalMessage: 'Server error occurred! please try again'
      };
    }
  }
  res.send(err.errors);
});

export default app;

/* error handler rendering the error page
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/

