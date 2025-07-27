/**
 * DMX Controller Analysis - TEST VERSION
 * 
 * This analysis sends DMX commands to the controller via TTN downlink.
 * It uses the ChirpStack codec to encode commands in hex format.
 * 
 * Commands supported:
 * - Lights control: {"lights": [{"address": 1, "channels": [255, 0, 0, 0]}]}
 * - Pattern control: {"pattern": "rainbow", "cycles": 0}
 * - Off command: {"command": "off"}
 * 
 * TEST VERSION: Includes sample commands for manual testing
 */

const { Analysis, Utils } = require("@tago-io/sdk");

/**
 * ChirpStack codec encodeDownlink function
 * This is the encoding function from the DMX controller codec
 */
function encodeDownlink(input) {
  // NEW: Direct hex string support
  if (input.data.hex && typeof input.data.hex === 'string') {
    var hexStr = input.data.hex.replace(/[^0-9A-Fa-f]/g, '');
    var bytes = [];
    if (hexStr.length % 2 !== 0) {
      hexStr = '0' + hexStr;
    }
    for (var i = 0; i < hexStr.length; i += 2) {
      bytes.push(parseInt(hexStr.substr(i, 2), 16));
    }
    return { bytes: bytes, fPort: input.fPort || 1 };
  }

  // NEW: Direct raw byte array support
  if (input.data.raw && Array.isArray(input.data.raw)) {
    var bytes = [];
    for (var i = 0; i < input.data.raw.length; i++) {
      var val = parseInt(input.data.raw[i], 10);
      if (isNaN(val) || val < 0 || val > 255) {
        continue;
      }
      bytes.push(val);
    }
    return { bytes: bytes, fPort: input.fPort || 1 };
  }

  // CASE 1: Special command strings
  if (input.data.command === "go") {
    return { bytes: [0x67, 0x6F], fPort: input.fPort || 1 };
  }

  // CASE 2: Special numeric commands
  if (input.data.command === "green" || input.data.command === 2) {
    return { bytes: [0x02], fPort: input.fPort || 1 };
  }
  if (input.data.command === "red" || input.data.command === 1) {
    return { bytes: [0x01], fPort: input.fPort || 1 };
  }
  if (input.data.command === "blue" || input.data.command === 3) {
    return { bytes: [0x03], fPort: input.fPort || 1 };
  }
  if (input.data.command === "white" || input.data.command === 4) {
    return { bytes: [0x04], fPort: input.fPort || 1 };
  }
  if (input.data.command === "off" || input.data.command === 0) {
    return { bytes: [0x00], fPort: input.fPort || 1 };
  }

  // CASE 3: Direct test mode
  if (input.data.command === "test") {
    return { bytes: [0xAA], fPort: input.fPort || 1 };
  }

  // CASE 4: Pattern commands - COMPACT BINARY ENCODING
  if (input.data.pattern) {
    var bytes = [];
    var patternType = '';
    var speed = 50;
    var cycles = 5;

    if (typeof input.data.pattern === 'string') {
      patternType = input.data.pattern;
      switch (input.data.pattern) {
        case 'colorFade': speed = 50; cycles = 5; break;
        case 'rainbow': speed = 50; cycles = 3; break;
        case 'strobe': speed = 100; cycles = 10; break;
        case 'chase': speed = 200; cycles = 3; break;
        case 'alternate': speed = 300; cycles = 5; break;
        case 'stop':
          return { bytes: [0xF0], fPort: input.fPort || 1 };
      }
    } else if (typeof input.data.pattern === 'object') {
      patternType = input.data.pattern.type || 'colorFade';
      speed = input.data.pattern.speed || 50;
      cycles = input.data.pattern.cycles || 5;
    }

    bytes.push(0xF1);
    var typeNum = 0;
    switch (patternType) {
      case 'colorFade': typeNum = 0; break;
      case 'rainbow': typeNum = 1; break;
      case 'strobe': typeNum = 2; break;
      case 'chase': typeNum = 3; break;
      case 'alternate': typeNum = 4; break;
      default: typeNum = 0; break;
    }
    bytes.push(typeNum);
    bytes.push(speed & 0xFF);
    bytes.push((speed >> 8) & 0xFF);
    bytes.push(cycles & 0xFF);
    bytes.push((cycles >> 8) & 0xFF);
    return { bytes: bytes, fPort: input.fPort || 1 };
  }

  // CASE 5: Lights JSON object - proper DMX control
  if (input.data.lights) {
    if (!Array.isArray(input.data.lights)) {
      return { bytes: [], fPort: input.fPort || 1 };
    }
    let bytes = [];
    bytes.push(input.data.lights.length);
    for (let i = 0; i < input.data.lights.length; i++) {
      const light = input.data.lights[i];
      if (typeof light.address !== 'number' || !Array.isArray(light.channels) || light.channels.length !== 4) {
        console.error("Invalid light structure encountered:", light);
        return { bytes: [], fPort: input.fPort || 1 };
      }
      bytes.push(light.address & 0xFF);
      for (let j = 0; j < 4; j++) {
        bytes.push(light.channels[j] & 0xFF);
      }
    }
    return { bytes: bytes, fPort: input.fPort || 1 };
  }

  // CASE 6: Config downlink for number of lights
  if (input.data.config && typeof input.data.config.numLights === 'number') {
    var n = input.data.config.numLights;
    if (n < 1) n = 1;
    if (n > 25) n = 25;
    return { bytes: [0xC0, n], fPort: input.fPort || 1 };
  }

  // Fallback - any other data is converted to a string and sent
  if (typeof input.data === 'object') {
    var jsonString = JSON.stringify(input.data);
    var bytes = [];
    for (var i = 0; i < jsonString.length; i++) {
      bytes.push(jsonString.charCodeAt(i));
    }
    return { bytes: bytes, fPort: input.fPort || 1 };
  }

  return { bytes: [], fPort: input.fPort || 1 };
}

/**
 * Convert bytes array to hex string
 */
function bytesToHex(bytes) {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Main analysis function
 */
async function startAnalysis(context) {
  try {
    console.log("DMX Controller Analysis started");
    
    // Get the command from the analysis parameters
    let command = null;
    
    // Check if we have scope data (from action trigger)
    if (context.scope && context.scope.length > 0) {
      command = context.scope[0]?.value || context.scope[0]?.message;
    }
    
    // If no command from scope, check if we have a test command in environment
    if (!command && context.environment) {
      command = context.environment.test_command;
    }
    
    // TEST VERSION: If still no command, run test commands
    if (!command) {
      console.log("No command provided. Running test commands...");
      
      // Test all three command types
      const testCommands = [
        {
          name: "Test 1: Lights Command",
          command: {
            lights: [
              { address: 1, channels: [255, 0, 0, 0] },
              { address: 5, channels: [0, 255, 0, 0] }
            ]
          }
        },
        {
          name: "Test 2: Rainbow Pattern Command",
          command: {
            pattern: "rainbow",
            cycles: 0
          }
        },
        {
          name: "Test 3: Off Command",
          command: {
            command: "off"
          }
        }
      ];
      
      for (const test of testCommands) {
        console.log(`\n--- ${test.name} ---`);
        await processCommand(context, test.command);
      }
      
      return;
    }

    // Process the single command
    await processCommand(context, command);

  } catch (error) {
    console.error("Error in DMX Controller Analysis:", error);
    if (context.logs && error && error.message) {
      await context.logs.error(`DMX Controller Analysis error: ${error.message}`);
    } else {
      console.error("Error occurred but logging context not available");
    }
  }
}

/**
 * Process a single command
 */
async function processCommand(context, command) {
  console.log("Processing command:", command);

  // Parse the command (it might be a string that needs to be parsed)
  let commandData;
  try {
    commandData = typeof command === 'string' ? JSON.parse(command) : command;
  } catch (error) {
    console.error("Failed to parse command:", error);
    return;
  }

  // Encode the command using ChirpStack codec
  const encoded = encodeDownlink({ data: commandData, fPort: 1 });
  
  if (!encoded.bytes || encoded.bytes.length === 0) {
    console.error("Failed to encode command");
    return;
  }

  // Convert to hex string
  const hexPayload = bytesToHex(encoded.bytes);
  console.log("Encoded hex payload:", hexPayload);

  // Send downlink to DMX controller device
  const deviceID = "07341e99-a40d-4315-b799-dc58daf98a44";
  
  const downlinkData = {
    variable: "downlink",
    value: hexPayload,
    metadata: {
      fport: 1,
      command_type: commandData.lights ? "lights" : commandData.pattern ? "pattern" : "command",
      original_command: JSON.stringify(commandData)
    }
  };

  if (context.devices) {
    await context.devices.sendData(deviceID, downlinkData);
    console.log("Downlink sent successfully to device:", deviceID);
  } else {
    console.log("Mock mode: Would send downlink to device:", deviceID);
    console.log("Downlink data:", JSON.stringify(downlinkData, null, 2));
  }

  // Log the action
  if (context.logs) {
    await context.logs.info(`DMX command sent: ${JSON.stringify(commandData)} -> ${hexPayload}`);
  } else {
    console.log(`DMX command processed: ${JSON.stringify(commandData)} -> ${hexPayload}`);
  }
}

module.exports = new Analysis(startAnalysis);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports.encodeDownlink = encodeDownlink;
  module.exports.bytesToHex = bytesToHex;
} 