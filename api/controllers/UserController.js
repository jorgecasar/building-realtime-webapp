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
		User.create( req.params.all(), function createdUser(err, user){
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
				// Response JSON if needed.
				if (req.wantsJSON) return res.json(200);
				// Redirect to the users page.
				else return res.redirect('/user');
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
		// Use Passport LocalStrategy
		require('passport').authenticate('local', function(err, user, info){
			if ((err) || (!user)) next(err);
			req.login(user, function(err){
				if (err) return res.redirect('/user/auth');
				// Redirect to the user page.
				return res.redirect('/user/' + user.id);
			});
		})(req, res);
	},
	logout: function(req, res){
		// Call Passport method to destroy the session.
		req.logout();
		// Redirect to home page.
		return res.redirect('/');
	}
};