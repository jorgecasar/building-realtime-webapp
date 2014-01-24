/**
 * UserController
 *
 * @module      :: Controller
 * @description :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
	
	/*
	 * API Rest actions.
	 */
	find: function(req, res, next) {
		var id = req.param('id');
		// If id is a shortcut we don't have to find.
		if ( isShortcut(id) ) return next();

		req.session.canAdminUser = canAdminUser(id, req.user);

		// If we get an id we will retun one unique user.
		if (id) {
			User.findOne(id).done(function foundUser(err, user){
				if ( err ) return next(err);
				if ( !user ) return res.notFound();

				// Response JSON if needed.
				if (req.wantsJSON) return res.json(user);
				// Else response view with results 
				else return res.view({ user: user });
			});
		}
		// Otherwise, we will retun an user array.
		else {
			
			// If we have a where param we will pase it as JSON.
			var where = req.param('where');
			if( _.isString(where)) {
				where = JSON.parse(where);
			}
			// Setting options from params.
			var filters = {
				limit: req.param('limit') || undefined,
				skip: req.param('skip')  || undefined,
				sort: req.param('sort') || undefined,
				where: where || undefined
			};
			// Find users according with filters
			User.find(filters).done(function foundUsers(err, users){
				if ( err ) return next(err);
				// Response JSON if needed.
				if (req.wantsJSON) {
					// If there are users return users
					if( users.length ) return res.json(users);
					// Otherwise, return status 204: no content
					else return json(204);
				// Otherwise, response view with results 
				} else {
					return res.view({ users: users });
				}
			});
		}
		function isShortcut(id){
			return (id === 'find' || id === 'create' || id === 'update' || id === 'destroy' );
		}
		function canAdminUser(id, sessionUser){
			// Check if there are an logged user
			// and the id is the requested one
			return sessionUser && sessionUser.id === id;
		}
	},
	create: function(req, res, next) {
		// Create an user using all params.
		// Schema is true, then we will save that we need.
		var params = _.extend({}, req.session.tempUser, req.params.all());
		User.create( params, function createdUser(err, user){
			if (err) return next(err);
			req.login(user, function(err){
				if (err) return res.redirect('/user/auth');
				// Redirect to the user page.
				// Response JSON if needed.
				// Status 201 is Created.
				if (req.wantsJSON) return res.json(201, user);
				// Redirect to the user page that we've just created
				else return res.redirect('/user/' + user.id);
			});
		});
	},
	update: function(req, res, next) {
		var id = req.param('id');
		// Id is needed, otherwise not found (status 404).
		if( !id ) return res.notFound();
		// Update the user gave.
		User.update(id, req.params.all()).done(function updatedUsers(err, users){
			if ( err ) return next(err);
			// If user is not found, return error 404.
			if ( !users ) return res.notFound();
			// Update return an array,
			// but as we update by id, we can take the unique element.
			var user = users[0];
			// Response JSON if needed.
			// Status 201 is Created.
			if (req.wantsJSON) return res.json(201, user);
			// Redirect to the user page that we've just created.
			else return res.redirect('/user/' + user.id);
		});
	},
	destroy: function(req, res, next) {
		var id = req.param('id');
		// Id is needed, otherwise not found (status 404).
		if( !id ) return res.notFound();
		// Find the user by id.
		User.findOne(id).done(function foundUser(err, user){
			if ( err ) return next(err);
			// If user is not found, return error 404.
			if ( !user ) return res.notFound();
			// Delete the user.
			User.destroy(user.id).done(function userDestroyed(err){
				if ( err ) return next();
				req.logout();
				// Response JSON if needed.
				if (req.wantsJSON) return res.json(200);
				// Redirect to the users page.
				else return res.redirect('/');
			})
		});
	},
	
	/*
	 * Actions to render a view.
	 */
	new: function(req, res) {
		// Response the view with the action's name.
		return res.view();
	},
	edit: function(req, res) {
		User.findOne(req.param('id')).done(function foundUser(err, user){
			if ( err ) return next(err);
			// Response the view with the action's name.
			else return res.view({ user: user });
		});
	},
	// This accion will render the view with the login form
	auth: function(req, res) {
		return res.view();
	},
	
	/*
	 * Actions that proccess info.
	 */
	login: function(req, res, next) {
		var provider = req.param('provider') || 'local';
		sails.log.verbose('AuthController.login:', isProvider);
		if ( provider === 'local' || isProvider(provider) ) return linkProfile(provider, req, res, next);
		return res.redirect('/user/auth');
	},
	logout: function(req, res, next){
		sails.log.verbose('AuthController.login');
		var provider = req.param('provider');
		if ( isProvider(provider) ) return unlinkProfile(provider, req, res, next);
		// Call Passport method to destroy the session.
		req.logout();
		// Redirect to home page.
		return res.redirect('/');
	}
};

function isProvider(provider){
	return sails.config.providers[provider];
}

function linkProfile(provider, req, res, next){
	sails.log.verbose('AuthController linkProfile');
	process.nextTick(function () {
		require('passport').authenticate(
			provider,
			function (err, user) {
				sails.log.verbose('authenticate callback');
				// If there are a logged user.
				if( req.user ){
					sails.log.verbose('req.user');
					// If there are a user in our DB.
					if ( user.id ) {
						sails.log.verbose('user.id');
						//  If the ids match.
						if( req.user.id === user.id ){
							sails.log.verbose('req.user.id === user.id');
							// Return to logeduser page
							return res.redirect('/user/' + req.user.id);
						}
						// Otherwise, the ids are differents.
						else {
							sails.log.verbose('req.user.id !== user.id');
							// There are another user with this account.
							// TODO: Solve the conflict.
							return res.redirect('/user/' + req.user.id);
						}
					}
					// There aren't a user in our DB.
					else {
						sails.log.verbose('!user.id');
						// Save the new profile.
						User.findOne(req.user.id).done(function(err, localUser){
							if( err ) res.serverError(err);
							sails.log.verbose('Adding profile', user.profiles[0]);
							localUser.profiles.push(user.profiles[0]);
							localUser.save(function(err){
								if( err ) {
									// TODO: Notify error.
									return res.redirect('/user/' + req.user.id);
								}
								return res.redirect('/user/' + req.user.id);
							});
						});
					}
				} else {
					sails.log.verbose('!req.user');
					if( user.id ) {
						sails.log.verbose('user.id');
						req.login(user, function (err) {
							if (err) return res.serverError([err]);
							return res.redirect('/user/' + user.id);
						});
					} else {
						sails.log.verbose('!user.id');
						// Save the temporal user in the session.
						req.session.tempUser = user;
						//TODO: Notify that the user need a new account.
						return res.redirect('/user/new');
					}
				}
			}
		)(req, res, next);
	});
}

function unlinkProfile(provider, req, res){
	User.findOne(req.user.id).done(function(err, user){
		var foundProfile = false;
		var i = user.profiles.length;
		while( !foundProfile && i >= 0){
			i--;
			foundProfile = user.profiles[i].provider === provider;
		}
		if( foundProfile ) {
			user.profiles.splice(i, 1);
			user.save(function(err, user){
				if( err ) {
					// TODO: Notify error.
					return res.redirect('/user/' + user.id);
				}
				return res.redirect('/user/' + user.id);
			});
		} else {
			// TODO: Notify provider not found.
			return res.redirect('/user/' + user.id);
		}
	});
}
