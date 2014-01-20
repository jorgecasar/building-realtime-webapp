/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	attributes: {
		username: {
			type: 'string',
			required: true,
			unique: true
		},
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
		// Override toJSON instance method to remove password value.
		toJSON: function() {
			var obj = this.toObject();
			delete obj.password;
			return obj;
		},
		// Check a password with the saved one.
		validPassword: function(password, callback) {
				var obj = this.toObject();
				// If there are a callback, compare async.
				if (callback) {
					 //callback (err, res)
					 return bcrypt.compare(password, obj.password, callback);
				}
				// Otherwise, compare sync.
				return bcrypt.compareSync(password, obj.password);
		  }
	},
	// Lifecycle Callbacks.
	beforeCreate: function(values, next) {
		hashPassword(values, next);
	},
	beforeValidation: function(values, next) {
		if( values.password && values.new_password && values.confirm_password) {
			// If we recive a password. We will try to change for the new one.
			if ( values.new_password === values.confirm_password ) {
				// If new password and confirm password is the same.
				User.findOne(values.id).done(function(err, user) {
					if (err) return next(err);
					if( user.validPassword(values.password) ){
						// If old password is valid.
						// Ovewrite password with the new password.
						values.password = values.new_password;
						// delete password confirmation.
						delete values.confirm_password;
						// Hash the password.
						hashPassword(values, next);
					}
				});
			}
		} else if (values.id) {
			// If we are updating the data but the password is not submited.
			User.findOne(values.id).done(function(err, user) {
				if (err) {
					return next(err);
				} else {
					// Take the same password user had.
					values.password = user.password;
					next();
				}
			});
		} else {
			next();
		}
	}

};

var bcrypt = require('bcrypt');
 
function hashPassword(values, next) {
	// Generate the crypt salt.
	bcrypt.genSalt(10, function(err, salt) {
		if (err) return next(err);
		// Generate the hash using the salt generated.
		bcrypt.hash(values.password, salt, function(err, hash) {
			if (err) return next(err);
			// Overwrite the password with the hash.
			values.password = hash;
			next();
		});
	 });
}
