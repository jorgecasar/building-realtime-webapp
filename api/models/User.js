/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
		email: {
			type: 'string',
			required: true,
			email: true,
			unique: true
		},
		password: {
			type: 'string',
			required: true
		},
		// Override toJSON instance method to remove password value
		toJSON: function() {
			var obj = this.toObject();
			delete obj.password;
			return obj;
		},
		
	},
	// Lifecycle Callbacks
	beforeCreate: function(values, next) {
		hashPassword(values, next);
	},
	beforeUpdate: function(values, next) {
		if(values.password) hashPassword(values, next);
		else next();
	}

};

var bcrypt = require('bcrypt');
 
function hashPassword(values, next) {
    bcrypt.hash(values.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }
        values.password = hash;
        next();
    });
}
