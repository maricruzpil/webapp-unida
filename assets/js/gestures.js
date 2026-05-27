import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
 
let handLandmarker = null;
let modeloIniciado = false;
let loopActivo = false;
 
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
 
const manoTexto = document.getElementById("mano");
const ordenTexto = document.getElementById("orden");
 
const pulgarLed = document.getElementById("pulgar");
const indiceLed = document.getElementById("indice");
const medioLed = document.getElementById("medio");
const anularLed = document.getElementById("anular");
const meniqueLed = document.getElementById("menique");
 
const video = document.createElement("video");
video.autoplay = true;
video.playsInline = true;
 
 
/* =========================
   BOTÓN INSTRUCCIONES
========================= */
 
const btn = document.getElementById("infoGestureBtn");
const modal = document.getElementById("instructionsModal");
const closeBtn = document.getElementById("closeInstructions");
 
if (btn && modal && closeBtn) {
 
  btn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
 
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
 
}
 
 
/* =========================
   INICIAR MODELO
========================= */
 
async function iniciarModelo() {
 
  if (modeloIniciado) return;
 
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
 
  handLandmarker = await HandLandmarker.createFromOptions(
    filesetResolver,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
      },
      runningMode: "VIDEO",
      numHands: 1
    }
  );
 
  modeloIniciado = true;
}
 
 
/* =========================
   INICIAR CÁMARA
========================= */
 
async function iniciarCamara() {
 
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });
 
  video.srcObject = stream;
 
  video.addEventListener("loadeddata", () => {
 
    if (!canvas || !ctx) return;
 
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
 
    loopActivo = true;
    loop();
 
  });
}
 
 
/* =========================
   CALCULAR ÁNGULO
========================= */
 
function angulo(a, b, c) {
 
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
 
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
 
  const angle = Math.acos(dot / (magAB * magCB));
  return angle * (180 / Math.PI);
}
 
 
/* =========================
   DETECTAR DEDOS
========================= */
 
function detectarDedos(hand) {
 
  const pulgar = angulo(hand[4], hand[3], hand[2]) > 150 ? 1 : 0;
  const indice = angulo(hand[8], hand[6], hand[5]) > 160 ? 1 : 0;
  const medio = angulo(hand[12], hand[10], hand[9]) > 160 ? 1 : 0;
  const anular = angulo(hand[16], hand[14], hand[13]) > 160 ? 1 : 0;
  const menique = angulo(hand[20], hand[18], hand[17]) > 160 ? 1 : 0;
 
  return [pulgar, indice, medio, anular, menique];
}
 
 
/* =========================
   DETECTAR MANO
========================= */
 
function detectarMano(hand) {
 
  const thumb = hand[4];
  const pinky = hand[20];
 
  return thumb.x < pinky.x ? "Izquierda" : "Derecha";
}
 
 
/* =========================
   CLASIFICAR GESTOS
========================= */
 
function clasificarGesto(patron, lado) {
 
  const key = patron.join("") + "_" + lado;
 
  const gestos = {
 
    "10001_Derecha": "AVANZAR",
    "10001_Izquierda": "AVANZAR",
 
    "00000_Derecha": "RETROCEDER",
    "00000_Izquierda": "RETROCEDER",
 
    "11111_Derecha": "DETENER",
    "11111_Izquierda": "DETENER",
 
    "01000_Derecha": "VUELTA DERECHA",
    "01000_Izquierda": "VUELTA IZQUIERDA",

    "01100_Derecha": "VUELTA ATRÁS DERECHA",
    "01100_Izquierda": "VUELTA ATRÁS IZQUIERDA",
 
    "00001_Derecha": "90° DERECHA",
    "00001_Izquierda": "90° IZQUIERDA",
 
    "00111_Derecha": "360° DERECHA",
    "00111_Izquierda": "360° IZQUIERDA",
 
    "11001_Derecha":  "DEMO",
    "11001_Izquierda": "DEMO"
  };
 
  return gestos[key] || "Orden no reconocida";
}
 
 
/* =========================
   ACTUALIZAR LED
========================= */
 
function actualizarLed(elemento, estado) {
  if (!elemento) return;
  elemento.classList.remove("on", "off");
  elemento.classList.add(estado ? "on" : "off");
}
 
 
/* =========================
   LOOP PRINCIPAL (CORREGIDO)
========================= */
 
async function loop() {
 
  if (!loopActivo) return;
  if (!handLandmarker) {
    requestAnimationFrame(loop);
    return;
  }
 
  // 🔥 EVITA ERROR ROI width = 0
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    requestAnimationFrame(loop);
    return;
  }
 
  const results = handLandmarker.detectForVideo(video, performance.now());
 
  ctx.clearRect(0, 0, canvas.width, canvas.height);
 
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();
 
  if (results.landmarks && results.landmarks.length > 0) {
 
    const hand = results.landmarks[0];
 
    for (let i = 0; i < hand.length; i++) {
 
      const point = hand[i];
 
      ctx.beginPath();
      ctx.arc(
        canvas.width - (point.x * canvas.width),
        point.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "lime";
      ctx.fill();
    }
 
    const lado = detectarMano(hand);
    const patron = detectarDedos(hand);
    const nombre = clasificarGesto(patron, lado);
 
    if (manoTexto) manoTexto.innerText = lado;
    if (ordenTexto) ordenTexto.innerText = nombre;
 
    // Enviar al carrito
    if (window.enviarComando) window.enviarComando(nombre, "Gesto");
 
    actualizarLed(pulgarLed, patron[0]);
    actualizarLed(indiceLed, patron[1]);
    actualizarLed(medioLed, patron[2]);
    actualizarLed(anularLed, patron[3]);
    actualizarLed(meniqueLed, patron[4]);
 
  } else {
 
    if (manoTexto) manoTexto.innerText = "Sin detección";
    if (ordenTexto) ordenTexto.innerText = "Esperando gesto...";
 
    actualizarLed(pulgarLed, 0);
    actualizarLed(indiceLed, 0);
    actualizarLed(medioLed, 0);
    actualizarLed(anularLed, 0);
    actualizarLed(meniqueLed, 0);
  }
 
  requestAnimationFrame(loop);
}
 
 
/* =========================
   FUNCIONES GLOBALES PARA SWITCH
========================= */
 
window.startGestures = async function () {
 
  await iniciarModelo();
  await iniciarCamara();
};
 
window.stopGestures = function () {
 
  loopActivo = false;
 
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
};