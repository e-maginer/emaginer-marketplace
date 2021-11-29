import jwt from 'jsonwebtoken';
import {promisify} from 'util';
import createError from 'http-errors';
import crypto from 'crypto';
// This module is using the Named exports to expose API function unlike exporting an anonymous object literal exposing all the controller API functions in other modules.
// When we import a default literal object, most module bundlers will consider the entire object being used and they won't be able
// to eliminate any unused code from the exported functionality. While being a utility module we want to offer the choice to the API consumers to import relevant code only
/*
the JWT signing algorithm takes the header, the payload and the secret to create a unique signature (the signature is the hashed value created using the header+ payload
and the secret as a key). The JWT sent to the client is comprised of the header, payload and signature
 */
export async function signToken (payload) {
    return await jwt.sign(payload,process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRRES_IN
    })
}
/*
the verify function takes the header + payload from the JWT, generates a signature (hash) using the secret code and compare the hash received in the JWT received from client
 */
export async function verifyToken (token) {
    try{
        return await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    }catch (e) {
        if(e.name === 'TokenExpiredError'){
            throw createError(401,'session time out! please login again');
        }
        if(e.name === 'JsonWebTokenError'){
            throw createError(401,'unauthorized access');
        }
    }

}

export function createOTP(length) {
   const clearOTP =  crypto.randomBytes(length).toString('hex');
   const encryptedOTP = hashOTP(clearOTP);
   return {
       clearOTP,
       encryptedOTP
   };
}

export function hashOTP(clearOTP){
    return crypto.createHash('sha256').update(clearOTP).digest('hex');
}