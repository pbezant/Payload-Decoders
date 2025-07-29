function Decoder(bytes, port) {
    var decoded = {};
    
    // Check if TTI has already decoded the payload
    if (typeof bytes === 'object' && bytes.uplink_message && 
        bytes.uplink_message.decoded_payload && 
        bytes.uplink_message.decoded_payload.valid === true) {
        
        // Use TTI's decoded data
        return decodeTTIPayload(bytes);
    } else {
        // Fallback to hex parsing if TTI didn't decode
        return decodeHexPayload(bytes);
    }
}

function decodeTTIPayload(ttiData) {
    var measurements = [];
    var uplinkMessage = ttiData.uplink_message;
    
    // Extract LoRaWAN metadata first
    if (uplinkMessage.rx_metadata && uplinkMessage.rx_metadata.length > 0) {
        var rxMetadata = uplinkMessage.rx_metadata[0];
        
        // Extract LoRaWAN datarate
        if (uplinkMessage.settings && uplinkMessage.settings.data_rate) {
            measurements.push({
                field: "LORA_DATARATE",
                value: uplinkMessage.settings.data_rate.lora.spreading_factor + "SF" + uplinkMessage.settings.data_rate.lora.bandwidth + "BW",
                timestamp: "auto"
            });
        }
        
        // Extract SNR and RSSI
        if (rxMetadata.snr !== undefined) {
            measurements.push({
                field: "LORA_SNR",
                value: rxMetadata.snr,
                timestamp: "auto"
            });
        }
        
        if (rxMetadata.rssi !== undefined) {
            measurements.push({
                field: "LORA_RSSI",
                value: rxMetadata.rssi,
                timestamp: "auto"
            });
        }
    }
    
    // Extract location from TTI if available
    if (uplinkMessage.locations && uplinkMessage.locations.user) {
        var location = uplinkMessage.locations.user;
        measurements.push({
            field: "DEVICE_LOCATION",
            value: "(" + location.latitude + "," + location.longitude + ")",
            timestamp: "auto"
        });
    }
    
    // Extract sensor data from TTI's decoded payload
    if (uplinkMessage.decoded_payload && uplinkMessage.decoded_payload.messages && 
        uplinkMessage.decoded_payload.messages[0]) {
        
        var messages = uplinkMessage.decoded_payload.messages[0];
        
        for (var i = 0; i < messages.length; i++) {
            var message = messages[i];
            
            switch (message.type) {
                case "Air Temperature":
                    measurements.push({
                        field: "AIR_TEMPERATURE",
                        value: message.measurementValue,
                        timestamp: "auto"
                    });
                    // Add motion ID for temperature readings
                    if (message.motionId !== undefined) {
                        measurements.push({
                            field: "TEMP_MOTION_ID",
                            value: message.motionId,
                            timestamp: "auto"
                        });
                    }
                    break;
                    
                case "Light":
                    measurements.push({
                        field: "LIGHT",
                        value: message.measurementValue,
                        timestamp: "auto"
                    });
                    // Add motion ID for light readings
                    if (message.motionId !== undefined) {
                        measurements.push({
                            field: "LIGHT_MOTION_ID",
                            value: message.motionId,
                            timestamp: "auto"
                        });
                    }
                    break;
                    
                case "Battery":
                    measurements.push({
                        field: "BATTERY",
                        value: message.measurementValue,
                        timestamp: "auto"
                    });
                    // Add motion ID for battery readings
                    if (message.motionId !== undefined) {
                        measurements.push({
                            field: "BATTERY_MOTION_ID",
                            value: message.motionId,
                            timestamp: "auto"
                        });
                    }
                    break;
                    
                case "Device Status":
                    // Extract device configuration fields
                    if (message.measurementValue) {
                        var status = message.measurementValue;
                        
                        // SOS Mode (if available in status)
                        if (status.sosMode !== undefined) {
                            measurements.push({
                                field: "SOS_MODE",
                                value: status.sosMode,
                                timestamp: "auto"
                            });
                        }
                        
                        // Work Mode (if available in status)
                        if (status.workMode !== undefined) {
                            measurements.push({
                                field: "WORK_MODE",
                                value: status.workMode,
                                timestamp: "auto"
                            });
                        }
                        
                        // Heartbeat Interval (if available in status)
                        if (status.heartbeatInterval !== undefined) {
                            measurements.push({
                                field: "HEARTBEAT_INTERVAL",
                                value: status.heartbeatInterval,
                                timestamp: "auto"
                            });
                        }
                        
                        // Periodic Interval (if available in status)
                        if (status.periodicInterval !== undefined) {
                            measurements.push({
                                field: "PERIODIC_INTERVAL",
                                value: status.periodicInterval,
                                timestamp: "auto"
                            });
                        }
                        
                        // Event Interval (if available in status)
                        if (status.eventInterval !== undefined) {
                            measurements.push({
                                field: "EVENT_INTERVAL",
                                value: status.eventInterval,
                                timestamp: "auto"
                            });
                        }
                        
                        // Hardware Version (if available in status)
                        if (status.hardwareVersion !== undefined) {
                            measurements.push({
                                field: "HARDWARE_VERSION",
                                value: status.hardwareVersion,
                                timestamp: "auto"
                            });
                        }
                        
                        // Firmware Version (if available in status)
                        if (status.firmwareVersion !== undefined) {
                            measurements.push({
                                field: "FIRMWARE_VERSION",
                                value: status.firmwareVersion,
                                timestamp: "auto"
                            });
                        }
                    }
                    break;
                    
                case "Event Status":
                    // Check if measurementValue is an array
                    if (Array.isArray(message.measurementValue) && message.measurementValue.length > 0) {
                        var eventId = message.measurementValue[0].id;
                        var eventName = message.measurementValue[0].eventName;
                        
                        // Initialize event flags based on T1000 documentation
                        var hasSOSEvent = false;
                        var hasShockEvent = false;
                        var hasMotionEvent = false;
                        var hasMotionlessEvent = false;
                        var hasTempEvent = false;
                        var hasLightEvent = false;
                        var hasButtonEvent = false;
                        var hasFallEvent = false;
                        
                        // Process all events in the array
                        var allEventIds = [];
                        var allEventNames = [];
                        
                        for (var k = 0; k < message.measurementValue.length; k++) {
                            var event = message.measurementValue[k];
                            allEventIds.push(event.id);
                            allEventNames.push(event.eventName);
                            
                            // Set event flags based on ID (from T1000 documentation)
                            switch (event.id) {
                                case 1: hasMotionEvent = true; break;
                                case 2: hasMotionlessEvent = true; break;
                                case 3: hasButtonEvent = true; break;
                                case 4: hasShockEvent = true; break;
                                case 5: hasTempEvent = true; break;
                                case 6: hasLightEvent = true; break;
                                case 7: hasSOSEvent = true; break;
                                case 8: hasFallEvent = true; break;
                            }
                        }
                        
                        // Add primary event info
                        measurements.push({
                            field: "EVENT_STATUS",
                            value: eventName,  // Event name as string
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "EVENT_STATUS_ID",
                            value: eventId,    // Event ID as integer
                            timestamp: "auto"
                        });
                        
                        // Add all event IDs as a comma-separated string
                        measurements.push({
                            field: "ALL_EVENT_IDS",
                            value: allEventIds.join(","),
                            timestamp: "auto"
                        });
                        
                        // Add individual event boolean flags
                        measurements.push({
                            field: "SOS_EVENT",
                            value: hasSOSEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "SHOCK_EVENT",
                            value: hasShockEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "MOTION_EVENT",
                            value: hasMotionEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "MOTIONLESS_EVENT",
                            value: hasMotionlessEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "TEMP_EVENT",
                            value: hasTempEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "LIGHT_EVENT",
                            value: hasLightEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "BUTTON_EVENT",
                            value: hasButtonEvent,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "FALL_EVENT",
                            value: hasFallEvent,
                            timestamp: "auto"
                        });
                    }
                    
                    // Add motion ID and timestamp if available
                    if (message.motionId !== undefined) {
                        measurements.push({
                            field: "MOTION_ID",
                            value: message.motionId,
                            timestamp: "auto"
                        });
                    }
                    if (message.timestamp) {
                        measurements.push({
                            field: "MEASUREMENT_TIMESTAMP",
                            value: message.timestamp,
                            timestamp: "auto"
                        });
                    }
                    break;
                    
                case "Wi-Fi Scan":
                    // Check if measurementValue is an array
                    if (Array.isArray(message.measurementValue)) {
                        // Count number of Wi-Fi APs detected
                        var wifiCount = message.measurementValue.length;
                        measurements.push({
                            field: "WIFI_COUNT",
                            value: wifiCount,
                            timestamp: "auto"
                        });
                        
                        // Add individual Wi-Fi AP data
                        for (var j = 0; j < message.measurementValue.length; j++) {
                            var ap = message.measurementValue[j];
                            measurements.push({
                                field: "WIFI_AP_" + j + "_MAC",
                                value: ap.mac,
                                timestamp: "auto"
                            });
                            measurements.push({
                                field: "WIFI_AP_" + j + "_RSSI",
                                value: parseInt(ap.rssi),
                                timestamp: "auto"
                            });
                        }
                        
                        // Add strongest Wi-Fi signal info
                        var strongestAP = message.measurementValue[0];
                        var strongestRSSI = parseInt(strongestAP.rssi);
                        for (var k = 1; k < message.measurementValue.length; k++) {
                            var currentRSSI = parseInt(message.measurementValue[k].rssi);
                            if (currentRSSI > strongestRSSI) {
                                strongestAP = message.measurementValue[k];
                                strongestRSSI = currentRSSI;
                            }
                        }
                        measurements.push({
                            field: "WIFI_STRONGEST_MAC",
                            value: strongestAP.mac,
                            timestamp: "auto"
                        });
                        measurements.push({
                            field: "WIFI_STRONGEST_RSSI",
                            value: strongestRSSI,
                            timestamp: "auto"
                        });
                    }
                    
                    // Add motion ID for Wi-Fi readings
                    if (message.motionId !== undefined) {
                        measurements.push({
                            field: "WIFI_MOTION_ID",
                            value: message.motionId,
                            timestamp: "auto"
                        });
                    }
                    break;
                    
                case "Motion":
                    measurements.push({
                        field: "MOTION_ID",
                        value: message.motionId,
                        timestamp: "auto"
                    });
                    break;
            }
        }
    }
    
    // Ensure all required fields are present with default values if missing
    var requiredFields = {
        "BATTERY": null,
        "SOS_MODE": 0,
        "WORK_MODE": 0,
        "HEARTBEAT_INTERVAL": 0,
        "PERIODIC_INTERVAL": 0,
        "HARDWARE_VERSION": 0.0,
        "FIRMWARE_VERSION": 0.0,
        "EVENT_INTERVAL": 0,
        "AIR_TEMPERATURE": null,
        "LIGHT": null,
        "SOS_EVENT": false,
        "LORA_DATARATE": "",
        "LORA_SNR": 0.0,
        "LORA_RSSI": 0,
        "DEVICE_LOCATION": null
    };
    
    // Check which required fields are missing and add defaults
    var existingFields = measurements.map(function(m) { return m.field; });
    
    for (var field in requiredFields) {
        if (existingFields.indexOf(field) === -1 && requiredFields[field] !== null) {
            measurements.push({
                field: field,
                value: requiredFields[field],
                timestamp: "auto"
            });
        }
    }
    
    return measurements;
}

function decodeHexPayload(bytes) {
    // Check if bytes is a string (base64 encoded hex from Datacake)
    if (typeof bytes === 'string') {
        // Convert base64 to hex string
        var hexString = Buffer.from(bytes, 'base64').toString('hex');
    } else {
        // Convert bytes array to hex string
        var hexString = bytesToHex(bytes);
    }
    
    var decoded = unpack(hexString);
    return deserialize(decoded);
}

// Helper function to convert bytes to hex
function bytesToHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
        hex += ('0' + (bytes[i] & 0xFF).toString(16)).slice(-2);
    }
    return hex;
}

// Your existing helper functions (keep these for fallback)
function unpack(hexString) {
    var result = [];
    var remainMessage = hexString;
    while (remainMessage.length >= 2) {
        var dataId = remainMessage.substring(0, 2);
        var dataValue = '';
        var messageValue = '';
        
        switch (dataId) {
            case '01':
                dataValue = remainMessage.substring(2, 102);
                messageValue = remainMessage.substring(102);
                break;
            case '02':
                dataValue = remainMessage.substring(2, 102);
                messageValue = remainMessage.substring(102);
                break;
            case '05':
                dataValue = remainMessage.substring(2, 6);
                messageValue = remainMessage.substring(6);
                break;
            case '06':
                dataValue = remainMessage.substring(2, 84);
                messageValue = remainMessage.substring(84);
                break;
            case '07':
                dataValue = remainMessage.substring(2, 84);
                messageValue = remainMessage.substring(84);
                break;
            case '08':
                dataValue = remainMessage.substring(2, 84);
                messageValue = remainMessage.substring(84);
                break;
            case '09':
                dataValue = remainMessage.substring(2, 20);
                messageValue = remainMessage.substring(20);
                break;
            case '0A':
                dataValue = remainMessage.substring(2, 84);
                messageValue = remainMessage.substring(84);
                break;
            case '0B':
                dataValue = remainMessage.substring(2, 84);
                messageValue = remainMessage.substring(84);
                break;
            case '0D':
                dataValue = remainMessage.substring(2, 4);
                messageValue = remainMessage.substring(4);
                break;
            case '11':
                dataValue = remainMessage.substring(2, 84);
                messageValue = remainMessage.substring(84);
                break;
            default:
                return result;
        }
        
        result.push({
            'dataId': dataId,
            'dataValue': dataValue
        });
        remainMessage = messageValue;
    }
    return result;
}

function deserialize(bytes) {
    var measurementArray = [];
    for (var i = 0; i < bytes.length; i++) {
        var byte = bytes[i];
        var dataId = byte.dataId;
        var dataValue = byte.dataValue;
        
        switch (dataId) {
            case '01':
                measurementArray = getDeviceStatus(dataValue);
                break;
            case '02':
                measurementArray = getDeviceStatus(dataValue);
                break;
            case '05':
                measurementArray = getHeartbeat(dataValue);
                break;
            case '06':
                measurementArray = getGNSSLocationAndSensor(dataValue);
                break;
            case '07':
                measurementArray = getWiFiLocationAndSensor(dataValue);
                break;
            case '08':
                measurementArray = getBluetoothLocationAndSensor(dataValue);
                break;
            case '09':
                measurementArray = getGNSSLocationOnly(dataValue);
                break;
            case '0A':
                measurementArray = getWiFiLocationOnly(dataValue);
                break;
            case '0B':
                measurementArray = getBluetoothLocationOnly(dataValue);
                break;
            case '0D':
                measurementArray = getErrorCode(dataValue);
                break;
            case '11':
                measurementArray = getPositioningStatusAndSensor(dataValue);
                break;
        }
    }
    return measurementArray;
}

// Keep your existing helper functions for fallback
function getDeviceStatus(dataValue) {
    // Device Status Packet (0x01/0x02) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Parse device status fields based on T1000 documentation
    // This is a simplified version - adjust based on actual packet structure
    
    // SOS Mode (1 byte)
    var sosMode = parseInt(dataValue.substring(offset, offset + 2), 16);
    offset += 2;
    
    // Work Mode (1 byte)
    var workMode = parseInt(dataValue.substring(offset, offset + 2), 16);
    offset += 2;
    
    // Heartbeat Interval (2 bytes)
    var heartbeatInterval = parseInt(dataValue.substring(offset, offset + 4), 16);
    offset += 4;
    
    // Periodic Interval (2 bytes)
    var periodicInterval = parseInt(dataValue.substring(offset, offset + 4), 16);
    offset += 4;
    
    // Event Interval (2 bytes)
    var eventInterval = parseInt(dataValue.substring(offset, offset + 4), 16);
    offset += 4;
    
    // Hardware Version (2 bytes) - convert to float
    var hwVersionRaw = parseInt(dataValue.substring(offset, offset + 4), 16);
    var hardwareVersion = parseFloat(hwVersionRaw / 100.0); // Assuming version is stored as integer * 100
    offset += 4;
    
    // Firmware Version (2 bytes) - convert to float
    var fwVersionRaw = parseInt(dataValue.substring(offset, offset + 4), 16);
    var firmwareVersion = parseFloat(fwVersionRaw / 100.0); // Assuming version is stored as integer * 100
    offset += 4;
    
    // Battery (1 byte)
    var batteryRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var battery = Math.round(batteryRaw * 0.496); // Convert to TTI battery value
    offset += 2;
    
    // Add all device status measurements
    measurementArray.push(
        { field: 'SOS_MODE', value: sosMode, timestamp: 'auto' },
        { field: 'WORK_MODE', value: workMode, timestamp: 'auto' },
        { field: 'HEARTBEAT_INTERVAL', value: heartbeatInterval, timestamp: 'auto' },
        { field: 'PERIODIC_INTERVAL', value: periodicInterval, timestamp: 'auto' },
        { field: 'EVENT_INTERVAL', value: eventInterval, timestamp: 'auto' },
        { field: 'HARDWARE_VERSION', value: hardwareVersion, timestamp: 'auto' },
        { field: 'FIRMWARE_VERSION', value: firmwareVersion, timestamp: 'auto' },
        { field: 'BATTERY', value: battery, timestamp: 'auto' }
    );
    
    // Add default values for other required fields
    var defaultFields = [
        { field: 'AIR_TEMPERATURE', value: null },
        { field: 'LIGHT', value: null },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 },
        { field: 'DEVICE_LOCATION', value: null }
    ];
    
    for (var i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].value !== null) {
            measurementArray.push({
                field: defaultFields[i].field,
                value: defaultFields[i].value,
                timestamp: 'auto'
            });
        }
    }
    
    return measurementArray;
}

function getHeartbeat(dataValue) {
    // Heartbeat Packet (0x05) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Parse heartbeat data
    // Battery (1 byte)
    var batteryRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var battery = Math.round(batteryRaw * 0.496); // Convert to TTI battery value
    offset += 2;
    
    // Add heartbeat measurements
    measurementArray.push(
        { field: 'BATTERY', value: battery, timestamp: 'auto' }
    );
    
    // Add default values for all other required fields
    var defaultFields = [
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'AIR_TEMPERATURE', value: null },
        { field: 'LIGHT', value: null },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 },
        { field: 'DEVICE_LOCATION', value: null }
    ];
    
    for (var i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].value !== null) {
            measurementArray.push({
                field: defaultFields[i].field,
                value: defaultFields[i].value,
                timestamp: 'auto'
            });
        }
    }
    
    return measurementArray;
}

function getGNSSLocationAndSensor(dataValue) {
    // GNSS Location and Sensor Packet (0x06) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Timestamp (4 bytes) - skip for now
    offset += 8;
    
    // Latitude (4 bytes) - check if valid
    var latitudeHex = dataValue.substring(offset, offset + 8);
    var latitude = null;
    if (latitudeHex !== 'ffffffff') {
        var latValue = getSensorValue(latitudeHex, 1000000);
        if (latValue >= -90 && latValue <= 90) {
            latitude = latValue;
        }
    }
    offset += 8;
    
    // Longitude (4 bytes) - check if valid
    var longitudeHex = dataValue.substring(offset, offset + 8);
    var longitude = null;
    if (longitudeHex !== 'ffffffff') {
        var lngValue = getSensorValue(longitudeHex, 1000000);
        if (lngValue >= -180 && lngValue <= 180) {
            longitude = lngValue;
        }
    }
    offset += 8;
    
    // Altitude (1 byte) - treat as signed byte
    var altitudeRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var altitude = altitudeRaw > 127 ? altitudeRaw - 256 : altitudeRaw;
    offset += 2;
    
    // Accuracy (1 byte) - treat as signed byte
    var accuracyRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var accuracy = accuracyRaw > 127 ? accuracyRaw - 256 : accuracyRaw;
    offset += 2;
    
    // Temperature (1 byte) - convert from hex encoding to TTI value
    var tempRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var temperature = Math.round(tempRaw * 0.137);
    offset += 2;
    
    // Light (1 byte) - convert from hex encoding to TTI value
    var lightRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var light = Math.round(lightRaw * 0.004);
    offset += 2;
    
    // Battery (1 byte) - convert from hex encoding to TTI value
    var batteryRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var battery = Math.round(batteryRaw * 0.496);
    offset += 2;
    
    // Motion ID (1 byte) - treat as signed byte
    var motionIdRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var motionId = motionIdRaw > 127 ? motionIdRaw - 256 : motionIdRaw;
    offset += 2;
    
    // Event Status (1 byte) - treat as signed byte
    var eventStatusRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var eventStatus = eventStatusRaw > 127 ? eventStatusRaw - 256 : eventStatusRaw;
    offset += 2;
    
    // Add measurements with proper data types
    if (latitude !== null && longitude !== null) {
        measurementArray.push({
            field: 'DEVICE_LOCATION',
            value: '(' + latitude + ',' + longitude + ')',
            timestamp: 'auto'
        });
    }
    
    measurementArray.push(
        { field: 'AIR_TEMPERATURE', value: parseFloat(temperature), timestamp: 'auto' },
        { field: 'LIGHT', value: parseInt(light), timestamp: 'auto' },
        { field: 'BATTERY', value: parseInt(battery), timestamp: 'auto' },
        { field: 'ALTITUDE', value: altitude, timestamp: 'auto' },
        { field: 'ACCURACY', value: accuracy, timestamp: 'auto' },
        { field: 'MOTION_ID', value: motionId, timestamp: 'auto' },
        { field: 'EVENT_STATUS', value: eventStatus, timestamp: 'auto' }
    );
    
    // Add default values for required fields that might not be in this packet
    var defaultFields = [
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 }
    ];
    
    // Add default fields
    for (var i = 0; i < defaultFields.length; i++) {
        measurementArray.push({
            field: defaultFields[i].field,
            value: defaultFields[i].value,
            timestamp: 'auto'
        });
    }
    
    return measurementArray;
}

function getWiFiLocationAndSensor(dataValue) {
    // Proper WiFi Location and Sensor Packet (0x07) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Timestamp (4 bytes) - skip for now
    offset += 8;
    
    // Latitude (4 bytes) - check if valid
    var latitudeHex = dataValue.substring(offset, offset + 8);
    var latitude = null;
    if (latitudeHex !== 'ffffffff') {
        var latValue = getSensorValue(latitudeHex, 1000000);
        if (latValue >= -90 && latValue <= 90) {
            latitude = latValue;
        }
    }
    offset += 8;
    
    // Longitude (4 bytes) - check if valid
    var longitudeHex = dataValue.substring(offset, offset + 8);
    var longitude = null;
    if (longitudeHex !== 'ffffffff') {
        var lngValue = getSensorValue(longitudeHex, 1000000);
        if (lngValue >= -180 && lngValue <= 180) {
            longitude = lngValue;
        }
    }
    offset += 8;
    
    // Altitude (1 byte) - treat as signed byte
    var altitudeRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var altitude = altitudeRaw > 127 ? altitudeRaw - 256 : altitudeRaw;
    offset += 2;
    
    // Accuracy (1 byte) - treat as signed byte
    var accuracyRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var accuracy = accuracyRaw > 127 ? accuracyRaw - 256 : accuracyRaw;
    offset += 2;
    
    // Temperature (1 byte) - convert from hex encoding to TTI value
    var tempRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var temperature = Math.round(tempRaw * 0.137);
    offset += 2;
    
    // Light (1 byte) - convert from hex encoding to TTI value
    var lightRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var light = Math.round(lightRaw * 0.004);
    offset += 2;
    
    // Battery (1 byte) - convert from hex encoding to TTI value
    var batteryRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var battery = Math.round(batteryRaw * 0.496);
    offset += 2;
    
    // Motion ID (1 byte) - treat as signed byte
    var motionIdRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var motionId = motionIdRaw > 127 ? motionIdRaw - 256 : motionIdRaw;
    offset += 2;
    
    // Event Status (1 byte) - treat as signed byte
    var eventStatusRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var eventStatus = eventStatusRaw > 127 ? eventStatusRaw - 256 : eventStatusRaw;
    offset += 2;
    
    // Wi-Fi Count (1 byte)
    var wifiCount = parseInt(dataValue.substring(offset, offset + 2), 16);
    
    // Add measurements with proper data types
    if (latitude !== null && longitude !== null) {
        measurementArray.push({
            field: 'DEVICE_LOCATION',
            value: '(' + latitude + ',' + longitude + ')',
            timestamp: 'auto'
        });
    }
    
    measurementArray.push(
        { field: 'AIR_TEMPERATURE', value: parseFloat(temperature), timestamp: 'auto' },
        { field: 'LIGHT', value: parseInt(light), timestamp: 'auto' },
        { field: 'BATTERY', value: parseInt(battery), timestamp: 'auto' },
        { field: 'ALTITUDE', value: altitude, timestamp: 'auto' },
        { field: 'ACCURACY', value: accuracy, timestamp: 'auto' },
        { field: 'MOTION_ID', value: motionId, timestamp: 'auto' },
        { field: 'EVENT_STATUS', value: eventStatus, timestamp: 'auto' },
        { field: 'WIFI_COUNT', value: wifiCount, timestamp: 'auto' }
    );
    
    // Add default values for required fields that might not be in this packet
    var defaultFields = [
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 }
    ];
    
    // Add default fields
    for (var i = 0; i < defaultFields.length; i++) {
        measurementArray.push({
            field: defaultFields[i].field,
            value: defaultFields[i].value,
            timestamp: 'auto'
        });
    }
    
    return measurementArray;
}

function getBluetoothLocationAndSensor(dataValue) {
    // Bluetooth Location and Sensor Packet (0x08) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Timestamp (4 bytes) - skip for now
    offset += 8;
    
    // Latitude (4 bytes) - check if valid
    var latitudeHex = dataValue.substring(offset, offset + 8);
    var latitude = null;
    if (latitudeHex !== 'ffffffff') {
        var latValue = getSensorValue(latitudeHex, 1000000);
        if (latValue >= -90 && latValue <= 90) {
            latitude = latValue;
        }
    }
    offset += 8;
    
    // Longitude (4 bytes) - check if valid
    var longitudeHex = dataValue.substring(offset, offset + 8);
    var longitude = null;
    if (longitudeHex !== 'ffffffff') {
        var lngValue = getSensorValue(longitudeHex, 1000000);
        if (lngValue >= -180 && lngValue <= 180) {
            longitude = lngValue;
        }
    }
    offset += 8;
    
    // Altitude (1 byte) - treat as signed byte
    var altitudeRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var altitude = altitudeRaw > 127 ? altitudeRaw - 256 : altitudeRaw;
    offset += 2;
    
    // Accuracy (1 byte) - treat as signed byte
    var accuracyRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var accuracy = accuracyRaw > 127 ? accuracyRaw - 256 : accuracyRaw;
    offset += 2;
    
    // Temperature (1 byte) - convert from hex encoding to TTI value
    var tempRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var temperature = Math.round(tempRaw * 0.137);
    offset += 2;
    
    // Light (1 byte) - convert from hex encoding to TTI value
    var lightRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var light = Math.round(lightRaw * 0.004);
    offset += 2;
    
    // Battery (1 byte) - convert from hex encoding to TTI value
    var batteryRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var battery = Math.round(batteryRaw * 0.496);
    offset += 2;
    
    // Motion ID (1 byte) - treat as signed byte
    var motionIdRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var motionId = motionIdRaw > 127 ? motionIdRaw - 256 : motionIdRaw;
    offset += 2;
    
    // Event Status (1 byte) - treat as signed byte
    var eventStatusRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var eventStatus = eventStatusRaw > 127 ? eventStatusRaw - 256 : eventStatusRaw;
    offset += 2;
    
    // Add measurements with proper data types
    if (latitude !== null && longitude !== null) {
        measurementArray.push({
            field: 'DEVICE_LOCATION',
            value: '(' + latitude + ',' + longitude + ')',
            timestamp: 'auto'
        });
    }
    
    measurementArray.push(
        { field: 'AIR_TEMPERATURE', value: parseFloat(temperature), timestamp: 'auto' },
        { field: 'LIGHT', value: parseInt(light), timestamp: 'auto' },
        { field: 'BATTERY', value: parseInt(battery), timestamp: 'auto' },
        { field: 'ALTITUDE', value: altitude, timestamp: 'auto' },
        { field: 'ACCURACY', value: accuracy, timestamp: 'auto' },
        { field: 'MOTION_ID', value: motionId, timestamp: 'auto' },
        { field: 'EVENT_STATUS', value: eventStatus, timestamp: 'auto' }
    );
    
    // Add default values for required fields that might not be in this packet
    var defaultFields = [
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 }
    ];
    
    // Add default fields
    for (var i = 0; i < defaultFields.length; i++) {
        measurementArray.push({
            field: defaultFields[i].field,
            value: defaultFields[i].value,
            timestamp: 'auto'
        });
    }
    
    return measurementArray;
}

function getGNSSLocationOnly(dataValue) {
    // GNSS Location Only Packet (0x09) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Timestamp (4 bytes) - skip for now
    offset += 8;
    
    // Latitude (4 bytes) - check if valid
    var latitudeHex = dataValue.substring(offset, offset + 8);
    var latitude = null;
    if (latitudeHex !== 'ffffffff') {
        var latValue = getSensorValue(latitudeHex, 1000000);
        if (latValue >= -90 && latValue <= 90) {
            latitude = latValue;
        }
    }
    offset += 8;
    
    // Longitude (4 bytes) - check if valid
    var longitudeHex = dataValue.substring(offset, offset + 8);
    var longitude = null;
    if (longitudeHex !== 'ffffffff') {
        var lngValue = getSensorValue(longitudeHex, 1000000);
        if (lngValue >= -180 && lngValue <= 180) {
            longitude = lngValue;
        }
    }
    offset += 8;
    
    // Add location measurement
    if (latitude !== null && longitude !== null) {
        measurementArray.push({
            field: 'DEVICE_LOCATION',
            value: '(' + latitude + ',' + longitude + ')',
            timestamp: 'auto'
        });
    }
    
    // Add default values for all required fields
    var defaultFields = [
        { field: 'BATTERY', value: null },
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'AIR_TEMPERATURE', value: null },
        { field: 'LIGHT', value: null },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 }
    ];
    
    for (var i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].value !== null) {
            measurementArray.push({
                field: defaultFields[i].field,
                value: defaultFields[i].value,
                timestamp: 'auto'
            });
        }
    }
    
    return measurementArray;
}

function getWiFiLocationOnly(dataValue) {
    // WiFi Location Only Packet (0x0A) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Timestamp (4 bytes) - skip for now
    offset += 8;
    
    // Latitude (4 bytes) - check if valid
    var latitudeHex = dataValue.substring(offset, offset + 8);
    var latitude = null;
    if (latitudeHex !== 'ffffffff') {
        var latValue = getSensorValue(latitudeHex, 1000000);
        if (latValue >= -90 && latValue <= 90) {
            latitude = latValue;
        }
    }
    offset += 8;
    
    // Longitude (4 bytes) - check if valid
    var longitudeHex = dataValue.substring(offset, offset + 8);
    var longitude = null;
    if (longitudeHex !== 'ffffffff') {
        var lngValue = getSensorValue(longitudeHex, 1000000);
        if (lngValue >= -180 && lngValue <= 180) {
            longitude = lngValue;
        }
    }
    offset += 8;
    
    // Add location measurement
    if (latitude !== null && longitude !== null) {
        measurementArray.push({
            field: 'DEVICE_LOCATION',
            value: '(' + latitude + ',' + longitude + ')',
            timestamp: 'auto'
        });
    }
    
    // Add default values for all required fields
    var defaultFields = [
        { field: 'BATTERY', value: null },
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'AIR_TEMPERATURE', value: null },
        { field: 'LIGHT', value: null },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 }
    ];
    
    for (var i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].value !== null) {
            measurementArray.push({
                field: defaultFields[i].field,
                value: defaultFields[i].value,
                timestamp: 'auto'
            });
        }
    }
    
    return measurementArray;
}

function getBluetoothLocationOnly(dataValue) {
    // Bluetooth Location Only Packet (0x0B) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Timestamp (4 bytes) - skip for now
    offset += 8;
    
    // Latitude (4 bytes) - check if valid
    var latitudeHex = dataValue.substring(offset, offset + 8);
    var latitude = null;
    if (latitudeHex !== 'ffffffff') {
        var latValue = getSensorValue(latitudeHex, 1000000);
        if (latValue >= -90 && latValue <= 90) {
            latitude = latValue;
        }
    }
    offset += 8;
    
    // Longitude (4 bytes) - check if valid
    var longitudeHex = dataValue.substring(offset, offset + 8);
    var longitude = null;
    if (longitudeHex !== 'ffffffff') {
        var lngValue = getSensorValue(longitudeHex, 1000000);
        if (lngValue >= -180 && lngValue <= 180) {
            longitude = lngValue;
        }
    }
    offset += 8;
    
    // Add location measurement
    if (latitude !== null && longitude !== null) {
        measurementArray.push({
            field: 'DEVICE_LOCATION',
            value: '(' + latitude + ',' + longitude + ')',
            timestamp: 'auto'
        });
    }
    
    // Add default values for all required fields
    var defaultFields = [
        { field: 'BATTERY', value: null },
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'AIR_TEMPERATURE', value: null },
        { field: 'LIGHT', value: null },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 }
    ];
    
    for (var i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].value !== null) {
            measurementArray.push({
                field: defaultFields[i].field,
                value: defaultFields[i].value,
                timestamp: 'auto'
            });
        }
    }
    
    return measurementArray;
}

function getErrorCode(dataValue) {
    // Error Code Packet (0x0D) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Error code (1 byte)
    var errorCode = parseInt(dataValue.substring(offset, offset + 2), 16);
    offset += 2;
    
    // Add error code measurement
    measurementArray.push({
        field: 'ERROR_CODE',
        value: errorCode,
        timestamp: 'auto'
    });
    
    // Add default values for all required fields
    var defaultFields = [
        { field: 'BATTERY', value: null },
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'AIR_TEMPERATURE', value: null },
        { field: 'LIGHT', value: null },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 },
        { field: 'DEVICE_LOCATION', value: null }
    ];
    
    for (var i = 0; i < defaultFields.length; i++) {
        if (defaultFields[i].value !== null) {
            measurementArray.push({
                field: defaultFields[i].field,
                value: defaultFields[i].value,
                timestamp: 'auto'
            });
        }
    }
    
    return measurementArray;
}

function getPositioningStatusAndSensor(dataValue) {
    // Positioning Status and Sensor Packet (0x11) parsing
    var measurementArray = [];
    var offset = 0;
    
    // Positioning status (1 byte)
    var positioningStatus = parseInt(dataValue.substring(offset, offset + 2), 16);
    offset += 2;
    
    // Temperature (1 byte) - convert from hex encoding to TTI value
    var tempRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var temperature = Math.round(tempRaw * 0.137);
    offset += 2;
    
    // Light (1 byte) - convert from hex encoding to TTI value
    var lightRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var light = Math.round(lightRaw * 0.004);
    offset += 2;
    
    // Battery (1 byte) - convert from hex encoding to TTI value
    var batteryRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var battery = Math.round(batteryRaw * 0.496);
    offset += 2;
    
    // Motion ID (1 byte) - treat as signed byte
    var motionIdRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var motionId = motionIdRaw > 127 ? motionIdRaw - 256 : motionIdRaw;
    offset += 2;
    
    // Event Status (1 byte) - treat as signed byte
    var eventStatusRaw = parseInt(dataValue.substring(offset, offset + 2), 16);
    var eventStatus = eventStatusRaw > 127 ? eventStatusRaw - 256 : eventStatusRaw;
    offset += 2;
    
    // Add measurements with proper data types
    measurementArray.push(
        { field: 'POSITIONING_STATUS', value: positioningStatus, timestamp: 'auto' },
        { field: 'AIR_TEMPERATURE', value: parseFloat(temperature), timestamp: 'auto' },
        { field: 'LIGHT', value: parseInt(light), timestamp: 'auto' },
        { field: 'BATTERY', value: parseInt(battery), timestamp: 'auto' },
        { field: 'MOTION_ID', value: motionId, timestamp: 'auto' },
        { field: 'EVENT_STATUS', value: eventStatus, timestamp: 'auto' }
    );
    
    // Add default values for required fields that might not be in this packet
    var defaultFields = [
        { field: 'SOS_MODE', value: 0 },
        { field: 'WORK_MODE', value: 0 },
        { field: 'HEARTBEAT_INTERVAL', value: 0 },
        { field: 'PERIODIC_INTERVAL', value: 0 },
        { field: 'HARDWARE_VERSION', value: 0.0 },
        { field: 'FIRMWARE_VERSION', value: 0.0 },
        { field: 'EVENT_INTERVAL', value: 0 },
        { field: 'SOS_EVENT', value: false },
        { field: 'LORA_DATARATE', value: "" },
        { field: 'LORA_SNR', value: 0.0 },
        { field: 'LORA_RSSI', value: 0 },
        { field: 'DEVICE_LOCATION', value: null }
    ];
    
    // Add default fields
    for (var i = 0; i < defaultFields.length; i++) {
        measurementArray.push({
            field: defaultFields[i].field,
            value: defaultFields[i].value,
            timestamp: 'auto'
        });
    }
    
    return measurementArray;
}

function loraWANV2DataFormat(str) {
    var strReverse = bigEndianTransform(str);
    var str2 = toBinary(strReverse);
    if (str2.substring(0, 1) === '1') {
        var arr = str2.split('');
        var reverseArr = arr.map(function (item) {
            return parseInt(item) ? 0 : 1;
        });
        str2 = parseInt(reverseArr.join(''), 2) + 1;
        return '-' + str2;
    } else {
        return parseInt(str2, 2);
    }
}

function bigEndianTransform(data) {
    var dataArray = [];
    for (var i = 0; i < data.length; i += 2) {
        dataArray.push(data.substring(i, i + 2));
    }
    return dataArray.reverse().join('');
}

function toBinary(arr) {
    var binaryData = [];
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        var data = parseInt(item, 16).toString(2);
        var dataLength = data.length;
        if (data.length !== 4) {
            for (var j = 0; j < 4 - dataLength; j++) {
                data = '0' + data;
            }
        }
        binaryData.push(data);
    }
    var binaryString = binaryData.join('');
    var binaryLength = binaryString.length;
    if (binaryLength === 24) {
        binaryString = binaryString.substring(8, binaryLength);
    }
    return binaryString;
}

function getSensorValue(str, dig) {
    if (str === '8000') {
        return null;
    } else {
        return parseInt(str, 16) / dig;
    }
}

function getBattery(batteryStr) {
    return loraWANV2DataFormat(batteryStr);
} 