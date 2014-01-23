var passport         = require('passport'),
    GitHubStrategy   = require('passport-github').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    TwitterStrategy  = require('passport-twitter').Strategy;

function providersHandler(token, tokenSecret, profile, done) {
	sails.log.verbose('config/passport providersHandler');
	process.nextTick(function () {
		User.findOne()
		.where({'profiles.id': profile.id})
		.done(function (err, user) {
			if (user) return done(null, user);
			
			var user = {}
			user.profiles = [];

			if(profile.emails) {
				if( profile.emails[0] && profile.emails[0].value ) {
					user.email = profile.emails[0].value;
				}
			}
			if(profile.username) {
				user.username = profile.username;
			}
			if(profile.displayName) {
				user.displayName = profile.displayName;
			}
			if(profile.gender) {
				user.gender = profile.gender;
			}

			user.profiles.push(profile);
			delete profile._raw;
			delete profile._json;
			return done(err, user);
		});
	});
};

module.exports = {
	configProviders: function(options, next) {
		passport.use(new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID || sails.config.providers.github.clientID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET || sails.config.providers.github.clientSecret,
				callbackURL: process.env.GITHUB_CALLBACK_URL || sails.config.providers.github.callbackURL
			},
			providersHandler
		));
		passport.use(new FacebookStrategy({
				clientID: process.env.FACEBOOK_CLIENT_ID || sails.config.providers.facebook.clientID,
				clientSecret: process.env.FACEBOOK_CLIENT_SECRET || sails.config.providers.facebook.clientSecret,
				callbackURL: process.env.FACEBOOK_CALLBACK_URL || sails.config.providers.facebook.callbackURL
			},
			providersHandler
		));
		passport.use(new TwitterStrategy({
				consumerKey: process.env.TWITTER_CONSUMER_KEY || sails.config.providers.twitter.consumerKey,
				consumerSecret: process.env.TWITTER_CONSUMER_SECRET || sails.config.providers.twitter.consumerSecret,
				callbackURL: process.env.TWITTER_CALLBACK_URL || sails.config.providers.twitter.callbackURL
			},
			providersHandler
		));
	}
};
