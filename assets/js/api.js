/*
  api.js
  Conecta la webapp con la API Flask del carrito IoT
  Usado por voice.js y gestures.js
*/

const API_URL = "http://192.168.0.17:5000/api/movimiento";

// Mapeo de comandos → id_movimiento en la BD
const COMANDOS = {
  // Voz (minúsculas)
  "avanzar":        1,
  "retroceder":     2,
  "detener":        3,
  "vuelta derecha": 4,
  "vuelta izquierda": 5,
  "90° derecha":    8,
  "90° izquierda":  9,
  "360° derecha":   10,
  "360° izquierda": 11,

  // Gestos (mayúsculas)
  "AVANZAR":          1,
  "RETROCEDER":       2,
  "DETENER":          3,
  "VUELTA DERECHA":   4,
  "VUELTA IZQUIERDA": 5,
  "90° DERECHA":      8,
  "90° IZQUIERDA":    9,
  "360° DERECHA":     10,
  "360° IZQUIERDA":   11,
};

window.enviarComando = async function (nombreComando, origen = "Web") {

  const idMovimiento = COMANDOS[nombreComando];

  // Si no está en el mapa o es "Orden no reconocida", no envía nada
  if (!idMovimiento) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_movimiento:  idMovimiento,
        id_dispositivo: 1,
        id_telemetria:  1,
        origen:         origen
      })
    });

    const data = await response.json();
    console.log(`✅ Comando enviado: ${nombreComando} (#${idMovimiento}) →`, data.message);

  } catch (err) {
    console.error("❌ Error enviando comando al carrito:", err);
  }
}; 