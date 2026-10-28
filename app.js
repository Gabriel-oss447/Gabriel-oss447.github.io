/* ==================================================================
   app.js — Lógica de todo el sitio (se carga en TODAS las páginas)
   Los datos se guardan en ARRAYS y se respaldan en localStorage del
   navegador para que no se pierdan al cambiar de página o recargar.
   ================================================================== */

/* ---------- 0. UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);

// Escapa texto para que nadie pueda inyectar HTML en la tabla
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const leer = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

// Muestra un mensaje verde (ok = true) o rojo (ok = false) en un <p class="msg">
function mensaje(el, texto, ok) {
  if (!el) return;
  el.textContent = texto;
  el.className = 'msg ' + (ok ? 'msg-ok' : 'msg-error');
}


/* ---------- 1. ARRAYS DE DATOS ----------
   usuarios    → cuentas creadas (clientes + administrador)
   solicitudes → formularios "Quiero recibir información"            */
let usuarios = leer('usuarios', []);
let solicitudes = leer('solicitudes', []);

// Cuenta de administrador por defecto (CÁMBIALA aquí)
if (!usuarios.some((u) => u.rol === 'admin')) {
  usuarios.push({ correo: 'admin@centenario.com', password: 'Admin123', rol: 'admin' });
  guardar('usuarios', usuarios);
}

const getSesion = () => leer('sesion', null);


/* ---------- 2. BOTONES DE SESIÓN EN EL MENÚ ----------
   Rellena <span id="nav-session"> según haya o no sesión iniciada. */
function pintarSesion() {
  const box = $('nav-session');
  if (!box) return;
  const s = getSesion();
  if (!s) {
    box.innerHTML = '<a class="btn btn-outline" href="login.html">Iniciar sesión</a> ' +
                    '<a class="btn btn-primary" href="registro.html">Crear cuenta</a>';
    return;
  }
  box.innerHTML = '<span class="nav-user">' + esc(s.correo) + '</span> ' +
    (s.rol === 'admin' ? '<a class="btn btn-outline" href="admin.html">Panel admin</a> ' : '') +
    '<button class="btn btn-primary" id="btn-salir" type="button">Cerrar sesión</button>';
  $('btn-salir').onclick = () => { localStorage.removeItem('sesion'); location.href = 'index.html'; };
}


/* ---------- 3. REGISTRO DE USUARIO (registro.html) ---------- */
function initRegistro() {
  const form = $('form-registro');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('msg-registro');
    const correo = $('reg-correo').value.trim().toLowerCase();
    const password = $('reg-password').value;
    const dni = $('reg-dni').value.trim();
    const celular = $('reg-celular').value.trim();

    if (!/^\S+@\S+\.\S+$/.test(correo)) return mensaje(msg, 'Ingresa un correo válido.', false);
    if (password.length < 6) return mensaje(msg, 'La contraseña debe tener al menos 6 caracteres.', false);
    if (!/^\d{8}$/.test(dni)) return mensaje(msg, 'El DNI debe tener 8 dígitos.', false);
    if (!/^9\d{8}$/.test(celular)) return mensaje(msg, 'El celular debe tener 9 dígitos y empezar con 9.', false);
    if (usuarios.some((u) => u.correo === correo)) return mensaje(msg, 'Ese correo ya tiene una cuenta.', false);
    if (usuarios.some((u) => u.dni === dni)) return mensaje(msg, 'Ese DNI ya está registrado.', false);

    usuarios.push({ correo, password, dni, celular, rol: 'usuario' });   // ← se guarda en el array
    guardar('usuarios', usuarios);
    mensaje(msg, 'Cuenta creada. Redirigiendo al inicio de sesión…', true);
    setTimeout(() => (location.href = 'login.html'), 1200);
  });
}


/* ---------- 4. INICIO DE SESIÓN (login.html) ----------
   Sirve para usuarios Y administrador: solo pide correo y contraseña. */
function initLogin() {
  const form = $('form-login');
  if (!form) return;

  // Avisos al abrir la página de login
  const msg = $('msg-login');
  if (location.search.includes('denegado')) {
    mensaje(msg, 'Debes iniciar sesión como administrador. Si ya lo hiciste y volviste aquí, abre el sitio con un servidor local (ver instrucciones).', false);
  } else if (location.protocol === 'file:') {
    mensaje(msg, 'Estás abriendo el sitio como archivo local: en algunos navegadores la sesión no pasa de una página a otra. Si no puedes entrar, usa un servidor local.', false);
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const correo = $('log-correo').value.trim().toLowerCase();
    const password = $('log-password').value;
    const u = usuarios.find((x) => x.correo === correo && x.password === password);
    if (!u) return mensaje($('msg-login'), 'Correo o contraseña incorrectos.', false);

    guardar('sesion', { correo: u.correo, rol: u.rol });
    // Comprobamos que la sesión realmente quedó guardada
    if (!getSesion()) return mensaje($('msg-login'), 'Tu navegador bloquea el almacenamiento. Abre el sitio con un servidor local (ver instrucciones).', false);
    location.href = u.rol === 'admin' ? 'admin.html' : 'index.html';   // admin → panel, usuario → inicio
  });
}


/* ---------- 5. GUARDAR SOLICITUDES (formulario de index.html) ---------- */
function initSolicitud() {
  const form = $('form-solicitud');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('msg-solicitud');
    if (!$('lugar').value) return mensaje(msg, 'Elige dónde quieres vivir.', false);

    solicitudes = leer('solicitudes', []);   // relee por si hay otra pestaña abierta
    solicitudes.push({                        // ← se guarda en el array
      id: Date.now(),
      fecha: new Date().toLocaleString('es-PE'),
      nombres: $('nombres').value.trim(),
      apellidos: $('apellidos').value.trim(),
      correo: $('correo').value.trim(),
      tipoDoc: $('tipo-doc').value,
      documento: $('documento').value.trim(),
      telefono: $('telefono').value.trim(),
      lugar: $('lugar').value,
      atendida: false
    });
    guardar('solicitudes', solicitudes);
    form.reset();
    mensaje(msg, '¡Gracias! Recibimos tu solicitud y te contactaremos pronto.', true);
  });
}


/* ---------- 6. PANEL DEL ADMINISTRADOR (admin.html) ---------- */
function initAdmin() {
  const tbody = $('tabla-solicitudes');
  if (!tbody) return;

  // Protección: solo entra el administrador
  const s = getSesion();
  if (!s || s.rol !== 'admin') { location.href = 'login.html?denegado=1'; return; }

  function pintar() {
    solicitudes = leer('solicitudes', []);
    const filtro = $('filtro').value;   // todas | pendientes | atendidas
    const lista = solicitudes.filter((x) => filtro === 'todas' || (filtro === 'atendidas') === x.atendida);

    // Contadores de arriba
    const atendidas = solicitudes.filter((x) => x.atendida).length;
    $('c-total').textContent = solicitudes.length;
    $('c-atendidas').textContent = atendidas;
    $('c-pendientes').textContent = solicitudes.length - atendidas;

    // Filas de la tabla
    tbody.innerHTML = lista.length ? lista.map((x, i) => `
      <tr class="${x.atendida ? 'fila-atendida' : ''}">
        <td>${i + 1}</td>
        <td>${esc(x.fecha)}</td>
        <td>${esc(x.nombres)} ${esc(x.apellidos)}</td>
        <td>${esc(x.correo)}</td>
        <td>${esc(x.tipoDoc)} ${esc(x.documento)}</td>
        <td>${esc(x.telefono)}</td>
        <td>${esc(x.lugar)}</td>
        <td><span class="estado ${x.atendida ? 'estado-ok' : 'estado-pend'}">${x.atendida ? 'Atendida' : 'Pendiente'}</span></td>
        <td class="acciones">
          <button class="btn btn-outline btn-sm" data-accion="toggle" data-id="${x.id}">${x.atendida ? 'Marcar pendiente' : 'Marcar atendida'}</button>
          <button class="btn btn-sm btn-borrar" data-accion="borrar" data-id="${x.id}">Eliminar</button>
        </td>
      </tr>`).join('')
      : '<tr><td colspan="9" class="vacio">No hay solicitudes para mostrar.</td></tr>';
  }

  // Clics en los botones de cada fila (delegación de eventos)
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.accion === 'toggle') {
      const item = solicitudes.find((x) => x.id === id);
      if (item) item.atendida = !item.atendida;            // cambia atendida ↔ pendiente
    } else if (confirm('¿Eliminar esta solicitud?')) {
      solicitudes = solicitudes.filter((x) => x.id !== id);
    }
    guardar('solicitudes', solicitudes);
    pintar();
  });

  $('filtro').addEventListener('change', pintar);
  pintar();
}


/* ---------- 7. PÁGINA DE PROYECTOS (proyectos.html) ----------
   Para EDITAR un proyecto cambia sus datos aquí:
   img       → ruta de la foto del terreno (ej. "img/laderas.jpg"); si está vacío se muestra un recuadro
   plano     → ruta del PDF (ej. "planos/laderas-del-valle.pdf")
   direccion → texto que busca Google Maps (pon la dirección exacta)  */
const placeholder = (t) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="#ece6fb"/>' +
  '<text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="22" fill="#5b06e3">' + t + '</text></svg>');

const proyectos = [
  { nombre: 'Urbanización Mirador del Valle', zona: ' Junin / Pilcomayo', img: 'Assets/Imagenes/Urbanización Mirador del Valle.png', plano: 'Assets/Planos/CIPRIANO CHUPACA.pdf', direccion: 'Urbanización Mirador del Valle, Pilcomayo, Junín, Perú' },
  { nombre: 'Proyecto Alto Miraflores', zona: 'Junin / Pilcomayo', img: 'Assets/Imagenes/Proyecto Alto Miraflores.png', plano: 'Assets/Planos/proyecto2.pdf', direccion: 'Proyecto Alto Miraflores, Pilcomayo, Junín, Perú' },
  { nombre: 'Proyecto la Perla', zona: 'Junin / Chupaca', img: 'Assets/Imagenes/Proyecto la Perla.png', plano: 'Assets/Planos/LA PERLA CHUPACA.pdf', direccion: 'Proyecto la Perla, Chupaca, Junín, Perú' },
  { nombre: 'Proyecto La Planicie', zona: 'Junin / Pilcomayo', img: 'Assets/Imagenes/Proyecto La Planicie.png', plano: 'Assets/Planos/LA PLANICIE PILCOMAYO.pdf', direccion: 'Proyecto La Planicie, Pilcomayo, Junín, Perú' },
  { nombre: 'Proyecto Valle', zona: 'Junin / Chupaca', img: 'Assets/Imagenes/Proyecto Valle.png', plano: 'Assets/Planos/VALLE CHUPACA.pdf', direccion: 'Proyecto Valle, Chupaca, Junín, Perú' },
];

function initProyectos() {
  const grid = $('grid-proyectos');
  if (!grid) return;
  grid.innerHTML = proyectos.map((p) => {
    const q = encodeURIComponent(p.direccion);
    return `
    <article class="plano-card">
      <!-- 1) Imagen del terreno -->
      <img src="${esc(p.img || placeholder(p.nombre))}" alt="Terreno ${esc(p.nombre)}" loading="lazy">
      <div class="plano-body">
        <h3>${esc(p.nombre)}</h3>
        <p class="card-meta">${esc(p.zona)}</p>
        <!-- 2) Botón para descargar el plano en PDF -->
        <a class="btn btn-primary btn-block" href="${esc(p.plano)}" download>Descargar plano PDF</a>
        <!-- 3) Dirección con Google Maps -->
        <p class="direccion"><strong>Dirección:</strong> ${esc(p.direccion)}</p>
        <a class="maps-link" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">Abrir en Google Maps ↗</a>
        <iframe class="mapa" src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" title="Mapa de ${esc(p.nombre)}"></iframe>
      </div>
    </article>`;
  }).join('');
}


/* ---------- 8. ARRANQUE: cada función solo actúa si su página existe ---------- */
document.addEventListener('DOMContentLoaded', () => {
  pintarSesion();
  initRegistro();
  initLogin();
  initSolicitud();
  initAdmin();
  initProyectos();
});
