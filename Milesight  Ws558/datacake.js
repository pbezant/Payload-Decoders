// Sample Payload: 0374000004800000000005810006830000000007c9000008310000

/**
 * Payload Decoder for Datacake
 * based on Payload Decoder for Chirpstack and Milesight network server
 * Copyright 2021 Milesight IoT
 * @product WS558
 */
function Decoder(bytes, port) {
    // declare Datacake object
    var decoded = {};
  
    for (var i = 0; i < bytes.length; ) {
      var channel_id = bytes[i++];
      var channel_type = bytes[i++];
      // VOLTAGE
      if (channel_id === 0x03 && channel_type === 0x74) {
        decoded.voltage = readUInt16LE(bytes.slice(i, i + 2)) / 10;
        i += 2;
      }
      // ACTIVE POWER
      else if (channel_id === 0x04 && channel_type === 0x80) {
        decoded.active_power = readUInt32LE(bytes.slice(i, i + 4));
        i += 4;
      }
      // POWER FACTOR
      else if (channel_id === 0x05 && channel_type === 0x81) {
        decoded.power_factor = bytes[i];
        i += 1;
      }
      // POWER CONSUMPTION
      else if (channel_id === 0x06 && channel_type === 0x83) {
        decoded.power_consumption = readUInt32LE(bytes.slice(i, i + 4));
        i += 4;
      }
      // TOTAL CURRENT
      else if (channel_id === 0x07 && channel_type === 0xc9) {
        decoded.total_current = readUInt16LE(bytes.slice(i, i + 2));
        i += 2;
      }
      // SWITCH STATUS
      else if (channel_id === 0x08 && channel_type === 0x31) {
        var switchFlags = bytes[i + 1];
  
        // output all switch status
        for (var idx = 0; idx < 8; idx++) {
          var switchTag = 'switch_' + (idx + 1);
          decoded[switchTag] = ((switchFlags >> idx) & 1) === 1;
        }
  
        i += 2;
      } else {
        break;
      }
    }
  
    // Test for LoRa properties in normalizedPayload
    try {
      decoded.lora_rssi =
        (!!normalizedPayload.gateways &&
          Array.isArray(normalizedPayload.gateways) &&
          normalizedPayload.gateways[0].rssi) ||
        0;
      decoded.lora_snr =
        (!!normalizedPayload.gateways &&
          Array.isArray(normalizedPayload.gateways) &&
          normalizedPayload.gateways[0].snr) ||
        0;
      decoded.lora_datarate = normalizedPayload.data_rate || 'not retrievable';
    } catch (error) {
      console.log('Error occurred while decoding LoRa properties: ' + error);
    }
  
    return decoded;
}

/**
 * Convert bytes array to hex string
 */
function bytesToHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
        var byte = bytes[i];
        var hexByte = byte.toString(16);
        // Pad with leading zero if needed (compatible with older JS)
        if (hexByte.length === 1) {
            hexByte = '0' + hexByte;
        }
        hex += hexByte;
    }
    return hex;
}

/**
 * Alternative encoder function that Datacake might be calling
 * Some platforms expect this specific function signature
 */
function encodeDownlink(data, port) {
    console.log('=== DATACAKE ENCODEDOWNLINK DEBUG ===');
    console.log('encodeDownlink called with:', JSON.stringify(data));
    return Encoder(data, port);
}

/**
 * Payload Encoder for Datacake Downlinks
 * Supports relay control and utility commands as described in README
 * @product WS558
 */
function Encoder(data, port) {
    console.log('=== DATACAKE ENCODER DEBUG ===');
    console.log('Input data:', JSON.stringify(data));
    console.log('Input data type:', typeof data);
    console.log('Port:', port);
    
    var bytes = [];
    
    try {
        // Normalize input to commands array
        var commands = normalizeCommands(data);
        console.log('Normalized commands:', JSON.stringify(commands));
        
        // Process each command
        for (var i = 0; i < commands.length; i++) {
            var command = commands[i];
            console.log('Processing command', i + 1, ':', JSON.stringify(command));
            var commandBytes = encodeCommand(command);
            console.log('Command bytes:', commandBytes);
            bytes = bytes.concat(commandBytes);
        }
        
        console.log('Final bytes array:', bytes);
        
        // Validate all bytes are in valid range (0-255)
        validateBytes(bytes);
        
        console.log('Validation passed. Returning bytes:', bytes);
        // Ensure all bytes are proper integers
        var finalBytes = [];
        for (var j = 0; j < bytes.length; j++) {
            var byte = bytes[j];
            if (typeof byte === 'string') {
                byte = parseInt(byte, 10);
            }
            if (typeof byte !== 'number' || isNaN(byte)) {
                throw new Error('Invalid byte at index ' + j + ': ' + bytes[j]);
            }
            finalBytes.push(byte);
        }
        
        console.log('Final validated bytes:', finalBytes);
        
        // Try different return formats - some platforms expect specific structures
        // Option 1: Just bytes array (current)
        // Option 2: Object with bytes and fPort
        // Option 3: Hex string
        
        // Try returning just the bytes array - Datacake might expect this
        console.log('Returning bytes array:', finalBytes);
        return finalBytes;
        
    } catch (error) {
        console.log('Encoder error:', error.message);
        throw new Error('Encoding failed: ' + error.message);
    }
}

/**
 * Validate that all bytes are in valid range (0-255)
 */
function validateBytes(bytes) {
    for (var i = 0; i < bytes.length; i++) {
        if (typeof bytes[i] !== 'number' || bytes[i] < 0 || bytes[i] > 255) {
            throw new Error('Invalid byte at index ' + i + ': ' + bytes[i] + ' (must be 0-255)');
        }
    }
}

/**
 * Normalize input to commands array format
 */
function normalizeCommands(data) {
    // Handle commands array format (recommended)
    if (data && data.commands && Array.isArray(data.commands)) {
        return data.commands;
    }
    
    // Handle direct array format
    if (Array.isArray(data)) {
        return data;
    }
    
    // Handle single command object
    if (data && typeof data === 'object') {
        return [data];
    }
    
    throw new Error('Invalid command format. Expected commands array, direct array, or single command object.');
}

/**
 * Encode individual command to bytes
 */
function encodeCommand(command) {
    if (!command || typeof command !== 'object') {
        throw new Error('Invalid command object');
    }
    
    // Handle raw hex commands
    if (command.hex !== undefined) {
        return encodeHexCommand(command.hex);
    }
    
    // Handle multi-relay commands
    if (command.relays !== undefined) {
        return encodeMultiRelayCommand(command);
    }
    
    // Handle relay commands
    if (command.relay !== undefined) {
        return encodeRelayCommand(command);
    }
    
    // Handle utility commands
    if (command.type !== undefined) {
        return encodeUtilityCommand(command);
    }
    
    throw new Error('Command must have either "relay", "relays", "hex", or "type" property');
}

/**
 * Encode raw hex command
 */
function encodeHexCommand(hex) {
    if (typeof hex !== 'string') {
        throw new Error('Hex must be a string');
    }
    
    // Remove any spaces or colons
    hex = hex.replace(/[\s:]/g, '');
    
    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
        throw new Error('Invalid hex format');
    }
    
    // Convert hex to bytes
    var bytes = [];
    for (var i = 0; i < hex.length; i += 2) {
        var byte = parseInt(hex.substr(i, 2), 16);
        bytes.push(byte);
    }
    
    return bytes;
}

/**
 * Encode multi-relay command (e.g., turn on relays 1 and 3)
 */
function encodeMultiRelayCommand(command) {
    var relays = command.relays;
    var state = command.state;
    
    if (!Array.isArray(relays) || relays.length === 0) {
        throw new Error('Relays must be a non-empty array');
    }
    
    if (typeof state !== 'string') {
        throw new Error('State must be a string ("on" or "off")');
    }
    
    var normalizedState = state.toLowerCase();
    if (normalizedState !== 'on' && normalizedState !== 'off') {
        throw new Error('State must be "on" or "off"');
    }
    
    // Validate relay numbers
    for (var i = 0; i < relays.length; i++) {
        if (typeof relays[i] !== 'number' || relays[i] < 1 || relays[i] > 8) {
            throw new Error('Relay ' + relays[i] + ' must be a number between 1 and 8');
        }
    }
    
    // Create control and status masks
    var controlMask = 0;
    var statusMask = 0;
    
    for (var j = 0; j < relays.length; j++) {
        var relayBit = relays[j] - 1; // Convert to 0-based index
        controlMask |= (1 << relayBit); // Set control bit
        if (normalizedState === 'on') {
            statusMask |= (1 << relayBit); // Set status bit for ON
        }
    }
    
    // Channel 08 command: 08[control_mask][status_mask]
    var bytes = [0x08, controlMask, statusMask];
    
    return bytes;
}

/**
 * Encode relay control commands
 */
function encodeRelayCommand(command) {
    var relay = command.relay;
    var state = command.state;
    var duration = command.duration;
    
    // Validate relay number
    if (typeof relay !== 'number' || relay < 1 || relay > 8) {
        throw new Error('Relay must be a number between 1 and 8');
    }
    
    // Validate state
    if (typeof state !== 'string') {
        throw new Error('State must be a string ("on" or "off")');
    }
    
    var normalizedState = state.toLowerCase();
    if (normalizedState !== 'on' && normalizedState !== 'off') {
        throw new Error('State must be "on" or "off"');
    }
    
    var bytes = [];
    var channelId = relay; // Channel ID corresponds to relay number
    
    if (duration !== undefined) {
        // Duration command (0x32)
        if (typeof duration !== 'number' || duration < 1 || duration > 65535) {
            throw new Error('Duration must be a number between 1 and 65535 seconds');
        }
        
        bytes.push(channelId);
        bytes.push(0x32); // Duration command type
        bytes.push(normalizedState === 'on' ? 0x01 : 0x00);
        
        // Duration as 16-bit little-endian (ensure valid bytes)
        bytes.push(duration & 0xFF);
        bytes.push((duration >> 8) & 0xFF);
        
    } else {
        // Immediate command (0x31)
        bytes.push(channelId);
        bytes.push(0x31); // Immediate command type
        bytes.push(normalizedState === 'on' ? 0x01 : 0x00);
    }
    
    return bytes;
}

/**
 * Encode utility/device commands
 */
function encodeUtilityCommand(command) {
    var type = command.type;
    var bytes = [];
    
    switch (type) {
        case 'reboot':
            bytes = [0xFF, 0x10, 0xFF];
            break;
            
        case 'delete_delay':
            bytes = [0xFF, 0x11];
            break;
            
        case 'all_off':
            bytes = [0xFF, 0x12, 0x00];
            break;
            
        case 'all_on':
            bytes = [0xFF, 0x12, 0x01];
            break;
            
        case 'set_interval':
            var value = command.value;
            if (typeof value !== 'number' || value < 1 || value > 65535) {
                throw new Error('Interval value must be a number between 1 and 65535 seconds');
            }
            bytes = [0xFF, 0x13];
            // Value as 16-bit little-endian (ensure valid bytes)
            bytes.push(value & 0xFF);
            bytes.push((value >> 8) & 0xFF);
            break;
            
        case 'enable_power_monitoring':
            bytes = [0xFF, 0x14, 0x01];
            break;
            
        case 'disable_power_monitoring':
            bytes = [0xFF, 0x14, 0x00];
            break;
            
        case 'reset_power_consumption':
            bytes = [0xFF, 0x15];
            break;
            
        case 'enquire_status':
            bytes = [0xFF, 0x16];
            break;
            
        default:
            throw new Error('Unknown utility command type: ' + type);
    }
    
    return bytes;
}

/* ******************************************
 * bytes to number
 ********************************************/
function readUInt8LE(bytes) {
    return bytes & 0xff;
}

function readInt8LE(bytes) {
    var ref = readUInt8LE(bytes);
    return ref > 0x7f ? ref - 0x100 : ref;
}

function readUInt16LE(bytes) {
    var value = (bytes[1] << 8) + bytes[0];
    return value & 0xffff;
}

function readInt16LE(bytes) {
    var ref = readUInt16LE(bytes);
    return ref > 0x7fff ? ref - 0x10000 : ref;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return value & 0xffffffff;
}

function readInt32LE(bytes) {
    var ref = readUInt32LE(bytes);
    return ref > 0x7fffffff ? ref - 0x100000000 : ref;
}

/* ******************************************
 * Test function for encoder (optional)
 ********************************************/
function testEncoder() {
    console.log('=== WS558 Datacake Encoder Tests ===');
    
    // Test single relay command
    try {
        var result1 = Encoder({ commands: [{ relay: 1, state: "on" }] });
        console.log('Single relay on:', JSON.stringify(result1));
        console.log('Bytes array:', result1);
    } catch (e) {
        console.log('Test 1 failed:', e.message);
    }
    
    // Test duration command
    try {
        var result2 = Encoder({ commands: [{ relay: 2, state: "off", duration: 300 }] });
        console.log('Duration command:', JSON.stringify(result2));
        console.log('Bytes array:', result2);
    } catch (e) {
        console.log('Test 2 failed:', e.message);
    }
    
    // Test utility command
    try {
        var result3 = Encoder({ commands: [{ type: "reboot" }] });
        console.log('Reboot command:', JSON.stringify(result3));
        console.log('Bytes array:', result3);
    } catch (e) {
        console.log('Test 3 failed:', e.message);
    }
    
    // Test multiple commands
    try {
        var result4 = Encoder({
            commands: [
                { relay: 1, state: "on", duration: 120 },
                { type: "all_off" },
                { type: "set_interval", value: 600 }
            ]
        });
        console.log('Multiple commands:', JSON.stringify(result4));
        console.log('Bytes array:', result4);
    } catch (e) {
        console.log('Test 4 failed:', e.message);
    }
    
    // Test edge cases that might cause issues
    try {
        var result5 = Encoder({ commands: [{ relay: 8, state: "on", duration: 65535 }] });
        console.log('Max duration test:', JSON.stringify(result5));
        console.log('Bytes array:', result5);
    } catch (e) {
        console.log('Test 5 failed:', e.message);
    }
    
    try {
        var result6 = Encoder({ commands: [{ type: "set_interval", value: 65535 }] });
        console.log('Max interval test:', JSON.stringify(result6));
        console.log('Bytes array:', result6);
    } catch (e) {
        console.log('Test 6 failed:', e.message);
    }
    
    // Test the exact command format you're using
    try {
        var result7 = Encoder({ relay: 1, state: "on" });
        console.log('Direct command test:', JSON.stringify(result7));
        console.log('Bytes array:', result7);
    } catch (e) {
        console.log('Test 7 failed:', e.message);
    }
    
    // Test with string JSON input (like what might be passed from external system)
    try {
        var jsonString = '{"relay": 1, "state": "on"}';
        var parsedData = JSON.parse(jsonString);
        var result8 = Encoder(parsedData);
        console.log('JSON string parsed test:', JSON.stringify(result8));
        console.log('Bytes array:', result8);
    } catch (e) {
        console.log('Test 8 failed:', e.message);
    }
    
    // Test multi-relay command (turn on relays 1 and 3)
    try {
        var result9 = Encoder({ commands: [{ relays: [1, 3], state: "on" }] });
        console.log('Multi-relay test (1&3 on):', JSON.stringify(result9));
        console.log('Bytes array:', result9);
    } catch (e) {
        console.log('Test 9 failed:', e.message);
    }
    
    // Test raw hex command
    try {
        var result10 = Encoder({ commands: [{ hex: "080505" }] });
        console.log('Raw hex test (080505):', JSON.stringify(result10));
        console.log('Bytes array:', result10);
    } catch (e) {
        console.log('Test 10 failed:', e.message);
    }
}

// Uncomment to run tests
// testEncoder();
  