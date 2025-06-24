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

##### Multiple Relays (Array)
```json
{
  "commands": [
    { "relay": 1, "state": "on" },
    { "relay": 2, "state": "off" }
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

#### Mixing Relay and Utility Commands
```json
{
  "commands": [
    { "relay": 1, "state": "on" },
    { "type": "all_off" },
    { "type": "set_interval", "value": 600 }
  ]
}
```

### Command Nuances
- **Format Flexibility:** The encoder supports multiple input formats, but the `"commands"` array is most compatible with TTN integrations.
- **Immediate commands only:** Duration/delay is not supported. Each command turns a relay on or off immediately.
- **Relay numbers:** 1–8 only.
- **State:** Must be "on" or "off" (case-insensitive).
- **Invalid input:** The encoder will throw errors for bad formats, relay numbers, or states.
- **fPort:** Downlinks use `fPort: 85` by default.

---

## Development & Testing
- The `testEncoder()` function in `ThingsNetwork.js` provides example usage and logs output for debugging.
- No exports are needed; TTN calls `encodeDownlink()` and `decodeUplink()` directly.

---

## References
- See the official [Milesight WS558 User Guide](ws558-user-guide-en.pdf) for protocol details. 