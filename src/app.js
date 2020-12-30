
import express from 'express';
import createError from 'http-errors';
import indexRouter from './routers/index.js';
import {fileURLToPath} from 'url';
import {dirname,join} from 'path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
// import {createRequire} from 'module';
// const require = createRequire(import.meta.url);


//The express() function is a top-level function exported by the express module (substack pattern, NodeJS  deign patterns)
const app = express();

// view engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');
/*
morgan allows for showing HTTP logs in the console which helps in debugging. we can use 'combined' instead
of 'tiny' or 'dev' to get more verbose logs
*/
app.use(morgan('dev'));

//this is to enable express to automatically parse incoming JSON in the request into JS object that can be
// accessed using request.body and express.urlencoded() to parse forms fields into the body property.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

app.use('/', indexRouter);


// Handling 404 errors
// When you pass an argument to next(), Express will assume that this was an error and it will skip all other routes
// and send whatever was passed to next() to the error handling middleware that was defined
app.use(function(req, res, next){
  next(createError(404));
})

// error handler for API
app.use(function(err, req, res, next) {
  //@todo log error using winston
  console.log('error status code', err.status);
  console.log('error message', err.message);
  console.log('erro trace', err.stack);
  /*
  If you call next() with an error after you have started writing the response (for example, if you encounter an error while streaming
  the response to the client) the Express default error handler closes the connection and fails the request. So when you add a custom
   error handler, you must delegate to the default Express error handler, when the headers have already been sent to the client:
   */
  if(res.headersSent){
    next(err);
  }
  //If the error did not originate from createError, it will not have a status property. So set the status code to 500 Internal Server Error
  //res.status(err.status||500).send({message:err.message});
  res.status(err.status||500).send(err.errors);
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

