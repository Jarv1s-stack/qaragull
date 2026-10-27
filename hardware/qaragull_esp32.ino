// Qaragull Field Lab ESP32 example. Hardware is optional and not included.
// Requires ArduinoJson, BH1750, OneWire, and DallasTemperature libraries.
#include <ArduinoJson.h>
#include <BH1750.h>
#include <DallasTemperature.h>
#include <OneWire.h>
#include <Wire.h>

constexpr int SOIL_PIN = 34;
constexpr int LEAF_SIGNAL_PIN = 32; // Buffered, low-voltage sensor output only.
constexpr int ONE_WIRE_PIN = 4;
constexpr int PUMP_PIN = 25;
constexpr int FAN_PIN = 26;
constexpr int LAMP_PIN = 27;
constexpr int SOIL_DRY_RAW = 3000; // Calibrate for your own sensor and soil.
constexpr int SOIL_WET_RAW = 1300; // Calibrate for your own sensor and soil.
constexpr uint32_t SENSOR_PERIOD_MS = 3000;
constexpr uint32_t PUMP_LIMIT_MS = 4000;
constexpr uint32_t COMMAND_TIMEOUT_MS = 30000;

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature temperatureSensor(&oneWire);
BH1750 lightSensor;
uint32_t lastSensorAt = 0;
uint32_t lastCommandAt = 0;
uint32_t pumpStartedAt = 0;
bool pumpOn = false;
bool fanOn = false;
bool lampOn = false;
float latestTemperature = NAN;
int latestSoilMoisture = 0;

void applyOutputs() {
  digitalWrite(PUMP_PIN, pumpOn ? HIGH : LOW);
  digitalWrite(FAN_PIN, fanOn ? HIGH : LOW);
  digitalWrite(LAMP_PIN, lampOn ? HIGH : LOW);
}

void allOff() {
  pumpOn = false;
  fanOn = false;
  lampOn = false;
  applyOutputs();
}

void readCommand() {
  static char line[192];
  static size_t length = 0;
  while (Serial.available() > 0) {
    const char incoming = static_cast<char>(Serial.read());
    if (incoming != '\n' && length < sizeof(line) - 1) {
      line[length++] = incoming;
      continue;
    }
    line[length] = '\0';
    length = 0;
    StaticJsonDocument<192> command;
    if (deserializeJson(command, line) != DeserializationError::Ok || command["type"] != "actuator") continue;

    lastCommandAt = millis();
    lampOn = command["lamp"] | false;
    fanOn = command["fan"] | false;
    const bool requestedPump = command["pump"] | false;
    const bool safeToWater = isfinite(latestTemperature) && latestTemperature > -5 && latestTemperature < 35 && latestSoilMoisture < 85;
    if (requestedPump && safeToWater) {
      if (!pumpOn) pumpStartedAt = millis();
      pumpOn = true;
    } else {
      pumpOn = false;
    }
    applyOutputs();
  }
}

void publishSensors() {
  const int soilRaw = analogRead(SOIL_PIN);
  latestSoilMoisture = constrain(map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100), 0, 100);
  const float lux = lightSensor.readLightLevel();
  temperatureSensor.requestTemperatures();
  latestTemperature = temperatureSensor.getTempCByIndex(0);
  const int leafSignalMillivolts = analogReadMilliVolts(LEAF_SIGNAL_PIN);

  // Browser protocol: soil %, BH1750 lux, DS18B20 °C, buffered input mV.
  Serial.printf("%d,%.1f,%.1f,%d\n", latestSoilMoisture, lux, latestTemperature, leafSignalMillivolts);
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  pinMode(SOIL_PIN, INPUT);
  pinMode(LEAF_SIGNAL_PIN, INPUT);
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(LAMP_PIN, OUTPUT);
  allOff();
  Wire.begin();
  lightSensor.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  temperatureSensor.begin();
  lastCommandAt = millis();
}

void loop() {
  readCommand();
  const uint32_t now = millis();
  if (pumpOn && now - pumpStartedAt >= PUMP_LIMIT_MS) {
    pumpOn = false;
    applyOutputs();
  }
  if (now - lastCommandAt >= COMMAND_TIMEOUT_MS) allOff();
  if (now - lastSensorAt >= SENSOR_PERIOD_MS) {
    lastSensorAt = now;
    publishSensors();
  }
}
