## **Milesight Smart Light Controller WS558 User Guide**

### **Safety Precautions**

Milesight is not responsible for losses or damages from not following this guide. The device must not be modified. Change the default password (123456) on first configuration for security. Installation and maintenance should be by qualified personnel following electrical safety regulations. Ensure power is off during installation. For LN models, do not reverse Live (L) and Neutral (N) wires. For best data transmission, ensure the device is within LoRaWAN® gateway signal range and away from metal objects. Do not overload maximum capacity. The device is for indoor use only; do not place it outside operating temperature range. Keep away from naked flames, heat sources (oven, sunlight), cold sources, liquids, and extreme temperature changes. Keep away from water to prevent electric shock. Use in a clean environment; dusty or dirty environments may prevent proper operation. Do not drop or subject to physical shocks or strong vibration.

### **Declaration of Conformity**

The WS558 conforms with essential requirements and relevant provisions of CE, FCC, and RoHS.

### **Copyright**

© 2011-2022 Milesight. All rights reserved. All information in this guide is copyright protected. No part of this guide may be copied or reproduced without written authorization from Xiamen Milesight IoT Co., Ltd.

### **Get Help**

For assistance, contact Milesight technical support:

* **Email**: iot.support@milesight.com  
* **Tel**: 86-592-5085280  
* **Fax**: 86-592-5023065  
* **Address**: Building C09, Software Park III, Xiamen 361024, China

### **Revision History**

* **July 20, 2022**: V 2.0 \- Initial version

### **Contents**

1. **Product Introduction** (Page 5\)  
   * 1.1 Overview (Page 5\)  
   * 1.2 Features (Page 5\)  
2. **Hardware Introduction** (Page 5\)  
   * 2.1 Packing List (Page 5\)  
   * 2.2 Hardware Overview (Page 6\)  
   * 2.4 Dimensions (mm) (Page 7\)  
3. **Operation Guide** (Page 7\)  
   * 3.1 ToolBox Login (Page 7\)  
     * 3.1.1 NFC Configuration (Page 7\)  
     * 3.1.2 USB Configuration (Page 8\)  
   * 3.2 LoRaWAN Settings (Page 9\)  
     * 3.2.1 Basic Settings (Page 10\)  
     * 3.2.2 Frequency Settings (Page 11\)  
     * 3.2.3 Multicast Settings (Page 12\)  
   * 3.3 General Settings (Page 15\)  
   * 3.4 Milesight D2D Settings (Page 15\)  
   * 3.5 Maintenance (Page 16\)  
     * 3.5.1 Upgrade (Page 16\)  
     * 3.5.2 Backup (Page 17\)  
     * 3.5.3 Reset to Factory Default (Page 19\)  
4. **Installation** (Page 19\)  
5. **Device Payload** (Page 20\)  
   * 5.1 Basic Information (Page 20\)  
   * 5.2 Sensor Data (Page 21\)  
   * 5.3 Downlink Commands (Page 22\)

### **1\. Product Introduction**

#### **1.1 Overview**

The WS558 is a LoRaWAN® Smart Light Controller for monitoring and controlling lights. With 2 circuit types and 8 switches, it fits various rooms, reducing re-wiring and renovation costs. Besides LoRaWAN®, the WS558 can be controlled without a gateway via Milesight D2D protocol for quick connections. It's widely used for wireless control of indoor lights, fans, heaters, and machines. Power data and switch status are transmitted via LoRaWAN® protocol, offering encrypted long-distance radio transmissions with low power consumption. Users can view data through Milesight IoT Cloud or their own Application Server.

#### **1.2 Features**

* LN type or switch type optional, controls up to 8 circuits of lights, adapts to different indoor wiring  
* Supports local switch button control, allowing lamp status testing without networking  
* Collects data on current, voltage, and electrical consumption  
* Up to 15 km communication range  
* Easy configuration via NFC  
* Standard LoRaWAN technology  
* Compatible with Milesight IoT Cloud and Milesight ToolBox  
* Supports Milesight D2D protocol for ultra-low latency control without a gateway  
* Supports multicast for bulk control

### **2\. Hardware Introduction**

#### **2.1 Packing List**

* 1 x WS558 Controller  
* 4 x Wall Mounting Kits  
* 1 x Quick Guide  
* 1 x Warranty Card  
  If any items are missing or damaged, contact your sales representative.

#### **2.2 Hardware Overview**

Components include AC Power Interface, NFC Area, Type-C Console Port, Light Indicator, Power Indicator, Light Button, Reset Button, Mounting Holes, and Switch/Output. All circuits/switches are open with their LED indicators off by default. Press the button beneath an LED indicator to close a circuit/switch; the LED will light up, indicating the connected lamp is on.

#### **2.3 Wiring Diagram**

(Diagrams for LN Model and Switch Model are provided in the original document)

#### **2.4 Dimensions (mm)**

(Diagrams with dimensions are provided in the original document)

### **3\. Operation Guide**

The WS558 can be configured via NFC or the Type-C port.

#### **3.1 ToolBox Login**

##### **3.1.1 NFC Configuration**

1. Download and install "Milesight ToolBox" App from Google Play or Apple App Store.  
2. Enable NFC on your smartphone and launch the App.  
3. Attach your smartphone to the device's NFC area to read device information. Basic information and settings will appear if recognized.  
4. Tap "Read/Write device" in the App to configure. Password validation (default: 123456\) is required for the first configuration.  
   Note:  
5. Check your smartphone's NFC area and consider removing the phone case.  
6. If reading/writing fails, move the phone away and try again.  
7. The WS558 can also be configured via a dedicated Milesight IoT NFC reader.

##### **3.1.2 USB Configuration**

1. Download ToolBox software from [www.milesight-iot.com](https://www.milesight-iot.com).  
2. Connect the device to a computer via the Type-C port. Avoid touching the power interface, switches, and other wirings to prevent electric shock.  
3. Open ToolBox, select "General" as type, and click password to log in (default: 123456).  
4. After logging in, you can check device status and change settings.  
   * **Model**: WS558-915M  
   * **Serial Number**: 6756C22186300001  
   * **PN**: LN  
   * **Device EUI**: 24e124756c221863  
   * **Firmware Version**: 01.01-a3  
   * **Hardware Version**: 2.0  
   * **Device Status**: On  
   * **Join Status**: De-Activate  
   * **RSSI/SNR**: 0/0  
   * **Voltage**: 222V  
   * **Total Current**: 5mA  
   * **Power Consumption**: Reset 0kWh  
   * **Channel Mask**: 0000000000000000ff00  
   * **Uplink Frame-counter**: 0  
   * **Downlink Frame-counter**: 0

#### **3.2 LoRaWAN Settings**

These settings configure data transmission parameters in the LoRaWAN® network.

##### **3.2.1 Basic Settings**

WS558 supports basic configurations like join type, App EUI, App Key, and other information, with default settings available.

* **Device EUI**: Unique ID, found on the label.  
* **App EUI**: Default is 24E124C0002A0001.  
* **Application Port**: Used for sending/receiving data, default is 85\.  
* **Join Type**: OTAA and ABP modes available.  
* **Application Key**: Appkey for OTAA mode, default is 5572404C696E6B4C6F52613230313823. DevAddr for ABP mode is default to the 5th to 12th digits of SN.  
* **Network Session Key**: Nwkskey for ABP mode, default is 5572404C696E6B4C6F52613230313823.  
* **Application Session Key**: Appskey for ABP mode, default is 5572404C696E6B4C6F52613230313823.  
* **RX2 Data Rate**: To receive downlinks or Milesight D2D commands.  
* **RX2 Frequency/MHz**: To receive downlinks or Milesight D2D commands.  
* **Spread Factor**: If ADR is disabled, the device sends data via this spread factor.  
* **Confirmed Mode**: If the device doesn't receive ACK, it resends data once.  
* **Rejoin Mode**:  
  * Reporting interval ≤ 30 mins: Device sends LinkCheckReq MAC packets every 30 mins to validate connectivity. If no response, it rejoins the network.  
  * Reporting interval \> 30 mins: Device sends LinkCheckReq MAC packets every reporting interval. If no response, it rejoins the network.  
* **ADR Mode**: Allows the network server to adjust device data rate.  
* Tx Power: Transmit power of the device.  
  Note:  
1. Contact your sales representative for device EUI list if many units.  
2. Contact your sales representative for random App keys before purchase.  
3. Select OTAA mode if using Milesight IoT Cloud.  
4. Only OTAA mode supports rejoin mode.

##### **3.2.2 Frequency Settings**

Select supported frequency and channels for uplinks, ensuring they match the LoRaWAN® gateway.  
If the device frequency is CN470/AU915/US915, enter channel indices separated by commas to enable them (e.g., "1, 40" for Channel 1 and 40; "1-40" for Channels 1-40; "1-40, 60" for Channels 1-40 and 60; "All" for all channels; "Null" disables all channels).  
Note:

* For \-868M models, default frequency is EU868.  
* For \-915M models, default frequency is AU915.

##### **3.2.3 Multicast Settings**

WS558 supports setting up multiple multicast groups to receive commands for bulk control.

1. Enable Multicast Group on WS558, set a unique address and keys to distinguish groups. Default settings can be kept.  
   * **Multicast Address**: Unique 8-digit address.  
   * **Multicast McAppSkey**: 32-digit key.  
     * Defaults: Group 1: 5572404C696E6B4C6F52613230313823; Group 2: 5572404C696E6B4C6F52613230313824; Group 3: 5572404C696E6B4C6F52613230313825; Group 4: 5572404C696E6B4C6F52613230313826  
   * **Multicast McNetSkey**: 32-digit key.  
     * Defaults: Group 1: 5572404C696E6B4C6F52613230313823; Group 2: 5572404C696E6B4C6F52613230313824; Group 3: 5572404C696E6B4C6F52613230313825; Group 4: 5572404C696E6B4C6F52613230313826  
2. Add a multicast group on the network server (e.g., Milesight UG6x gateway: "Network Server \-\> Multicast Groups", click "Add"). Fill in information matching WS558 settings, select devices, and click "Save".  
3. Go to “Network Server \-\> Packets”, select the multicast group, fill in the downlink command, and click “Send”. The network server will broadcast the command.  
   Note: Ensure all devices' application ports are the same.

#### **3.3 General Settings**

* **Reporting Interval**: Interval for reporting switch status and electrical parameters. Default: 20 mins, Range: 1 \- 1080 mins.  
* **The device returns to the power supply state**: If the device loses power and returns to power supply, all switches or outputs status will change according to this parameter.  
* **Change Password**: Change the password of the device for ToolBox App or software configuration.

#### **3.4 Milesight D2D Settings**

Milesight D2D protocol is developed by Milesight for setting up transmission among Milesight devices without a gateway. When enabled, WS558 can act as a Milesight D2D agent device to receive commands from Milesight D2D controller devices.

1. Ensure the RX2 datarate and RX2 frequency in LoRaWAN settings are the same as the Milesight D2D controller device.  
2. Enable the Milesight D2D feature, and define a unique Milesight D2D key that matches the controller device (Default Milesight D2D Key: 5572404C696E6B4C6F52613230313823).  
3. Define a 2-byte hexadecimal control command (0x0000 to 0xffff) and its action. For example, you can configure a control command to turn a switch on, off, or inverse its status.  
4. These control commands can be configured in the Milesight D2D controller device. When triggered, the controller device will send the pre-defined control command to control the circuits/switches of WS558.

#### **3.5 Maintenance**

##### **3.5.1 Upgrade**

**ToolBox Software**:

1. Download firmware from [www.milesight-iot.com](https://www.milesight-iot.com) to your PC.  
2. Go to “Maintenance \-\> Upgrade” in ToolBox software, click “Browse” to import firmware and upgrade. You can also click “Up to Date” to search for the latest firmware.  
   ToolBox App:  
3. Download firmware from [www.milesight-iot.com](https://www.milesight-iot.com) to your smartphone.  
4. Open ToolBox App and click “Browse” to import firmware and upgrade.  
   Note:  
5. ToolBox operations are not supported during upgrade.  
6. Only the Android version of ToolBox supports the upgrade feature.

##### **3.5.2 Backup**

WS558 supports configuration backup for easy and quick device configuration in bulk. Backup is only allowed for devices with the same model and LoRaWAN® frequency band.  
ToolBox Software:

1. Go to “Maintenance \-\> Backup and Reset” in ToolBox software, click “Export” to backup the device configuration.  
2. Click “Browse” to import the backup file, then click “Import” to load the configuration.  
   ToolBox App:  
3. Go to the “Template” page in the App and save current settings as a template. You can also edit the template file.  
4. Select a template file saved on the smartphone and click “Write”, then attach it to another device to write the configuration.  
   Note: Slide the template item to the left to edit or delete it. Click the template to edit the configurations.

##### **3.5.3 Reset to Factory Default**

Select one of the following methods to reset the device:

* **Via ToolBox Software**: Go to “Maintenance \-\> Backup and Reset” in ToolBox software, click “Reset”.  
* **Via ToolBox App**: Go to “Device \-\> Maintenance”, tap “Reset”, then attach your smartphone to the device's NFC area.

### **4\. Installation**

* **Wall Mounting**: Fix wall plugs into the wall, then fix the device to the wall plugs with screws.  
* **DIN Rail Mounting**: Fix the device to the DIN rail via the groove on its back.

### **5\. Device Payload**

All data follows HEX format, with the Data field in little endian: Channel1 Type1 Data1 Channel2 Type2 Data2 Channel 3 ... (1 Byte Channel, 1 Byte Type, N/M Bytes Data).  
Decoder examples are available at https://github.com/Milesight-IoT/SensorDecoders.

#### **5.1 Basic Information**

WS558 reports basic device information when it joins the network.  
Example:  
ff0bff ff0101 ff166756c22186300001 ff090200 ff0a0101 ff0f02 ff2601

* **Channel**: ff  
* **Type**:  
  * 01 (Protocol Version): 01 \=\> V1  
  * 09 (Hardware Version): 01 40 \=\> V1.4  
  * 0a (Software Version): 01 14 \=\> V1.14  
  * 0b (Power On): Device is on  
  * 0f (Device Type): 00: Class A, 01: Class B, 02: Class C  
  * 16 (Device SN): 16 digits  
  * 26 (Power Consumption): 00-disabled, 01-enabled  
* **Value**: (Examples provided in original document for each type)

#### **5.2 Sensor Data**

WS558 reports switch status and electrical data according to the reporting interval (20 mins by default). For Switch models, only switch status is uploaded.  
Example:

1. Periodic package:  
   08310001 058164 07c90200 0374b208 068301000000 048001000000  
   * **Channel**:  
     * 03 (Voltage): UINT16, Unit: V, Resolution: 0.1V  
     * 04 (Active Power): UINT32, Unit: W  
     * 05 (Power Factor): UINT8, Unit: %  
     * 06 (Power Consumption): UINT32, Unit: Wh  
     * 07 (Total Current): UINT16, Unit: mA  
     * 08 (Switch Status): Byte 1: 00; Byte 2: indicates every switch status per bit (0=close, 1=open)  
   * **Value**: (Examples provided in original document for each type, showing decoded values like L1 open, Power Factor 100%, Current 2mA, Voltage 222.6V, Power Consumption 0.001 kWh, Active Power 1W)  
2. When any switch changes status:  
   08310060  
   * **Channel**: 08  
   * **Type**: 31 (Switch Status)  
   * **Value**: Byte 1: 00; Byte 2: 60 \= 0110 0000 \=\> L6, L7 open and others close  
3. When LN model device detects current over 13A for more than 30s, all switches will close and upload alarm package:  
   07c9413f 08310000  
   * **Channel**: 07  
   * **Type**: c9 (Current)  
   * **Value**: 41 3f \=\> 3f 41 \= 16193 mA \= 16.193A  
   * **Channel**: 08  
   * **Type**: 31 (Switch Status)  
   * **Value**: Byte 1: 00; Byte 2: 00 \=\> All close

#### **5.3 Downlink Commands**

WS558 supports downlink commands to configure the device. The application port is 85 by default.

* **Channel**: 08  
  * **Description**: Byte 1: every switch control status per bit (0=not allow control, 1=allow control); Byte 2: every switch status per bit (0=close, 1=open)  
* **Channel**: ff  
  * **Type**:  
    * 03 (Set Reporting Interval): 2 Bytes, unit: s  
    * 10 (Reboot Device): ff  
    * 32 (Add Delay Task): Byte 1: 00; Byte 2-3: delay time, unit: s; Byte 4: every switch control status per bit (0=not allow control, 1=allow control); Byte 5: every switch status per bit (0=close, 1=open)  
      * **Note**: WS558 supports adding only one task. Later commands will cover previous commands.  
    * 23 (Delete Delay Task): 00 ff  
    * 26 (Power Consumption): 00-disable, 01-enable  
    * 27 (Reset Power Consumption): ff  
    * 28 (Enquire Electrical Status): ff

**Example**:

1. **Close L1 and open L6**: 082120  
   * **Channel**: 08  
   * **Type**: Command  
   * **Byte 1**: 21 \= 0010 0001 \=\> L1 and L6 allow control  
   * **Byte 2**: 20 \= 0010 0000 \=\> L1 close, L6 open  
2. **Close all switches**: 08ff00  
   * **Channel**: 08  
   * **Type**: Command  
   * **Byte 1**: ff \= 1111 1111 \=\> All switches allow control  
   * **Byte 2**: 00 \= 0000 0000 \=\> All switches close  
3. **Set reporting interval as 20 minutes**: ff03b004  
   * **Channel**: ff  
   * **Type**: 03 (Set Reporting Interval)  
   * **Value**: b0 04 \=\> 04 b0 \= 1200s \= 20 minutes  
4. **Add a delay task: close L6 after 1 minute**: ff32003c002000  
   * **Channel**: ff  
   * **Type**: 32 (Add Delay Task)  
   * **Byte 1**: 00  
   * **Byte 2-3**: 3c 00 \=\> 00 3c \= 60s \= 1min  
   * **Byte 4**: 20 \=\> Bit6=1 \=\> Control L6  
   * **Byte 5**: 00 \=\> Bit6=0 \=\> L6 close  
5. **Delete the delay task**: ff2300ff  
   * **Channel**: ff  
   * **Type**: 23 (Delete Delay Task)  
   * **Value**: 00ff  
6. **Disable the collection and upload of power consumption**: ff2600  
   * **Channel**: ff  
   * **Type**: 26 (Power Consumption)  
   * **Value**: 00 \= disable  
7. **Reset power consumption**: ff27ff  
   * **Channel**: ff  
   * **Type**: 27 (Reset Power Consumption)  
   * Value: ff (Reserved)  
     \-END