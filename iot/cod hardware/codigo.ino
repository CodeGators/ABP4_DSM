#include <Servo.h>
#include <Wire.h> 
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2); 

Servo servo1, servo2, servo3;

// --- MAPEAMENTO DE PINOS ---
const int leds[] = {7, 6, 5}; 
const int pinoBuzzer = 8;
const int pinosTrig[] = {22, 24, 26};
const int pinosEcho[] = {23, 25, 27}; 

// --- CONFIGURAÇÕES DO SISTEMA ---
const int limiteAbertura = 10; 

// --- MODO APRESENTAÇÃO (1 seg real = 30 min virtuais) ---
bool interagindoComGaveta = false;

// Relógio começa perto das 08:00 para acionar a primeira gaveta rápido
unsigned long anteriorMillis = 0;
int horas = 7, minutos = 45, segundos = 0; 

bool doseA_entregue = false;
bool doseB_entregue = false;
bool doseC_entregue = false;

void setup() {
  Serial.begin(9600);
  
  lcd.init();
  lcd.backlight();
  
  atualizarVisor("PillGator V4.2", "Pitch + Seguranca");
  delay(2000);

  servo1.attach(9);
  servo2.attach(10);
  servo3.attach(11);
  
  servo1.write(0);
  servo2.write(0);
  servo3.write(0);

  for(int i = 0; i < 3; i++) {
    pinMode(leds[i], OUTPUT);
    pinMode(pinosTrig[i], OUTPUT);
    pinMode(pinosEcho[i], INPUT);
  }
  
  pinMode(pinoBuzzer, OUTPUT);
}

// Relógio com salto temporal de 30 minutos por segundo
void processarRelogio() {
  if (interagindoComGaveta) return; 

  unsigned long atualMillis = millis();
  
  if (atualMillis - anteriorMillis >= 100) { 
    anteriorMillis = atualMillis;
    minutos += 3; 
    
    if (minutos >= 60) { 
      minutos = minutos % 60; 
      horas++; 
    }
    
    if (horas >= 24) { 
      horas = 0; 
      doseA_entregue = false;
      doseB_entregue = false;
      doseC_entregue = false;
    }
  }
}

String obterHoraAtual() {
  char buffer[9];
  sprintf(buffer, "%02d:%02d:00", horas, minutos); 
  return String(buffer);
}

String obterProximoRemedio() {
  if (!doseA_entregue && (horas < 8)) return "PROX: A as 08:00";
  else if (!doseB_entregue && (horas < 14)) return "PROX: B as 14:00";
  else if (!doseC_entregue && (horas < 20)) return "PROX: C as 20:00";
  else return "PROX: A as 08:00"; 
}

long medirDistancia(int indiceGaveta) {
  digitalWrite(pinosTrig[indiceGaveta], LOW);
  delayMicroseconds(2);
  digitalWrite(pinosTrig[indiceGaveta], HIGH);
  delayMicroseconds(10);
  digitalWrite(pinosTrig[indiceGaveta], LOW);
  
  long duracao = pulseIn(pinosEcho[indiceGaveta], HIGH, 30000); 
  // CORREÇÃO: Retorna 999 (infinito) se der erro de leitura (gaveta muito aberta)
  if (duracao == 0) return 999;
  return duracao * 0.034 / 2;
}

void atualizarVisor(String linha1, String linha2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linha1);
  lcd.setCursor(0, 1);
  lcd.print(linha2);
}

void tocarAvisoAgradavel() {
  for (int i = 0; i < 3; i++) {
    tone(pinoBuzzer, 2500); delay(100); 
    tone(pinoBuzzer, 3000); delay(100);
    noTone(pinoBuzzer);     delay(100);
  }
}

void tocarAlertaErro() {
  for(int i = 0; i < 5; i++) {
    tone(pinoBuzzer, 2000); delay(200); 
    noTone(pinoBuzzer);     delay(50);
  }
}

void liberarRemedio(int numeroGaveta, String nome) {
  interagindoComGaveta = true; 
  int indice = numeroGaveta - 1;
  
  atualizarVisor("HORA: " + obterHoraAtual(), "ABRINDO: " + nome);
  delay(1500);
  
  atualizarVisor("GAVETA " + String(numeroGaveta), "PODE PUXAR!");
  digitalWrite(leds[indice], HIGH);

  if(numeroGaveta == 1) servo1.write(90);
  else if(numeroGaveta == 2) servo2.write(90);
  else if(numeroGaveta == 3) servo3.write(90);

  tocarAvisoAgradavel(); 

  bool gavetaFoiAberta = false;
  
  // Aguarda até 10 segundos para a pessoa puxar a gaveta
  for(int i = 0; i < 100; i++) { 
    long distanciaAtual = medirDistancia(indice);
    if(distanciaAtual > limiteAbertura) { 
      gavetaFoiAberta = true;
      break; 
    }
    delay(100); 
  }

  if(gavetaFoiAberta) {
    atualizarVisor("MEDICACAO OK", "FECHE A GAVETA");
    
    bool gavetaFoiFechada = false;
    
    // Aguarda até 10 segundos para a pessoa fechar a gaveta
    for(int i = 0; i < 100; i++) {
      long d = medirDistancia(indice);
      if(d > 0 && d <= limiteAbertura) {
        gavetaFoiFechada = true;
        break;
      }
      delay(100);
    }
    
    // --- NOVO: ALERTA DE GAVETA ABERTA ---
    // Se passaram os 10 segundos e a gaveta ainda está aberta, dispara a sirene
    if(!gavetaFoiFechada) {
      atualizarVisor("ALERTA CRITICO!", "GAVETA ABERTA!");
      // Fica apitando em loop INFINITO até a pessoa empurrar a gaveta de volta
      while(medirDistancia(indice) > limiteAbertura) {
        tone(pinoBuzzer, 800); delay(300);
        noTone(pinoBuzzer);    delay(300);
      }
    }
    // -------------------------------------
    
    for(int s = 8; s > 0; s--) {
      atualizarVisor("GAVETA FECHADA", "TRANCA EM: " + String(s) + "s");
      delay(1000);
    }

  } else {
    atualizarVisor("ALERTA CRITICO!", "DOSE PERDIDA");
    tocarAlertaErro();
    delay(3000);
  }

  if(numeroGaveta == 1) servo1.write(0);
  else if(numeroGaveta == 2) servo2.write(0);
  else if(numeroGaveta == 3) servo3.write(0);

  digitalWrite(leds[indice], LOW);
  atualizarVisor("SISTEMA", "TRANCADO");
  delay(1500);
  
  interagindoComGaveta = false;
  anteriorMillis = millis(); 
}

void loop() {
  processarRelogio();
  
  static unsigned long lastUpdate = 0;
  if(millis() - lastUpdate > 200) {
    atualizarVisor("HR: " + obterHoraAtual(), obterProximoRemedio());
    lastUpdate = millis();
  }

  if(horas >= 8 && !doseA_entregue) {
    liberarRemedio(1, "REMEDIO A");
    doseA_entregue = true; 
  }
  
  if(horas >= 14 && !doseB_entregue) {
    liberarRemedio(2, "REMEDIO B");
    doseB_entregue = true;
  }

  if(horas >= 20 && !doseC_entregue) {
    liberarRemedio(3, "REMEDIO C");
    doseC_entregue = true;
  }
}
