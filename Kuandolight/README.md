# Kuando Busylight Downlink Analysis Script for TagoIO

This script lets you control a Kuando Busylight via TTN (The Things Network) by sending downlink commands from TagoIO. Trigger it from a dashboard button or run it manually. Supports named commands (All Clear, Alert, Alarm) and custom RGB/timing values.

## Prerequisites
- A Kuando Busylight device registered in TTN
- TagoIO account with Analysis feature enabled
- TTN Application ID, Device ID, and API Key (with downlink permission)
- Node.js environment in TagoIO Analysis (axios is pre-installed)

## Environment Variables (set in TagoIO)
- `TTN_APP_ID`:      Your TTN Application ID
- `TTN_DEVICE_ID`:   Your TTN Device ID
- `TTN_API_KEY`:     Your TTN API Key (with downlink permission)
- `TTN_REGION`:      TTN region/cluster (e.g., eu1, nam1). Default: eu1

## Setup
1. Copy `tago.js` into your TagoIO Analysis script editor.
2. Set the environment variables above in the Analysis settings.
3. Save and deploy the Analysis.

## Usage
### Triggering
- **Dashboard Button:**
  - Create a dashboard form/button that sends a variable `command` (e.g., `all_clear`, `alert`, `alarm`) or `custom_payload` (JSON string/object with `red`, `green`, `blue`, `ontime`, `offtime`).
- **Manual Run:**
  - Run the Analysis and provide the same variables in the scope.

### Command Mapping
| Command     | Color         | On Time | Off Time | Behavior         |
|-------------|--------------|---------|----------|-----------------|
| all_clear   | Green        | 0       | 0        | Steady          |
| alert       | Yellow       | 30      | 30       | Pulse 30s       |
| alarm       | Red          | 1       | 1        | Flash 1s        |

- **Custom:**
  - Provide a `custom_payload` variable as a JSON object or string:
    ```json
    { "red": 125, "green": 255, "blue": 255, "ontime": 255, "offtime": 0 }
    ```

## How It Works
- The script maps the command or custom values to a byte array: `[red, blue, green, ontime, offtime]`.
- The byte array is base64 encoded and sent to TTN’s downlink API on port 15.
- TTN delivers the downlink to your device.

## Troubleshooting
- Check the Analysis logs for errors (missing env vars, invalid input, TTN API errors).
- Make sure your TTN API Key has downlink permissions.
- Confirm your device is registered and active in TTN.
- If using custom payloads, ensure all fields are numbers.

## Extending
- Add new named commands by editing the `COMMANDS` object in the script.
- Adjust timing or color values as needed for your use case.

---

Big Daddy, if you need more features or run into issues, you know where to find me. 