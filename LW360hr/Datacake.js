function Decoder(bytes, port) {
    // Defensive programming to handle various input types
    if (!bytes || bytes.length === 0) {
        return {
            error: "Empty or invalid payload"
        };
    }

    // Report and Alarm Types
    var reportTypes = {
        2: 'Periodic Report'
    };

    var alarmTypes = {
        1: 'Help Alert',
        2: 'Man Down Alert',
        8: 'Low Heart Rate Alert'
    };

    var gpsFixStatuses = {
        0: 'Not Fixed',
        1: '2D Fix',
        2: '3D Fix'
    };

    var beaconTypes = {
        0: 'Beacon Not Available',
        1: 'iBeacon',
        2: 'Eddystone Beacon',
        3: 'ALTBeacon'
    };

    // Helper function to safely read 32-bit little-endian integer
    function safeReadInt32LE(arr, start) {
        if (!arr || start + 3 >= arr.length) return 0;
        return (
            (arr[start] || 0) |
            ((arr[start + 1] || 0) << 8) |
            ((arr[start + 2] || 0) << 16) |
            ((arr[start + 3] || 0) << 24)
        );
    }

    // Helper function to safely read 16-bit little-endian integer
    function safeReadInt16LE(arr, start) {
        if (!arr || start + 1 >= arr.length) return 0;
        return (arr[start] || 0) | ((arr[start + 1] || 0) << 8);
    }

    // Helper function to convert 20-byte beacon ID to hex string
    function readBeaconId(arr) {
        var beaconId = '';
        for (var i = 20; i < 40; i++) {
            var hex = (arr[i] || 0).toString(16);
            beaconId += hex.length === 1 ? '0' + hex : hex;
        }
        return beaconId;
    }

    // Decode timestamp
    var time = safeReadInt32LE(bytes, 16) * 1000;
    var timeISO = new Date(time).toISOString();

    // GPS Fix Status and Message Type
    var gpsFix = bytes[11] || 0;
    var gpsFixStatus = (gpsFix >> 5) & 0x07;
    var messageType = gpsFix & 0x1F;

    // Determine message type description
    var messageTypeDescription = 'Unknown Message Type';
    if (reportTypes[messageType]) {
        messageTypeDescription = reportTypes[messageType];
    } else if (alarmTypes[messageType]) {
        messageTypeDescription = alarmTypes[messageType];
    }

    // Beacon Type
    var beaconTypeRaw = bytes[40] || 0;
    var beaconTypeDecoded = (beaconTypeRaw >> 5) & 0x07;

    var decoded = {
        // Protocol Version and Command ID
        protocol_version: bytes[0] || 0,
        command_id: safeReadInt16LE(bytes, 1),

        // Location
        location: '(' + 
            (safeReadInt32LE(bytes, 7) * 0.000001).toFixed(6) + 
            ', ' + 
            (safeReadInt32LE(bytes, 3) * 0.000001).toFixed(6) + 
            ')',
        location_details: {
            latitude: safeReadInt32LE(bytes, 7) * 0.000001,
            longitude: safeReadInt32LE(bytes, 3) * 0.000001
        },

        // GPS Fix Information
        gps_fix: {
            status: gpsFixStatus,
            status_description: gpsFixStatuses[gpsFixStatus] || 'Unknown',
            type: messageType,
            type_description: messageTypeDescription
        },

        // Reserved Byte
        reserved: bytes[12] || 0,

        // Additional Measurements
        calorie: safeReadInt16LE(bytes, 13),
        battery_capacity: bytes[15] || 0,

        // Beacon Information
        beacon_id: readBeaconId(bytes),
        beacon_type: {
            raw: beaconTypeRaw,
            decoded: beaconTypeDecoded,
            description: beaconTypes[beaconTypeDecoded] || 'Unknown'
        },

        // Signal Information
        rssi: bytes[41] ? bytes[41] - 256 : 0,
        tx_power: bytes[42] || 0,

        // Physiological Data
        heart_rate: bytes[43] || 0,
        skin_temperature: safeReadInt16LE(bytes, 44) / 100,

        // Activity Tracking
        step_count: safeReadInt16LE(bytes, 46),
        distance: safeReadInt16LE(bytes, 48),

        // Timestamps
        timestamp: timeISO,
        timestamp_unix: time / 1000
    };

    return decoded;
}