# R602A LoRa Siren TTN Payload Decoder

A comprehensive payload decoder for the Netvox R602A Wireless LoRa Siren compatible with The Things Network (TTN) v3.

## Features

- ✅ **Uplink Data Decoding**: Heartbeat and warning status reports
- ✅ **Downlink Response Decoding**: Configuration and command responses  
- ✅ **Downlink Command Encoding**: Send alarm commands to the device
- ✅ **Error Handling**: Robust validation and error reporting
- ✅ **Hex Values**: Raw payload data included for debugging
- ✅ **Timestamps**: Automatic timestamp generation

## Installation

### Step 1: Add to TTN Console

1. Navigate to your TTN application
2. Go to **Payload formatters** → **Uplink**
3. Select **Custom JavaScript formatter**
4. Copy and paste the decoder code
5. Click **Save changes**

### Step 2: Test the Decoder

1. Go to **Live data** tab
2. Wait for device uplink or trigger manually
3. Verify decoded payload appears in JSON format

## Payload Types

### Uplink Data Reports (fPort 6)

The device sends periodic heartbeat and status reports.

#### Raw Payload Example
```
01690100E10000000000
```

#### Decoded JSON Output
```json
{
  "timestamp": "2025-06-23T15:30:45.123Z",
  "fPort": 6,
  "raw_payload": "01690100E10000000000",
  "message_type": "data_report",
  "version": 1,
  "version_hex": "0x01",
  "device_type": 105,
  "device_type_hex": "0x69",
  "device_model": "R602A",
  "report_type": 1,
  "report_type_hex": "0x01",
  "heartbeat_time_seconds": 3600,
  "heartbeat_time_minutes": 60,
  "heartbeat_time_hex": "0x0E10",
  "warning_status": "no_warning",
  "warning_status_code": 0,
  "warning_status_hex": "0x00",
  "reserved_bytes": "0000000000"
}
```

### Downlink Command Responses (fPort 7)

Responses to configuration commands sent to the device.

#### Configuration Success Response
```json
{
  "timestamp": "2025-06-23T15:31:20.456Z",
  "fPort": 7,
  "raw_payload": "8169000000000000000000",
  "message_type": "config_response",
  "command_id": 129,
  "command_id_hex": "0x81",
  "device_type": 105,
  "device_type_hex": "0x69",
  "device_model": "R602A",
  "command_type": "config_report_response",
  "status": "success",
  "status_code": 0,
  "status_hex": "0x00",
  "reserved_bytes": "0000000000000000"
}
```

#### Read Configuration Response
```json
{
  "timestamp": "2025-06-23T15:32:10.789Z",
  "fPort": 7,
  "raw_payload": "8269012C012C0000000000",
  "message_type": "config_response",
  "command_id": 130,
  "command_id_hex": "0x82",
  "device_type": 105,
  "device_type_hex": "0x69",
  "device_model": "R602A",
  "command_type": "read_config_response",
  "min_time_seconds": 300,
  "min_time_minutes": 5,
  "min_time_hex": "0x012C",
  "max_time_seconds": 300,
  "max_time_minutes": 5,
  "max_time_hex": "0x012C",
  "reserved_bytes": "0000000000"
}
```

## Sending Downlink Commands

### Setup Downlink Encoder

1. Go to **Payload formatters** → **Downlink**
2. Select **Custom JavaScript formatter**
3. Use the same decoder code (includes `encodeDownlink` function)
4. Click **Save changes**

### Command Examples

#### 🔥 Fire Alarm (10 seconds with LED)
```json
{
  "command": "start_warning",
  "warning_mode": "fire",
  "strobe_mode": "blink_1",
  "duration": 10
}
```
**Generates:** `90690001000A0000000000` on fPort 7

#### 🚨 Emergency Alert (30 seconds with LED mode 2)
```json
{
  "command": "start_warning",
  "warning_mode": "emergency",
  "strobe_mode": "blink_2",
  "duration": 30
}
```
**Generates:** `9069010200100000000000` on fPort 7

#### 🔔 Doorbell (5 seconds, no LED)
```json
{
  "command": "start_warning",
  "warning_mode": "doorbell",
  "strobe_mode": "none",
  "duration": 5
}
```
**Generates:** `90690300000005000000000` on fPort 7

#### 🔇 Stop All Alarms
```json
{
  "command": "start_warning",
  "warning_mode": "mute",
  "strobe_mode": "none",
  "duration": 0
}
```
**Generates:** `9069040000000000000000` on fPort 7

#### 🏠 Burglar Alarm (60 seconds with LED)
```json
{
  "command": "start_warning",
  "warning_mode": "burglar",
  "strobe_mode": "blink_1",
  "duration": 60
}
```
**Generates:** `90690201003C0000000000` on fPort 7

### How to Send Commands

1. Go to your device in TTN Console
2. Navigate to **Messaging** tab
3. Click **+ Schedule downlink**
4. Select **JSON** payload format
5. Paste one of the command examples above
6. Set **Confirmed downlink** if you want delivery confirmation
7. Click **Schedule downlink**

### Verify Downlink Commands

To verify your downlinks are being generated correctly:

1. **Check the hex bytes** in TTN Console after scheduling
2. **Compare with expected values** from the examples above
3. **Monitor Live Data** for downlink confirmations

#### Expected Hex Values:
- **Fire Alarm (10s):** `90690001000A0000000000`
- **Emergency (30s):** `9069010200110000000000` 
- **Doorbell (5s):** `90690300000005000000000`
- **Stop/Mute:** `9069040000000000000000`
- **Burglar (60s):** `90690201003C0000000000`

#### Manual Hex Downlink (Alternative Method):
If JSON isn't working, try sending raw hex directly:

1. In TTN Console → Messaging → Schedule downlink
2. Select **Bytes** instead of JSON
3. Enter hex values directly (e.g., `90690001000A0000000000`)
4. Set fPort to `7`
5. Click **Schedule downlink**

## Configuration Options

### Warning Modes
| Mode | Description | Code |
|------|-------------|------|
| `fire` | Fire alarm sound | 0x00 |
| `emergency` | Emergency alert sound | 0x01 |
| `burglar` | Burglar alarm sound | 0x02 |
| `doorbell` | Doorbell chime | 0x03 |
| `mute` | Silent/stop sounds | 0x04 |

### Strobe Modes
| Mode | Description | Code |
|------|-------------|------|
| `none` | No LED indication | 0x00 |
| `chase` | LED chase/flowing light | 0x01 |
| `blink` | LED blink pattern | 0x02 |

### Duration
- **Range:** 0-65535 seconds
- **Unit:** Seconds
- **Special:** Use `0` to stop immediately

## Troubleshooting

### Common Issues

#### ❌ "Payload too short" Error
**Cause:** Incomplete or corrupted payload
**Solution:** Check device transmission and gateway connectivity

#### ❌ "Invalid device type" Error  
**Cause:** Wrong device type in payload (not 0x69)
**Solution:** Verify this decoder is used only with R602A devices

#### ❌ "Unknown fPort" Error
**Cause:** Payload received on unexpected fPort
**Solution:** R602A uses fPort 6 (data) and fPort 7 (commands)

#### ❌ Downlink not working
**Cause:** Device not in Class C mode or network issues
**Solution:** 
- Ensure device joined as Class C
- Check network server supports Class C
- Verify gateway has downlink capability

### Debug Information

The decoder includes comprehensive debug information:

```json
{
  "raw_payload": "01690100E10000000000",
  "version_hex": "0x01",
  "device_type_hex": "0x69",
  "heartbeat_time_hex": "0x0E10",
  "warning_status_hex": "0x00"
}
```

Use these hex values to manually verify payload parsing.

## Device Information

- **Model:** Netvox R602A
- **Type:** Wireless LoRa Siren
- **Device Type Code:** 0x69
- **LoRaWAN Class:** C
- **Power:** 12V DC
- **Frequency:** LoRaWAN regional frequencies

## API Integration

### Node-RED Integration
Use the decoded JSON directly in Node-RED flows:

```javascript
// Extract warning status
const isWarning = msg.payload.warning_status === "warning_active";

// Check heartbeat interval
const heartbeatMinutes = msg.payload.heartbeat_time_minutes;

// Trigger actions based on device state
if (isWarning) {
    // Handle warning condition
    msg.topic = "alarm/warning";
} else {
    // Normal heartbeat
    msg.topic = "alarm/heartbeat";
}
```

### Home Assistant Integration
Example MQTT sensor configuration:

```yaml
sensor:
  - name: "R602A Heartbeat"
    state_topic: "ttn/application/my-app/device/r602a-001/up"
    value_template: "{{ value_json.heartbeat_time_minutes }}"
    unit_of_measurement: "min"
    
  - name: "R602A Warning Status"
    state_topic: "ttn/application/my-app/device/r602a-001/up"
    value_template: "{{ value_json.warning_status }}"
```

## License

This decoder is provided as-is for use with Netvox R602A devices. Check your local regulations for LoRaWAN usage compliance.

## Support

- **Device Manual:** Refer to Netvox R602A documentation
- **TTN Documentation:** [The Things Network Docs](https://docs.thethingsnetwork.org/)
- **LoRaWAN Specification:** [LoRa Alliance](https://lora-alliance.org/)

## Version History

- **v1.0:** Initial release with full uplink/downlink support
- Supports TTN v3 (The Things Stack)
- Compatible with Netvox R602A firmware versions