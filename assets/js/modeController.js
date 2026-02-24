document.addEventListener("DOMContentLoaded", function () {

  const voiceSection = document.getElementById("voiceMode");
  const gestureSection = document.getElementById("gestureMode");

  const btnVoice = document.getElementById("btnVoice");
  const btnGesture = document.getElementById("btnGesture");

  // Seguridad anti-null
  if (!voiceSection || !gestureSection || !btnVoice || !btnGesture) {
    console.error("Error: No se encontraron los elementos del modo.");
    return;
  }

  // ======== ACTIVAR VOZ ========
  btnVoice.addEventListener("click", function () {

    voiceSection.style.display = "block";
    gestureSection.style.display = "none";

    btnVoice.classList.add("active");
    btnGesture.classList.remove("active");

    // Iniciar voz si existe
    if (window.startVoice) {
      window.startVoice();
    }

    // Detener gestos si existe
    if (window.stopGestures) {
      window.stopGestures();
    }

  });

  // ======== ACTIVAR GESTOS ========
  btnGesture.addEventListener("click", function () {

    voiceSection.style.display = "none";
    gestureSection.style.display = "block";

    btnGesture.classList.add("active");
    btnVoice.classList.remove("active");

    // Detener voz si existe
    if (window.stopVoice) {
      window.stopVoice();
    }

    // Iniciar gestos si existe
    if (window.startGestures) {
      window.startGestures();
    }

  });

});