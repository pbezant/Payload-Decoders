// TagoIO Analysis Script for Kuando Busylight Downlink via TTN
// Triggers: Dashboard button or manual run
// Author: Big Daddy's AI

/**
 * ENVIRONMENT VARIABLES (set in TagoIO):
 * TTN_APP_ID:      Your TTN Application ID
 * TTN_DEVICE_ID:   Your TTN Device ID
 * TTN_API_KEY:     Your TTN API Key (with downlink permission)
 * TTN_REGION:      TTN region/cluster (e.g., eu1, nam1)
 */

const axios = require('axios');

// Named command mapping
const COMMANDS = {
  'all_clear':   { red: 0,   green: 255, blue: 0,   ontime: 0,   offtime: 0 },   // Green, steady
  'alert':       { red: 255, green: 255, blue: 0,   ontime: 30,  offtime: 30 },  // Yellow, pulse every 30s
  'alarm':       { red: 255, green: 0,   blue: 0,   ontime: 1,   offtime: 1 },   // Red, flash every 1s
};

// Helper: Encode payload as [red, blue, green, ontime, offtime]
function encodePayload({ red, green, blue, ontime, offtime }) {
  return [
    red & 0xFF,
    blue & 0xFF,
    green & 0xFF,
    ontime & 0xFF,
    offtime & 0xFF,
  ];
}

// Helper: Convert byte array to base64
function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

// Main Analysis entry point
async function main(context, scope) {
  // 1. Get environment variables
  const TTN_APP_ID    = process.env.TTN_APP_ID;
  const TTN_DEVICE_ID = process.env.TTN_DEVICE_ID;
  const TTN_API_KEY   = process.env.TTN_API_KEY;
  const TTN_REGION    = process.env.TTN_REGION || 'eu1';

  if (!TTN_APP_ID || !TTN_DEVICE_ID || !TTN_API_KEY) {
    context.log('Missing TTN credentials. Set TTN_APP_ID, TTN_DEVICE_ID, TTN_API_KEY in environment.');
    return;
  }

  // 2. Get input: command name or custom values
  let command = (scope.find(x => x.variable === 'command') || {}).value;
  let custom  = (scope.find(x => x.variable === 'custom_payload') || {}).value;

  let payloadObj;
  if (command && COMMANDS[command.toLowerCase()]) {
    payloadObj = COMMANDS[command.toLowerCase()];
    context.log(`Using named command: ${command}`);
  } else if (custom) {
    // Expecting custom as JSON string or object
    if (typeof custom === 'string') {
      try { custom = JSON.parse(custom); } catch (e) { context.log('Invalid custom_payload JSON'); return; }
    }
    // Validate fields
    const { red, green, blue, ontime, offtime } = custom;
    if ([red, green, blue, ontime, offtime].some(v => typeof v !== 'number')) {
      context.log('Custom payload missing required fields (red, green, blue, ontime, offtime)');
      return;
    }
    payloadObj = { red, green, blue, ontime, offtime };
    context.log('Using custom payload:', payloadObj);
  } else {
    context.log('No command or custom_payload provided.');
    return;
  }

  // 3. Encode payload
  const bytes = encodePayload(payloadObj);
  const base64Payload = bytesToBase64(bytes);
  context.log('Encoded bytes:', bytes, 'Base64:', base64Payload);

  // 4. Prepare TTN downlink API request
  const url = `https://${TTN_REGION}.cloud.thethings.network/api/v3/as/applications/${TTN_APP_ID}/devices/${TTN_DEVICE_ID}/down/push`;
  const headers = {
    'Authorization': `Bearer ${TTN_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const body = {
    downlinks: [
      {
        f_port: 15,
        frm_payload: base64Payload,
        priority: 'NORMAL',
      },
    ],
  };

  // 5. Send downlink
  try {
    const response = await axios.post(url, body, { headers });
    context.log('Downlink sent! TTN response:', response.data);
  } catch (err) {
    context.log('Failed to send downlink:', err.response ? err.response.data : err.message);
  }
}

module.exports = { main };