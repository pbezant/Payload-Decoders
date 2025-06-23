/**
 * TTN Payload Decoder for R602A Wireless LoRa Siren
 * Supports both uplink data reports and downlink command responses
 * Device Type: 0x69
 * Compatible with TTN v3 (The Things Stack)
 */

function decodeUplink(input) {
  const bytes = input.bytes;
  const fPort = input.fPort;
  const timestamp = new Date().toISOString();
  
  let decoded = {
    timestamp: timestamp,
    fPort: fPort,
    raw_payload: bytesToHex(bytes)
  };
  
  try {
    // Validate minimum payload length
    if (bytes.length < 3) {
      throw new Error("Payload too short");
    }
    
    if (fPort === 6) {
      // Uplink Data Report (ReportDataCmd)
      decoded = {...decoded, ...decodeDataReport(bytes)};
    } else if (fPort === 7) {
      // Downlink Command Response (ConfigureCmd)
      decoded = {...decoded, ...decodeConfigResponse(bytes)};
    } else {
      decoded.error = "Unknown fPort";
      decoded.message = `Unsupported fPort: ${fPort}`;
    }
    
  } catch (error) {
    decoded.error = "Decode error";
    decoded.message = error.message;
  }
  
  return {
    data: decoded,
    warnings: [],
    errors: decoded.error ? [decoded.message] : []
  };
}

function decodeDataReport(bytes) {
  // ReportDataCmd format: Version(1) + DeviceType(1) + ReportType(1) + NetvoxPayLoadData(8)
  // NetvoxPayLoadData: HeartbeatTime(2) + WarningStatus(1) + Reserved(5)
  
  if (bytes.length !== 11) {
    throw new Error(`Invalid data report length: ${bytes.length}, expected 11 bytes`);
  }
  
  const version = bytes[0];
  const deviceType = bytes[1];
  const reportType = bytes[2];
  
  // Validate device type
  if (deviceType !== 0x69) {
    throw new Error(`Invalid device type: 0x${deviceType.toString(16).toUpperCase()}, expected 0x69`);
  }
  
  // Parse heartbeat time (2 bytes, big endian, unit: seconds)
  const heartbeatTime = (bytes[3] << 8) | bytes[4];
  
  // Parse warning status
  const warningStatusCode = bytes[5];
  const warningStatus = getWarningStatus(warningStatusCode);
  
  // Reserved bytes (should be 0x00)
  const reserved = bytes.slice(6, 11);
  
  return {
    message_type: "data_report",
    version: version,
    version_hex: `0x${version.toString(16).toUpperCase().padStart(2, '0')}`,
    device_type: deviceType,
    device_type_hex: `0x${deviceType.toString(16).toUpperCase()}`,
    device_model: "R602A",
    report_type: reportType,
    report_type_hex: `0x${reportType.toString(16).toUpperCase().padStart(2, '0')}`,
    heartbeat_time_seconds: heartbeatTime,
    heartbeat_time_minutes: Math.round(heartbeatTime / 60 * 100) / 100,
    heartbeat_time_hex: `0x${heartbeatTime.toString(16).toUpperCase().padStart(4, '0')}`,
    warning_status: warningStatus,
    warning_status_code: warningStatusCode,
    warning_status_hex: `0x${warningStatusCode.toString(16).toUpperCase().padStart(2, '0')}`,
    reserved_bytes: bytesToHex(reserved)
  };
}

function decodeConfigResponse(bytes) {
  // ConfigureCmd format: CmdID(1) + DeviceType(1) + NetvoxPayLoadData(var, max 9 bytes)
  
  if (bytes.length < 2) {
    throw new Error(`Invalid config response length: ${bytes.length}, minimum 2 bytes required`);
  }
  
  const cmdId = bytes[0];
  const deviceType = bytes[1];
  
  // Validate device type
  if (deviceType !== 0x69) {
    throw new Error(`Invalid device type: 0x${deviceType.toString(16).toUpperCase()}, expected 0x69`);
  }
  
  let decoded = {
    message_type: "config_response",
    command_id: cmdId,
    command_id_hex: `0x${cmdId.toString(16).toUpperCase().padStart(2, '0')}`,
    device_type: deviceType,
    device_type_hex: `0x${deviceType.toString(16).toUpperCase()}`,
    device_model: "R602A"
  };
  
  // Parse based on command ID
  switch (cmdId) {
    case 0x81: // ConfigReportRsp
      decoded = {...decoded, ...decodeConfigReportResponse(bytes)};
      break;
    case 0x82: // ReadConfigReportRsp
      decoded = {...decoded, ...decodeReadConfigResponse(bytes)};
      break;
    default:
      decoded.command_type = "unknown";
      decoded.message = `Unknown command ID: 0x${cmdId.toString(16).toUpperCase()}`;
      if (bytes.length > 2) {
        decoded.payload_data = bytesToHex(bytes.slice(2));
      }
  }
  
  return decoded;
}

function decodeConfigReportResponse(bytes) {
  // ConfigReportRsp: Status(1) + Reserved(8)
  if (bytes.length !== 11) {
    throw new Error(`Invalid ConfigReportRsp length: ${bytes.length}, expected 11 bytes`);
  }
  
  const status = bytes[2];
  const reserved = bytes.slice(3, 11);
  
  return {
    command_type: "config_report_response",
    status: status === 0x00 ? "success" : "failure",
    status_code: status,
    status_hex: `0x${status.toString(16).toUpperCase().padStart(2, '0')}`,
    reserved_bytes: bytesToHex(reserved)
  };
}

function decodeReadConfigResponse(bytes) {
  // ReadConfigReportRsp: MinTime(2) + MaxTime(2) + Reserved(5)
  if (bytes.length !== 11) {
    throw new Error(`Invalid ReadConfigReportRsp length: ${bytes.length}, expected 11 bytes`);
  }
  
  const minTime = (bytes[2] << 8) | bytes[3];
  const maxTime = (bytes[4] << 8) | bytes[5];
  const reserved = bytes.slice(6, 11);
  
  return {
    command_type: "read_config_response",
    min_time_seconds: minTime,
    min_time_minutes: Math.round(minTime / 60 * 100) / 100,
    min_time_hex: `0x${minTime.toString(16).toUpperCase().padStart(4, '0')}`,
    max_time_seconds: maxTime,
    max_time_minutes: Math.round(maxTime / 60 * 100) / 100,
    max_time_hex: `0x${maxTime.toString(16).toUpperCase().padStart(4, '0')}`,
    reserved_bytes: bytesToHex(reserved)
  };
}

function getWarningStatus(code) {
  switch (code) {
    case 0x00:
      return "no_warning";
    case 0x01:
      return "warning_active";
    default:
      return "unknown";
  }
}

function getWarningMode(code) {
  switch (code) {
    case 0x00:
      return "fire_mode";
    case 0x01:
      return "emergency_mode";
    case 0x02:
      return "burglar_mode";
    case 0x03:
      return "doorbell_mode";
    case 0x04:
      return "mute_mode";
    default:
      return "unknown_mode";
  }
}

function getStrobeMode(code) {
  switch (code) {
    case 0x00:
      return "no_led_indication";
    case 0x01:
      return "led_chase_mode";
    case 0x02:
      return "led_blink_mode";
    default:
      return "unknown_strobe_mode";
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
    .join('');
}

// TTN v3 requires this for downlink encoding (optional)
function encodeDownlink(input) {
  // This function can be used to encode downlink commands
  // Example usage would be to send warning commands to the device
  const data = input.data;
  
  if (data.command === "start_warning") {
    // StartWarning command format from manual: 
    // CmdID(0x90) + DeviceType(0x69) + WarningMode(1) + StrobeMode(1) + Duration(2) + Reserved(5)
    const warningModeMap = {
      "fire": 0x00,
      "emergency": 0x01,
      "burglar": 0x02,
      "doorbell": 0x03,
      "mute": 0x04
    };
    
    const strobeModeMap = {
      "none": 0x00,
      "chase": 0x01,
      "blink": 0x02
    };
    
    const warningMode = warningModeMap[data.warning_mode] || 0x04;
    const strobeMode = strobeModeMap[data.strobe_mode] || 0x00;
    const duration = data.duration || 10; // seconds
    
    // Format: CmdID + DeviceType + WarningMode + StrobeMode + Duration(2 bytes) + Reserved(5 bytes)
    const bytes = [
      0x90,                           // CmdID: StartWarning
      0x69,                           // DeviceType: R602A
      warningMode,                    // WarningMode
      strobeMode,                     // StrobeMode  
      (duration >> 8) & 0xFF,        // Duration high byte
      duration & 0xFF,                // Duration low byte
      0x00, 0x00, 0x00, 0x00, 0x00   // Reserved (5 bytes)
    ];
    
    return {
      bytes: bytes,
      fPort: 7,
      warnings: []
    };
  }
  
  return {
    bytes: [],
    fPort: 7,
    errors: ["Unknown command"]
  };
}

// TTN v3 automatically uses the decodeUplink and encodeDownlink functions
// No module.exports needed