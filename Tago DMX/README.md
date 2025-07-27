# Tago DMX Light Control System

## Overview
This project implements a DMX light control system using TagoIO, TTN, and a Milesight WS101 smart button. The system allows control of DMX lights through different button press types.

## Device Configuration
## Button Press Mapping

### WS101 Payload Format
Based on Milesight WS101 documentation:
- **Single Press**: `FF2E01` (status = 1)
- **Long Press**: `FF2E02` (status = 2)
- **Double Press**: `FF2E03` (status = 3)

### Command Mapping
- **Single Press** → DMX Lights Command
  ```json
  {
    "lights": [
      { "address": 1, "channels": [255, 0, 0, 0] },
      { "address": 5, "channels": [0, 255, 0, 0] }
    ]
  }
  ```

- **Double Press** → Rainbow Pattern Command
  ```json
  {
    "pattern": "rainbow",
    "cycles": 0
  }
  ```

- **Long Press** → Off Command
  ```json
  {
    "command": "off"
  }
  ```

## System Architecture

### Components
1. **Milesight WS101 Button** - Sends button press events via LoRaWAN
2. **TTN Network** - Routes messages between devices and TagoIO
3. **TagoIO Action** - Triggers on button press events
4. **DMX Controller Analysis** - Sends commands to DMX lights
5. **DMX Controller** - Receives commands and controls lights

### Data Flow
```
WS101 Button → TTN → TagoIO Action → DMX Analysis → TTN → DMX Controller
```

## Implementation Files

### Analysis Scripts
- `dmx-controller-analysis.js` - Main DMX command sender
- `button-press-handler.js` - Button press detection and routing

### Configuration Files
- `tasks.md` - Development tasks and progress tracking
- `device-config.json` - Device configuration details
- `payload-decoders/` - Payload decoder scripts

## Testing Strategy

### Phase 1: Analysis Testing
- Test DMX controller analysis independently
- Verify command encoding and downlink
- Test each command type separately

### Phase 2: Action Testing
- Test button press detection
- Verify action triggers correctly
- Test complete button-to-light flow

### Phase 3: Integration Testing
- End-to-end testing with physical devices
- Verify all button press types work
- Test error handling and edge cases

## Dependencies

### TagoIO
- Device management
- Analysis execution
- Action automation

### TTN/ChirpStack
- LoRaWAN network
- Device communication
- Payload encoding/decoding

### Payload Decoders
- Milesight WS101 decoder
- DMX controller codec

## Troubleshooting

### Common Issues
1. **Button not detected** - Check TTN device registration
2. **Commands not sent** - Verify analysis execution
3. **Lights not responding** - Check DMX controller connection
4. **Wrong commands** - Verify payload encoding

### Debug Steps
1. Check TagoIO device data for button events
2. Verify action trigger conditions
3. Check analysis execution logs
4. Verify TTN downlink messages

## References

### Documentation
- [Milesight WS101 Documentation](https://github.com/Milesight-IoT/SensorDecoders/tree/main/WS_Series/WS101)
- [TagoIO Analysis Documentation](https://docs.tago.io/analysis/)
- [TTN Integration Guide](https://www.thethingsnetwork.org/docs/)

### Payload Decoders
- [WS101 Decoder](https://raw.githubusercontent.com/Milesight-IoT/SensorDecoders/main/WS_Series/WS101/WS101_Decoder.js)
- [DMX Controller Codec](https://raw.githubusercontent.com/pbezant/LoRa-DMX/refs/heads/master/chirpstack_codec.js) 