# Quick and dirty Express Router mock

_With version 1.0, this now supports Express 4.0 routes._

This provides a mock express object that you can attach routes to. 

The motivation was this is to have a mechanic for **pure** Unit Testing of routes which doesn't rely on creating an instance of Express. Additionally, I wanted to pass in mock `request` and `response` objects that I could later inspect for changes made by the controller.

## Quick start

Create a mock express application:

	var MockExpress = require('mock-express'),
		assert = require('assert');

	var app = MockExpress(); // notice there's no "new"

Append a `get` route to your app

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
		done(); // this is the callback used by mocha to indicate test completion
	});

Call the route

	app.invoke('get', '/test?start=true', req, res);

Note that your assertions should be in the callback passed to the makeResponse object, since most routes terminate with some kind of call to the response object.

With the transition to Express 4.x, this module now supports the use of `router.use()` syntax, which allows you to test error-handling middleware.

You do not need to pass in the `req` and `res` objects when calling `invoke()` if you use `makeRequest` and `makeResponse`. `invoke()` will automatically default to the last request and response mock objects made using those utility functions. Thus you could write `app.invoke('get', '/test?start=true')` above instead.

## Timeouts due to assertion errors in callbacks

If your assertions in the callbacks throw an error, then the test will **timeout** because the error is thrown in a callback.

To avoid this, create your callback as follows:

	var assertionCallback = app.makeAssertionCallback(done, function(err, sideEffects) {
		<your assertions>
	});
	var res = app.makeResponse();

Note that you should not call `done()` (or it's non-Mocha equivalent) directly if you create your callback in this manner.

## Available side effects

Currently you have the following available to check

* `sideEffects.redirect` - this string represents the name of any redirect
* `sideEffects.viewName` - the view name passed as the first argument to `res.render`.
* `sideEffects.model` - the model object passed as the second argument to `res.render`
* `sideEffects.session` - anything that is set into the session object.
* `sideEffects.json` - the variable passed as the first argument to `res.json`
* `sideEffects.send` - the variable passed as the first argument to `res.send`