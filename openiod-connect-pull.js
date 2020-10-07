/*
** Module: openiod-connect-pull.js
**  Connector to pull data from a source and push to target
**
**
**
*/

/*

Id: openiod-connect-pull
Generic pull service as part of the generic connector to enable pull services and to connect external target services.

Copyright (C) 2020  André van der Wiel / Scapeler http://www.scapeler.com

This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or
send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.along with this program.
If not, see <https://www.gnu.org/licenses/>.

*/

"use strict";
// **********************************************************************************
// add module specific requires
var   axios = require('axios');

var _openIoDConfig;
var _processPath;
var _service;
var _source;
var _sourceIdMap;
var _sourceAttributeMap;
var _sourceCopyTarget;
var _target;
var logger
var self;

var stations = []

var clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}



module.exports = {

	init: function (service,openIoDConfig) {
		self = this;
		_openIoDConfig 			= openIoDConfig;
		logger = _openIoDConfig.logger
		logger.info('Init service '+service.serviceName);
		_service 						= service;
		_source 						= service.source;
		_sourceIdMap 				= _source.idMap;
		_sourceAttributeMap = _source.attributeMap;
    _processPath        = _openIoDConfig.getProcessLocalPath();

		if (_source.processor) {

			_source.sourceProcessor 	= require(_processPath+'/processor/'+_source.processor);
			logger.info(_source.sourceProcessor)
		}
		if (_source.controller) {
			_source.sourceController 	= require(_processPath+'/controller/'+_source.controller);
		}
		_sourceCopyTarget		= service.sourceCopyTarget;
		_target							= service.target;

		var promiseIds
		if (_service.source.sourceProcessor !== undefined) {
			logger.info('Start processor')
			_service.source.sourceProcessor.init(_service,openIoDConfig)
			return
		}
/*
			// // DEBUG:
			// for test aggregate function
			if (promiseIds == undefined) {
				//logger.info('stopped in debug mode aggregate')
				return
			} else if(promiseIds.then==undefined) {
				//logger.info('stopped in debug mode aggregate')
				return
			}
			logger.info('C')

			promiseIds
			.then(function(response) {
				//logger.info('available stations retrieved')
				var ids = response.data.data
				idIndex=0
				getDataForIds(_service,openIoDConfig,ids)
			}, function(err) {
				logger.info(err)
			})
			//this.getData();
		} else this.getData();
*/
	},
	getData:function(){
		logger.info('getData')
		var fois = _openIoDConfig.getArgv().fois;
		var params = '';
		//logger.info(_openIoDConfig)
		//logger.info(fois)
		for (var i=0;i<fois.length;i++) {
			var foi = fois[i];
			if (i==0) {
				params = ""+foi.id;
			} else {
				params = params + ',' + foi.id;
			}
		}
		var path = _source.prefixPath+_source.path+params+_source.suffixPath;

		var options = {
  		hostname: _source.host,
			foiId : fois[0].id,
  		port: _source.port,
  		path: path,
  		method: _source.method,
			headers: { 'Authorization': 'Bearer '+_source.token
					, 'content-type': 'application/json; charset=utf-8' } //'Accept-Encoding': 'gzip,deflate',
		};

		if (_source.suffixPath == '/timeseries') {
			logger.info(_service.source.processCycle)
			//for (_service.source.processCycle.startDate < _service.source.processCycle.endDate) {
				var m=''+(_service.source.processCycle.startCycleDate.getUTCMonth()+1)
				if (m.length==1) {
					m='0'+m
				}
				var d=''+(_service.source.processCycle.startCycleDate.getUTCDate())
				if (d.length==1) {
					d='0'+d
				}
				var _parmHour = _service.source.processCycle.startCycleDate.getUTCHours()+1;
				options.path = path + '/' +
					_service.source.processCycle.startCycleDate.getUTCFullYear() +
					m +
					d +
					'/' + _parmHour  // for Josene parameter UTC hour + 1 (1-24)
					this.getHttps(options, this.processResult);
			//}
		} else {
			this.getHttps(options, this.processResult);
		}

	},
	getHttps:function(options, callback){
		logger.info('Service: '+_service.name+' retrieve source data.')
		logger.info(options)
		var result='';
		https.get(options, (res) => {
		  logger.info('statusCode:'+ res.statusCode);
		  //logger.info('headers:', res.headers);
		  res.on('data', (d) => {
		    //process.stdout.write(d);
				//logger.info('Service data: '+_service.name+' data retrieved.')
				result=result+d
				//callback(d.toString());
		  });
			res.on('end', (d) => {
		    //process.stdout.write(d);
				logger.info('Service end: '+_service.name+' data retrieved.')
				callback(result.toString(),options);
		  });
		}).on('error', (e) => {
			logger.info('Service: '+_service.name+' data retrieve error.')
		  logger.error(e);
		});
	},
	processResult:function(result,options){
		logger.info('processResult')
		logger.info(result.substr(0,5000))
		var _resultJson = JSON.parse(result);
		var _result=''
		var fiwareObject 		= {};
		// josene timeseries?
		var joseneHist=false
		if (_resultJson.date!=undefined & _resultJson.hour!=undefined & _resultJson.timeseries!=undefined) {
			logger.info(_resultJson.date +' '+ _resultJson.hour +' '+ _resultJson.timeseries.length)
			_result=_resultJson.timeseries
			joseneHist=true
		} else {
			_result=_resultJson
		}
		//logger.info(_result)
		//logger.info(_result[0])
		logger.info('Number of timeseries in this hour: ' + _result.length);
		fiwareObjects = []
		for (var i=0;i<_result.length;i++){
			var sourceData 				= _result[i];
			var _attributeId 			= _sourceIdMap["id"];
			var _attributeDateTime= _sourceIdMap["entityTime"];
			var _id 							= sourceData[_attributeId];
			var _dateTime 				= sourceData[_attributeDateTime];
			if (joseneHist == true) {
				_id 			= 'J'+options.foiId
				sourceData.id = _id
			}
			var _key 							= _id+'_'+_dateTime;
			if (_sourceCopyTarget && _sourceCopyTarget.active){
				self.sendToSourceCopyTarget({"id":_id,"dateTime":_dateTime,"key":_key},sourceData, _sourceCopyTarget);
			}

			if (_sourceController) {
				_sourceController.init(_service,_openIoDConfig,sourceData);
			}
			for (var m=0;m<_sourceAttributeMap.length;m++){
				if (m==1) continue
				var _map 						= _sourceAttributeMap[m];
				fiwareObject 		= {};
				if (_sourceController.getDefaults) {
					_sourceController.setDefaults();
					fiwareObject = _sourceController.getDefaults();
				}
				for (var attribute in _map.attributes){
					var targetAttribute		=_map.attributes[attribute];
					if(sourceData[attribute]){
						var _attr = sourceData[attribute];
						if(_sourceController[attribute]) {
							var targetValue = _sourceController[attribute](sourceData[attribute]);
							//if (attribute=='s_pm2_5') {
								//logger.info(' Validation for attribute '+ attribute+ ' value: ' );
								//logger.info(targetAttribute)
								//logger.info(targetValue)
							//}
							logger.info(targetValue)
							if (targetValue != undefined) fiwareObject[targetAttribute]=clone(targetValue);
//							logger.info('   Old / New value: '+ _attr + ' / ' + fiwareObject[targetAttribute]);
//							logger.info(fiwareObject[targetAttribute]);
						} else {
							logger.info(' No validation for attribute '+ attribute);
							fiwareObject[targetAttribute]=sourceData[attribute];
						}
					}
				}

				if (_target && _target.active){
					if (_target.entityTimeConfig){
						var _tmpDateTime = new Date(_dateTime);
						if (_target.entityTimeConfig.round=='UP' && _target.entityTimeConfig.trunc=='minute') {
							_tmpDateTime = new Date(_tmpDateTime.getTime()+59999);
							fiwareObject.entityTime = new Date(_tmpDateTime.getFullYear(),_tmpDateTime.getMonth(),_tmpDateTime.getDate()
													,_tmpDateTime.getHours(),_tmpDateTime.getMinutes()).toISOString();
							fiwareObject.id			=_map.targetIdPrefix+_id+'_'+fiwareObject.entityTime;
							fiwareObject.type		=_map.targetType;
						}	else {
							fiwareObject.entityTime = _dateTime;
							fiwareObject.id			=_map.targetIdPrefix+_key;
							fiwareObject.type		=_map.targetType;
						}
					}
					//logger.info('yyyyyyyyyyyyyyyyyyyy')
					//var fiwareObjectClone = clone(fiwareObject)
					//logger.info(fiwareObject)
					fiwareObjects.push(fiwareObject)
					//setTimeout(self.sendToTarget,i*200,fiwareObjectClone, _target)
					//self.sendToTarget(fiwareObject, _target);
				}
			}
		}
//		logger.info(fiwareObjects[0])
//		logger.info(fiwareObjects[1])
//		return
		fiwareObjectsIndex=0
		self.processFiwareObjects()
	},
	processFiwareObjects: function(){
		logger.info('Process record: '+fiwareObjectsIndex+'/'+fiwareObjects.length)
		var fiwareObject = fiwareObjects[fiwareObjectsIndex]
		logger.info(fiwareObjectsIndex)
		logger.info(fiwareObject)
		self.sendToTarget(fiwareObject, _target);
	},
	sendToSourceCopyTarget: function(id,data,target) {
		var _key ='source_'+id.key;
		logger.info('Send to source copy target with id: '+_key);
		var fiwareObject = {};
		fiwareObject.id = _key;
		fiwareObject.type = 'sourceAttributes';
		fiwareObject.content = data;
		self.sendToTarget(fiwareObject,target);
	},
	sendToTarget: function(fiwareObject,target) {
		var _fiwareObject = fiwareObject
		logger.info(fiwareObject);
		//logger.info(target);
		if (target.name=='contextBroker') {
			self.postDataContextBroker(_fiwareObject,target)
		}
	},
	postDataContextBroker:function(fiwareObject,target){
		var _fiwareObject = fiwareObject
//		logger.info(_fiwareObject)
		logger.info('POST data '+target.name+' '+target.host+':'+target.FiwareService+target.FiwareServicePath+' id:'+_fiwareObject.id+' type:'+_fiwareObject.type);
//		var postData = {};
//		postData.id = fiwareObject.id;
//		postData.type = fiwareObject.type;
//		postData.content = fiwareObject.sourceAttributes;
		//logger.info('xxxxxxxxxxxxxxxxxx')
    //logger.info(_fiwareObject)
//    if (_fiwareObject.PM25 != undefined) {
//			logger.info('2xxxxxxxxxxxxxxxxx')
//			logger.info(_fiwareObject.PM25.value)
//		}
		var _data = JSON.stringify(_fiwareObject);
		var _url = target.protocol+"://"+target.host+":"+target.port+target.prefixPath+target.path
		logger.info(_url)

		var options = {
		  hostname: target.host,
		  port: 		target.port,
		  path: 		target.prefixPath+target.path,
		  method: 	target.method,
		  headers: {
		       'Content-Type': 				'application/json',
		       'Content-Length': 			_data.length,
					 'Fiware-Service': 			target.FiwareService,
					 'Fiware-ServicePath': 	target.FiwareServicePath
		     },
			data: _data,
			url:_url
		};
		axios(options,
//			{
//    	method: 'post',
//    	url: '/addUser',
//    	data: _data
//		}
	)
		.then(function (response) {
			if (response.data.statusCode == '422') {
				logger.info('Statuscode 422 and '+ response.data.statusDesc);
//				logger.info(response.data)
			}
			if (response.data.statusCode == '422' && response.data.statusDesc=='Already Exists') {
				// if (response.data.statusDesc=='Already Exists') {
	//			if (response.data.description=='Already Exists') {
					logger.info('Already Exists');
			}
			if (response.data.status == '422') {
				logger.info('Status 422 and '+ response.data.statusData.description);
			}
			if (response.data.status == 422 && response.data.statusData.description=='Already Exists') {
				// if (response.data.statusDesc=='Already Exists') {
				// if (response.data.description=='Already Exists') {
					logger.info('Already Exists 2');
			}

			fiwareObjectsIndex++
			if (fiwareObjectsIndex<fiwareObjects.length) {
				self.processFiwareObjects()
			}
		})
		.catch(function (error) {
			if (error.response) {
					// The request was made and the server responded with a status code
					// that falls out of the range of 2xx
					logger.info('error.response');
					//logger.info(error.response.data);
					logger.info(error.response.status);
					//logger.info(error.response.headers);
			} else if (error.request) {
				logger.info('error.request');
					// The request was made but no response was received
					// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// http.ClientRequest in node.js
					//logger.info(error.request);
			} else {
					// Something happened in setting up the request that triggered an Error
					logger.info('Error', error.message);
			}
			//logger.info(error.config);
			logger.info('Error config code: '+ error.code);
			logger.info(error)


			fiwareObjectsIndex++
			if (fiwareObjectsIndex<fiwareObjects.length) {
				self.processFiwareObjects()
			}
		});

},
postDataContextBrokerOld:function(fiwareObject,target){
	var _fiwareObject = fiwareObject
//		logger.info(_fiwareObject)
	logger.info('POST data '+target.name+' '+target.host+':'+target.FiwareService+target.FiwareServicePath+' id:'+_fiwareObject.id+' type:'+_fiwareObject.type);
//		var postData = {};
//		postData.id = fiwareObject.id;
//		postData.type = fiwareObject.type;
//		postData.content = fiwareObject.sourceAttributes;
	//logger.info('xxxxxxxxxxxxxxxxxx')
	//logger.info(_fiwareObject)
//    if (_fiwareObject.PM25 != undefined) {
//			logger.info('2xxxxxxxxxxxxxxxxx')
//			logger.info(_fiwareObject.PM25.value)
//		}
	var _data = JSON.stringify(_fiwareObject);

	var options = {
		hostname: target.host,
		port: 		target.port,
		path: 		target.prefixPath+target.path,
		method: 	target.method,
		headers: {
				 'Content-Type': 				'application/json',
				 'Content-Length': 			_data.length,
				 'Fiware-Service': 			target.FiwareService,
				 'Fiware-ServicePath': 	target.FiwareServicePath
			 }
	};

	//logger.info(options);
	//logger.info(_data);
	var req = https.request(options, (res) => {
		logger.info('statusCode:' + res.statusCode);
		//logger.info('headers:', res.headers);

		res.on('data', (d) => {
			process.stdout.write(d);
			//logger.info(d);
			logger.info('data')

		});
		res.on('end', (d) => {
			//process.stdout.write(d);
			logger.info('Service end: '+_service.name+' data sent.')
			fiwareObjectsIndex++
			if (fiwareObjectsIndex<fiwareObjects.length) {
				self.processFiwareObjects()
			}
		});
	});

	req.on('error', (e) => {
		logger.info('error')
		logger.error(e);
		fiwareObjectsIndex++
		if (fiwareObjectsIndex<fiwareObjects.length) {
			self.processFiwareObjects()
		}
	});

	req.write(_data);
	req.end();
}

}

//"use strict";
// **********************************************************************************
