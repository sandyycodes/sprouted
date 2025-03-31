//#include <WiFi.h>
#include <WiFiManager.h>  // Include WiFiManager library
#include <HTTPClient.h>
#include "Adafruit_seesaw.h"
#include <Adafruit_AHTX0.h>

Adafruit_seesaw ss;
Adafruit_AHTX0 aht;
char device_id[20];

const char* serverURL = "http://192.168.1.247:3000/update"; // Your server URL

void setup() {
    WiFi.mode(WIFI_STA);
    Serial.begin(115200);

    // Initialize WiFiManager
    WiFiManager wm;

    // reset settings - wipe stored credentials for testing
    // these are stored by the esp library
    //wm.resetSettings();

    // Automatically connect using saved credentials,
    // if connection fails, it starts an access point with the specified name ( "AutoConnectAP"),
    // if empty will auto generate SSID, if password is blank it will be anonymous AP (wm.autoConnect())
    // then goes into a blocking loop awaiting configuration and will return success result

    bool res;
    // res = wm.autoConnect(); // auto generated AP name from chipid
    // res = wm.autoConnect("AutoConnectAP"); // anonymous ap
    res = wm.autoConnect("SproutEd-Setup","sproutnyc"); // password protected ap

    if(!res) {
        Serial.println("Failed to connect");
        ESP.restart();
    } 
    else {
        //if you get here you have connected to the WiFi    
        Serial.println("connected...yeey :)");
    }

    // Sensor connection
    if (!ss.begin(0x36)) {
        Serial.println("ERROR! Seesaw not found");
        while (1) delay(1);
    } else {
        Serial.print("Seesaw started! version: ");
        Serial.println(ss.getVersion(), HEX);
    }

    if (!aht.begin()) {
        Serial.println("Could not find AHT? Check wiring");
        while (1) delay(10);
    }
    Serial.println("AHT10 or AHT20 found");

    
    // Generate unique device ID from ESP32's MAC address
    uint64_t chipid = ESP.getEfuseMac();  // Get chip's unique ID
    snprintf(device_id, 20, "ESP%04X", (uint16_t)(chipid >> 32)); // Shortened ID

    Serial.print("Device ID: ");
    Serial.println(device_id);

}



void loop() {
    if (WiFi.status() == WL_CONNECTED) {


      String plantName = "plant-name";
      Serial.println(plantName);
      float tempC = ss.getTemp();
      uint16_t capread = ss.touchRead(0);
      sensors_event_t humidity, temp;
      aht.getEvent(&humidity, &temp);// populate temp and humidity objects with fresh data


      HTTPClient http;
      http.begin(serverURL);
      http.addHeader("Content-Type", "application/json");

      //sensor data
      String jsonPayload = "{";
      jsonPayload += "\"device_id\": \"" + String(device_id) + "\", ";
      jsonPayload += "\"plantName\": \"" + String(plantName) + "\", ";
      jsonPayload += "\"temperature\": " + String(tempC, 2) + ", ";
      jsonPayload += "\"humidity\": " + String(humidity.relative_humidity, 2) + ", ";
      jsonPayload += "\"moisture\": " + String(capread);
      jsonPayload += "}";
      
      int httpResponseCode = http.POST(jsonPayload);

      Serial.print("Server response: ");
      Serial.println(httpResponseCode);
      Serial.print("Sent data: ");
      Serial.println(jsonPayload); 

      http.end();
    }
    else{
      Serial.println("Error connecting to wifi");
    }

    delay(5000); // Send data every 5 seconds
}
