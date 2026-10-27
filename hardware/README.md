# Optional ESP32 bridge

This example uses free Arduino libraries: ArduinoJson, BH1750, OneWire, and DallasTemperature. No board or sensors are included. Adjust pin assignments and soil calibration for the hardware before connecting anything.

At 115200 baud the board sends one CSV line every 3 seconds:

```text
soilMoisturePercent,lightLux,temperatureC,leafSignalMillivolts
```

The web app sends a JSON line when an actuator is changed:

```json
{"type":"actuator","lamp":false,"fan":true,"pump":false}
```

All output pins start off. The pump is blocked above 85% soil moisture or outside the configured temperature range, and the board limits each pump activation to 4 seconds. If no command arrives for 30 seconds, every output turns off. Use properly rated, isolated drivers for a pump, lamp, or fan; do not connect mains voltage or bare electrodes to the ESP32.

The leaf-signal input is only a buffered low-voltage measurement sample. It is not an ECG diagnosis or a claim that a plant communicates.
