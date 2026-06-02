/* ==========================================================================
   LÓGICA JAVASCRIPT - ZENHUB DASHBOARD
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- ESTADO INICIAL ---
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
    weatherCity: 'Madrid',
    weatherTemp: '22',
    weatherCondition: 'Despejado'
  };

  // Cargar estado desde localStorage si existe
  const savedState = localStorage.getItem('zenhub_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error('Error al parsear el estado guardado, usando el por defecto', e);
    }
  }

  // Guardar estado en localStorage
  function saveState() {
    localStorage.setItem('zenhub_state', JSON.stringify(state));
    // Actualizar widgets conectados
    updateStatsWidget();
  }

  // --- CONTROLADOR DE TEMAS ---
  const themeBtn = document.getElementById('theme-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Aplicar tema cargado
  document.body.className = state.theme;
  themeOptions.forEach(opt => {
    if (opt.getAttribute('data-theme') === state.theme) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  // Mostrar/Ocultar dropdown
  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
  });

  // Seleccionar tema
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selectedTheme = option.getAttribute('data-theme');
      state.theme = selectedTheme;
      document.body.className = selectedTheme;
      
      // Actualizar dropdown
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      themeDropdown.classList.remove('show');
      
      saveState();
      
      // Re-renderizar gráficos por si dependen de variables CSS del tema
      renderWeeklyChart();
    });
  });

  // Cerrar dropdown al hacer click fuera
  document.addEventListener('click', () => {
    themeDropdown.classList.remove('show');
  });


  // --- RELOJ, FECHA Y SALUDO DINÁMICO ---
  const greetingText = document.getElementById('greeting-text');
  const dateText = document.getElementById('date-text');
  const clockTime = document.getElementById('clock-time');

  function updateClockAndGreeting() {
    const now = new Date();
    
    // Formatear reloj (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockTime.textContent = `${hours}:${minutes}:${seconds}`;

    // Formatear fecha
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = now.toLocaleDateString('es-ES', options);
    // Capitalizar primera letra de la fecha
    dateText.textContent = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

    // Determinar saludo dinámico
    const currentHour = now.getHours();
    let greeting = '';

    if (currentHour >= 5 && currentHour < 12) {
      greeting = '¡Buenos días, Creador!';
    } else if (currentHour >= 12 && currentHour < 20) {
      greeting = '¡Buenas tardes, Enfocado!';
    } else {
      greeting = '¡Buenas noches, Pensador!';
    }
    
    // Evitar parpadeos actualizando solo si cambia el saludo
    if (greetingText.textContent !== greeting) {
      greetingText.textContent = greeting;
    }
  }

  // Ejecución inicial e intervalo por segundo
  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);


  // --- WIDGET: ENFOQUE POMODORO ---
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

  let timeLeft = 25 * 60; // 25 min en segs por defecto
  let maxTime = 25 * 60;
  let timerInterval = null;
  let isRunning = false;
  let currentMode = 'work'; // 'work', 'short', 'long'

  // Circunferencia del círculo SVG (2 * PI * r = 2 * 3.14159 * 88 = 552.92)
  const circleCircumference = 552.92;

  function updateTimerUI() {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    timerDigits.textContent = `${minutes}:${seconds}`;

    // Calcular progreso
    const progress = (maxTime - timeLeft) / maxTime;
    const offset = circleCircumference - (progress * circleCircumference);
    timerProgressBar.style.strokeDashoffset = offset;
  }

  function playZenChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Primera nota
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 (Do)
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 1.2);

      // Segunda nota armónica
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5 (Mi)
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn("La API de Web Audio no fue permitida o soportada:", e);
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
        
        // Reproducir campana zen
        playZenChime();
        
        // Auto avanzar fase
        if (currentMode === 'work') {
          alert('¡Sesión de enfoque completada! Tómate un respiro.');
          setMode('short');
        } else {
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

    // Actualizar botones de modo
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

  // Configuración de botones de modo
  modeWorkBtn.addEventListener('click', () => setMode('work', 25));
  modeShortBtn.addEventListener('click', () => setMode('short', 5));
  modeLongBtn.addEventListener('click', () => setMode('long', 15));

  // Inicializar UI de temporizador
  setMode('work', 25);


  // --- WIDGET: NOTAS RÁPIDAS (Auto-guardado con Debounce) ---
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


  // --- WIDGET: GESTOR DE TAREAS (TO-DO) ---
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
    
    // Filtrar tareas
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
        <button class="task-delete-btn" aria-label="Eliminar tarea">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      `;

      // Eventos
      const checkbox = li.querySelector('.checkbox-custom');
      checkbox.addEventListener('change', () => toggleTask(task.id));

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

  // Filtros
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      renderTasks();
    });
  });

  // Renderizar tareas por primera vez
  renderTasks();


  // --- WIDGET: RASTREADOR DE HÁBITOS (Habit Tracker) ---
  const habitForm = document.getElementById('habit-form');
  const habitInput = document.getElementById('habit-input');
  const habitsList = document.getElementById('habits-list');

  // Calcular la racha actual (streaks consecutivas de días marcados)
  function calculateStreak(history) {
    let currentStreak = 0;
    // Recorrer la historia del hábito al revés (de hoy hacia atrás)
    // Para simplificar esta visualización semanal, sumamos días seleccionados consecutivamente desde el último día marcado hacia atrás
    let max = 0;
    let current = 0;
    
    for (let val of history) {
      if (val) {
        current++;
        if (current > max) max = current;
      } else {
        current = 0;
      }
    }
    
    // Racha del final (casilla actual activa)
    let endStreak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]) {
        endStreak++;
      } else {
        // Rompe si encontramos un día vacío antes de hoy (asumiendo que hoy es el último día con datos ingresados)
        if (endStreak > 0) break;
      }
    }

    return endStreak > 0 ? endStreak : max;
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

      // Crear checkboxes para los 7 días
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

      // Eventos para conmutar días
      row.querySelectorAll('.habit-day-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const dayIdx = parseInt(e.target.getAttribute('data-day'));
          toggleHabitDay(habit.id, dayIdx);
        });
      });

      // Evento para borrar hábito
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

  // Render inicial de hábitos
  renderHabits();


  // --- WIDGET: METRICAS Y GRAFICO DE ANALÍTICA (SVG Dinámico) ---
  const statCompletedTasks = document.getElementById('stat-completed-tasks');
  const statActiveHabits = document.getElementById('stat-active-habits');
  const weeklyChart = document.getElementById('weekly-chart');

  function updateStatsWidget() {
    // 1. Tareas completadas totales
    const completedTasksCount = state.tasks.filter(t => t.completed).length;
    statCompletedTasks.textContent = completedTasksCount;

    // 2. Racha máxima de hábitos activos hoy
    let maxStreak = 0;
    state.habits.forEach(h => {
      const streak = calculateStreak(h.history);
      if (streak > maxStreak) maxStreak = streak;
    });
    statActiveHabits.textContent = maxStreak;
  }

  function renderWeeklyChart() {
    weeklyChart.innerHTML = '';
    
    // Añadir gradiente lineal al SVG del gráfico
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

    // Calcular valores de la semana (L, M, M, J, V, S, D)
    // El porcentaje es la tasa de cumplimiento de todos los hábitos creados para cada día concreto
    const daysData = [0, 0, 0, 0, 0, 0, 0]; // Valores de 0 a 1
    
    if (state.habits.length > 0) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        let completed = 0;
        state.habits.forEach(h => {
          if (h.history[dayIdx]) completed++;
        });
        daysData[dayIdx] = completed / state.habits.length;
      }
    } else {
      // Por defecto para que no esté vacío el gráfico inicialmente, creamos una curva de ejemplo
      daysData[0] = 0.2;
      daysData[1] = 0.5;
      daysData[2] = 0.45;
      daysData[3] = 0.7;
      daysData[4] = 0.6;
      daysData[5] = 0.85;
      daysData[6] = 0.9;
    }

    // Configuración de renderizado
    const width = 400;
    const height = 150;
    const paddingX = 40;
    const paddingY = 25;
    
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;
    const stepX = usableWidth / 6;

    // Calcular coordenadas
    const points = daysData.map((val, idx) => {
      const x = paddingX + idx * stepX;
      // Invertir Y ya que 0,0 está arriba a la izquierda
      const y = height - paddingY - val * usableHeight;
      return { x, y, value: val };
    });

    // Dibujar líneas de cuadrícula horizontales (25%, 50%, 75%, 100%)
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

    // Construir Path de línea y Path de área rellena
    let pathD = `M ${points[0].x} ${points[0].y}`;
    let areaD = `M ${points[0].x} ${height - paddingY} L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
      areaD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    areaD += ` L ${points[points.length - 1].x} ${height - paddingY} Z`;

    // Añadir Área Rellena
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('class', 'chart-area');
    weeklyChart.appendChild(areaPath);

    // Añadir Línea
    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', pathD);
    linePath.setAttribute('class', 'chart-line');
    weeklyChart.appendChild(linePath);

    // Nombres de los días
    const daysLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Dibujar puntos interactivos y etiquetas
    points.forEach((pt, idx) => {
      // Círculo del punto
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', '4.5');
      circle.setAttribute('class', 'chart-dot');
      
      // Mostrar tooltip o valor rápido al pasar el cursor
      const percentVal = Math.round(pt.value * 100);
      circle.innerHTML = `<title>Día ${idx + 1}: ${percentVal}% de hábitos</title>`;
      
      weeklyChart.appendChild(circle);

      // Etiqueta de texto del día
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pt.x);
      text.setAttribute('y', height - 8);
      text.setAttribute('class', 'chart-label');
      text.textContent = daysLabels[idx];
      weeklyChart.appendChild(text);
      
      // Valor del porcentaje arriba del punto (opcional, solo si está activo/alto para no colisionar)
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

  // Inicializar estadísticas y gráficos
  updateStatsWidget();
  renderWeeklyChart();


  // --- WIDGET: MOTOR DE CLIMA INTERACTIVO ---
  const weatherCity = document.getElementById('weather-city');
  const weatherSearchInput = document.getElementById('weather-search-input');
  const weatherSearchBtn = document.getElementById('weather-search-btn');
  const weatherTemp = document.getElementById('weather-temp');
  const weatherCondition = document.getElementById('weather-condition');
  const weatherHumidity = document.getElementById('weather-humidity');
  const weatherWind = document.getElementById('weather-wind');
  const weatherIconContainer = document.getElementById('weather-icon-container');

  // SVG de Climas
  const weatherIcons = {
    sunny: `
      <svg class="weather-icon animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5" fill="rgba(253, 224, 71, 0.2)" stroke="#eab308" />
        <path stroke-linecap="round" stroke="#eab308" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    `,
    cloudy: `
      <svg class="weather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    `,
    rainy: `
      <svg class="weather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        <path stroke-linecap="round" d="M7.5 21.75v-1.5M10.5 22.5v-1.5M13.5 21.75v-1.5M16.5 22.5v-1.5" />
      </svg>
    `,
    stormy: `
      <svg class="weather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.5 21l-2 3.5m4.5-3.5l-2 3.5" stroke-dasharray="2 2" />
        <path d="M13 18l-3 3h4.5l-2 3.5" stroke="var(--accent-color)" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `,
    snowy: `
      <svg class="weather-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        <path stroke-linecap="round" d="M8 22h.01M12 22h.01M16 22h.01M10 20h.01M14 20h.01" />
      </svg>
    `
  };

  // Motor Determinista de Clima Basado en Texto (Offline First & Hermoso)
  function getMockWeather(cityName) {
    const cleanCity = cityName.trim().toLowerCase();
    
    // Hash determinista básico
    let hash = 0;
    for (let i = 0; i < cleanCity.length; i++) {
      hash = cleanCity.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    hash = Math.abs(hash);
    
    // Rango de Temperaturas (según hash entre -5 y 36 °C)
    const temp = (hash % 42) - 5;
    
    // Selector de condiciones
    const conditions = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
    let cond = conditions[hash % conditions.length];
    
    // Ajuste lógico básico: Si hace más de 30 grados, que no sea nieve
    if (temp > 30 && cond === 'snowy') cond = 'sunny';
    // Si hace menos de 0 grados y llueve, pasarlo a nieve
    if (temp <= 0 && cond === 'rainy') cond = 'snowy';

    const translations = {
      sunny: 'Despejado',
      cloudy: 'Parcialmente Nublado',
      rainy: 'Lluvia Moderada',
      stormy: 'Tormenta Eléctrica',
      snowy: 'Nieve Ligera'
    };

    // Humedad (35% a 95%)
    const humidity = 35 + (hash % 61);
    // Viento (3km/h a 45km/h)
    const wind = 3 + (hash % 43);

    return {
      cityName: cityName.trim().charAt(0).toUpperCase() + cityName.trim().slice(1),
      temp: `${temp}°C`,
      conditionText: translations[cond],
      iconKey: cond,
      humidity: `${humidity}%`,
      wind: `${wind} km/h`
    };
  }

  // Actualizar UI del Clima
  function updateWeatherUI(cityName) {
    const data = getMockWeather(cityName);
    
    weatherCity.textContent = data.cityName;
    weatherTemp.textContent = data.temp;
    weatherCondition.textContent = data.conditionText;
    weatherHumidity.textContent = data.humidity;
    weatherWind.textContent = data.wind;

    // Pintar icono
    weatherIconContainer.innerHTML = weatherIcons[data.iconKey] || weatherIcons.sunny;

    // Guardar en el estado
    state.weatherCity = data.cityName;
    state.weatherTemp = data.temp;
    state.weatherCondition = data.conditionText;
    saveState();
  }

  // Buscar clima
  weatherSearchBtn.addEventListener('click', () => {
    const city = weatherSearchInput.value.trim();
    if (city) {
      updateWeatherUI(city);
      weatherSearchInput.value = '';
    }
  });

  weatherSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const city = weatherSearchInput.value.trim();
      if (city) {
        updateWeatherUI(city);
        weatherSearchInput.value = '';
      }
    }
  });

  // Cargar ciudad inicial guardada en el estado
  updateWeatherUI(state.weatherCity);


  // --- FUNCIONES AUXILIARES ---
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
