document.addEventListener("DOMContentLoaded", () => {

  const MOCKAPI_URL = "https://69950d45b081bc23e9c1e146.mockapi.io/v1/user/3";
  let OPENAI_API_KEY = "";      // se llena al cargar MockAPI
  
  
  const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

  // Wake Word
  const WAKE_WORD = "macaria";     // lo que detecta en texto (speech-to-text)
  const IDLE_MS = 20000;

  // ÚNICAS salidas permitidas (validación)
  const ALLOWED_OUTPUTS = new Set([
    "avanzar",
    "retroceder",
    "detener",
    "vuelta derecha",
    "vuelta izquierda",
    "90° derecha",
    "90° izquierda",
    "360° derecha",
    "360° izquierda",
    "Orden no reconocida",
  ]);

  // UI (null-safe)
  const modePill = document.getElementById("modePill");
  const transcriptEl = document.getElementById("transcript");
  const commandEl = document.getElementById("command");
  const substatusEl = document.getElementById("substatus");

  function safeText(el, text) {
    if (el) el.textContent = text;
  }

  function setMode(text, cls) {
    if (!modePill) return;
    modePill.textContent = text;
    modePill.className = `pill ${cls}`;
  }

  function setSubstatus(text) {
    safeText(substatusEl, text);
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  /* =====================================================
     ✅ CARGA API KEY DESDE MOCKAPI 
  ===================================================== */
  async function loadApiKeyFromMockAPI() {
  if (OPENAI_API_KEY) return OPENAI_API_KEY;

  try {
    setSubstatus("Cargando credenciales (MockAPI)…");

    const r = await fetch(MOCKAPI_URL, { method: "GET" });
    if (!r.ok) throw new Error(`MockAPI HTTP ${r.status}`);

    const data = await r.json();

    const key = data?.apiKey;
    if (!key || typeof key !== "string") {
      throw new Error("No se encontró 'apiKey'.");
    }

    OPENAI_API_KEY = key.trim();
    setSubstatus("Listo. Escuchando órdenes…");
    return OPENAI_API_KEY;

  } catch (err) {
    console.error("MockAPI error:", err);
    OPENAI_API_KEY = "";
    return "";
  }
}

  // Dispara la carga desde el inicio (sin detener el resto)
  //loadApiKeyFromMockAPI();
  (async () => {
  await loadApiKeyFromMockAPI();
  safeStart();
  })();
  /* =========================
     SPEECH RECOGNITION
  ========================= */
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setMode("No compatible", "pill-error");
    setSubstatus("Tu navegador no soporta SpeechRecognition. Prueba en Chrome/Edge.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "es-MX";
  recognition.continuous = true;
  recognition.interimResults = false;

  let suspended = false;
  let idleTimer = null;

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      suspended = true;
      setMode("Suspendido", "pill-sleep");
      setSubstatus('Suspendido por inactividad. Di "Macaria" para despertar.');
      safeText(commandEl, "—");
    }, IDLE_MS);
  }

  function safeStart() {
    try { recognition.start(); } catch (_) {}
  }

  recognition.onstart = () => {
    setMode(suspended ? "Suspendido" : "Activo", suspended ? "pill-sleep" : "pill-active");
    setSubstatus(suspended ? 'Esperando "Macaria"...' : "Escuchando órdenes…");
    resetIdleTimer();
  };

  recognition.onerror = (e) => {
    setMode("Error", "pill-error");
    setSubstatus(`Error STT: ${e.error || "desconocido"}`);
  };

  recognition.onend = () => {
    safeStart();
  };

  recognition.onresult = async (event) => {
    const last = event.results[event.results.length - 1];
    const raw = last?.[0]?.transcript?.trim() || "";
    if (!raw) return;

    safeText(transcriptEl, raw);
    resetIdleTimer();

    const lower = normalize(raw);

    // Suspendido: solo wake word
    if (suspended) {
      if (lower.includes(WAKE_WORD)) {
        suspended = false;
        setMode("Activo", "pill-active");
        setSubstatus("Despierta. Escuchando órdenes…");
        resetIdleTimer();
      } else {
        setSubstatus('Suspendido. Di "Macaria" para despertar.');
      }
      return;
    }

    // Activo: si dice wake word, ignora (solo mantiene activo)
    if (lower.includes(WAKE_WORD)) {
      setSubstatus("Wake word detectada (activo).");
      return;
    }

    // ✅ IA interpreta TODO (sin listas de sinónimos hardcodeadas)
    setSubstatus("Procesando con IA…");
    const key = OPENAI_API_KEY || (await loadApiKeyFromMockAPI());
    const cmd = await classifyWithOpenAI(raw, key);

    safeText(commandEl, cmd);
    setSubstatus(cmd === "Orden no reconocida" ? "No se reconoció una orden válida." : "Orden reconocida.");
  };

  setMode("Activo", "pill-active");
  setSubstatus("Pide permisos del micrófono. Escuchando órdenes…");
  //safeStart();

  /* =========================
     OpenAI: Clasificador
  ========================= */
  async function classifyWithOpenAI(text, apiKey) {
    if (!apiKey) {
      setMode("Sin API Key", "pill-error");
      setSubstatus("No hay API Key disponible (MockAPI falló o no respondió).");
      return "Orden no reconocida";
    }

    // 👇 Importante: NO listamos sinónimos. Pedimos comprensión semántica total,
    // incluyendo negación, comparación, ironía simple, “lo contrario de…”, etc.
    const system = `
Eres un intérprete de intención para un sistema de control por voz.
Tu misión es leer (o inferir desde una transcripción con errores) la intención del usuario y mapearla al comando de control MÁS ADECUADO.

Debes responder ÚNICAMENTE con EXACTAMENTE UNA de estas opciones (una sola línea y nada más):
avanzar
retroceder
detener
vuelta derecha
vuelta izquierda
90° derecha
90° izquierda
360° derecha
360° izquierda
Orden no reconocida

Criterio general:
- Comprende el significado completo del mensaje, aunque sea una frase larga o rara.
- Reconoce sinónimos, expresiones equivalentes, modismos, y palabras parecidas por errores del micrófono.
- Maneja negaciones y “lo contrario de…”.
  Ejemplo: “haz lo contrario de ir hacia atrás” ⇒ avanzar.
- Si el usuario pide un giro con ángulo, elige 90° o 360° según corresponda.
- Si pide girar sin ángulo específico, usa “vuelta derecha” o “vuelta izquierda”.
- Si pide parar, pausar, frenar o inmovilizar, usa “detener”.
- Si el mensaje contiene varias acciones, elige la acción PRINCIPAL o la primera orden clara.
- Si no hay intención clara o no encaja con el set, responde “Orden no reconocida”.

Prohibido:
- No expliques nada.
- No uses comillas.
- No agregues texto extra.
`.trim();

    try {
      const r = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: [
            { role: "system", content: system },
            { role: "user", content: text }
          ],
          temperature: 0
        })
      });

      if (!r.ok) return "Orden no reconocida";

      const data = await r.json();
      const out =
        data?.output_text ||
        data?.output?.[0]?.content?.map(c => c?.text).filter(Boolean).join("") ||
        "";

      const result = String(out).trim();

      // Validación dura: si no coincide EXACTO, no se acepta
      return ALLOWED_OUTPUTS.has(result) ? result : "Orden no reconocida";
    } catch {
      return "Orden no reconocida";
    }
  }
  

/* =====================================================
   🔊 VOZ EXPLICATIVA CON OPENAI (SHIMMER)
===================================================== */

const infoBtn = document.getElementById("infoVoiceBtn");

async function speakWithOpenAI(text) {
  const apiKey = await loadApiKeyFromMockAPI();

  if (!apiKey) {
    setSubstatus("No hay API Key para generar audio.");
    return;
  }

  try {
    setSubstatus("Generando voz...");

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "shimmer",
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      setSubstatus("Listo.");
    };

  } catch (err) {
    console.error("TTS error:", err);
    setSubstatus("Error al generar voz.");
  }
}

if (infoBtn) {
  infoBtn.addEventListener("click", async () => {

    const texto = `
Hola. Soy Macaria, tu asistente de control por voz.

Estoy lista para ayudarte.
Puedes decir comandos como avanzar, retroceder, detener,
vuelta derecha, vuelta izquierda,
noventa grados derecha o izquierda,
o giro completo de trescientos sesenta grados.

Si no detecto voz durante unos segundos,
entro en modo suspendido.

Para activarme, solo di: Macaria, seguido de una instrucción

Estoy lista para recibir tus órdenes.
`;

    await speakWithOpenAI(texto);

  });
}
window.startVoice = function () {
  try { recognition.start(); } catch (e) {}
};

window.stopVoice = function () {
  try { recognition.stop(); } catch (e) {}
};

});