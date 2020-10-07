
/**
 * The openiod-connect-pull-config module for init and configuration
 * @module openiod-connect-pull-config
 */

 /*

 Id: openiod-connect-pull-config
 Module for configuration parameters.

 Copyright (C) 2020  André van der Wiel / Scapeler https://www.scapeler.com

 This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
 To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or
 send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.along with this program.
 If not, see <https://www.gnu.org/licenses/>.

 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

	var fs 		= require('fs'),
			path 	= require('path'),
			os 		= require('os');
	const appRoot = require('app-root-path');
	const moduleInfo = require('./package.json')
	const commander = require('commander')
	const program = new commander.Command()
	const winston = require('winston')
	require('winston-daily-rotate-file');

	// Winston logger
	var logger = new winston.createLogger({
		exitOnError: false // do not exit on handled exceptions
	});
	logger.stream = {
		write: function(message, encoding) {
			logger.info(message);
		}
	};

	program
	  .version(moduleInfo.version, '-v, --version')
	  .usage('[OPTIONS]...')
	  .requiredOption('-c, --config [type]', 'Path to config file')
		.requiredOption('-s, --service [type]', 'Name of the service')
		.requiredOption('-p, --processpath [type]', 'Path to processor and controller')

	program.parse(process.argv);

	if (program.config === true) {
  	logger.error('no config value for configfile!');
  	process.exit(1);
	}
	if (program.service === true) {
  	logger.error('no service value given for servicename!');
  	process.exit(1);
	}
	if (program.processpath === true) {
  	logger.error('no path value given for processpath!');
  	process.exit(1);
	}
	logger.info('config path:', program.config);
	logger.info('service:', program.service);
	logger.info('processpath:', program.processpath);

	var mainSystemCode,
		parameter,
		request,
		argv,
		systemBaseCode,
		systemCode,
		systemConfigLocalPath,
		systemConfigStr,
		systemConfig,
		systemProcessLocalPath,
		systemContext,
		systemFolder,
		systemFolderParent,
		systemHostName,
		systemMainModuleName,
		systemName,
		systemServiceType,
		systemStart,
		systemVersion,
		systemVersionL1,
		systemVersionL2,
		systemVersionL3,
		localService,
		localServiceContent

		module.exports = {
			logger:logger,

			init: function (name,runtime_argv) {
				systemStart 							= new Date();

				systemHostName						= os.hostname();
				systemFolder 							= __dirname;
				systemFolderParent				= appRoot.path //path.resolve(__dirname, '../node_modules/' + name + '/../..');

				systemMainModuleName 			= name;
				systemBaseCode 						= path.basename(systemFolderParent);
				argv											= runtime_argv;

				systemConfigLocalPath 		= systemFolderParent + '/../' + program.config
				systemConfigStr 					= fs.readFileSync(systemConfigLocalPath+"/"+program.service+".json");
				systemConfig 							= JSON.parse(systemConfigStr);

				systemProcessLocalPath 		= systemFolderParent + '/../' + program.processpath

				// IMPORTANT: SYSTEM CONFIGURATION VALUES !!!
				systemName 								= systemConfig.system.systemName;
				systemCode 								= systemConfig.system.systemCode;
				mainSystemCode 						= systemConfig.system.systemCode;
				systemVersionL1 					= systemConfig.system.version.l1;
				systemVersionL2 					= systemConfig.system.version.l2;
				systemVersionL3 					= systemConfig.system.version.l3;
				systemVersion 						= systemVersionL1 + '.' + systemVersionL2 + '.' + systemVersionL3;
				systemServiceType 				= systemConfig.system.serviceType;

				// context(s)
				systemContext							= systemConfig.context;

				// service(s)
				localService							= systemConfig.service;
				localService.default.serviceName = program.service

//				localServiceContent				= systemConfig.service[argv.serviceName];
				localServiceContent				= systemConfig.service.default

				// Parameters
				parameter									= systemConfig.parameter;

				logger.configure({
					level: 'verbose',
			    transports: [
//						new winston.transports.File(localServiceContent.log.file),
						new winston.transports.DailyRotateFile(localServiceContent.log.file),
						new winston.transports.Console(localServiceContent.log.console)
			    ]
  			});

				logger.info('=================================================================');
				logger.info('');
				logger.info('Start systemname         : ' + systemName);
				logger.info(' Systemmaincode / subcode: ' + mainSystemCode + ' '+ systemCode );
				logger.info(' Systemversion           : ' + systemVersion);
				logger.info(' Systemhost              : ' + systemHostName);
				logger.info(' System folder           : ' + systemFolder);
				logger.info(' System folder parent    : ' + systemFolderParent);
				logger.info(' System config folder    : ' + systemConfigLocalPath);
				logger.info(' System process folder   : ' + systemProcessLocalPath);
				logger.info(' System Main modulename  : ' + systemMainModuleName);
				logger.info(' Config location         : ' + program.config);
				logger.info(' Service                 : ' + program.service);
				logger.info(' Servicetype             : ' + systemServiceType);
				logger.info(' System start            : ' + systemStart.toISOString());
				logger.info('=================================================================\n');
				logger.info('=================================================================');
				logger.info('LICENSE');
				logger.info('	');
				logger.info('Id: openiod-connect-pull-config');
				logger.info('Generic service for pull connector');
				logger.info('	');
				logger.info('Copyright (C) 2019  André van der Wiel / Scapeler https://www.scapeler.com');
				logger.info('')
				logger.info('This program is free software: you can redistribute it and/or modify');
				logger.info('it under the terms of the GNU Affero General Public License as published');
				logger.info('by the Free Software Foundation, either version 3 of the License, or');
				logger.info('(at your option) any later version.');
				logger.info('')
				logger.info('This program is distributed in the hope that it will be useful,');
				logger.info('but WITHOUT ANY WARRANTY; without even the implied warranty of');
				logger.info('MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the');
				logger.info('GNU Affero General Public License for more details.');
				logger.info('')
				logger.info('You should have received a copy of the GNU Affero General Public License');
				logger.info('along with this program.  If not, see <https://www.gnu.org/licenses/>.');
				logger.info('')
				logger.info('=================================================================\n');

				if (mainSystemCode != systemBaseCode) {
					logger.info('ERROR: SYSTEMCODE OF CONFIG FILE NOT EQUAL TO SYSTEM BASECODE (' + systemCode + ' vs ' + systemBaseCode + ')');
					return false;
				}
				return true;

			},  // end of init

			getSystemCode: function () {
				return systemCode;
			},

			getSystemFolderParent: function () {
				return systemFolderParent;
			},

			getSystemFolder: function () {
				return systemFolder;
			},

			getContext: function (context) {
				var _context = null;
				if (systemConfig.context && systemConfig.context[context]) {
					_context 	= systemConfig.context[context];
				}
				return _context;
			},
			getConfigParameter: function () {
				return parameter;
			},

			getConfigLocalPath: function () {
				return systemConfigLocalPath;
			},

			getConfigService: function (serviceName) {
				if (serviceName === undefined) return localService.default
				else return localService[serviceName];
			},

			getProcessLocalPath: function () {
				return systemProcessLocalPath;
			},

			getArgv: function() {
				return argv;
			},

			setProcessCycle: function(processCycle) {
				localServiceContent.source.processCycle = processCycle;
			},
			getProcessCycle: function() {
				return localServiceContent.source.processCycle;
			}

		} // end of module.exports
