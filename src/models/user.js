//mongoose instanceof mongoose.Mongoose; // true
import mongoose from 'mongoose';
import validator from 'validator';
import '../connections/defaultConnect.js';
import debugLib from 'debug';
import bcrypt from 'bcryptjs';

const debug = debugLib('model:user');
//see Object.freeze() in page 1112 in JS book (we can't use constant because it still allows to change the property of an object)
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
// copy the literal object containing constant variables into the user model statics
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

// @todo replace the middleware on the update function by using an array of functions in the precedent middleware (see page 66 mongoose book)
//schema.post(['save', 'validate', 'remove'], function(res) {
//   res === this; // true
//   res === doc; // true
// });
userSchema.post('update',function (err,doc,next){
    debug(`error in the user model: ${err.errors}`);
    // if validation error, then set the error status code to 400 (bad request) and convert error messages to a more
    // user friendly format
    validationErrorsFormatter(err);
    next(err);
})

/*
 Overwrite the toJSON() to delete sensitive user data from the response. In Mongoose, getters/setters allow you to execute
 custom logic when getting or setting a property/path on a document.
 Another useful feature of getters is that Mongoose applies getters when converting a document to JSON, including when
 you call Express' res.json() or res.send() function with a Mongoose document. but here it will not be applied as
 we have overwritten the toJSON function.
optionally, we can use mongoose getter : userSchema.path('password').get(v=>undefined); when we need the password to be returned,
for authentication for example, You can also skip running getters on a one-off basis using the Document#get() function's getters option:
user.get('password', null, { getters: false }); but A malicious user or a bug could cause an the password to be returned with this code
*/
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
}
//create the User model based on the userSchema. mongoose.model(modelName,schema,collectionName) takes 3 parameters,
// if we omit the 3rd argument, mongoose will create the collection using the modelName but in lowercase and plural
// Note that the return value of mongoose.model() is not an instance of the Model class. Rather, mongoose.model() returns
// a class that extends from Model. this is why here we call model() function and do not instantiate Model class using new
//@todo use namespaced subcollection for organizing collection such as auth.users
export default mongoose.model('User', userSchema);