#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

LiquidCrystal_I2C lcd(0x27, 16, 2); 

// --- VETORES DE COMPONENTES (Agora para 3 Gavetas) ---
Servo servosGaveta[3];
const int pinosLed[3]   = {7, 6, 5};     // LEDs das gavetas 1, 2 e 3
const int pinosServo[3] = {9, 10, 11};   // Servos das gavetas 1, 2 e 3
const int pinosTrig[3]  = {22, 24, 26};  // Trigs dos sensores 1, 2 e 3
const int pinosEcho[3]  = {23, 25, 27};  // Echos dos sensores 1, 2 e 3

const int pinoBuzzer = 8;
const int limiteAbertura = 10; 

// --- TEMPOS DE CONFIGURAÇÃO ---
const int tempoParaTrancar = 5000; // 5 segundos de delay para trancar

void setup() {
  Serial.begin(9600);
  
  lcd.init();
  lcd.backlight();
  
  pinMode(pinoBuzzer, OUTPUT);
  digitalWrite(pinoBuzzer, LOW);
  noTone(pinoBuzzer);

  // O loop agora vai até 3 para configurar todas as gavetas
  for (int i = 0; i < 3; i++) {
    pinMode(pinosLed[i], OUTPUT);
    pinMode(pinosTrig[i], OUTPUT);
    pinMode(pinosEcho[i], INPUT);
    
    servosGaveta[i].attach(pinosServo[i]);
    servosGaveta[i].write(0); 
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("PillGator V3.0"); 
  lcd.setCursor(0, 1);
  lcd.print("3 Gavetas Ativas");
  delay(2000);
}

long medirDistancia(int indice) {
  digitalWrite(pinosTrig[indice], LOW);
  delayMicroseconds(5); 
  digitalWrite(pinosTrig[indice], HIGH);
  delayMicroseconds(10);
  digitalWrite(pinosTrig[indice], LOW);
  
  long duracao = pulseIn(pinosEcho[indice], HIGH, 30000); 
  
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
  tone(pinoBuzzer, 1000); delay(200);
  noTone(pinoBuzzer);     delay(100);
  tone(pinoBuzzer, 1500); delay(300);
  noTone(pinoBuzzer);
}

void tocarAlertaDosePerdida(int indice) {
  for(int i = 0; i < 6; i++) {
    digitalWrite(pinosLed[indice], HIGH);
    tone(pinoBuzzer, 250); delay(200);
    digitalWrite(pinosLed[indice], LOW);
    noTone(pinoBuzzer);    delay(200);
  }
}

void liberarRemedio(int indice, String nome) {
  int numGaveta = indice + 1;
  
  atualizarVisor("AGORA: " + nome, "Puxe a Gaveta " + String(numGaveta));
  digitalWrite(pinosLed[indice], HIGH);

  servosGaveta[indice].write(90);
  tocarAvisoAgradavel(); 

  bool gavetaFoiAberta = false;
  
  for(int i = 0; i < 150; i++) { 
    long distanciaAtual = medirDistancia(indice);
    if(distanciaAtual > limiteAbertura) { 
      gavetaFoiAberta = true;
      break; 
    }
    delay(100); 
  }

  if(gavetaFoiAberta) {
    atualizarVisor("Remedio retirado", "Feche a Gaveta " + String(numGaveta));
    bool gavetaFoiFechada = false;
    
    for(int i = 0; i < 150; i++) { 
      long distanciaAtual = medirDistancia(indice);
      if(distanciaAtual > 0 && distanciaAtual <= limiteAbertura) {
        gavetaFoiFechada = true;
        break;
      }
      delay(100);
    }

    if(!gavetaFoiFechada) {
      atualizarVisor("ALERTA CRITICO!", "Gaveta " + String(numGaveta) + " Aberta!");
      while(medirDistancia(indice) > limiteAbertura) {
        tone(pinoBuzzer, 800); delay(300);
        noTone(pinoBuzzer);    delay(300);
      }
    }
    
    atualizarVisor("Gaveta Fechada", "Trancando em 5s.");
    delay(tempoParaTrancar); 

  } else {
    atualizarVisor("ALERTA CRITICO", "DOSE PERDIDA!");
    Serial.println("[AVISO] Dose ignorada na Gaveta " + String(numGaveta));
    tocarAlertaDosePerdida(indice);
    delay(2000);
  }

  // Tranca novamente
  servosGaveta[indice].write(0);
  digitalWrite(pinosLed[indice], LOW);
  
  atualizarVisor("Gaveta " + String(numGaveta), "Trancada e Segura");
  delay(2000);
}

void loop() {
  // Ciclo da Gaveta 1
  atualizarVisor("Prox: Remedio A", "Aguardando...");
  delay(4000); 
  liberarRemedio(0, "Remedio A");
  
  // Ciclo da Gaveta 2
  atualizarVisor("Prox: Remedio B", "Aguardando...");
  delay(4000); 
  liberarRemedio(1, "Remedio B");

  // Ciclo da Gaveta 3
  atualizarVisor("Prox: Remedio C", "Aguardando...");
  delay(4000); 
  liberarRemedio(2, "Remedio C");
  
  atualizarVisor("Sistema em", "Standby...");
  delay(5000); 
}
