# Milesight WS558 Smart Light Controller – TTN Payload Encoder/Decoder

This directory contains the TTN v3 encoder/decoder for the Milesight WS558 Smart Light Controller.

## Usage

### Downlink (encodeDownlink)

Send commands to control relays or device utilities. The encoder supports several input formats:

#### Recommended Format: `commands` Array (Most Compatible)
The most compatible and recommended way is to wrap all commands in a `commands` array:

##### Single Relay Command
```json
{
  "commands": [
    { "relay": 1, "state": "on" }
  ]
}
```

##### Duration Command (NEW!)
```json
{
  "commands": [
    { "relay": 1, "state": "on", "duration": 300 }
  ]
}
```

##### Multiple Relays (Array)
```json
{
  "commands": [
    { "relay": 1, "state": "on" },
    { "relay": 2, "state": "off", "duration": 5 }
  ]
}
```

#### Alternative Formats (Also Supported)

##### Direct Array Format
```json
[
  { "relay": 1, "state": "on" },
  { "relay": 2, "state": "off" }
]
```

##### Single Command Object
```json
{ "relay": 1, "state": "on" }
```
or
```json
{ "type": "reboot" }
```

#### Utility/Device Commands (as JSON in `commands` array)
- **Reboot:**
  ```json
  {
    "commands": [
      { "type": "reboot" }
    ]
  }
  ```
- **Delete Delay Task:**
  ```json
  {
    "commands": [
      { "type": "delete_delay" }
    ]
  }
  ```
- **All Relays OFF:**
  ```json
  {
    "commands": [
      { "type": "all_off" }
    ]
  }
  ```
- **All Relays ON:**
  ```json
  {
    "commands": [
      { "type": "all_on" }
    ]
  }
  ```
- **Set Reporting Interval:**
  ```json
  {
    "commands": [
      { "type": "set_interval", "value": 300 }
    ]
  }
  ```
- **Enable Power Monitoring:**
  ```json
  {
    "commands": [
      { "type": "enable_power_monitoring" }
    ]
  }
  ```
- **Disable Power Monitoring:**
  ```json
  {
    "commands": [
      { "type": "disable_power_monitoring" }
    ]
  }
  ```
- **Reset Power Consumption:**
  ```json
  {
    "commands": [
      { "type": "reset_power_consumption" }
    ]
  }
  ```
- **Enquire Status:**
  ```json
  {
    "commands": [
      { "type": "enquire_status" }
    ]
  }
  ```

#### Duration Command Examples
```json
{
  "commands": [
    { "relay": 1, "state": "on", "duration": 60 },      // Turn relay 1 on for 1 minute
    { "relay": 2, "state": "off", "duration": 300 },    // Turn relay 2 off for 5 minutes
    { "relay": 3, "state": "on", "duration": 3600 }     // Turn relay 3 on for 1 hour
  ]
}
```

#### Mixing Relay and Utility Commands
```json
{
  "commands": [
    { "relay": 1, "state": "on", "duration": 120 },
    { "type": "all_off" },
    { "type": "set_interval", "value": 600 }
  ]
}
```

### Command Nuances
- **Format Flexibility:** The encoder supports multiple input formats, but the `"commands"` array is most compatible with TTN integrations.
- **Duration Support:** NEW! You can now specify a `"duration"` parameter (1-65535 seconds) for timed relay operations.
- **Immediate vs Duration:** Commands without `"duration"` execute immediately. Commands with `"duration"` run for the specified time.
- **Relay numbers:** 1–8 only.
- **State:** Must be "on" or "off" (case-insensitive).
- **Duration range:** 1-65535 seconds (about 18 hours maximum).
- **Invalid input:** The encoder will throw errors for bad formats, relay numbers, states, or durations.
- **fPort:** Downlinks use `fPort: 85` by default.

---

## Development & Testing
- The `testEncoder()` function in `ThingsNetwork.js` provides example usage and logs output for debugging.
- No exports are needed; TTN calls `encodeDownlink()` and `decodeUplink()` directly.

---

## References
- See the official [Milesight WS558 User Guide](ws558-user-guide-en.pdf) for protocol details. 