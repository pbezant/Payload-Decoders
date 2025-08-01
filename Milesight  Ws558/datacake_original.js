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
          decoded[switchTag] = (switchFlags >> idx) & (1 === 1) ? 'on' : 'off';
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
  