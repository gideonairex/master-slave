'use strict';

var config       = require( './config' );
var request      = require( 'request' );
var SpecReporter = require( 'jasmine-spec-reporter' );
var spec         = new SpecReporter( { 'displayStacktrace' : true } );
var _            = require( 'lodash' );
var io           = require( 'socket.io-client' );
var uuid         = require( 'uuid');
var Promise      = require( 'bluebird' );

let env = process.env;

exports.config = {
	// Framework needed
	'framework'       : 'jasmine2',
	'seleniumAddress' : 'http://localhost:4444/wd/hub',
	'baseUrl'         : 'http://localhost:8000',
	'capabilities'    : {
		'browserName' : 'chrome'
	},
	'jasmineNodeOpts' : {
		'showColors'             : true, // Use colors in the command line report.
		'isVerbose'              : true,
		'defaultTimeoutInterval' : 1200000,
		'print'                  : function () {}
	},
	'allScriptsTimeout' : 120000,
	'specs'             : [ '../observation-public/test/single-pass/index.spec.js' ],
	'onPrepare'         : function () {
		jasmine.getEnv().addReporter( spec );
		return new Promise( function ( resolve, reject ) {
			request( 'http://10.1.2.47:3400/test-cases/{bowser.param.templateId}', function ( error, response, body ) {
				if ( !error && response.statusCode == 200 ) {
					browser.params.template = body;
					var socket = io( 'ws://10.1.2.47:3401' );
					socket.on( 'connect', function () {
						browser.params.browserStackBody = {
							'automation_session' : {
								'browser'            : 'chrome',
								'os'                 : 'OS X',
								'os_version'         : 'Yosemite'
							}
						};
						socket.emit( 'register-browserstack', {
							'browserstack' : browser.params.browserStackBody,
							'session'      : uuid.v4()
						} );
						// Override console.log
						var old = console.log;
						console.log = function () {
							//Array.prototype.unshift.call(arguments, 'Report: ');
							// Keep this for debugging purposes
							old.apply( this, arguments );
							socket.emit( 'browserstack-stream', {
								'data' : arguments
							} );
						};
						resolve();
					} );
				}
			} )
		} );
	},
	'onComplete' : function () {
		spec.metrics.endTime = new Date();
		request( {
			'method' : 'POST',
			'url'    : 'http://10.1.2.47:3400/machines/1/test-cases/' + browser.params.templateId,
			'body'   : {
				'browserstack' : browser.params.browserStackBody,
				'spec'         : spec.metrics
			},
			'json' : true
		}, function () {
			//console.log( 'Good' );
		} );
	}

};
