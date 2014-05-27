# Quick and dirty Express Router mock

This provides a mock express object that you can attach routes to. Couldn't find a wheel someone already made so I made my own.

## Quick start

Create a mock express application:

	var MockExpress = require('mock-express'),
		assert = require('assert');

	var app = MockExpress(); // notice there's no "new"

The object allows you to append routes with `get` and `post` only for now.

	app.get('/test', function(req, res, next) {
		var model = { name: 'world'};

		if (req.query.start === 'true') {
			res.render('index', model);
		} else {
			res.redirect('http://www.google.com');
		}
		
	});

Create and supply your own mock req and res objects:

	var req = app.makeRequest({ 'host': 'http://www.google.com' });
	var res = app.makeResponse(function(err, sideEffects) {
		assertEqual(sideEffects.model.name, 'world');
	});

Call the route

	app.invoke('get', '/test?start=true', req, res);

Note that your assertions should be in the callback passed to the makeResponse object, since most routes terminate with some kind of call to the response object. Currently there is no support for controllers that use `next()`.

Currently you have the following available to check

* `sideEffects.redirect` - this string represents the name of any redirect
* `sideEffects.viewName` - the view name passed as the first argument to `res.render`.
* `sideEffects.model` - the model object passed as the second argument to `res.render`
* `sideEffects.session` - anything that is set into the session object.