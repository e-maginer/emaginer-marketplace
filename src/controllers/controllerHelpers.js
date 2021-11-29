import { validationResult } from "express-validator";
import createError from "http-errors";

// it should be written as a function expression, as the function definition should be executed at the moment of formatting
// an existing error in the request (function must not be hoisted)
// .withDefaults() returns a new validationResult function, using the provided options in the options object.
// the validationResult function extracts the validation errors from a request and makes them available in a Result
// object (validationResult() returns a Result object so formattedValidationResult() returns a Result object because it's like calling the validationResult() returned by .withDefaults() )
// that holds the current state of validation errors in a request and allows access to it in a variety of ways..
export const formatValidationResult =  validationResult.withDefaults({
    formatter: (error) =>{
        let value = null;
        // omit the provided password value from the error message
        /*if(typeof error.param === 'string' && error.param !== 'password')
            value = error.value;*/
        return {
            'msg':error.msg,
            'param': error.param
        }
    }
});


export const requestValidationResult = function (req) {
    const validationResult = formatValidationResult(req);
    // .mapped() gets the first validation error of each failed field in the form of an object. it returns
    // an object where the keys are the field names, and the values are the validation errors
    if (!validationResult.isEmpty()) {
        const error = createError(400);
        error.errors = validationResult.mapped();
        throw error;
    }
}