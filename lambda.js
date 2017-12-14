"use strict";
var rp = require("request-promise");
const uuidv4 = require("uuid/v4");
const endpoints_config = require("./conf/endpoints_config.json");
const hass_api_config = require("./conf/hass_api_config.json");

exports.handler = function (request, context) {
/*#################################
############# helpers #############
#################################*/

    //looger
    function logger(level, func, msg) {
        console.log(level.toUpperCase() + " in " + func + ": " + msg);
    }

    //home assistant api access
    function hassApi(path, method, body, callback) {
        var options = {
            uri: hass_api_config.api_url + ":" + hass_api_config.api_port + path,
            method: method.toUpperCase(),
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "x-ha-access": hass_api_config.api_password
            },
            json: true
        };
        if (body) {
            options.body = body;
        }
        rp(options)
            .then(function (body) {
                callback(null, body);
            })
            .catch(function (err) {
                callback(err, null);
            });

    }

/*#################################
###### error response makers ######
#################################*/

    //generic response
    function createErrorResponse(request, type, _msg) {
        var responseHeader = {
            namespace: "Alexa",
            name: "ErrorResponse",
            messageId: uuidv4(),
            correlationToken: request.directive.header.correlationToken,
            payloadVersion: "3"
        };

        var responseEndpoint = {
            endpointId: request.directive.endpoint.endpointId
        };

        var responsePayload = {
            type: type,
            message: _msg
        };

        var response = {
            event: {
                header: responseHeader,
                endpoint: responseEndpoint,
                payload: responsePayload
            }
        };
        return response;
    }

    //out of range error
    function createOutOfRangeErrorResponse(request, minValue, maxValue) {
        var responseHeader = {
            namespace: "Alexa",
            name: "ErrorResponse",
            messageId: uuidv4(),
            correlationToken: request.directive.header.correlationToken,
            payloadVersion: "3"
        };

        var responseEndpoint = {
            endpointId: request.directive.endpoint.endpointId
        };

        var responsePayload = {
            type: "TEMPERATURE_VALUE_OUT_OF_RANGE",
            message: "The requested temperature cannot be set.",
            validRange: {
                minimumValue: {
                    value: minValue,
                    scale: "CELSIUS"
                },
                maximumValue: {
                    value: maxValue,
                    scale: "CELSIUS"
                }
            }
        };

        var response = {
            event: {
                header: responseHeader,
                endpoint: responseEndpoint,
                payload: responsePayload
            }
        };

        return response;
    }

    //thermostat is off response
    function createThermostatIsOffResponse(request, _msg) {
        var responseHeader = {
            namespace: "Alexa.ThermostatController",
            name: "ErrorResponse",
            messageId: uuidv4(),
            correlationToken: request.directive.header.correlationToken,
            payloadVersion: "3"
        };

        var responsePayload = {
            type: "THERMOSTAT_IS_OFF",
            message: _msg
        };

        var response = {
            event: {
                header: responseHeader,
                payload: responsePayload
            }
        };
        return response;
    }

/*#################################
########## custom errors ##########
#################################*/

    function DirectiveNamespaceError(_func, _namespace) {
        this.name = "DirectiveNamespaceError";
        this.functionName = _func;
        this.directiveNamespace = _namespace;
    }

    function DirectiveNameError(_func, _namespace, _name) {
        this.name = "DirectiveNameError";
        this.functionName = _func;
        this.directiveNamespace = _namespace;
        this.directiveName = _name;
    }

    function DiscoveryError(_func, _msg) {
        this.name = "DiscoveryError";
        this.functionName = _func;
        this.contextMessage = _msg;
    }

    function InvalidValueError(_func) {
        this.name = "InvalidValueError";
        this.functionName = _func;
    }

    function BridgeUnreachableError(_func) {
        this.name = "BridgeUnreachableError";
        this.functionName = _func;
    }

    function NoSuchEndpointError(_func, _msg) {
        this.name = "NoSuchEndpointError";
        this.functionName = _func;
        this.message = _msg;
    }

    function OutOfRangeError(_func, _min, _max) {
        this.name = "OutOfRangeError";
        this.functionName = _func;
        this.minValue = _min;
        this.maxValue = _max;
    }

    function ThermostatIsOffError(_func, _msg) {
        this.name = "ThermostatIsOffError";
        this.functionName = _func;
        this.message = _msg;
    }

/*#################################
######### request handlers ########
#################################*/

    function handleDiscovery(context) {
        try {
            var ednpointsResponse = [];

            endpoints_config.forEach(function (currentEndpoint) {
                ednpointsResponse.push({
                    "endpointId": currentEndpoint.endpoint_unique_id,
                    "friendlyName": currentEndpoint.alexa_friendly_name,
                    "description": "AC Custom Thermostat by TomerFi",
                    "manufacturerName": "TomerFi",
                    "displayCategories": ["THERMOSTAT"],
                    "cookie": {
                    },
                    "capabilities": [
                        {
                            "type": "AlexaInterface",
                            "interface": "Alexa.ThermostatController",
                            "version": "3",
                            "properties": {
                                "supported": [
                                    {
                                        "name": "targetSetpoint"
                                    },
                                    {
                                        "name": "thermostatMode"
                                    }
                                ],
                                "proactivelyReported": false,
                                "retrievable": true
                            }
                        },
                        {
                            "type": "AlexaInterface",
                            "interface": "Alexa.PowerController",
                            "version": "3",
                            "properties": {
                                "supported": [{
                                    "name": "powerState"
                                }],
                                "proactivelyReported": false,
                                "retrievable": true
                            }
                        },
                        {
		                    "type":"AlexaInterface",
		                    "interface":"Alexa.TemperatureSensor",
		                    "version":"3",
		                    "properties":{
		                       "supported":[
		                          {
		                             "name":"temperature"
		                          }
		                       ],
		                       "proactivelyReported":false,
		                       "retrievable":true
		                    }
		                }
                    ]
                });
            });

            var responseHeader = {
                namespace: "Alexa.Discovery",
                name: "Discover.Response",
                payloadVersion: "3",
                messageId: uuidv4()
            };

            var responsePayload = {
                endpoints: ednpointsResponse
            };

            var response = {
                event: {
                    header: responseHeader,
                    payload: responsePayload
                }
            };
            context.succeed(response);
        } catch (err) {
            throw new DiscoveryError("handleDiscovery", err.message);
        }
    }

    function handleStateReports(request, context) {
        var requestEndpointId = request.directive.endpoint.endpointId;

        var modeEntity;
        var statusEntity;
        var temperatureEntity;

        var gotConfig = endpoints_config.some(function (endpoint) {
            if (endpoint.endpoint_unique_id === requestEndpointId) {
                modeEntity = endpoint.mode_input_select;
                statusEntity = endpoint.status_input_boolean;
                temperatureEntity = endpoint.degrees_control.degrees_input_text;
                return true;
            }
            return false;
        });

        if (gotConfig) {
            hassApi("/api/states/" + modeEntity, "GET", null, function (err, response) {
                if (!err) {
                    var currentMode = response.state;
                    hassApi("/api/states/" + statusEntity, "GET", null, function (err, response) {
                        if (!err) {
                            var currentStatus = response.state;
                            hassApi("/api/states/" + temperatureEntity, "GET", null, function (err, response) {
                                if (!err) {
                                    var currentTemperature = response.state;
                                    var sampleTimeIso = new Date().toISOString();
                                    var responseContext = {
                                        properties: [{
                                            namespace: "Alexa.ThermostatController",
                                            name: "targetSetpoint",
                                            value: {
                                                value: currentTemperature,
                                                scale: "CELSIUS"
                                            },
                                            timeOfSample: sampleTimeIso,
                                            uncertaintyInMilliseconds: 0
                                        }, {
                                            namespace: "Alexa.ThermostatController",
                                            name: "thermostatMode",
                                            value: currentMode,
                                            timeOfSample: sampleTimeIso,
                                            uncertaintyInMilliseconds: 0
                                        }, {
                                            namespace: "Alexa.PowerController",
                                            name: "powerState",
                                            value: currentStatus,
                                            timeOfSample: sampleTimeIso,
                                            uncertaintyInMilliseconds: 0
                                        }, {
                                            namespace: "Alexa.TemperatureSensor",
                                            name: "temperature",
                                            value: currentTemperature,
                                            timeOfSample: sampleTimeIso,
                                            uncertaintyInMilliseconds: 0
                                        }]
                                    };

                                    var responseHeader = {
                                        namespace: "Alexa",
                                        name: "StateReport",
                                        payloadVersion: "3",
                                        messageId: uuidv4(),
                                        correlationToken: request.directive.header.correlationToken
                                    };

                                    var responseEndpoint = {
                                        endpointId: requestEndpointId
                                    };

                                    var stateResponse = {
                                        context: responseContext,
                                        event: {
                                            header: responseHeader,
                                            endpoint: responseEndpoint,
                                            payload: {}
                                        }
                                    };
                                    context.succeed(stateResponse);
                                } else {
                                    throw new NoSuchEndpointError("handleStateReports", "Failed to get the state for entity " + temperatureEntity + "from hass.");
                                }
                            });
                        } else {
                            throw new NoSuchEndpointError("handleStateReports", "Failed to get the state for entity " + statusEntity + "from hass.");
                        }
                    });
                } else {
                    throw new NoSuchEndpointError("handleStateReports", "Failed to get the state for entity " + modeEntity + "from hass.");
                }
            });
        } else {
            throw new InvalidValueError("handleStateReports");
        }
    }

    function handlePowerControl(request, context, action) {
        var requestEndpointId = request.directive.endpoint.endpointId;

        var statusEntity;

        var gotConfig = endpoints_config.some(function (endpoint) {
            if (endpoint.endpoint_unique_id === requestEndpointId) {
                statusEntity = endpoint.status_input_boolean;
                return true;
            }
            return false;
        });

        if (gotConfig) {
            var body = {
                entity_id: statusEntity
            };
            hassApi("/api/services/input_boolean/turn_" + action, "POST", body, function (err, response) {
                if (!err) {
                    var hassData = response;
                    var sampleTimeIso = new Date().toISOString();
                    var currentStatus;
                    var gotStatus = hassData.some(function (retrievdEntity) {
                        if (retrievdEntity.entity_id === statusEntity) {
                            currentStatus = retrievdEntity.state;
                            return true;
                        }
                        return false;
                    });

                    if (gotStatus) {
                        var responseContext = {
                            properties: [{
                                namespace: "Alexa.PowerController",
                                name: "powerState",
                                value: currentStatus,
                                timeOfSample: sampleTimeIso,
                                uncertaintyInMilliseconds: 0
                            }]
                        };

                        var responseHeader = {
                            namespace: "Alexa",
                            name: "Response",
                            payloadVersion: "3",
                            messageId: uuidv4(),
                            correlationToken: request.directive.header.correlationToken
                        };

                        var responseEndpoint = {
                            endpointId: requestEndpointId
                        };

                        var powerResponse = {
                            context: responseContext,
                            event: {
                                header: responseHeader,
                                endpoint: responseEndpoint,
                                payload: {}
                            }
                        };
                        context.succeed(powerResponse);
                    } else {
                        throw new NoSuchEndpointError("handlePowerControl", "Failed to get the state for entity " + statusEntity + "from hass.");
                    }
                } else {
                    throw new BridgeUnreachableError("handlePowerControl");
                }
            });
        } else {
            throw new InvalidValueError("handlePowerControl");
        }
    }

    function handleThermostatController(request, context, action) {
        var requestEndpointId = request.directive.endpoint.endpointId;

        var modeEntity;
        var statusEntity;
        var temperatureEntity;
        var minDegree;
        var maxDegree;

        var gotConfig = endpoints_config.some(function (endpoint) {
            if (endpoint.endpoint_unique_id === requestEndpointId) {
                temperatureEntity = endpoint.temperature_sensor;
                modeEntity = endpoint.mode_input_select;
                statusEntity = endpoint.status_input_boolean;
                temperatureEntity = endpoint.degrees_control.degrees_input_text;
                minDegree = endpoint.degrees_control.min_degree;
                maxDegree = endpoint.degrees_control.max_degree;
                return true;
            }
            return false;
        });

        if (gotConfig) {
            if (action === "SetTargetTemperature") {
                if (parseInt(request.directive.payload.targetSetpoint.value) < parseInt(minDegree) || parseInt(request.directive.payload.targetSetpoint.value) > parseInt(maxDegree)) {
                    throw new OutOfRangeError("handleThermostatController", minDegree, maxDegree);
                }
            }

            hassApi("/api/states/" + temperatureEntity, "GET", null, function (err, response) {
                if (!err) {
                    var currentTemperature = response.state;
                    hassApi("/api/states/" + modeEntity, "GET", null, function (err, response) {
                        if (!err) {
                            var currentMode = response.state;

                            hassApi("/api/states/" + statusEntity, "GET", null, function (err, response) {
                                if (!err) {
                                    var currentStatus = response.state;
                                    var destTemperature;
                                    var destMode;
                                    var destStatus = "On";
                                    switch (action) {
                                    case "SetTargetTemperature":
                                        destTemperature = request.directive.payload.targetSetpoint.value;
                                        destMode = currentMode;
                                        break;
                                    case "AdjustTargetTemperature":
                                        destTemperature = (parseInt(currentTemperature) + parseInt(request.directive.payload.targetSetpointDelta.value));
                                        if (parseInt(destTemperature) < parseInt(minDegree)) {
                                            destTemperature = minDegree;
                                        } else if (parseInt(destTemperature) > parseInt(maxDegree)) {
                                            destTemperature = maxDegree;
                                        }
                                        destMode = currentMode;
                                        break;
                                    case "SetThermostatMode":
                                        destTemperature = currentTemperature;
                                        destMode = request.directive.payload.thermostatMode.value;
                                        break;
                                    }

                                    var api_url;
                                    var api_body;
                                    if (action === "SetThermostatMode") {
                                        api_url = "/api/services/input_select/select_option";
                                        api_body = {
                                            entity_id: modeEntity,
                                            option: destMode
                                        };

                                    } else {
                                        api_url = "/api/services/input_text/set_value";
                                        api_body = {
                                            entity_id: temperatureEntity,
                                            value: destTemperature
                                        };
                                    }

                                    hassApi(api_url, "POST", api_body, function (err, response) {
                                        if (!err) {
                                            var sampleTimeIso = new Date().toISOString();

                                            var responseContext = {
                                                properties: [{
                                                    namespace: "Alexa.ThermostatController",
                                                    name: "targetSetpoint",
                                                    value: {
                                                        value: destTemperature,
                                                        scale: "CELSIUS"
                                                    },
                                                    timeOfSample: sampleTimeIso,
                                                    uncertaintyInMilliseconds: 0
                                                }, {
                                                    namespace: "Alexa.ThermostatController",
                                                    name: "thermostatMode",
                                                    value: destMode,
                                                    timeOfSample: sampleTimeIso,
                                                    uncertaintyInMilliseconds: 0
                                                }, {
                                                    namespace: "Alexa.TemperatureSensor",
                                                    name: "temperature",
                                                    value: {
                                                        value: currentTemperature,
                                                        scale: "CELSIUS"
                                                    },
                                                    timeOfSample: sampleTimeIso,
                                                    uncertaintyInMilliseconds: 0
                                                }, {
                                                    namespace: "Alexa.PowerController",
                                                    name: "powerState",
                                                    value: destStatus,
                                                    timeOfSample: sampleTimeIso,
                                                    uncertaintyInMilliseconds: 0
                                                }]
                                            };

                                            var responseHeader = {
                                                namespace: "Alexa",
                                                name: "Response",
                                                payloadVersion: "3",
                                                messageId: uuidv4(),
                                                correlationToken: request.directive.header.correlationToken
                                            };

                                            var responseEndpoint = {
                                                endpointId: requestEndpointId
                                            };

                                            var thermostatResponse = {
                                                context: responseContext,
                                                event: {
                                                    header: responseHeader,
                                                    endpoint: responseEndpoint,
                                                    payload: {}
                                                }
                                            };

                                            if (currentStatus.toLowerCase() === "off") {
                                                var statusBody = {
                                                    entity_id: statusEntity
                                                };
                                                hassApi("/api/services/input_boolean/turn_on", "POST", statusBody, function (err, response) {
                                                    if (!err) {
                                                        context.succeed(thermostatResponse);
                                                    } else {
                                                        throw new ThermostatIsOffError("handleThermostatController", "Entity " + statusEntity + " is not responding.");
                                                    }
                                                });
                                            } else {
                                                context.succeed(thermostatResponse);
                                            }
                                        } else {
                                            throw new BridgeUnreachableError("handleThermostatController");
                                        }
                                    });
                                } else {
                                    throw new NoSuchEndpointError("handleThermostatController", "Failed to get the state for entity " + statusEntity + "from hass.");
                                }
                            });
                        } else {
                            throw new NoSuchEndpointError("handleThermostatController", "Failed to get the state for entity " + modeEntity + "from hass.");
                        }
                    });
                } else {
                    throw new NoSuchEndpointError("handleThermostatController", "Failed to get the state for entity " + temperatureEntity + "from hass.");
                }
            });
        } else {
            throw new InvalidValueError("handleThermostatController");
        }
    }

/*#################################
############ main code ############
#################################*/
    var namespace = request.directive.header.namespace;
    var name = request.directive.header.name;

    try {
        switch (namespace) {
        case "Alexa":
            if (name === "ReportState") {
                handleStateReports(request, context);
            } else {
                throw new DirectiveNameError("exports.handler", namespace, name);
            }
            break;
        case "Alexa.Discovery":
            if (name === "Discover") {
                handleDiscovery(context);
            } else {
                throw new DiscoveryError("exports.handler", "directive name " + name + " is not registered with namespace " + namespace + ".");
            }
            break;
        case "Alexa.PowerController":
            if (name === "TurnOff" || request.directive.header.name === "TurnOn") {
                handlePowerControl(request, context, name.replace("Turn", ""));
            } else {
                throw new DirectiveNameError("exports.handler", namespace, name);
            }
            break;
        case "Alexa.ThermostatController":
            if (name === "SetTargetTemperature" || name === "AdjustTargetTemperature" || name === "SetThermostatMode") {
                handleThermostatController(request, context, name);
            } else {
                throw new DirectiveNameError("exports.handler", namespace, name);
            }
            break;
        default:
            throw new DirectiveNamespaceError("exports.handler", namespace);
        }
    } catch (err) {
        if (err.name === "DirectiveNameError") {
            logger("ERROR", err.functionName, "directive name " + err.directiveName + " is not registered with namespace " + err.directiveNamespace + ".");
            context.succeed(createErrorResponse(request, "INVALID_DIRECTIVE", "Unknown directive name."));
        } else if (err.name === "DirectiveNamespaceError") {
            logger("ERROR", err.functionName, "directive namespace " + err.directiveNamespace + " is unknown.");
            context.succeed(createErrorResponse(request, "INVALID_DIRECTIVE", "Unknown directive namespace."));
        } else if (err.name === "DiscoveryError") {
            //error responses are not allowed for discovery requests
            logger("ERROR", err.functionName, "error in discover " + err.contextMessage + ".");
            context.done(null, "FAILURE");
        } else if (err.name === "InvalidValueError") {
            logger("ERROR", err.functionName, "Syntax error in configuration files, please follow the instructions for configuring.");
            context.succeed(createErrorResponse(request, "INVALID_VALUE", "Encountered an error while loading the configuration, please check the logs."));
        } else if (err.name === "BridgeUnreachableError") {
            logger("ERROR", err.functionName, "Home Assistant's API is not responding, please check the server or the configuration files.");
            context.succeed(createErrorResponse(request, "BRIDGE_UNREACHABLE", "Encountered an error while accessing hass api, please check the logs."));
        } else if (err.name === "NoSuchEndpointError") {
            logger("ERROR", err.functionName, err.message);
            context.succeed(createErrorResponse(request, "NO_SUCH_ENDPOINT", "Encountered an error while retrieving the device data."));
        } else if (err.name === "OutOfRangeError") {
            logger("ERROR", err.functionName, "The requested error is out of range, the range allowed is defined in the config files.");
            context.succeed(createOutOfRangeErrorResponse(request, err.minValue, err.maxValue));
        } else if (err.name === "ThermostatIsOffError") {
            context.succeed(createThermostatIsOffResponse(request, err.message));
        } else {
            logger("ERROR", "exports.handler", err);
            context.succeed(createErrorResponse(request, "INTERNAL_ERROR", "Encountered an error while creating a state report, please check the logs."));
        }
    }
};