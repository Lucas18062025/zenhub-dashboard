/* ==========================================================================
   ZENHUB DASHBOARD - LÓGICA JAVASCRIPT COMPLETA
   Integración Open-Meteo para clima en tiempo real
   ========================================================================== */

/**
 * DataManager - Gestiona exportación/importación JSON, CSV y reportes PDF
 */
class DataManager {
  /**
   * Export full application state as JSON
   * @param {Object} state
   */
  exportJSON(state) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zenhub_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Export task list as CSV
   * @param {Array} tasks
   */
  exportCSV(tasks) {
    const headers = ["ID", "Tarea", "Prioridad", "Estado"];
    const rows = tasks.map(t => [
      t.id,
      `"${t.text.replace(/"/g, '""')}"`,
      t.priority || "medium",
      t.completed ? "Completada" : "Pendiente"
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `zenhub_tareas_${dateStr}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Export tasks as iCal (.ics) for Google Calendar / Apple Calendar / Outlook
   * @param {Array} tasks
   */
  exportICS(tasks) {
    const now = new Date();
    const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ZenHub Dashboard//Productivity App//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) {
      alert("No hay tareas pendientes para exportar al calendario.");
      return;
    }

    pendingTasks.forEach((t, i) => {
      const start = new Date(now.getTime() + (i + 1) * 3600000);
      const end = new Date(start.getTime() + 1800000);
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:zenhub-task-${t.id}@zenhub.app`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `SUMMARY:🎯 ${t.text.replace(/,/g, '\\,')}`,
        `DESCRIPTION:Tarea de ZenHub. Prioridad: ${t.priority || 'media'}`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    const dateStr = now.toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", `zenhub_calendario_${dateStr}.ics`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Import JSON backup file
   * @param {File} file
   * @returns {Promise<Object>}
   */
  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsedData = JSON.parse(e.target.result);
          if (!parsedData || typeof parsedData !== 'object') {
            throw new Error("Formato JSON inválido");
          }
          if (!Array.isArray(parsedData.tasks) || !Array.isArray(parsedData.habits)) {
            throw new Error("El archivo no contiene la estructura de datos de ZenHub.");
          }
          resolve(parsedData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Error leyendo el archivo"));
      reader.readAsText(file);
    });
  }

  /**
   * Import CSV task list
   * @param {File} file
   * @returns {Promise<Array>}
   */
  importCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
          if (lines.length <= 1) {
            throw new Error("El archivo CSV no contiene filas de datos.");
          }

          const importedTasks = [];
          const startIdx = lines[0].toLowerCase().includes('tarea') || lines[0].toLowerCase().includes('id') ? 1 : 0;

          for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i];
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            if (cols.length > 0) {
              let taskText = cols[1] ? cols[1].replace(/^"|"$/g, '').trim() : cols[0].replace(/^"|"$/g, '').trim();
              if (taskText) {
                let priority = 'medium';
                if (cols[2]) {
                  const pVal = cols[2].replace(/^"|"$/g, '').trim().toLowerCase();
                  if (['low', 'baja'].includes(pVal)) priority = 'low';
                  if (['high', 'alta'].includes(pVal)) priority = 'high';
                }
                let completed = false;
                if (cols[3]) {
                  const cVal = cols[3].replace(/^"|"$/g, '').trim().toLowerCase();
                  if (['completada', 'true', 'si', 'sí', '1'].includes(cVal)) completed = true;
                }

                importedTasks.push({
                  id: Date.now() + i,
                  text: taskText,
                  priority: priority,
                  completed: completed
                });
              }
            }
          }
          resolve(importedTasks);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo CSV"));
      reader.readAsText(file);
    });
  }

  /**
   * Generate Daily PDF Report using html2pdf.js
   * @param {Object} state
   */
  generatePDFReport(state) {
    if (typeof html2pdf === 'undefined') {
      alert("La librería para generar PDF aún no ha cargado. Por favor, reintenta.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateFormatted = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

    const completedTasks = state.tasks.filter(t => t.completed);
    const percentTasks = state.tasks.length > 0 ? Math.round((completedTasks.length / state.tasks.length) * 100) : 0;

    const reportContainer = document.createElement('div');
    reportContainer.style.padding = '30px';
    reportContainer.style.fontFamily = "'Inter', Arial, sans-serif";
    reportContainer.style.color = '#1e293b';
    reportContainer.style.background = '#ffffff';

    let habitsHtml = '';
    state.habits.forEach(h => {
      const completedDays = h.history.filter(Boolean).length;
      habitsHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: 500;">${this.escapeHtml(h.name)}</td>
          <td style="padding: 10px; text-align: center;">${completedDays} / 7 días</td>
        </tr>
      `;
    });

    let tasksHtml = '';
    state.tasks.forEach(t => {
      tasksHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px;">${t.completed ? '✅' : '⏳'}</td>
          <td style="padding: 8px; font-weight: 500; ${t.completed ? 'text-decoration: line-through; color: #94a3b8;' : ''}">${this.escapeHtml(t.text)}</td>
          <td style="padding: 8px; text-align: center; font-size: 12px; text-transform: uppercase;">${t.priority}</td>
        </tr>
      `;
    });

    reportContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px;">
        <div>
          <h1 style="margin: 0; color: #4338ca; font-size: 26px; font-family: 'Outfit', sans-serif;">🎯 ZenHub Dashboard</h1>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Reporte Diario de Productividad</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: 600; color: #1e293b; font-size: 14px;">${dateFormatted}</p>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Generado automáticamente</p>
        </div>
      </div>

      <div style="display: flex; gap: 15px; margin-bottom: 30px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #4338ca;">${percentTasks}%</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Progreso de Tareas</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #10b981;">${completedTasks.length} / ${state.tasks.length}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Tareas Completadas</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${state.habits.length}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Hábitos Monitoreados</div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">📋 Lista de Tareas</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #475569;">
              <th style="padding: 8px; width: 40px;">Estado</th>
              <th style="padding: 8px;">Tarea</th>
              <th style="padding: 8px; width: 80px; text-align: center;">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            ${tasksHtml || '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #94a3b8;">No hay tareas registradas</td></tr>'}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">🎯 Rastreador de Hábitos</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; color: #475569;">
              <th style="padding: 8px;">Hábito</th>
              <th style="padding: 8px; text-align: center; width: 120px;">Cumplimiento Semanal</th>
            </tr>
          </thead>
          <tbody>
            ${habitsHtml || '<tr><td colspan="2" style="padding: 15px; text-align: center; color: #94a3b8;">No hay hábitos registrados</td></tr>'}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style="color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">📝 Notas Rápidas</h3>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; font-size: 13px; white-space: pre-wrap; color: #334155;">
          ${this.escapeHtml(state.notes) || 'Sin notas guardadas para el día de hoy.'}
        </div>
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `Reporte_ZenHub_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(reportContainer).save();
  }

  escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
}

/**
 * WeatherManager - Obtiene clima en tiempo real sin API key
 * Usa Open-Meteo (gratuito, sin límites)
 */
class WeatherManager {
  constructor() {
    this.defaultCity = "San Miguel de Tucumán";
    this.defaultLat = -26.8241;
    this.defaultLon = -65.2036;
    this.geocodingBase = "https://geocoding-api.open-meteo.com/v1/search";
    this.weatherBase = "https://api.open-meteo.com/v1/forecast";
  }

  /**
   * Geocode a city name to get latitude and longitude
   * @param {string} cityName - City name to search
   * @returns {Promise<{lat: number, lon: number, name: string} | null>}
   */
  async geocodeCity(cityName) {
    try {
      const params = new URLSearchParams({
        name: cityName,
        count: 1,
        language: "es",
        format: "json"
      });

      const response = await fetch(`${this.geocodingBase}?${params}`);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.warn(`City not found: ${cityName}`);
        return null;
      }

      const result = data.results[0];
      const fullName = [result.name, result.admin1, result.country]
        .filter(Boolean)
        .join(", ");

      return {
        lat: result.latitude,
        lon: result.longitude,
        name: fullName
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  /**
   * Fetch current weather for given coordinates
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<{temp: string, condition: string, humidity: number, wind: number} | null>}
   */
  async getWeather(lat, lon) {
    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
        timezone: "America/Argentina/Cordoba"
      });

      const response = await fetch(`${this.weatherBase}?${params}`);
      const data = await response.json();
      const current = data.current;

      return {
        temp: `${Math.round(current.temperature_2m)}°C`,
        condition: this.interpretWeatherCode(current.weather_code),
        humidity: Math.round(current.relative_humidity_2m),
        wind: Math.round(current.wind_speed_10m)
      };
    } catch (error) {
      console.error("Weather fetch error:", error);
      return null;
    }
  }

  /**
   * Interpret WMO Weather Code to readable Spanish text
   * @param {number} code - WMO Weather Code
   * @returns {string}
   */
  interpretWeatherCode(code) {
    const codes = {
      0: "Despejado",
      1: "Mayormente despejado",
      2: "Parcialmente nublado",
      3: "Nublado",
      45: "Neblina",
      48: "Neblina con escarcha",
      51: "Llovizna ligera",
      53: "Llovizna moderada",
      55: "Llovizna densa",
      61: "Lluvia ligera",
      63: "Lluvia moderada",
      65: "Lluvia fuerte",
      71: "Nieve ligera",
      73: "Nieve moderada",
      75: "Nieve fuerte",
      80: "Chubascos ligeros",
      81: "Chubascos moderados",
      82: "Chubascos fuertes",
      95: "Tormenta eléctrica"
    };
    return codes[code] || "Condición desconocida";
  }

  /**
   * Full flow: search city -> fetch weather -> update UI
   * @param {string} cityName
   * @returns {Promise<boolean>}
   */
  async searchCity(cityName) {
    const coords = await this.geocodeCity(cityName);
    if (!coords) return false;

    const weather = await this.getWeather(coords.lat, coords.lon);
    if (!weather) return false;

    this.updateUI(coords.name, weather);
    localStorage.setItem("zenhub_lastCity", cityName);
    return true;
  }

  /**
   * Update weather widget UI with data
   * @param {string} cityName
   * @param {{temp: string, condition: string, humidity: number, wind: number}} weather
   */
  updateUI(cityName, weather) {
    document.getElementById("weather-city").textContent = cityName;
    document.getElementById("weather-temp").textContent = weather.temp;
    document.getElementById("weather-condition").textContent = weather.condition;
    document.getElementById("weather-humidity").textContent = `${weather.humidity}%`;
    document.getElementById("weather-wind").textContent = `${weather.wind} km/h`;
  }

  /**
   * Initialize weather with saved city or default
   */
  async initialize() {
    const savedCity = localStorage.getItem("zenhub_lastCity") || this.defaultCity;
    await this.searchCity(savedCity);
  }
}

// Global instance
const weatherManager = new WeatherManager();

// ============================================================================
// MAIN APP LOGIC
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {

  // --- INITIAL STATE ---
  let state = {
    theme: 'theme-dark-glass',
    tasks: [
      { id: 1, text: 'Planificar sprint semanal', completed: false, priority: 'high' },
      { id: 2, text: 'Realizar 30 min de lectura diaria', completed: true, priority: 'low' },
      { id: 3, text: 'Revisar métricas de ZenHub', completed: false, priority: 'medium' }
    ],
    habits: [
      { id: 1, name: 'Meditar', history: [true, true, false, false, false, false, false] },
      { id: 2, name: 'Hacer Ejercicio', history: [true, false, true, false, false, false, false] },
      { id: 3, name: 'Tomar 2L Agua', history: [true, true, true, true, false, false, false] }
    ],
    notes: '¡Bienvenido a tu panel ZenHub!\n\nEste bloc de notas cuenta con auto-guardado en localStorage. Escribe lo que necesites recordar hoy y concéntrate en tus metas.',
    weatherCity: 'Tucumán'
  };

  // Load state from localStorage if exists
  const savedState = localStorage.getItem('zenhub_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error('Error parsing saved state, using default', e);
    }
  }

  // Save state to localStorage
  function saveState() {
    localStorage.setItem('zenhub_state', JSON.stringify(state));
    updateStatsWidget();
  }

  // --- THEME CONTROLLER ---
  const themeBtn = document.getElementById('theme-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Apply loaded theme
  document.body.className = state.theme;
  themeOptions.forEach(opt => {
    if (opt.getAttribute('data-theme') === state.theme) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  // Toggle dropdown
  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
  });

  // Select theme
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selectedTheme = option.getAttribute('data-theme');
      state.theme = selectedTheme;
      document.body.className = selectedTheme;

      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      themeDropdown.classList.remove('show');

      saveState();
      renderWeeklyChart();
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    themeDropdown.classList.remove('show');
    if (dataDropdown) dataDropdown.classList.remove('show');
  });

  // --- DATA & REPORT CONTROLLER ---
  const dataBtn = document.getElementById('data-btn');
  const dataDropdown = document.getElementById('data-dropdown');
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnImportJson = document.getElementById('btn-import-json');
  const btnImportCsv = document.getElementById('btn-import-csv');
  const inputImportJson = document.getElementById('input-import-json');
  const inputImportCsv = document.getElementById('input-import-csv');

  const dataManager = new DataManager();

  if (dataBtn && dataDropdown) {
    dataBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dataDropdown.classList.toggle('show');
      themeDropdown.classList.remove('show');
    });

    btnExportPdf.addEventListener('click', () => {
      dataDropdown.classList.remove('show');
      dataManager.generatePDFReport(state);
    });

    btnExportJson.addEventListener('click', () => {
      dataDropdown.classList.remove('show');
      dataManager.exportJSON(state);
    });

    btnExportCsv.addEventListener('click', () => {
      dataDropdown.classList.remove('show');
      dataManager.exportCSV(state.tasks);
    });

    const btnExportIcs = document.getElementById('btn-export-ics');
    if (btnExportIcs) {
      btnExportIcs.addEventListener('click', () => {
        dataDropdown.classList.remove('show');
        dataManager.exportICS(state.tasks);
      });
    }

    btnImportJson.addEventListener('click', () => {
      dataDropdown.classList.remove('show');
      inputImportJson.click();
    });

    btnImportCsv.addEventListener('click', () => {
      dataDropdown.classList.remove('show');
      inputImportCsv.click();
    });

    inputImportJson.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const newState = await dataManager.importJSON(file);
        state = { ...state, ...newState };
        saveState();
        document.body.className = state.theme;
        renderTasks();
        renderHabits();
        updateStatsWidget();
        renderWeeklyChart();
        if (noteInput) noteInput.value = state.notes || '';
        alert("¡Copia de seguridad importada con éxito!");
      } catch (err) {
        alert(`Error al importar JSON: ${err.message}`);
      }
      inputImportJson.value = '';
    });

    inputImportCsv.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const importedTasks = await dataManager.importCSV(file);
        state.tasks = [...state.tasks, ...importedTasks];
        saveState();
        renderTasks();
        alert(`¡Se importaron ${importedTasks.length} tareas desde el archivo CSV!`);
      } catch (err) {
        alert(`Error al importar CSV: ${err.message}`);
      }
      inputImportCsv.value = '';
    });
  }

  // --- CLOCK, DATE AND DYNAMIC GREETING ---
  const greetingText = document.getElementById('greeting-text');
  const dateText = document.getElementById('date-text');
  const clockTime = document.getElementById('clock-time');

  function updateClockAndGreeting() {
    const now = new Date();

    // Format clock (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockTime.textContent = `${hours}:${minutes}:${seconds}`;

    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = now.toLocaleDateString('es-ES', options);
    dateText.textContent = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

    // Dynamic greeting
    const currentHour = now.getHours();
    let greeting = '';

    if (currentHour >= 5 && currentHour < 12) {
      greeting = '¡Buenos días, Creador!';
    } else if (currentHour >= 12 && currentHour < 20) {
      greeting = '¡Buenas tardes, Enfocado!';
    } else {
      greeting = '¡Buenas noches, Pensador!';
    }

    if (greetingText.textContent !== greeting) {
      greetingText.textContent = greeting;
    }
  }

  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);

  // --- WIDGET: POMODORO TIMER ---
  const timerDigits = document.getElementById('timer-digits');
  const timerProgressBar = document.getElementById('timer-progress-bar');
  const pomodoroPhase = document.getElementById('pomodoro-phase');
  const toggleBtn = document.getElementById('pomodoro-toggle');
  const resetBtn = document.getElementById('pomodoro-reset');
  const playIcon = toggleBtn.querySelector('.play-icon');
  const pauseIcon = toggleBtn.querySelector('.pause-icon');

  const modeWorkBtn = document.getElementById('pomodoro-work');
  const modeShortBtn = document.getElementById('pomodoro-short');
  const modeLongBtn = document.getElementById('pomodoro-long');

  let timeLeft = 25 * 60;
  let maxTime = 25 * 60;
  let timerInterval = null;
  let isRunning = false;
  let currentMode = 'work';

  const circleCircumference = 552.92;

  function updateTimerUI() {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    timerDigits.textContent = `${minutes}:${seconds}`;

    const progress = (maxTime - timeLeft) / maxTime;
    const offset = circleCircumference - (progress * circleCircumference);
    timerProgressBar.style.strokeDashoffset = offset;
  }

  // Desktop Notifications Controller
  const toggleNotificationsBtn = document.getElementById('toggle-notifications');
  const notificationStatusText = document.getElementById('notification-status-text');

  function updateNotificationUI() {
    if (!('Notification' in window)) {
      if (notificationStatusText) notificationStatusText.textContent = "No soportado";
      return;
    }
    if (Notification.permission === 'granted') {
      if (notificationStatusText) notificationStatusText.textContent = "Activadas";
      if (toggleNotificationsBtn) toggleNotificationsBtn.classList.add('active');
    } else if (Notification.permission === 'denied') {
      if (notificationStatusText) notificationStatusText.textContent = "Bloqueadas";
      if (toggleNotificationsBtn) toggleNotificationsBtn.classList.remove('active');
    } else {
      if (notificationStatusText) notificationStatusText.textContent = "Activar";
      if (toggleNotificationsBtn) toggleNotificationsBtn.classList.remove('active');
    }
  }

  if (toggleNotificationsBtn) {
    toggleNotificationsBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        alert("Tu navegador no soporta notificaciones de escritorio.");
        return;
      }
      if (Notification.permission === 'granted') {
        alert("Las notificaciones de escritorio ya están activadas.");
      } else {
        const permission = await Notification.requestPermission();
        updateNotificationUI();
        if (permission === 'granted') {
          sendDesktopNotification("🎯 ZenHub", "¡Notificaciones de escritorio activadas correctamente!");
        }
      }
    });
  }

  updateNotificationUI();

  function sendDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body: body });
      } catch (e) {
        console.warn("Error enviando notificación nativa:", e);
      }
    }
  }

  // Audio Synthesizer
  const pomodoroSoundSelect = document.getElementById('pomodoro-sound-select');
  const pomodoroTestSound = document.getElementById('pomodoro-test-sound');

  if (state.soundTheme && pomodoroSoundSelect) {
    pomodoroSoundSelect.value = state.soundTheme;
  }

  if (pomodoroSoundSelect) {
    pomodoroSoundSelect.addEventListener('change', () => {
      state.soundTheme = pomodoroSoundSelect.value;
      saveState();
    });
  }

  if (pomodoroTestSound) {
    pomodoroTestSound.addEventListener('click', () => {
      const selectedSound = pomodoroSoundSelect ? pomodoroSoundSelect.value : 'zen';
      playZenChime(selectedSound);
    });
  }

  function playZenChime(type = null) {
    const soundType = type || (pomodoroSoundSelect ? pomodoroSoundSelect.value : (state.soundTheme || 'zen'));
    if (soundType === 'silent') return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      if (soundType === 'zen') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(now + 1.2);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.2);
        gain2.gain.setValueAtTime(0.15, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.2);
        osc2.stop(now + 1.5);

      } else if (soundType === 'marimba') {
        [392.00, 523.25, 659.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.2, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.4);
        });

      } else if (soundType === 'pulse') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);

      } else if (soundType === 'beep') {
        [0, 0.2, 0.4].forEach(offset => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now + offset);
          gain.gain.setValueAtTime(0.1, now + offset);
          gain.gain.setValueAtTime(0.001, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      }
    } catch (e) {
      console.warn("Web Audio API error:", e);
    }
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');

    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');

        playZenChime();

        if (currentMode === 'work') {
          sendDesktopNotification("🎯 ZenHub Pomodoro", "¡Sesión de enfoque completada! Tómate un respiro.");
          alert('¡Sesión de enfoque completada! Tómate un respiro.');
          setMode('short');
        } else {
          sendDesktopNotification("🎯 ZenHub Pomodoro", "¡Descanso terminado! Es hora de enfocar.");
          alert('¡Descanso terminado! Es hora de enfocar.');
          setMode('work');
        }
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }

  function setMode(mode, customMinutes = null) {
    pauseTimer();
    currentMode = mode;

    let minutes = 25;
    if (mode === 'work') {
      minutes = customMinutes || 25;
      pomodoroPhase.textContent = 'Enfoque';
      pomodoroPhase.style.setProperty('--badge-bg', 'rgba(129, 140, 248, 0.15)');
      timerProgressBar.style.stroke = 'var(--accent-color)';
    } else if (mode === 'short') {
      minutes = customMinutes || 5;
      pomodoroPhase.textContent = 'Pausa Corta';
      pomodoroPhase.style.setProperty('--badge-bg', 'rgba(16, 185, 129, 0.15)');
      timerProgressBar.style.stroke = 'var(--color-success)';
    } else if (mode === 'long') {
      minutes = customMinutes || 15;
      pomodoroPhase.textContent = 'Pausa Larga';
      pomodoroPhase.style.setProperty('--badge-bg', 'rgba(59, 130, 246, 0.15)');
      timerProgressBar.style.stroke = 'var(--priority-low)';
    }

    document.querySelectorAll('.timer-controls button.btn-secondary, .timer-actions-row button').forEach(b => b.classList.remove('active'));

    timeLeft = minutes * 60;
    maxTime = minutes * 60;
    updateTimerUI();
  }

  toggleBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  resetBtn.addEventListener('click', () => {
    pauseTimer();
    timeLeft = maxTime;
    updateTimerUI();
  });

  modeWorkBtn.addEventListener('click', () => setMode('work', 25));
  modeShortBtn.addEventListener('click', () => setMode('short', 5));
  modeLongBtn.addEventListener('click', () => setMode('long', 15));

  setMode('work', 25);

  // --- WIDGET: QUICK NOTES (Auto-save with Debounce) ---
  const noteInput = document.getElementById('quick-note-input');
  const noteStatus = document.getElementById('note-status');

  noteInput.value = state.notes;

  let saveTimeout = null;
  noteInput.addEventListener('input', () => {
    noteStatus.textContent = 'Guardando...';
    noteStatus.className = 'note-save-status saving';

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      state.notes = noteInput.value;
      saveState();
      noteStatus.textContent = 'Guardado';
      noteStatus.className = 'note-save-status saved';
    }, 800);
  });

  // --- WIDGET: TASK MANAGER (TO-DO) ---
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const taskPriority = document.getElementById('task-priority');
  const taskList = document.getElementById('task-list');
  const tasksPercent = document.getElementById('tasks-percent');
  const tasksProgressFill = document.getElementById('tasks-progress-fill');
  const filterTabs = document.querySelectorAll('.filter-tab');

  let currentFilter = 'all';

  function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = state.tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true;
    });

    if (filteredTasks.length === 0) {
      taskList.innerHTML = `<li class="subtext" style="text-align: center; padding: 1.5rem 0;">No hay tareas en esta sección</li>`;
    }

    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.setAttribute('data-id', task.id);

      li.innerHTML = `
        <div class="task-item-left">
          <input type="checkbox" class="checkbox-custom" ${task.completed ? 'checked' : ''}>
          <span class="priority-indicator priority-${task.priority}" title="Prioridad: ${task.priority}"></span>
          <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <div class="task-actions-right">
          <button class="task-calendar-btn" title="Añadir a Google Calendar" aria-label="Añadir a Google Calendar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          </button>
          <button class="task-delete-btn" aria-label="Eliminar tarea">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;

      const checkbox = li.querySelector('.checkbox-custom');
      checkbox.addEventListener('change', () => toggleTask(task.id));

      const calendarBtn = li.querySelector('.task-calendar-btn');
      calendarBtn.addEventListener('click', () => {
        const title = encodeURIComponent(`🎯 ${task.text}`);
        const details = encodeURIComponent(`Tarea de ZenHub Dashboard.\nPrioridad: ${task.priority || 'media'}`);
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
        window.open(gcalUrl, '_blank');
      });

      const deleteBtn = li.querySelector('.task-delete-btn');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      taskList.appendChild(li);
    });

    updateTaskProgress();
  }

  function updateTaskProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    tasksPercent.textContent = `${percent}%`;
    tasksProgressFill.style.width = `${percent}%`;
  }

  function toggleTask(id) {
    state.tasks = state.tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveState();
    renderTasks();
  }

  function deleteTask(id) {
    const taskElement = taskList.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
      taskElement.style.opacity = '0';
      taskElement.style.transform = 'translateY(10px)';
      taskElement.style.transition = 'all 0.25s ease';

      setTimeout(() => {
        state.tasks = state.tasks.filter(task => task.id !== id);
        saveState();
        renderTasks();
      }, 250);
    }
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
      id: Date.now(),
      text: text,
      completed: false,
      priority: taskPriority.value
    };

    state.tasks.push(newTask);
    saveState();

    taskInput.value = '';
    renderTasks();
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      renderTasks();
    });
  });

  renderTasks();

  // --- WIDGET: HABIT TRACKER ---
  const habitForm = document.getElementById('habit-form');
  const habitInput = document.getElementById('habit-input');
  const habitsList = document.getElementById('habits-list');

  function calculateStreak(history) {
    let maxStreak = 0;
    let currentStreak = 0;

    for (let val of history) {
      if (val) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    let endStreak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]) {
        endStreak++;
      } else {
        if (endStreak > 0) break;
      }
    }

    return endStreak > 0 ? endStreak : maxStreak;
  }

  function renderHabits() {
    habitsList.innerHTML = '';

    if (state.habits.length === 0) {
      habitsList.innerHTML = `<p class="subtext" style="text-align: center; padding: 1.5rem 0;">No hay hábitos registrados</p>`;
    }

    state.habits.forEach(habit => {
      const row = document.createElement('div');
      row.className = 'habit-row';
      row.setAttribute('data-id', habit.id);

      let daysHtml = '';
      habit.history.forEach((checked, dayIdx) => {
        daysHtml += `
          <input type="checkbox"
                 class="habit-day-checkbox"
                 data-day="${dayIdx}"
                 ${checked ? 'checked' : ''}
                 title="Día ${dayIdx + 1}"
                 aria-label="${habit.name} - Día ${dayIdx + 1}">
        `;
      });

      const streak = calculateStreak(habit.history);

      row.innerHTML = `
        <div class="habit-info">
          <button class="habit-delete-btn" aria-label="Borrar hábito">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <span class="habit-name" title="${escapeHtml(habit.name)}">${escapeHtml(habit.name)}</span>
        </div>
        ${daysHtml}
        <div class="habit-streak-display">
          <span>${streak}</span>
          <span style="color: ${streak > 0 ? 'var(--accent-color)' : 'var(--text-muted)'}">🔥</span>
        </div>
      `;

      row.querySelectorAll('.habit-day-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const dayIdx = parseInt(e.target.getAttribute('data-day'));
          toggleHabitDay(habit.id, dayIdx);
        });
      });

      row.querySelector('.habit-delete-btn').addEventListener('click', () => deleteHabit(habit.id));

      habitsList.appendChild(row);
    });
  }

  function toggleHabitDay(habitId, dayIdx) {
    state.habits = state.habits.map(h => {
      if (h.id === habitId) {
        const newHistory = [...h.history];
        newHistory[dayIdx] = !newHistory[dayIdx];
        return { ...h, history: newHistory };
      }
      return h;
    });
    saveState();
    renderHabits();
    renderWeeklyChart();
  }

  function deleteHabit(id) {
    const rowElement = habitsList.querySelector(`[data-id="${id}"]`);
    if (rowElement) {
      rowElement.style.opacity = '0';
      rowElement.style.transform = 'translateY(5px)';
      rowElement.style.transition = 'all 0.2s ease';

      setTimeout(() => {
        state.habits = state.habits.filter(h => h.id !== id);
        saveState();
        renderHabits();
        renderWeeklyChart();
      }, 200);
    }
  }

  habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = habitInput.value.trim();
    if (!name) return;

    const newHabit = {
      id: Date.now(),
      name: name,
      history: [false, false, false, false, false, false, false]
    };

    state.habits.push(newHabit);
    saveState();

    habitInput.value = '';
    renderHabits();
    renderWeeklyChart();
  });

  renderHabits();

  // --- WIDGET: WEEKLY STATS AND CHART ---
  const statCompletedTasks = document.getElementById('stat-completed-tasks');
  const statActiveHabits = document.getElementById('stat-active-habits');
  const weeklyChart = document.getElementById('weekly-chart');

  function updateStatsWidget() {
    const completedTasksCount = state.tasks.filter(t => t.completed).length;
    statCompletedTasks.textContent = completedTasksCount;

    let maxStreak = 0;
    state.habits.forEach(h => {
      const streak = calculateStreak(h.history);
      if (streak > maxStreak) maxStreak = streak;
    });
    statActiveHabits.textContent = maxStreak;
  }

  function renderWeeklyChart() {
    weeklyChart.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    linearGradient.setAttribute('id', 'chart-gradient');
    linearGradient.setAttribute('x1', '0');
    linearGradient.setAttribute('y1', '0');
    linearGradient.setAttribute('x2', '0');
    linearGradient.setAttribute('y2', '1');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', 'var(--accent-color)');
    stop1.setAttribute('stop-opacity', '0.25');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', 'var(--accent-color)');
    stop2.setAttribute('stop-opacity', '0.00');

    linearGradient.appendChild(stop1);
    linearGradient.appendChild(stop2);
    defs.appendChild(linearGradient);
    weeklyChart.appendChild(defs);

    const daysData = [0, 0, 0, 0, 0, 0, 0];

    if (state.habits.length > 0) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        let completed = 0;
        state.habits.forEach(h => {
          if (h.history[dayIdx]) completed++;
        });
        daysData[dayIdx] = completed / state.habits.length;
      }
    } else {
      daysData[0] = 0.2;
      daysData[1] = 0.5;
      daysData[2] = 0.45;
      daysData[3] = 0.7;
      daysData[4] = 0.6;
      daysData[5] = 0.85;
      daysData[6] = 0.9;
    }

    const width = 400;
    const height = 150;
    const paddingX = 40;
    const paddingY = 25;

    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;
    const stepX = usableWidth / 6;

    const points = daysData.map((val, idx) => {
      const x = paddingX + idx * stepX;
      const y = height - paddingY - val * usableHeight;
      return { x, y, value: val };
    });

    const gridLevels = [0, 0.5, 1];
    gridLevels.forEach(lvl => {
      const y = height - paddingY - lvl * usableHeight;
      const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gridLine.setAttribute('x1', paddingX);
      gridLine.setAttribute('y1', y);
      gridLine.setAttribute('x2', width - paddingX);
      gridLine.setAttribute('y2', y);
      gridLine.setAttribute('class', 'chart-grid-line');
      weeklyChart.appendChild(gridLine);
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    let areaD = `M ${points[0].x} ${height - paddingY} L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
      areaD += ` L ${points[i].x} ${points[i].y}`;
    }

    areaD += ` L ${points[points.length - 1].x} ${height - paddingY} Z`;

    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('class', 'chart-area');
    weeklyChart.appendChild(areaPath);

    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', pathD);
    linePath.setAttribute('class', 'chart-line');
    weeklyChart.appendChild(linePath);

    const daysLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    points.forEach((pt, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', '4.5');
      circle.setAttribute('class', 'chart-dot');

      const percentVal = Math.round(pt.value * 100);
      circle.innerHTML = `<title>Día ${idx + 1}: ${percentVal}% de hábitos</title>`;

      weeklyChart.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pt.x);
      text.setAttribute('y', height - 8);
      text.setAttribute('class', 'chart-label');
      text.textContent = daysLabels[idx];
      weeklyChart.appendChild(text);

      if (idx % 2 === 0 || pt.value > 0.8) {
        const valText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valText.setAttribute('x', pt.x);
        valText.setAttribute('y', pt.y - 8);
        valText.setAttribute('class', 'chart-label');
        valText.setAttribute('style', 'font-size: 8px; fill: var(--text-sub); font-weight: bold;');
        valText.textContent = `${percentVal}%`;
        weeklyChart.appendChild(valText);
      }
    });
  }

  updateStatsWidget();
  renderWeeklyChart();

  // --- WIDGET: WEATHER (Open-Meteo Integration) ---
  const weatherSearchBtn = document.getElementById('weather-search-btn');
  const weatherSearchInput = document.getElementById('weather-search-input');

  if (weatherSearchBtn && weatherSearchInput) {
    weatherSearchBtn.addEventListener('click', async () => {
      const city = weatherSearchInput.value.trim();
      if (!city) return;

      weatherSearchBtn.disabled = true;
      weatherSearchBtn.textContent = 'Buscando...';

      const success = await weatherManager.searchCity(city);

      weatherSearchBtn.disabled = false;
      weatherSearchBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      `;

      if (success) {
        weatherSearchInput.value = "";
      } else {
        alert('No se encontró la ciudad. Intenta de nuevo.');
      }
    });

    weatherSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') weatherSearchBtn.click();
    });
  }

  // Initialize weather on page load
  weatherManager.initialize();

  // --- HELPER FUNCTIONS ---
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

});
