/**
 * canAdminUser
 *
 * @module      :: Policy
 * @description :: Simple policy to allow administrate the requested user.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

	// Allow only if the user requested is the same as logged.
	if (req.param('id') === req.user.id) return next();

	// User is not allowed
	// (default res.forbidden() behavior can be overridden in `config/403.js`)
	return res.forbidden('You are not permitted to perform this action.');
};
