
function Decoder(bytes, port) {
    // Defensive programming to handle various input types
    if (!bytes || bytes.length === 0) {
        return {
            error: "Empty or invalid payload"
        };
    }

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

    // Helper function to safely convert to hex string
    function safeToHexString(value) {
        if (value === null || value === undefined) return '';
        var hex = (value).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }

    // Helper function to safely read Beacon ID as hex string
    function readBeaconId(arr) {
        var beaconId = '';
        for (var i = 20; i < 40; i++) {
            beaconId += safeToHexString(arr[i]);
        }
        return beaconId;
    }

    // Decode timestamp
    var time = safeReadInt32LE(bytes, 16) * 1000;
    
    // Calculate latitude and longitude
    var latitude = safeReadInt32LE(bytes, 7) * 0.000001;
    var longitude = safeReadInt32LE(bytes, 3) * 0.000001;
    
    var decoded = {
        // Location formatted as (latitude, longitude)
        location: '(' + latitude.toFixed(6) + ', ' + longitude.toFixed(6) + ')',
        
        // Separate latitude and longitude fields for additional flexibility
        location_latitude: latitude,
        location_longitude: longitude,
        
        // GPS Fix
        gps_fix: (bytes[11] || 0) / 32,
        
        // Report Type
        report_type: (bytes[11] || 0) % 32,
        
        // Battery Capacity
        battery_capacity: bytes[15] || 0,
        
        // Beacon ID (as a hex string)
        beacon_id: readBeaconId(bytes),
        
        // Beacon Type
        beacon_type: (bytes[40] || 0) / 32,
        
        // RSSI
        rssi: bytes[41] || 0,
        
        // Tx Power
        tx_power: bytes[42] || 0,
        
        // Heart Rate
        heart_rate: bytes[43] || 0,
        
        // Temperature
        temperature: safeReadInt16LE(bytes, 44) / 100,
        
        // Timestamp
        timestamp: new Date(time).toISOString()
    };

    // Return the decoded payload
    return decoded;
}