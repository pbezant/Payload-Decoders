function decodeUplink(input) {
    try {
      const bytes = Buffer.from(input.bytes);
  
      let time = bytes.slice(16, 20).readInt32LE();
      time = new Date(time * 1000).toISOString();
  
      const data = {
        data: {
          location: {
            longitude: bytes.slice(3, 7).readInt32LE() * 0.000001,
            latitude: bytes.slice(7, 11).readInt32LE() * 0.000001,
          },
          gpsFix: bytes.slice(11, 12).readInt8() / 32,
          reportType: bytes.slice(11, 12).readInt8() % 32,
          batteryCapacity: bytes.slice(15, 16).readInt8(),
          beaconId:
            (BigInt(bytes[20]) << 160n) |
            (BigInt(bytes[21]) << 152n) |
            (BigInt(bytes[22]) << 144n) |
            (BigInt(bytes[23]) << 136n) |
            (BigInt(bytes[24]) << 128n) |
            (BigInt(bytes[25]) << 120n) |
            (BigInt(bytes[26]) << 112n) |
            (BigInt(bytes[27]) << 104n) |
            (BigInt(bytes[28]) << 96n) |
            (BigInt(bytes[29]) << 86n) |
            (BigInt(bytes[30]) << 80n) |
            (BigInt(bytes[31]) << 72n) |
            (BigInt(bytes[32]) << 64n) |
            (BigInt(bytes[33]) << 48n) |
            (BigInt(bytes[34]) << 40n) |
            (BigInt(bytes[35]) << 32n) |
            (BigInt(bytes[36]) << 24n) |
            (BigInt(bytes[37]) << 16n) |
            (BigInt(bytes[38]) << 8n) |
            BigInt(bytes[39]),
          beaconType: bytes.slice(40, 41).readInt8() / 32,
          rssi: bytes.slice(41, 42).readInt8(),
          txPower: bytes.slice(42, 43).readInt8(),
          heartRate: bytes.slice(43, 44).readInt8(),
          temperature: bytes.slice(44, 46).readInt16LE() / 100,
        },
        time: time,
        warnings: [],
        errors: [],
      };
      return data;
    } catch (error) {
      return {
        errors: [error.message],
        warnings: [],
        data: {},
      };
    }
  }