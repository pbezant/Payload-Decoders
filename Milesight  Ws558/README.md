# Milesight WS558 Smart Light Controller – TTN Payload Encoder/Decoder

This directory contains the TTN v3 encoder/decoder for the Milesight WS558 Smart Light Controller.

## Usage

### Downlink (encodeDownlink)

Send commands to control relays, optionally with a duration (delay). The encoder supports several input formats:

#### Single Relay Command
```json
{
  "relay": 1,
  "state": "on"
}
```

#### Relay Command with Duration (e.g., 10 seconds)
```json
{
  "relay": 1,
  "state": "on",
  "duration": 10
}
```
Or as a string:
```json
{
  "relay": 1,
  "state": "on",
  "duration": "10s"
}
```

#### Multiple Relays (Array)
```json
[
  { "relay": 1, "state": "on" },
  { "relay": 2, "state": "off", "duration": 30 }
]
```

#### Wrapped in `commands` property (for TTN)
```json
{
  "commands": [
    { "relay": 1, "state": "on" },
    { "relay": 2, "state": "off", "duration": 30 }
  ]
}
```

### Utility/Device Commands
Use the `createUtilityCommand(type, value)` helper in custom integrations:

- **Reboot:** `{ bytes: [0xFF, 0x10, 0xFF] }`
- **Delete Delay Task:** `{ bytes: [0xFF, 0x23, 0x00, 0xFF] }`
- **All Relays OFF:** `{ bytes: [0x08, 0xFF, 0x00] }`
- **All Relays ON:** `{ bytes: [0x08, 0xFF, 0xFF] }`
- **Set Reporting Interval:** `createUtilityCommand('set_interval', 300)` (interval in seconds, 60–64800)
- **Enable Power Monitoring:** `{ bytes: [0xFF, 0x26, 0x01] }`
- **Disable Power Monitoring:** `{ bytes: [0xFF, 0x26, 0x00] }`
- **Reset Power Consumption:** `{ bytes: [0xFF, 0x27, 0xFF] }`
- **Enquire Status:** `{ bytes: [0xFF, 0x28, 0xFF] }`

### Duration/Delay Nuances
- **Only one delay task at a time!** If you send multiple commands with `duration`, only the last one will be active. The device will override previous delay tasks.
- **Duration units:**
  - Number: seconds (e.g., `10` = 10 seconds)
  - String: supports `s` (seconds), `m` (minutes), `h` (hours). E.g., `"5m"` = 5 minutes, `"2h"` = 2 hours.
  - Max duration: 65535 seconds (~18.2 hours)
- **Immediate commands** (no duration) can be sent for multiple relays at once.

### Uplink (decodeUplink)
The decoder parses incoming payloads and extracts:
- Protocol, hardware, software version
- Power monitoring status
- Relay states
- Voltage, current, power, power factor, power consumption
- Device SN, device class, etc.

### Example TTN Downlink Payloads
- **Turn relay 1 ON for 10 seconds:**
  ```json
  { "relay": 1, "state": "on", "duration": 10 }
  ```
- **Turn relay 2 OFF immediately:**
  ```json
  { "relay": 2, "state": "off" }
  ```
- **Turn all relays ON:**
  ```json
  { "relay": 1, "state": "on" }
  { "relay": 2, "state": "on" }
  ...
  { "relay": 8, "state": "on" }
  ```
  Or use the utility command: `[0x08, 0xFF, 0xFF]`

### Quirks & Gotchas
- **One delay at a time:** Only the last delay command is active.
- **Relay numbers:** 1–8 only.
- **State:** Must be `"on"` or `"off"` (case-insensitive).
- **Invalid input:** The encoder will throw errors for bad formats, relay numbers, or states.
- **fPort:** Downlinks use `fPort: 85` by default.

---

## Development & Testing
- The `testEncoder()` function in `ThingsNetwork.js` provides example usage and logs output for debugging.
- No exports are needed; TTN calls `encodeDownlink()` and `decodeUplink()` directly.

---

## References
- See the official [Milesight WS558 User Guide](ws558-user-guide-en.pdf) for protocol details. 