#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Pines para ESP32 (ajústalos si usaste otros)
#define SS_PIN 5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

// --- CONFIGURACIÓN DE TU RED WI-FI ---
const char* ssid = "MANUEL";
const char* password = "36274528";

// --- URL DE TU SERVIDOR EN LA NUBE ---
const char* serverName = "https://identificacion-rfid-estudiantes.vercel.app/api/attendance"; 

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  
  Serial.println();
  Serial.print("Conectando a la red: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n¡Wi-Fi conectado con éxito!");
  Serial.print("Dirección IP asignada: ");
  Serial.println(WiFi.localIP());
  Serial.println("-----------------------------------");
  Serial.println("Lector en la puerta LISTO. Acerca una tarjeta...");
}

void loop() {
  // Revisamos si hay una tarjeta cerca
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }
  // Revisamos si podemos leerla
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Extraemos el código UID de la tarjeta
  Serial.print("UID leído: ");
  String codigoTarjeta = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    codigoTarjeta += String(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    codigoTarjeta += String(rfid.uid.uidByte[i], HEX);
  }
  
  codigoTarjeta.toUpperCase();
  codigoTarjeta.trim();
  Serial.println(codigoTarjeta);

  // Enviamos el código a nuestra página web para que ella decida qué hacer
  if(WiFi.status() == WL_CONNECTED){
    WiFiClientSecure client;
    client.setInsecure(); // Necesario para conexiones HTTPS a Vercel
    
    HTTPClient http;
    http.setTimeout(15000); // Darle tiempo al servidor
    
    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/json");
    
    // Armamos el pequeño paquete JSON
    String jsonPayload = "{\"uid\": \"" + codigoTarjeta + "\"}";
    
    Serial.println("Enviando datos a la nube...");
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.print("Respuesta HTTP: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println(response); // Aquí verás si se marcó asistencia o si se guardó como pendiente
    } else {
      Serial.print("Error de red: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("Alerta: Sin conexión a Wi-Fi.");
  }

  // Pausamos el lector 3 segundos para que no lea la misma tarjeta 100 veces por accidente
  rfid.PICC_HaltA();
  delay(3000); 
}
