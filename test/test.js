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

	it('should correctly throw errors on invalid usage of makeResponse and makeAssertionCallback', function(done) {
		var app = MockExpress(); // notice there's no "new"

		try {
			assert.throws(function() { app.makeResponse({}); }, /requires a valid callback function/);
			assert.throws(function() { app.makeAssertionCallback({}); }, /requires a valid callback function/);
			assert.throws(function() { app.makeAssertionCallback(function() {}, {}); }, /requires a valid assertions function/);
			done();
		} catch (err) {
			done(err);
		}
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

	it('should not mutate req object supplied by user', function(done) {
		var app = MockExpress();
		var myReq = {
			params: {
				param1: 'one',
				param2: 'two'
			}
		};

		app.get('/test/:param1/:param2', function (req, res) {
			res.render('test', {
				param1: req.params.param1,
				param2: req.params.param2
			});
		});

		var assertionCallback = app.makeAssertionCallback(done, function(err, sideEffects) {
			assert.equal(myReq.params.param1, 'one');
			assert.equal(myReq.params.param2, 'two');
			assert.equal(sideEffects.model.param1, 'hello');
			assert.equal(sideEffects.model.param2, 'world');
		});

		app.makeResponse(assertionCallback);

		app.invoke('get', '/test/hello/world', myReq);
	});

	it('should return a body on res.send', function(done) {
		var app = MockExpress();

		app.get('/test/send', function (req, res) {
			res.send('hello world');
		});

		var assertionCallback = app.makeAssertionCallback(done, function(err, sideEffects) {
			assert.equal(sideEffects.send, 'hello world');
		});

		app.makeResponse(assertionCallback);

		app.invoke('get', '/test/send');
	});

	it('should return json on res.json', function(done) {
		var app = MockExpress();

		app.get('/test/json', function (req, res) {
			var content = {
				hello: 'world'
			};
			
			res.json(content);
		});

		var assertionCallback = app.makeAssertionCallback(done, function(err, sideEffects) {
			assert.equal(sideEffects.json.hello, 'world');
		});

		app.makeResponse(assertionCallback);

		app.invoke('get', '/test/json');
	});

	it ('should set and return settings', function(done) {
		var app = MockExpress();

		app.set('foo', 'bar');
		const foo = app.get('foo');
		assert.equal(foo, 'bar');

		done();
	});

	it('should return status on res.status', function(done) {
		var app = MockExpress();

		app.get('/test/status', function (req, res) {
			res.status(404);
		});

		var assertionCallback = app.makeAssertionCallback(done, function(err, sideEffects) {
			assert.equal(sideEffects.status, 404);
		});

		app.makeResponse(assertionCallback);

		app.invoke('get', '/test/status');
	});

	it('should return end on res.end', function(done) {
		var app = MockExpress();

		app.get('/test/end', function (req, res) {
			res.end('foo');
		});

		var assertionCallback = app.makeAssertionCallback(done, function(err, sideEffects) {
			assert.equal(sideEffects.end, 'foo');
		});

		app.makeResponse(assertionCallback);

		app.invoke('get', '/test/end');
	});

	it ('should return / for path() if no route is specified', function() {
		assert.equal(MockExpress().path(),'/');
	});

	it ('should return the specified route when path() is called', function() {
		assert.equal(MockExpress('/pineapples').path(),'/pineapples');
	});

	it('should accept invocations of routes without use of optional parameter', function() {
		var app = MockExpress();
		var invocations = 0;

		app.get('/teams/new/:step?', function(req, res) {
			res.send(req.params.step);
		});

		var req = app.makeRequest();
		var resAssertUndefined = app.makeResponse(function(err, sideEffects) {
			assert.equal(sideEffects.send, undefined);
			invocations += 1;
		});
		var resAssertOne = app.makeResponse(function(err, sideEffects) {
			assert.equal(sideEffects.send, '1');
			invocations += 1;
		});

		app.invoke('get', '/teams/new', req, resAssertUndefined);
		app.invoke('get', '/teams/new/1', req, resAssertOne);
		assert.equal(invocations, 2);
	});

});