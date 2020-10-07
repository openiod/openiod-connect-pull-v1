/*
** Module: index.js
**   OpenIod connect main module
**
**
*/
/*

Id: openiod-connect-pull
A generic connector to enable pull from source and send to target

Copyright (C) 2020  André van der Wiel / Scapeler https://www.scapeler.com

This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or
send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.along with this program.
If not, see <https://www.gnu.org/licenses/>.

*/

"use strict";

const path 	= require('path')

var main_module = 'openiod-connect-pull'
var modulePath = __dirname
var openIoDConfig = require(path.normalize(modulePath + '/openiod-connect-pull-config'))

var self = this

// **********************************************************************************

// config objects
var _systemCode 				= openIoDConfig.getSystemCode();
var _systemFolderParent	= openIoDConfig.getSystemFolderParent();
var _systemFolder				= openIoDConfig.getSystemFolder();
var _systemParameter		= openIoDConfig.getConfigParameter();
var logger = openIoDConfig.logger;

var _service;
var serviceCache	= {};

openIoDConfig.init(main_module);

function resolveAfterWaitTime(time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('resolved service at '+ new Date());
      logger.info('calling service');
      var processCycle = openIoDConfig.getProcessCycle();
      if (processCycle) {
        if (processCycle.endCycleDate < processCycle.endDate) {
          processCycle.startCycleDate   = new Date(processCycle.endCycleDate.getTime()+1); // new cycle continues where previous cycle has ended
          processCycle.endCycleDate     = new Date(processCycle.endCycleDate.getTime()+ _service.procedure.repeat.cycleTime); // 60 minutes per cycle. normal 3 hours, luchtmeetnet per hour!
          if (processCycle.endCycleDate> processCycle.endDate){
            processCycle.endCycleDate   = new Date(processCycle.endDate.getTime());
          } else {
            asyncCall();  // activate next cycle in wait state
          }
          openIoDConfig.setProcessCycle(processCycle);
          serviceCache[_service.name].init(_service,openIoDConfig);
        } else {
          logger.info("Cycles completed, process end.")
        }
      } else {
        asyncCall();  // activate next cycle in wait state
        serviceCache[_service.serviceName].init(_service,openIoDConfig);
      }
    }, time);
  });
}

async function asyncCall() {
  var result = await resolveAfterWaitTime(_service.procedure.repeat.wait);
  logger.info('Service end: '+result);
}

//asyncCall();


// **********************************************************************************

// todo: see messages in OGC 06-121r3 Table 8
var errorMessages = {
	  NOQUERY 					: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 				: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 				: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 				: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 					: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOFOI 						: { "message": 'Feature of Interest missing'	, "returnCode": 501 }
	, NOMODEL 					: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
	, NOARGVCOMMAND			: { "message": 'ERROR: Commandline argument command is missing or incorrect (push/pull/serve/ttn)'		, "returnCode": -1 }
	, NOARGVSERVICE			: { "message": 'ERROR: Commandline argument service is missing or unknown in this setting'		, "returnCode": -1 }
}

// standardQueryKeys, conversion table to convert 'semi'-standard keys into standard keys.
var standardQueryKeys = {
	  "SERVICE" : 'SERVICE'		// key=uppercase keyname; value=standard keyname
	, "REQUEST" : 'REQUEST'
}

var getModule = function(service,modulePath) {
	try {
    logger.info('Load module: '+modulePath);
    console.log(modulePath)
    serviceCache[service.serviceName] = require(path.normalize(modulePath+'.js'));
	}
	catch(e) {
		 logger.info(e)
	}
}
var executeService = function() {

	if (serviceCache[_service.serviceName] == null ) {
		getModule(_service,__dirname+'/' +_service.procedure.module);
		if (serviceCache[_service.serviceName] == null ) {
			getModule(_service,__dirname+'/' +_service.procedure.module+'/'+_service.procedure.module);
		}
		if (serviceCache[_service.serviceName] == null ) {
			logger.error('Error: module not found:' + _service.procedure.module);
      logger.info(__dirname);
			return -1;
		}
	}

  logger.info('calling service 1e time');

/*
  if (argv.fois && argv.fois[0].startDate && argv.fois[0].endDate) {
    var _foi = argv.fois[0];
    logger.info("Set processcycle");
    logger.info(_foi)
    var processCycle = {};
    processCycle.startDate = new Date(_foi.startDate);
    processCycle.endDate = new Date(_foi.endDate);
    processCycle.startCycleDate = new Date(_foi.startDate);
    processCycle.endCycleDate = new Date(processCycle.startCycleDate.getTime() + _service.procedure.repeat.cycleTime - 1);
		processCycle.cycleTime = _service.procedure.repeat.cycleTime;
    //process (2x?) 60 minutes per cycle. normal 3 hours, luchtmeetnet per hour!
    _service.source.processCycle = processCycle;
    logger.info(processCycle)
  }
*/

  serviceCache[_service.serviceName].init(_service,openIoDConfig);
  if (_service.procedure.repeat && _service.procedure.repeat.wait) {
		// repeat service every 'wait'-time.
    asyncCall();
  }

	return;
};

_service = openIoDConfig.getConfigService();

if (_service === undefined) {
	logger.error(errorMessages.NOARGVSERVICE.message);
	return errorMessages.NOARGVSERVICE.returnCode;
}

logger.info("OpenIoD execute: " + ' service '+ _service.serviceName)
if (_service.source!=undefined) logger.info("- source  : " + _service.source.name + ', procedure: ' + _service.procedure.name)
if (_service.target!=undefined) logger.info("- target  : " + _service.target.name);

exports.init = function () {
  executeService();
};
