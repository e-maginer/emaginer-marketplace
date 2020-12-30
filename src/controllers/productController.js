//We could also include the next function to be called if the route handler does not complete the request cycle, but in all these cases it does, so we've omitted it.
/**
 * test function
 * @param {Object} req
 * @param {Object} res
 * @author Tristan Muhader
 */
export function userLogin(req, res){
    res.send('respond with a resource');
}