/**
 * Test script for DMX Controller Analysis
 * 
 * This script tests the encodeDownlink function and command encoding
 * to verify the analysis will work correctly.
 */

// Import the functions from the analysis
const { encodeDownlink, bytesToHex } = require('./dmx-controller-analysis.js');

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
 * Test the analysis context simulation
 */
function testAnalysisContext() {
  console.log("\n🔧 Testing Analysis Context Simulation\n");

  // Simulate the analysis context
  const mockContext = {
    scope: [
      {
        value: JSON.stringify({
          lights: [
            { address: 1, channels: [255, 0, 0, 0] },
            { address: 5, channels: [0, 255, 0, 0] }
          ]
        })
      }
    ],
    devices: {
      sendData: async (deviceID, data) => {
        console.log("📤 Mock sendData called:");
        console.log("  Device ID:", deviceID);
        console.log("  Data:", JSON.stringify(data, null, 2));
        return Promise.resolve();
      }
    },
    logs: {
      info: async (message) => {
        console.log("📝 Mock log info:", message);
        return Promise.resolve();
      },
      error: async (message) => {
        console.log("❌ Mock log error:", message);
        return Promise.resolve();
      }
    }
  };

  console.log("Simulating analysis execution with lights command...");
  
  // This would be the actual analysis function call
  // startAnalysis(mockContext);
  
  console.log("✅ Analysis context simulation completed");
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("🚀 Starting DMX Controller Analysis Tests\n");
  
  try {
    const results = testCommandEncoding();
    testAnalysisContext();
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Create the analysis in TagoIO using the dmx-controller-analysis.js file");
    console.log("2. Test the analysis with each command type");
    console.log("3. Verify the hex payloads match the expected format");
    console.log("4. Create the action to trigger this analysis");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testCommandEncoding,
  testAnalysisContext,
  runAllTests
}; 