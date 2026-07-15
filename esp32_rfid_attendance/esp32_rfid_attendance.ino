#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------------------------------------------------------
// CONFIGURACIÓN DEL COLEGIO (MULTI-TENANCY)
// ---------------------------------------------------------
// RECUERDA: Cambia esto por el código exacto del colegio que creaste en el panel SuperAdmin
const String SCHOOL_ID = "CHMD"; 

// ---------------------------------------------------------
// CONFIGURACIÓN DE RED Y API
// ---------------------------------------------------------
const char* ssid = "MANUEL";
const char* password = "36274528";
const String apiUrl = "https://identificacion-rfid-estudiantes.vercel.app/api/attendance";

// ---------------------------------------------------------
// CONFIGURACIÓN DEL LECTOR RFID (Pines para ESP32)
// ---------------------------------------------------------
#define RST_PIN 22
#define SS_PIN 21
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Pines para LEDs y Buzzer (Opcional, déjalos así si no tienes conectados LEDs)
#define LED_GREEN 2
#define LED_RED 4
#define BUZZER 15

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Conectar a WiFi
  Serial.println("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado a WiFi!");
  Serial.println("Lector RFID listo. Esperando tarjeta...");
}

void loop() {
  // Revisar si hay una nueva tarjeta presente
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  // Leer el serial de la tarjeta
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Convertir el UID a String (Formato: "A1 B2 C3 D4")
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uidString += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uidString += String(mfrc522.uid.uidByte[i], HEX);
    if (i != mfrc522.uid.size - 1) uidString += " ";
  }
  uidString.toUpperCase();

  Serial.println("Tarjeta detectada: " + uidString);
  
  // Enviar a la API
  sendToAPI(uidString);
  
  // Detener lectura para no enviar múltiples peticiones por la misma tarjeta
  mfrc522.PICC_HaltA();
  delay(1000); 
}

void sendToAPI(String uid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiUrl);
    http.addHeader("Content-Type", "application/json");

    // Construir el JSON incluyendo el UID y el SCHOOL_ID
    StaticJsonDocument<200> doc;
    doc["uid"] = uid;
    doc["schoolId"] = SCHOOL_ID; // <--- AQUÍ SE ENVÍA EL CÓDIGO DEL COLEGIO
    
    String requestBody;
    serializeJson(doc, requestBody);
    
    Serial.println("Enviando datos a la nube: " + requestBody);
    
    int httpResponseCode = http.POST(requestBody);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Código HTTP: " + String(httpResponseCode));
      Serial.println("Respuesta: " + response);
      
      if (httpResponseCode == 200 || httpResponseCode == 201) {
        // Asistencia Exitosa
        digitalWrite(LED_GREEN, HIGH);
        tone(BUZZER, 1000, 200); // Tono agudo (éxito)
        delay(500);
        digitalWrite(LED_GREEN, LOW);
      } else if (httpResponseCode == 404) {
        // Tarjeta No Registrada (Pendiente)
        digitalWrite(LED_RED, HIGH);
        tone(BUZZER, 500, 500); // Tono grave (alerta)
        delay(1000);
        digitalWrite(LED_RED, LOW);
      }
    } else {
      Serial.println("Error en la petición HTTP. Código de error: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("Error: WiFi desconectado.");
  }
}
