import mongoose from 'mongoose';
import validator from 'validator';
import '../connections/defaultConnect.js';
import debugLib from 'debug';
import bcrypt from 'bcryptjs';

const debug = debugLib('model:user');
const Genders = Object.freeze({
        MALE: 'male',
        FEMALE: 'female',
        OTHER: 'other'
    }),
    Statuses = Object.freeze({
        NOT_INITIALIZED: 'NOT_INITIALIZED',
        ACTIVE: 'ACTIVE',
        SUSPENDED: 'SUSPENDED',
        DEACTIVE: 'DEACTIVE'
    });

const userSchema  = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'Please enter your name'],
        trim: true,
    },
    userName: {
        type : String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: [true,'Please enter your email'],
        trim: true,
        unique: true,
        lowercase: true,
        validate: {
            // Validators always receive the value to validate as their first argument and must return Boolean.
            // Returning false or throwing an error means validation failed. https://mongoosejs.com/docs/api.html#schematype_SchemaType-validate
            validator: value => validator.isEmail(value),
            message: props => `${props.value} is not a valid value for ${props.path}`
        }
    },
    password: {
        type: String,
        required: [true,'Please enter your password'],
        // Schema-Level Projections: `password` will be excluded when you do `User.find()` unless you explicitly project it in.
        select: false
    },
    gender: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        enum: Object.values(Genders)
    },
    dob: {
       type: Date,
       required: false
    },
    status: {
        type: String,
        required: true,
        uppercase: true,
        enum: Object.values(Statuses),
        default: Statuses.NOT_INITIALIZED
    },
},{
    timestamps: true
});
//copy the literal object containing constant variables into the user model statics
Object.assign(userSchema.statics,{Genders,Statuses});

/**
 * this function format the validation error returned by Mongoose as per Emaginer error format
 * err{
  "status": 400,
  "stack": "error stacktrace",
  "errors": {
    "globalMessage": "The provided details is registered already." //in case of error message not associated with any path/parameter
    "name": {
        "msg": "name is invalid",
        "value": "",
        "param": "name"
    },
    "password": {
        "msg": "please enter a valid password",
        "value": "",
        "param": "password"
    }
  }
}
 * @param err
 */
function validationErrorsFormatter(err) {
    let embeddedErrors = {};
    if(err.name ==="ValidationError"){
        err.status =400;
        // get an array of all property keys (paths' names) in the err.embeddedErrors object. And for each error in path, add a new property
        // in the embeddedErrors object where the property key is the path name (embeddedErrors.key but since key is a variable then we use the bracket notation)
        // and the value of the property key is only the error message as opposed to a long message used by the built-in err.embeddedErrors object.
        debug(`content of Object.entries(err.errors): ${Object.entries(err.errors) }`);
        Object.keys(err.errors).forEach((key)=>{
            embeddedErrors[key] = {
                'msg' : err.errors[key].message,
                'param' : key
            };
        });
    }
    // Uniqueness in Mongoose is not a validation parameter (like required); it tells Mongoose to create a unique index
    // in MongoDB for that field. The uniqueness constraint is handled entirely in the MongoDB server. When you add a
    // document with a duplicate key, the MongoDB server will return the error (E11000...).
    if(err.name === 'MongoError' && err.code === 11000){
        err.status =400;
        Object.keys(err.keyPattern).forEach((key)=>{
            embeddedErrors[key] = {
                    'msg' : `value already exist`,
                    'param' : key
            };
        })
    }
    err.errors = embeddedErrors;
}

userSchema.pre('save',async function (next){
    const user = this;
    if(user.isModified('password')){
        const saltRound = process.env.BCRYPT_SALT_ROUNDS;
        const saltObject = await bcrypt.genSalt(parseInt(saltRound));
        user.password = await bcrypt.hash(user.password, saltObject);
    }
    next();
})
// error handler middleware registered as post hook for user save() operation
userSchema.post('save',function (err, doc, next){
    debug(`error in the user model: ${err.errors}`);
    // if validation error, then set the error status code to 400 (bad request) and convert error messages to a more
    // user friendly format
    validationErrorsFormatter(err);
    next(err);
});

// error handler middleware registered as post hook for user update() operation
userSchema.post('update',function (err,doc,next){
    debug(`error in the user model: ${err.errors}`);
    // if validation error, then set the error status code to 400 (bad request) and convert error messages to a more
    // user friendly format
    validationErrorsFormatter(err);
    next(err);
})

// overwrite the toJSON() to delete sensitive data from the response. However, this


export default mongoose.model('User', userSchema);