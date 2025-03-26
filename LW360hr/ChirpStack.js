function decodeUplink(input) {
    try {
        const bytes = Buffer.from(input.bytes);

        // Decode time using Unix epoch timestamp
        let time = bytes.slice(16, 20).readInt32LE();
        time = new Date(time * 1000).toISOString();

        // Report and Alarm Types
        const reportTypes = {
            2: 'Periodic Report'
        };

        const alarmTypes = {
            1: 'Help Alert',
            2: 'Man Down Alert',
            8: 'Low Heart Rate Alert'
        };

        const data = {
            data: {
                protocolVersion: bytes.slice(0, 1).readInt8(),
                commandId: bytes.slice(1, 3).readInt16LE(),
                
                // Location data
                location: {
                    longitude: bytes.slice(3, 7).readInt32LE() * 0.000001,
                    latitude: bytes.slice(7, 11).readInt32LE() * 0.000001,
                },
                
                // GPS Fix Status and Report/Alarm Type
                gpsFix: {
                    status: (bytes.slice(11, 12).readInt8() >> 5) & 0x07, // Bit 5-7
                    type: bytes.slice(11, 12).readInt8() & 0x1F // Bit 0-4
                },
                
                // Determine if it's a report or an alarm
                messageType: {
                    raw: bytes.slice(11, 12).readInt8() & 0x1F,
                    description: null
                },
                
                // Reserved byte
                reserved: bytes.slice(12, 13).readInt8(),
                
                // Additional metrics
                calorie: bytes.slice(13, 15).readInt16LE(),
                batteryCapacity: bytes.slice(15, 16).readInt8(),
                
                // Timestamp
                timestamp: time,
                
                // Beacon information
                beaconId: bytes.slice(20, 40).toString('hex'),
                beaconType: {
                    raw: bytes.slice(40, 41).readInt8(),
                    decoded: (bytes.slice(40, 41).readInt8() >> 5) & 0x07
                },
                
                // Signal information
                rssi: bytes.slice(41, 42).readInt8(),
                txPower: bytes.slice(42, 43).readInt8(),
                
                // Physiological data
                heartRate: bytes.slice(43, 44).readInt8(),
                skinTemperature: bytes.slice(44, 46).readInt16LE() / 100,
                
                // Activity data
                step: bytes.slice(46, 48).readInt16LE(),
                distance: bytes.slice(48, 50).readInt16LE()
            },
            time: time,
            warnings: [],
            errors: []
        };

        // Decode GPS Fix Status
        const gpsFixStatuses = {
            0: 'Not Fixed',
            1: '2D Fix',
            2: '3D Fix'
        };
        data.data.gpsFix.statusDescription = gpsFixStatuses[data.data.gpsFix.status] || 'Unknown';

        // Decode Beacon Type
        const beaconTypes = {
            0: 'Beacon Not Available',
            1: 'iBeacon',
            2: 'Eddystone Beacon',
            3: 'ALTBeacon'
        };
        data.data.beaconType.description = beaconTypes[data.data.beaconType.decoded] || 'Unknown';

        // Determine if it's a report or an alarm
        const reportTypeValue = data.data.messageType.raw;
        if (reportTypes[reportTypeValue]) {
            data.data.messageType.description = reportTypes[reportTypeValue];
        } else if (alarmTypes[reportTypeValue]) {
            data.data.messageType.description = alarmTypes[reportTypeValue];
        } else {
            data.data.messageType.description = 'Unknown Message Type';
        }

        return data;
    } catch (error) {
        return {
            errors: [error.message],
            warnings: [],
            data: {}
        };
    }
}