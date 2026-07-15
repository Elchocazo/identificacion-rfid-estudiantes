#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

#define SS_PIN 5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

// --- CONFIGURACIÓN DE TU RED WI-FI ---
const char* ssid = "MANUEL";
const char* password = "36274528";


// --- CONFIGURACIÓN DEL SERVIDOR (VERCEL) ---
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
  
  Serial.println("");
  Serial.println("¡Wi-Fi conectado con éxito!");
  Serial.print("Dirección IP asignada: ");
  Serial.println(WiFi.localIP());
  Serial.println("-----------------------------------");
  Serial.println("Lector listo. Acerca una tarjeta...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }
  
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  Serial.print("UID leído: ");
  String codigoTarjeta = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    codigoTarjeta += String(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    codigoTarjeta += String(rfid.uid.uidByte[i], HEX);
  }
  
  codigoTarjeta.toUpperCase();
  codigoTarjeta.trim(); // Quitamos espacios al inicio o final por seguridad
  Serial.println(codigoTarjeta);

  // Enviar a la base de datos a través de nuestro servidor
  if(WiFi.status() == WL_CONNECTED){
    WiFiClientSecure client;
    client.setInsecure(); // No validar el certificado SSL de Vercel
    
    HTTPClient http;
    http.setTimeout(20000); // 20 segundos de tiempo de espera (para evitar Error -11 por el arranque en frío de Vercel)
    
    // Configuramos la URL
    http.begin(client, serverName);
    
    // Indicamos que enviaremos JSON
    http.addHeader("Content-Type", "application/json");
    
    // Creamos el JSON con el UID
    String jsonPayload = "{\"uid\": \"" + codigoTarjeta + "\"}";
    
    Serial.println("Enviando datos al servidor...");
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.print("Respuesta HTTP: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println(response);
    } else {
      Serial.print("Error enviando POST: ");
      Serial.println(httpResponseCode);
    }
    
    // Liberar recursos
    http.end();
  } else {
    Serial.println("Error: Desconectado del Wi-Fi.");
  }

  // Detenemos la lectura actual y esperamos unos segundos antes de volver a leer
  rfid.PICC_HaltA();
  delay(2000); 
}
