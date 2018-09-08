// I hate making wheels
var MockExpress = function(route) {
	var express = require('express'),
		extend = require('extend'),
		URL = require('url'),
		qs = require('querystring'),
		assert = require('assert'),
		router = new express.Router(),
		sideEffects = { session: {}, model: {} },

		defaultRequest, defaultResponse, defaultNext;

	if (!express.settings) {
		express.settings = {};
	}

	/**
	 * Next
	 *
	 * @param {object} value object send to next
	 *
	 * @returns {object} whatever the function received
	 */
	defaultNext = (value) => {
		return value;
	};

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
			next = next || defaultNext;

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
					return this;
				},
				redirect: function(location) {
					sideEffects.redirect = location;
					callback(null, sideEffects);
					return this;
				},
				set: function(headers) {
					sideEffects.headers = Object.assign(sideEffects.headers || {}, headers);
					callback(null, sideEffects);
					return this;
				},
				render: function(viewName, model) {
					sideEffects.viewName = viewName;
					sideEffects.model = model;
					callback(null, sideEffects);
					return this;
				},
				send: function(body) {
					sideEffects.send = body;
					callback(null, sideEffects);
					return this;
				},
				status: function(status) {
					sideEffects.status = status;
					callback(null, sideEffects);
					return this;
				},
				end: function(end) {
					sideEffects.end = end;
					callback(null, sideEffects);
					return this;
				},
				getHeader: function(str) {
					return (sideEffects.headers && sideEffects.headers[str]) || '';
				},
				write: function(str) {
					sideEffects.write = sideEffects.write || '';
					sideEffects.write += str;
					// callback(null, sideEffects);
					return this;
				},
				push: function(data) {
					sideEffects.triggers = sideEffects.triggers || {};
					sideEffects.triggers.data && sideEffects.triggers.data(data);
					sideEffects.push = sideEffects.push || '';
					sideEffects.push += data;
					return this;
				},
				emit: function(ev, data) {
					sideEffects.triggers = sideEffects.triggers || {};
					sideEffects.triggers[ev] && sideEffects.triggers[ev](data);
					sideEffects.emit = sideEffects.emit || '';
					sideEffects.emit += typeof data != 'undefined' ? data : '';
					if (ev === 'end') {
						callback(null, sideEffects);
					}
					return this;
				},
				once: function(ev, callback) {
					sideEffects.triggers = sideEffects.triggers || {};
					sideEffects.triggers[ev] = function() {
						if (callback.called) {
							return;
						}
						callback.called = true;
						callback.apply(null, Array.prototype.slice.apply(arguments));
					}
					return this;
				},
				on: function(ev, callback) {
					sideEffects.triggers = sideEffects.triggers || {};
					sideEffects.triggers[ev] = callback;
					return this;
				}
			};
			return defaultResponse;
		}
	};

};

module.exports = MockExpress;
