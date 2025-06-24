/**
 * WS558 Smart Light Controller - TTN v3 Downlink Payload Encoder
 * 
 * Supports JSON commands like:
 * { "relay": 1, "state": "on" }
 * { "relay": 2, "state": "off", "duration": 30 }
 * { "relay": 3, "state": "on", "duration": "5m" }
 * { "relay": 4, "state": "off", "duration": "2h" }
 * 
 * Or arrays for multiple relays:
 * [
 *   { "relay": 1, "state": "on" },
 *   { "relay": 2, "state": "off", "duration": 30 }
 * ]
 */

function encodeDownlink(input) {
  try {
    // Handle different input formats that TTN might send
    let commands;
    
    // Check if input.data.commands is an array (wrapped array format)
    if (input.data && Array.isArray(input.data.commands)) {
      commands = input.data.commands;
    }
    // Check if input.data is an array
    else if (Array.isArray(input.data)) {
      commands = input.data;
    }
    // Check if input.commands is an array (direct commands property)
    else if (Array.isArray(input.commands)) {
      commands = input.commands;
    }
    // Check if input itself is an array (sometimes TTN sends it this way)
    else if (Array.isArray(input)) {
      commands = input;
    }
    // Check if input.data exists and is an object (single command)
    else if (input.data && typeof input.data === 'object' && input.data.relay) {
      commands = [input.data];
    }
    // Fallback - treat input as the command itself
    else if (input && typeof input === 'object' && input.relay) {
      commands = [input];
    }
    else {
      throw new Error('Invalid input format. Expected object with relay/state, array of such objects, or wrapped in "commands" property.');
    }
    
    let bytes = [];
    let errors = [];
    let warnings = [];
    
    // Process each command
    for (let cmd of commands) {
      let result = processCommand(cmd);
      if (result.error) {
        errors.push(result.error);
        continue;
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
      if (result.bytes) {
        bytes = bytes.concat(result.bytes);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Encoding errors: ${errors.join(', ')}`);
    }
    
    return {
      bytes: bytes,
      fPort: 85, // Default application port for WS558
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    return {
      errors: [error.message]
    };
  }
}

function processCommand(cmd) {
  // Validate basic structure
  if (!cmd || typeof cmd !== 'object') {
    return { error: 'Command must be an object' };
  }
  
  if (!cmd.hasOwnProperty('relay') || !cmd.hasOwnProperty('state')) {
    return { error: 'Command must have "relay" and "state" properties' };
  }
  
  // Validate relay number
  let relay = parseInt(cmd.relay);
  if (isNaN(relay) || relay < 1 || relay > 8) {
    return { error: `Invalid relay number: ${cmd.relay}. Must be 1-8` };
  }
  
  // Validate state
  let state = cmd.state.toLowerCase();
  if (state !== 'on' && state !== 'off') {
    return { error: `Invalid state: ${cmd.state}. Must be "on" or "off"` };
  }
  
  // Check if duration is specified
  if (cmd.duration) {
    return processDelayCommand(relay, state, cmd.duration);
  } else {
    return processImmediateCommand(relay, state);
  }
}

function processImmediateCommand(relay, state) {
  // Create switch control command
  // Format: 08 [control_byte] [status_byte]
  
  let controlByte = 1 << (relay - 1); // Enable control for this relay
  let statusByte = state === 'on' ? (1 << (relay - 1)) : 0; // Set state
  
  return {
    bytes: [0x08, controlByte, statusByte]
  };
}

function processDelayCommand(relay, state, duration) {
  // Parse duration
  let durationSeconds = parseDuration(duration);
  if (durationSeconds === null) {
    return { error: `Invalid duration format: ${duration}` };
  }
  
  if (durationSeconds > 65535) {
    return { 
      error: `Duration too long: ${duration}. Maximum is 65535 seconds (about 18.2 hours)`,
    };
  }
  
  // WS558 supports only one delay task at a time
  // Format: ff 32 00 [delay_low] [delay_high] [control_byte] [status_byte]
  
  let delayLow = durationSeconds & 0xFF;
  let delayHigh = (durationSeconds >> 8) & 0xFF;
  let controlByte = 1 << (relay - 1); // Enable control for this relay
  let statusByte = state === 'on' ? (1 << (relay - 1)) : 0; // Set state
  
  return {
    bytes: [0xFF, 0x32, 0x00, delayLow, delayHigh, controlByte, statusByte],
    warning: 'WS558 supports only one delay task at a time. Later commands will override previous delay tasks.'
  };
}

function parseDuration(duration) {
  if (typeof duration === 'number') {
    return duration; // Assume seconds
  }
  
  if (typeof duration === 'string') {
    let match = duration.match(/^(\d+)([smh]?)$/);
    if (!match) {
      return null;
    }
    
    let value = parseInt(match[1]);
    let unit = match[2] || 's';
    
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      default:
        return null;
    }
  }
  
  return null;
}

// Helper function to create common commands
function createUtilityCommand(type, value = null) {
  switch (type) {
    case 'reboot':
      return { bytes: [0xFF, 0x10, 0xFF] };
    
    case 'delete_delay':
      return { bytes: [0xFF, 0x23, 0x00, 0xFF] };
    
    case 'all_off':
      return { bytes: [0x08, 0xFF, 0x00] }; // All relays controlled, all off
    
    case 'all_on':
      return { bytes: [0x08, 0xFF, 0xFF] }; // All relays controlled, all on
    
    case 'set_interval':
      if (!value || value < 60 || value > 64800) { // 1 min to 18 hours
        throw new Error('Reporting interval must be between 60 and 64800 seconds');
      }
      let intervalLow = value & 0xFF;
      let intervalHigh = (value >> 8) & 0xFF;
      return { bytes: [0xFF, 0x03, intervalLow, intervalHigh] };
    
    case 'enable_power_monitoring':
      return { bytes: [0xFF, 0x26, 0x01] };
    
    case 'disable_power_monitoring':
      return { bytes: [0xFF, 0x26, 0x00] };
    
    case 'reset_power_consumption':
      return { bytes: [0xFF, 0x27, 0xFF] };
    
    case 'enquire_status':
      return { bytes: [0xFF, 0x28, 0xFF] };
    
    default:
      throw new Error(`Unknown utility command: ${type}`);
  }
}

// TTN v3 Decoder function (for uplink decoding)
function decodeUplink(input) {
  let bytes = input.bytes;
  let data = {};
  let warnings = [];
  
  let i = 0;
  while (i < bytes.length) {
    let channel = bytes[i++];
    if (i >= bytes.length) break;
    
    let type = bytes[i++];
    
    // Parse based on channel and type
    if (channel === 0xFF) {
      // System information
      switch (type) {
        case 0x01: // Protocol version
          if (i < bytes.length) {
            data.protocol_version = bytes[i++];
          }
          break;
        case 0x09: // Hardware version
          if (i + 1 < bytes.length) {
            data.hardware_version = `${bytes[i]}.${bytes[i + 1]}`;
            i += 2;
          }
          break;
        case 0x0A: // Software version
          if (i + 1 < bytes.length) {
            data.software_version = `${bytes[i]}.${bytes[i + 1]}`;
            i += 2;
          }
          break;
        case 0x0B: // Power on
          data.power_on = true;
          break;
        case 0x0F: // Device type
          if (i < bytes.length) {
            let deviceType = bytes[i++];
            data.device_class = deviceType === 0 ? 'A' : deviceType === 1 ? 'B' : 'C';
          }
          break;
        case 0x16: // Device SN
          if (i + 7 < bytes.length) {
            data.device_sn = bytes.slice(i, i + 8).map(b => b.toString(16).padStart(2, '0')).join('');
            i += 8;
          }
          break;
        case 0x26: // Power consumption feature
          if (i < bytes.length) {
            data.power_monitoring_enabled = bytes[i++] === 1;
          }
          break;
        default:
          i++; // Skip unknown type
      }
    } else {
      // Sensor data
      switch (type) {
        case 0x74: // Voltage
          if (i + 1 < bytes.length) {
            data.voltage = ((bytes[i + 1] << 8) | bytes[i]) * 0.1;
            i += 2;
          }
          break;
        case 0x80: // Active Power
          if (i + 3 < bytes.length) {
            data.active_power = (bytes[i + 3] << 24) | (bytes[i + 2] << 16) | (bytes[i + 1] << 8) | bytes[i];
            i += 4;
          }
          break;
        case 0x81: // Power Factor
          if (i < bytes.length) {
            data.power_factor = bytes[i++];
          }
          break;
        case 0x83: // Power Consumption
          if (i + 3 < bytes.length) {
            data.power_consumption_wh = (bytes[i + 3] << 24) | (bytes[i + 2] << 16) | (bytes[i + 1] << 8) | bytes[i];
            i += 4;
          }
          break;
        case 0xC9: // Total Current
          if (i + 1 < bytes.length) {
            data.current_ma = (bytes[i + 1] << 8) | bytes[i];
            i += 2;
          }
          break;
        case 0x31: // Switch Status
          if (i + 1 < bytes.length) {
            i++; // Skip first byte (always 0x00)
            let switchStatus = bytes[i++];
            data.relays = {};
            for (let relay = 1; relay <= 8; relay++) {
              data.relays[`relay_${relay}`] = (switchStatus & (1 << (relay - 1))) ? 'on' : 'off';
            }
          }
          break;
        default:
          i++; // Skip unknown type
      }
    }
  }
  
  return {
    data: data,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Functions are automatically available to TTN v3
// No exports needed - TTN will call encodeDownlink() and decodeUplink() directly

// Test function - you can remove this after debugging
function testEncoder() {
  // Test individual relays
  console.log("Relay 1 OFF:", encodeDownlink({data: {relay: 1, state: "off"}}));
  console.log("Relay 3 OFF:", encodeDownlink({data: {relay: 3, state: "off"}}));
  console.log("Relay 5 OFF:", encodeDownlink({data: {relay: 5, state: "off"}}));
  
  // Test the bit patterns
  for (let i = 1; i <= 8; i++) {
    let controlBit = 1 << (i - 1);
    let statusBit = 0; // OFF
    console.log(`Relay ${i} OFF: Control=0x${controlBit.toString(16)}, Status=0x${statusBit.toString(16)}`);
  }
}