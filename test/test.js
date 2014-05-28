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

	it ('should return / for path() if no route is specified', function() {
		assert.equal(MockExpress().path(),'/');
	});

	it ('should return the specified route when path() is called', function() {
		assert.equal(MockExpress('/pineapples').path(),'/pineapples');
	});

});