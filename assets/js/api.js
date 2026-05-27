/*
  api.js — Conector webapp ↔ API Flask del carrito
  Incluye: envío de comandos, velocidad, sensor, DEMO
*/
 
const API_BASE = "https://web-production-a207c.up.railway.app";
 
const COMANDOS = {
  "avanzar": 1,          "AVANZAR": 1,
  "retroceder": 2,       "RETROCEDER": 2,
  "detener": 3,          "DETENER": 3,
  "vuelta derecha": 4,   "VUELTA DERECHA": 4,
  "vuelta izquierda": 5, "VUELTA IZQUIERDA": 5,
  "90° derecha": 8,      "90° DERECHA": 8,
  "90° izquierda": 9,    "90° IZQUIERDA": 9,
  "360° derecha": 10,    "360° DERECHA": 10,
  "360° izquierda": 11,  "360° IZQUIERDA": 11,
  "demo": "DEMO",        "DEMO": "DEMO",
};
 
const NOMBRES = {
  1: "Adelante", 2: "Atrás", 3: "Detener",
  4: "Vuelta derecha", 5: "Vuelta izquierda",
  8: "Giro 90° der.", 9: "Giro 90° izq.",
  10: "Giro 360° der.", 11: "Giro 360° izq.",
};
 
// Secuencia demo: [id_movimiento, espera_ms_antes_del_siguiente]
const DEMO_SECUENCIA = [
  { id: 2,  nombre: "Atrás",          espera: 1800 },
  { id: 1,  nombre: "Adelante",       espera: 1800 },
  { id: 9,  nombre: "90° izquierda",  espera: 900  },
  { id: 8,  nombre: "90° derecha",    espera: 900  },
  { id: 11, nombre: "360° izquierda", espera: 1500 },
];
 
let demoActivo = false;
 
// ─────────────────────────────────────────
//  ENVIAR UN MOVIMIENTO
// ─────────────────────────────────────────
async function enviarMovimiento(idMovimiento, origen = "Web") {
  const r = await fetch(`${API_BASE}/api/movimiento`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_movimiento:  idMovimiento,
      id_dispositivo: 1,
      id_telemetria:  1,
      origen:         origen
    })
  });
  return r.json();
}
 
// ─────────────────────────────────────────
//  EJECUTAR DEMO
// ─────────────────────────────────────────
window.ejecutarDemo = async function (origen = "Web") {
  if (demoActivo) return;
  demoActivo = true;
 
  // Actualizar botones
  const btns = document.querySelectorAll(".btn-demo");
  btns.forEach(b => { b.disabled = true; b.textContent = "▶ Demo en curso..."; });
 
  const statusEl = document.getElementById("demoStatus");
  const lastMov  = document.getElementById("lastMovement");
 
  console.log("🚗 Iniciando demo...");
 
  for (let i = 0; i < DEMO_SECUENCIA.length; i++) {
    const paso = DEMO_SECUENCIA[i];
 
    // Mostrar qué movimiento va
    const msg = `(${i + 1}/${DEMO_SECUENCIA.length}) ${paso.nombre}`;
    if (statusEl) statusEl.textContent = msg;
    if (lastMov)  lastMov.textContent  = paso.nombre;
 
    btns.forEach(b => { b.textContent = `▶ ${msg}`; });
    console.log(`  → ${msg}`);
 
    try {
      await enviarMovimiento(paso.id, origen);
    } catch (err) {
      console.error("Error en demo:", err);
    }
 
    // Esperar antes del siguiente movimiento
    await new Promise(resolve => setTimeout(resolve, paso.espera));
  }
 
  // Demo terminado
  demoActivo = false;
  btns.forEach(b => {
    b.disabled = false;
    b.innerHTML = '<i class="bi bi-play-circle-fill"></i> INICIAR DEMO';
  });
  if (statusEl) statusEl.textContent = "✓ Demo completada";
  setTimeout(() => { if (statusEl) statusEl.textContent = ""; }, 3000);
  console.log("✅ Demo completada");
};
 
// ─────────────────────────────────────────
//  ENVIAR COMANDO (voz / gesto)
// ─────────────────────────────────────────
window.enviarComando = async function (nombreComando, origen = "Web") {
  const valor = COMANDOS[nombreComando];
  if (!valor) return;
 
  // Demo
  if (valor === "DEMO") {
    window.ejecutarDemo(origen);
    return;
  }
 
  const idMovimiento = valor;
  const el = document.getElementById("lastMovement");
  if (el) el.textContent = NOMBRES[idMovimiento] || nombreComando;
 
  try {
    const data = await enviarMovimiento(idMovimiento, origen);
    console.log(`✅ ${nombreComando} (#${idMovimiento}) →`, data.message);
  } catch (err) {
    console.error("❌ Error enviando comando:", err);
  }
};
 
// ─────────────────────────────────────────
//  SETUP: botones, velocidad, sensor
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
 
  // Botones demo
  const btnDemoVoz    = document.getElementById("btnDemoVoz");
  const btnDemoGesto  = document.getElementById("btnDemoGesto");
  if (btnDemoVoz)   btnDemoVoz.addEventListener("click",   () => window.ejecutarDemo("Botón-Voz"));
  if (btnDemoGesto) btnDemoGesto.addEventListener("click", () => window.ejecutarDemo("Botón-Gesto"));
 
  // Velocidad
  const slider     = document.getElementById("speedSlider");
  const valueEl    = document.getElementById("speedValue");
  const btnAplicar = document.getElementById("btnAplicarVelocidad");
 
  if (slider && valueEl) {
    slider.addEventListener("input", () => { valueEl.textContent = slider.value; });
  }
 
  if (btnAplicar) {
    btnAplicar.addEventListener("click", async () => {
      const velocidad = slider ? parseInt(slider.value) : 200;
      btnAplicar.textContent = "Enviando...";
      try {
        await fetch(`${API_BASE}/api/parametro`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clave: "VELOCIDAD", valor: velocidad })
        });
        btnAplicar.textContent = "✓ Aplicado";
        setTimeout(() => { btnAplicar.textContent = "Aplicar"; }, 2000);
      } catch {
        btnAplicar.textContent = "Error";
        setTimeout(() => { btnAplicar.textContent = "Aplicar"; }, 2000);
      }
    });
  }
 
  // Polling sensor
  async function actualizarSensor() {
    try {
      const r = await fetch(`${API_BASE}/api/obstaculo/ultimo`);
      if (!r.ok) return;
      const data = await r.json();
      if (!data.success || !data.data) return;
 
      const statusEl   = document.getElementById("obstacleStatus");
      const distanceEl = document.getElementById("obstacleDistance");
      const esObstaculo = data.data.nombre_estatus === "OBSTACULO";
 
      if (statusEl) {
        statusEl.textContent = esObstaculo ? "OBSTÁCULO" : "LIBRE";
        statusEl.className = `status-value ${esObstaculo ? "sensor-obstaculo" : "sensor-libre"}`;
      }
      if (distanceEl && data.data.distancia_cm != null) {
        distanceEl.textContent = `${parseFloat(data.data.distancia_cm).toFixed(1)} cm`;
      }
    } catch (_) {}
  }
 
  setInterval(actualizarSensor, 2000);
  actualizarSensor();
});