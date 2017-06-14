// I hate making wheels
var MockExpress = function(route) {
	var express = require('express'),
		extend = require('extend'),
		URL = require('url'),
		qs = require('querystring'),
		assert = require('assert'),
		router = new express.Router(),
		sideEffects = { session: {}, model: {} },
		defaultRequest, defaultResponse;

		if (!express.settings) {
		  express.settings = {};
		}

	// limited subset for now
	return {
		'put': function() { router.put.apply(router, Array.prototype.slice.apply(arguments)); },
		'patch': function() { router.patch.apply(router, Array.prototype.slice.apply(arguments)); },
		'delete': function() { router.delete.apply(router, Array.prototype.slice.apply(arguments)); },
		'get': function() {
      if (arguments.length === 1) {
        return express.application.set.apply(express, Array.prototype.slice.apply(arguments));
      }
      else {
        router.get.apply(router, Array.prototype.slice.apply(arguments));
      }
    },
    'set': function() { express.application.set.apply(express, Array.prototype.slice.apply(arguments)); },

		'post': function() { router.post.apply(router, Array.prototype.slice.apply(arguments)); },
		'use': function() { router.use.apply(router, Array.prototype.slice.apply(arguments)) },
		'invoke': function(method, path, req, res, next) {
			req = extend({}, req || defaultRequest);
			res = extend({}, res || defaultResponse);

			req.query = qs.parse(URL.parse(path).query);

			req.method = method;
			req.url = path;

			router.handle(req, res, next);
		},
		'path': function() {
			return route || '/';
		},
		'makeAssertionCallback': function(callback, assertions) {
			assert(typeof callback === 'function', 'makeAssertionCallback requires a valid callback function');
			assert(typeof assertions === 'function', 'makeAssertionCallback requires a valid assertions function');

			return function(err, sideEffects) {
				try {
					assertions(err, sideEffects);
					callback();
				} catch (e) {
					callback(e);
				}
 			};
		},
		'makeRequest': function(getMap) {
			var requestObject = Object.create(null);
			requestObject.get = function(property) {
				return getMap[property];
			};

      if (requestObject.get('body')) {
        requestObject.body = requestObject.get('body');
      }

			Object.defineProperty(requestObject, 'session', {
				get: function() {
					return sideEffects.session;
				},
				set: function(newValue) {
					sideEffects.session = newValue;
				}
			});

			defaultRequest = requestObject;

			return requestObject;
		},
		'makeResponse': function(callback) {
			assert(typeof callback === 'function', 'makeResponse requires a valid callback function');

			defaultResponse =  {
				json: function(json) {
					sideEffects.json = json;
					callback(null, sideEffects);
				},
				redirect: function(location) {
					sideEffects.redirect = location;
					callback(null, sideEffects);
				},
				render: function(viewName, model) {
					sideEffects.viewName = viewName;
					sideEffects.model = model;
					callback(null, sideEffects);
				},
				send: function(body) {
					sideEffects.send = body;
					callback(null, sideEffects);
				},
        status: function(status) {
          sideEffects.status = status;
          callback(null, sideEffects);
        },
        end: function(end) {
          sideEffects.end = end;
          callback(null, sideEffects);
        }
			};
			return defaultResponse;
		}
	};

};

module.exports = MockExpress;
