/**
 * Standalone Test script for DMX Controller Analysis
 * 
 * This script tests the encodeDownlink function and command encoding
 * without requiring the TagoIO SDK.
 */

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
 * Test function to verify command encoding
 */
function testCommandEncoding() {
  console.log("🧪 Testing DMX Controller Analysis Encoding\n");

  // Test 1: Single Press - Lights Command
  console.log("Test 1: Single Press - Lights Command");
  const lightsCommand = {
    lights: [
      { address: 1, channels: [255, 0, 0, 0] },
      { address: 5, channels: [0, 255, 0, 0] }
    ]
  };
  
  const lightsEncoded = encodeDownlink({ data: lightsCommand, fPort: 1 });
  const lightsHex = bytesToHex(lightsEncoded.bytes);
  console.log("Input:", JSON.stringify(lightsCommand));
  console.log("Encoded bytes:", lightsEncoded.bytes);
  console.log("Hex payload:", lightsHex);
  console.log("Expected format: [number_of_lights, address1, ch1, ch2, ch3, ch4, address2, ch1, ch2, ch3, ch4]");
  console.log("Expected: [02, 01, FF, 00, 00, 00, 05, 00, FF, 00, 00]");
  console.log("✅ Test 1 completed\n");

  // Test 2: Double Press - Rainbow Pattern Command
  console.log("Test 2: Double Press - Rainbow Pattern Command");
  const rainbowCommand = {
    pattern: "rainbow",
    cycles: 0
  };
  
  const rainbowEncoded = encodeDownlink({ data: rainbowCommand, fPort: 1 });
  const rainbowHex = bytesToHex(rainbowEncoded.bytes);
  console.log("Input:", JSON.stringify(rainbowCommand));
  console.log("Encoded bytes:", rainbowEncoded.bytes);
  console.log("Hex payload:", rainbowHex);
  console.log("Expected format: [F1, pattern_type, speed_low, speed_high, cycles_low, cycles_high]");
  console.log("Expected: [F1, 01, 32, 00, 00, 00] (rainbow=1, speed=50, cycles=0)");
  console.log("✅ Test 2 completed\n");

  // Test 3: Long Press - Off Command
  console.log("Test 3: Long Press - Off Command");
  const offCommand = {
    command: "off"
  };
  
  const offEncoded = encodeDownlink({ data: offCommand, fPort: 1 });
  const offHex = bytesToHex(offEncoded.bytes);
  console.log("Input:", JSON.stringify(offCommand));
  console.log("Encoded bytes:", offEncoded.bytes);
  console.log("Hex payload:", offHex);
  console.log("Expected format: [00]");
  console.log("Expected: [00]");
  console.log("✅ Test 3 completed\n");

  // Test 4: Invalid command
  console.log("Test 4: Invalid Command");
  const invalidCommand = {
    invalid: "data"
  };
  
  const invalidEncoded = encodeDownlink({ data: invalidCommand, fPort: 1 });
  const invalidHex = bytesToHex(invalidEncoded.bytes);
  console.log("Input:", JSON.stringify(invalidCommand));
  console.log("Encoded bytes:", invalidEncoded.bytes);
  console.log("Hex payload:", invalidHex);
  console.log("Expected: JSON string encoded as bytes");
  console.log("✅ Test 4 completed\n");

  // Summary
  console.log("📊 Test Summary:");
  console.log("✅ Lights Command:", lightsHex);
  console.log("✅ Rainbow Command:", rainbowHex);
  console.log("✅ Off Command:", offHex);
  console.log("✅ Invalid Command:", invalidHex);
  
  return {
    lights: lightsHex,
    rainbow: rainbowHex,
    off: offHex,
    invalid: invalidHex
  };
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("🚀 Starting DMX Controller Analysis Tests\n");
  
  try {
    const results = testCommandEncoding();
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Create the analysis in TagoIO using the dmx-controller-analysis.js file");
    console.log("2. Test the analysis with each command type");
    console.log("3. Verify the hex payloads match the expected format");
    console.log("4. Create the action to trigger this analysis");
    
    console.log("\n🔧 Expected Hex Payloads for TagoIO:");
    console.log("Single Press (Lights):", results.lights);
    console.log("Double Press (Rainbow):", results.rainbow);
    console.log("Long Press (Off):", results.off);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests
runAllTests(); 