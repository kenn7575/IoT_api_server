#include <WiFiNINA.h>
#include <ArduinoJson.h>
#include <HttpClient.h>
#include <DHT.h>
#include <Vector.h>
#include <rgb_lcd.h>

// Network Configuration
const char* WIFI_SSID = "KCN_2.4GHz";
const char* WIFI_PASSWORD = "S3cr3tPassword1!";
const char* SERVER_ADDRESS = "192.168.1.50";
const int SERVER_PORT = 3000;

// Pin Configurations
const int SOUND_SENSOR_PIN = A0;
const int LED_PIN = 4;
const int BUTTON_PIN = 3;
const int DHT_PIN = 7;
const int DHT_TYPE = DHT11;

// Sensor Settings
float tempMin = 20.0;  // Default safe values
float tempMax = 30.0;
float humMin = 30.0;
float humMax = 70.0;
int tempRefreshSeconds = 20;
int humidityRefreshSeconds = 20;
String activeSensorSettings = "Open";

// Global Variables
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient client;
HttpClient httpClient(client, SERVER_ADDRESS, SERVER_PORT);
rgb_lcd lcd;
float temp = 0;
float humidity = 0;
unsigned long lastSettingsUpdate = 0;
unsigned long lastTempUpdate = 0;
unsigned long lastHumidityUpdate = 0;
unsigned long lastSoundMeasurement = 0;
unsigned long lastDisplayUpdate = 0;
bool tempAlert = false;
bool humAlert = false;

// Settings Configuration
struct DeviceSettings {
  String startTime = "09:00:00";
  String endTime = "17:00:00";
  int updateSettingsInterval = 360;
};

DeviceSettings deviceSettings;
String machineId = "5407ED2992154343CA94";
String apiKey = "";
bool tempInCelsius = true;

bool connectToWiFi();
void loginDevice();
void loadSettings();
void setRGBColor(int r, int g, int b);
void handleSoundMeasurement(unsigned long currentTime, unsigned long& lastSoundMeasurement);
void handleTemperatureMeasurement(unsigned long currentTime, unsigned long& lastTempUpdate);
void handleHumidityMeasurement(unsigned long currentTime, unsigned long& lastHumidityUpdate);
int sendMeasurement(const String& type, float value);
void sendAlert(const String& sensorType, const String& name, const String& description, int measurementID);

void setup() {
  Serial.begin(9600);

  // Explicit LCD initialization with detailed setup
  lcd.begin(16, 2);  // 16 columns, 2 rows
  delay(100);        // Short delay to ensure LCD is ready

  // Clear any previous content
  lcd.clear();

  // Set cursor and print initial message
  lcd.setCursor(0, 0);
  lcd.print("Sensor Monitor");

  // Ensure backlight is on
  lcd.setRGB(255, 255, 255);  // Full white backlight

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT);

  bool connected = connectToWiFi();
  dht.begin();

  // Initial device setup
  loginDevice();
  loadSettings();

  // Debug print to Serial
  Serial.println("LCD Initialized");

  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("Temp: ");
  lcd.setCursor(0, 1);
  lcd.print("Humidity: ");
}

void loop() {
  unsigned long currentTime = millis();

  // Button for temperature unit toggle
  if (digitalRead(BUTTON_PIN) == HIGH) {
    tempInCelsius = !tempInCelsius;

    float tempToShow = temp;
    if (tempInCelsius) {
      tempToShow = (temp * 9.0 / 5.0) + 32.0;
    }

    lcd.setCursor(7, 0);
    lcd.print(tempToShow);
    lcd.print(tempInCelsius ? "*C" : "*F");
    lcd.setCursor(10, 1);
    lcd.print(humidity);
    lcd.print("%");
  }

  // Periodic settings refresh
  if (currentTime - lastSettingsUpdate > (deviceSettings.updateSettingsInterval * 1000UL)) {
    loadSettings();
    lastSettingsUpdate = currentTime;
  }

  handleSoundMeasurement(currentTime, lastSoundMeasurement);
  handleTemperatureMeasurement(currentTime, lastTempUpdate);
  handleHumidityMeasurement(currentTime, lastHumidityUpdate);
}

bool connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);

    if (millis() - startAttempt > 10000) {
      Serial.println("\nFailed to connect. Resetting...");
      setRGBColor(255, 0, 0);  // Red error indicator
      delay(2000);
      return false;
    }
  }
  Serial.println("\nWiFi Connected");
  setRGBColor(0, 255, 0);  // Green success indicator
  return true;
}

void loginDevice() {
  Serial.println("Logging in device...");

  if (!client.connect(SERVER_ADDRESS, SERVER_PORT)) {
    Serial.println("Server connection failed");
    setRGBColor(255, 0, 0);  // Red error
    return;
  }

  StaticJsonDocument<200> jsonDoc;
  jsonDoc["machine_id"] = machineId;

  String jsonString;
  serializeJson(jsonDoc, jsonString);

  client.println("POST /devices/login HTTP/1.1");
  client.println("Host: " + String(SERVER_ADDRESS));
  client.println("Content-Type: application/json");
  client.println("Content-Length: " + String(jsonString.length()));
  client.println();
  client.println(jsonString);

  unsigned long timeout = millis();
  while (!client.available()) {
    if (millis() - timeout > 5000) {
      Serial.println("Login response timeout");
      client.stop();
      return;
    }
  }

  // Simple error handling for login response
  while (client.available()) {
    String line = client.readStringUntil('\n');
    Serial.println(line);  // Debug print

    if (line.startsWith("{")) {
      StaticJsonDocument<200> responseJson;
      DeserializationError error = deserializeJson(responseJson, line);

      if (!error && responseJson.containsKey("apiKey")) {
        apiKey = responseJson["apiKey"].as<String>();
        Serial.println("Device login successful");
        break;
      }
    }
  }
}

void loadSettings() {
  Serial.println("Loading device settings...");

  if (!client.connect(SERVER_ADDRESS, SERVER_PORT)) {
    Serial.println("Settings server connection failed");
    return;
  }

  client.println("GET /devices/" + machineId + "/settings HTTP/1.1");
  client.println("Host: " + String(SERVER_ADDRESS));
  client.println("api-key: " + apiKey);
  client.println("Connection: close");
  client.println();

  unsigned long timeout = millis();
  while (!client.available()) {
    if (millis() - timeout > 5000) {
      Serial.println("Settings response timeout");
      client.stop();
      return;
    }
  }

  String response = "";
  while (client.available()) {
    response += client.readString();
  }

  int jsonStart = response.indexOf('{');
  if (jsonStart != -1) {
    StaticJsonDocument<500> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, response.substring(jsonStart));

    if (!error) {
      deviceSettings.startTime = jsonDoc["settings"]["startTime"].as<String>();
      deviceSettings.endTime = jsonDoc["settings"]["endTime"].as<String>();
      deviceSettings.updateSettingsInterval = jsonDoc["settings"]["updateSettingsIntervalSeconds"];

      JsonArray sensorSettings = jsonDoc["sensorSettings"].as<JsonArray>();
      for (JsonVariant setting : sensorSettings) {
        String activePeriod = setting["activePeriod"].as<String>();
        String sensorType = setting["sensorType"].as<String>();

        if (sensorType == "Temperature") {
          tempMin = setting["minValue"];
          tempMax = setting["maxValue"];
          tempRefreshSeconds = setting["timeIntervalSeconds"];
        } else if (sensorType == "Humidity") {
          humMin = setting["minValue"];
          humMax = setting["maxValue"];
          humidityRefreshSeconds = setting["timeIntervalSeconds"];
        }

        activeSensorSettings = activePeriod;
      }

      Serial.println("Settings loaded successfully");
    }
  }
}

void handleTemperatureMeasurement(unsigned long currentTime, unsigned long& lastTempUpdate) {

  float templocal = dht.readTemperature();

  if (isnan(templocal)) {
    return;
  }

  if (currentTime - lastTempUpdate >= (tempRefreshSeconds * 1000UL)) {

    temp = templocal;

    int measurementId = sendMeasurement("Temperature", temp);

    // Convert to Fahrenheit if not in Celsius
    if (!tempInCelsius) {
      templocal = (temp * 9.0 / 5.0) + 32.0;
      lcd.setCursor(7, 0);
      lcd.print(templocal);
    } else {
      lcd.setCursor(7, 0);
      lcd.print(temp);
    }

    // Update LCD with temperature
    lcd.print(tempInCelsius ? "*C" : "*F");

    if (temp > tempMax) {
      sendAlert("Temperature", "High Temperature Alert", "Temperature exceeded maximum limit", measurementId);
      tempAlert = true;
      setRGBColor(255, 0, 0);  // Red
    } else if (temp < tempMin) {
      sendAlert("Temperature", "Low Temperature Alert", "Temperature fell below minimum limit", measurementId);
      tempAlert = true;
      setRGBColor(0, 0, 255);  // Blue
    } else {
      if (humAlert == false) {
        setRGBColor(0, 255, 0);  // Green
      }

      if (tempAlert) {
        sendAlert("Temperature", "Temperature is back to normale", "the temperature is back between the min and the max temperature", measurementId);
      }
      tempAlert = false;
    }

    lastTempUpdate = currentTime;
  }
}

void handleHumidityMeasurement(unsigned long currentTime, unsigned long& lastHumidityUpdate) {
  float humidityLocal = dht.readHumidity();

  if (isnan(humidityLocal)) {
    return;
  }

  if (currentTime - lastHumidityUpdate >= (humidityRefreshSeconds * 1000UL)) {

    humidity = humidityLocal;

    int measurementId = sendMeasurement("Humidity", humidity);

    // Update LCD with humidity
    lcd.setCursor(10, 1);
    lcd.print(humidity);
    lcd.print("%");

    if (humidity > humMax) {
      sendAlert("Humidity", "High Humidity Alert", "Humidity exceeded maximum limit", measurementId);
      humAlert = true;
      setRGBColor(255, 0, 0);  // Red
    } else if (humidity < humMin) {
      sendAlert("Humidity", "Low Humidity Alert", "Humidity fell below minimum limit", measurementId);
      humAlert = true;
      setRGBColor(0, 0, 255);  // Blue
    } else {
      if (tempAlert == false) {
        setRGBColor(0, 255, 0);  // Green
      }

      if (humAlert == true) {
        sendAlert("Humidity", "Humidity is back to normale", "the humidity is back between the min and the max humidity", measurementId);
      }

      humAlert = false;
    }

    lastHumidityUpdate = currentTime;
  }
}

void handleSoundMeasurement(unsigned long currentTime, unsigned long& lastSoundMeasurement) {
  static Vector<int> soundList;
  int soundMeasured = analogRead(SOUND_SENSOR_PIN);

  if (soundMeasured > 0) {
    soundList.push_back(soundMeasured);
  }

  if (currentTime - lastSoundMeasurement >= 60000) {  // 1-minute interval
    float soundLevel = 0;
    for (int sound : soundList) {
      soundLevel += sound;
    }
    soundLevel /= soundList.size();

    if (soundLevel > 300) {
      int measurementId = sendMeasurement("Noise", soundLevel);
      sendAlert("Noise", "Too much noise alert", "Loud noise detected in environment", measurementId);
      digitalWrite(LED_PIN, HIGH);
    } else if (soundLevel > 50 && activeSensorSettings == "Closed") {
      int measurementId = sendMeasurement("Noise", soundLevel);
      sendAlert("Noise", "Noise during closed hours", "Sound detected outside operating hours", measurementId);
      digitalWrite(LED_PIN, HIGH);
    }

    soundList.clear();
    lastSoundMeasurement = currentTime;
  }
}

int sendMeasurement(const String& type, float value) {
  if (!client.connect(SERVER_ADDRESS, SERVER_PORT)) return;

  StaticJsonDocument<200> jsonDoc;
  jsonDoc["measurement"] = value;
  jsonDoc["valueType"] = (type == "Temperature") ? "C" : "%";
  jsonDoc["machine_id"] = machineId;

  String jsonString;
  serializeJson(jsonDoc, jsonString);

  String typeCopy = type;
  typeCopy.toLowerCase();
  client.println("POST /measurements/" + typeCopy + " HTTP/1.1");
  client.println("Host: " + String(SERVER_ADDRESS));
  client.println("Content-Type: application/json");
  client.println("api-key: " + apiKey);
  client.println("Content-Length: " + String(jsonString.length()));
  client.println();
  client.println(jsonString);

  unsigned long timeout = millis();
  while (!client.available()) {
    if (millis() - timeout > 5000) {
      Serial.println("Settings response timeout");
      client.stop();
      return;
    }
  }

  String response = "";
  while (client.available()) {
    response += client.readString();
  }

  int jsonStart = response.indexOf('{');
  if (jsonStart != -1) {
    StaticJsonDocument<500> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, response.substring(jsonStart));

    if (!error) {
      return jsonDoc["id"].as<int>();
    }
  }
}

void sendAlert(const String& sensorType, const String& name, const String& description, int measurementID) {
  if (!client.connect(SERVER_ADDRESS, SERVER_PORT)) return;

  StaticJsonDocument<300> jsonDoc;
  jsonDoc["sensorType"] = sensorType;
  jsonDoc["name"] = name;
  jsonDoc["description"] = description;
  jsonDoc["measurementId"] = measurementID;

  String jsonString;
  serializeJson(jsonDoc, jsonString);

  client.println("POST /alerts HTTP/1.1");
  client.println("Host: " + String(SERVER_ADDRESS));
  client.println("Content-Type: application/json");
  client.println("api-key: " + apiKey);
  client.println("Content-Length: " + String(jsonString.length()));
  client.println();
  client.println(jsonString);
}

void setRGBColor(int r, int g, int b) {
  lcd.setRGB(r, g, b);
}
