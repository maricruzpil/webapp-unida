# 🤖 Macaria - Sistema de Control por Voz y Gestos

**Macaria** es un sistema inteligente de interacción humano-máquina que permite controlar movimientos mediante:

- 🎙 Comandos de voz
- 🖐 Gestos con la mano frente a la cámara

Proyecto académico desarrollado en el **Tecnológico Nacional de México - Campus Pachuca (2026)**.

---

# 🎯 Objetivo del Proyecto

Desarrollar una interfaz intuitiva que permita controlar un sistema físico o virtual mediante:

- Reconocimiento de voz natural
- Detección de gestos manuales en tiempo real
- Interfaz visual futurista tipo HUD

---

# 🧠 Arquitectura General


# 🎙 Módulo 1: Control por Voz

Permite ejecutar órdenes habladas utilizando reconocimiento de voz y procesamiento inteligente.

## 🔹 Funcionamiento

1. Se activa el micrófono.
2. Se captura el comando de voz.
3. Se envía al modelo de IA para clasificación.
4. Se ejecuta la acción correspondiente.
5. Macaria responde con voz sintética.

## 🛠 Tecnologías

- JavaScript
- Web Speech API
- OpenAI API
- HTML5 + CSS3
- Bootstrap 5

---

# 🖐 Módulo 2: Control por Gestos

Permite controlar movimientos mediante combinaciones específicas de dedos frente a la cámara.

## 🔹 Gestos Reconocidos

| Acción | Gesto |
|--------|--------|
| ▶ Avanzar | Pulgar + Meñique |
| ◀ Retroceder | Mano cerrada |
| ⏹ Detener | Mano abierta |
| ↪ Vuelta derecha | Índice (mano derecha) |
| ↩ Vuelta izquierda | Índice (mano izquierda) |
| ⟳ 90° Derecha | Meñique (mano derecha) |
| ⟲ 90° Izquierda | Meñique (mano izquierda) |
| 🔄 360° Derecha | Medio + Anular + Meñique (mano derecha) |
| 🔄 360° Izquierda | Medio + Anular + Meñique (mano izquierda) |

## 🔹 Funcionamiento

1. Se activa la cámara.
2. Se detectan puntos clave de la mano.
3. Se analiza qué dedos están levantados.
4. Se compara con una base de gestos.
5. Se ejecuta la orden correspondiente.

## 🛠 Tecnologías

- JavaScript
- Visión por computadora
- Detección de landmarks de mano
- HTML5 Canvas

---

# Autora

#### Maricruz Pineda Lara
#### Tecnológico Nacional de México
#### Campus Pachuca
#### 2026