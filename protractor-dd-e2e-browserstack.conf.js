'use strict';

var config       = require( './config' );
var request      = require( 'request' );
var SpecReporter = require( 'jasmine-spec-reporter' );
var spec         = new SpecReporter( { 'displayStacktrace' : true } );
var _            = require( 'lodash' );
var io           = require( 'socket.io-client' );

let env = process.env;

exports.config = {
	// Framework needed
	'framework'       : 'jasmine2',
	'seleniumAddress' : 'http://hub.browserstack.com/wd/hub',
	'baseUrl'         : 'https://dev.observe.edivate.com',
	'multiCapabilities' : config.multiCapabilities,
	'jasmineNodeOpts' : {
		'showColors'             : true, // Use colors in the command line report.
		'isVerbose'              : true,
		'defaultTimeoutInterval' : 1200000,
		'print'                  : function () {}
	},
	'allScriptsTimeout' : 120000,
	'specs'             : [ '../observation-public/test/single-pass/index.spec.js' ],
	'onPrepare'         : function () {
		var socket = io( 'ws://localhost:3401' );
		socket.on( 'connect', function () {
			// Register machine
			browser
				.driver
				.session_
				.then( function ( sessionDetails ) {

					// request master to create file 
					request( {
						'method' : 'POST',
						'url'    : 'http://localhost:3400/test-cases/' + id + '/logfile',
						'body'   : {},
						'json' : true
					}, function () {
						// in preparation for logging
						// console.log( 'created' );
					} );

					var session = sessionDetails.id_;
					var url = 'https://' + env.BROWSERSTACK_USER + ':' + env.BROWSERSTACK_KEY + '@www.browserstack.com/automate/sessions/'+session+'.json';
					request( {
						'url' : url,
					}, function ( error, response, body ) {
						if( error ) {
							return;
						}
						browser.params.browserStackBody = body;
						socket.emit( 'register-browserstack', {
							'browserstack' : body
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
					} );
				} );
		} );

		jasmine.getEnv().addReporter( spec );
		global.isAngularSite = function( flag ){
			browser.ignoreSynchronization = !flag;
		};
	},
	'onComplete' : function () {
		spec.metrics.endTime = new Date();
		request( {
			'method' : 'POST',
			'url'    : 'http://localhost:3400/machines/1/test-cases/' + browser.params.templateId,
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
