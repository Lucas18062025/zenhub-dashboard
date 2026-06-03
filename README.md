@"
<div align="center">
  
  ![ZenHub](https://img.shields.io/badge/ZenHub-Dashboard-blue?style=for-the-badge)
  ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
  ![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

  # 🎯 ZenHub Dashboard
  **Panel de productividad integral con Pomodoro, gestor de tareas, rastreador de hábitos y clima en tiempo real**

</div>

---

## 📸 Vista Previa

![ZenHub Dashboard Preview](https://raw.githubusercontent.com/Lucas18062025/zenhub-dashboard/main/assets/preview.png)

---

## ✨ Características

| Característica | Descripción |
|---|---|
| ⏱️ **Pomodoro Inteligente** | Técnica de 25 minutos con pausas configurables |
| 📋 **Gestor de Tareas** | Crear, editar y eliminar tareas en tiempo real |
| 🎯 **Rastreador de Hábitos** | Seguimiento semanal con estadísticas visuales |
| 🌤️ **Clima en Vivo** | Información meteorológica actual por ciudad |
| 📊 **Estadísticas** | Gráficas semanales de tareas completadas |
| 💾 **Persistencia** | Guarda automáticamente en localStorage |

---

## 🚀 Instalación

### Opción 1: Navegador Directo (⚡ Recomendado)

\`\`\`bash
# Solo requiere un navegador moderno
# Navegadores soportados:
# ✅ Chrome 90+
# ✅ Firefox 88+
# ✅ Safari 14+
# ✅ Edge 90+

# 1. Clona el repositorio
git clone https://github.com/Lucas18062025/zenhub-dashboard.git

# 2. Abre el archivo en tu navegador
index.html  # ← Double-click o arrastra al navegador
\`\`\`

### Opción 2: Servidor Local (Python)

\`\`\`bash
# Si tienes Python instalado
cd zenhub-dashboard
python -m http.server 8000

# Luego abre en navegador:
# http://localhost:8000
\`\`\`

### Opción 3: Live Server (VS Code)

\`\`\`bash
# Con la extensión "Live Server" instalada
# Click derecho en index.html → Open with Live Server
\`\`\`

---

## 🛠️ Estructura del Proyecto

\`\`\`
zenhub-dashboard/
├── index.html       # Estructura HTML
├── style.css        # Estilos (Tailwind-like)
├── app.js           # Lógica principal
├── assets/          # Recursos (screenshots, etc)
├── README.md        # Este archivo
└── LICENSE          # MIT License
\`\`\`

---

## 💡 Cómo Usar

### Pomodoro
1. Inicia sesión con tu nombre
2. Presiona **"Enfoque (25min)"** para comenzar
3. Pausa o reinicia cuando necesites

### Tareas
1. Escribe en el input y presiona **+**
2. Marca como completada (✓)
3. Elimina con el ícono de basura (🗑️)

### Hábitos
1. Agrega tu hábito en el campo de entrada
2. Presiona el botón **+**
3. Marca los días que lo completaste

### Clima
1. Busca una ciudad en el campo de búsqueda
2. Se actualiza automáticamente cada 60 segundos

---

## 🎨 Stack Tecnológico

\`\`\`
Frontend:
  • HTML5
  • CSS3 (Gradientes, Flexbox, Grid)
  • Vanilla JavaScript (ES6+)
  
Storage:
  • LocalStorage API
  
APIs Externas:
  • OpenWeatherMap (clima)
\`\`\`

---

## 📋 Roadmap

- [ ] Sincronización con Google Calendar
- [ ] Exportar tareas a PDF
- [ ] Tema oscuro/claro
- [ ] Notificaciones de navegador
- [ ] Soporte offline (PWA)
- [ ] Integración con Slack

---

## 🔒 Licencia

MIT License - Ver archivo [LICENSE](LICENSE)

---

## 👨‍💻 Autor

**Lucas Villagra**  
Analista de Ciberseguridad | Ethical Hacker  
San Miguel de Tucumán, Argentina  

📧 [lucaslean1806@gmail.com](mailto:lucaslean1806@gmail.com)  
🔗 [GitHub](https://github.com/Lucas18062025) | [LinkedIn](https://linkedin.com/in/lucas-villagra-cybersecurity)  

---

<div align="center">

**Hecho con ❤️ para una vida más productiva y segura**

</div>
"@ | Out-File README.md -Encoding UTF8
