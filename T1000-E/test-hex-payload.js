// Test script to verify hex payload decoding
const fs = require('fs');
const path = require('path');

// Load the decoder
const decoderCode = fs.readFileSync(path.join(__dirname, 'datacake.js'), 'utf8');

// Get the hex payload from TTI data
const ttiPayload = JSON.parse(fs.readFileSync(path.join(__dirname, 'tti-payload.json'), 'utf8'));
const hexPayload = ttiPayload.uplink_message.frm_payload;

console.log('Testing with hex payload that Datacake sends:');
console.log('Hex payload:', hexPayload);
console.log('='.repeat(60));

// Convert hex to bytes array (what Datacake would send)
const bytes = Buffer.from(hexPayload, 'hex');

console.log('Bytes array:', Array.from(bytes));
console.log('='.repeat(60));

// Execute the decoder with the hex payload
try {
    // Create a function from the decoder code
    const decoderFunction = new Function('bytes', 'port', decoderCode + '\nreturn Decoder(bytes, port);');
    
    // Call the decoder with hex bytes (what Datacake sends)
    const result = decoderFunction(bytes, 5);
    
    console.log('Decoder result with hex payload:');
    console.log(JSON.stringify(result, null, 2));
    
    // Compare with expected TTI values
    console.log('\n' + '='.repeat(60));
    console.log('COMPARISON:');
    console.log('='.repeat(60));
    
    const ttiValues = {
        'AIR_TEMPERATURE': 24,
        'LIGHT': 1,
        'BATTERY': 61
    };
    
    for (let item of result) {
        if (ttiValues[item.field]) {
            console.log(`${item.field}:`);
            console.log(`  Hex decoder: ${item.value}`);
            console.log(`  TTI expected: ${ttiValues[item.field]}`);
            console.log(`  Match: ${item.value === ttiValues[item.field] ? '✅' : '❌'}`);
        }
    }
    
} catch (error) {
    console.error('Error executing decoder:', error);
    console.error('Error stack:', error.stack);
} 