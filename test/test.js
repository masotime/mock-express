/* global describe, it */
// nothing here yet
var MockExpress = require('../index'),
	assert = require('assert');

describe('mockExpress', function() {

	it('should work using the example in the README', function(done) {
		var app = MockExpress(); // notice there's no "new"

		app.get('/test', function(req, res) {
			var model = { name: 'world'};

			if (req.query.start === 'true') {
				res.render('index', model);
			} else {
				res.redirect('http://www.google.com');
			}
			
		});

		var req = app.makeRequest({ 'host': 'http://www.google.com' });
		var res = app.makeResponse(function(err, sideEffects) {
			assert.equal(sideEffects.model.name, 'world');

			var res = app.makeResponse(function(err, sideEffects) {
				assert.equal(sideEffects.redirect, 'http://www.google.com');
				done();
			});

			app.invoke('get', '/test', req, res);			

		});

		app.invoke('get', '/test?start=true', req, res);

	});

	it('should not require the user to pass in the req and res objects when invoking, if they used makeRequest and makeResponse', function(done) {
		var app = MockExpress(); // notice there's no "new"

		app.get('/test', function(req, res) {
			var model = { name: 'world'};

			if (req.query.start === 'true') {
				res.render('index', model);
			} else {
				res.redirect('http://www.google.com');
			}
			
		});

		app.makeRequest({ 'host': 'http://www.google.com' });
		app.makeResponse(function(err, sideEffects) {
			assert.equal(sideEffects.model.name, 'world');

			app.makeResponse(function(err, sideEffects) {
				assert.equal(sideEffects.redirect, 'http://www.google.com');
				done();
			});

			app.invoke('get', '/test');

		});

		app.invoke('get', '/test?start=true');
	});

	it('should support the makeAssertionCallback feature, which automatically catches assertion errors in the callback', function(done) {
		var app = MockExpress(); // notice there's no "new"

		app.get('/test', function(req, res) {
			res.redirect('dumdedum');
		});

		app.makeRequest({ 'host': 'http://www.google.com' });
		var callback = function(err) {
			try {
				assert.notEqual(err, undefined);
				done();
			} catch(e) {
				done(e);
			}
		};

		var assertionCallback = app.makeAssertionCallback(callback, function() {
			assert.equal(1,2);
		});

		app.makeResponse(assertionCallback);

		app.invoke('get', '/test');
	});

	it('should correctly invoke the last layer of error handling in a route', function(done) {
		var app = MockExpress();

		app.get('/test', function(req, res, next) {
			next(new Error('hello'));
		});

		app.use(function(err, req, res, next) {
			assert(err.message === 'hello');
			done();
		});

		app.invoke('get', '/test');
	});

	it ('should return / for path() if no route is specified', function() {
		assert.equal(MockExpress().path(),'/');
	});

	it ('should return the specified route when path() is called', function() {
		assert.equal(MockExpress('/pineapples').path(),'/pineapples');
	});

});