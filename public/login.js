function $(id) {
  return document.getElementById(id);
}

async function api(path, options = {}) {
  // Detectar si estamos en producción y construir URL completa
  let fullPath = path;
  if (window.location.hostname !== 'localhost' && !path.startsWith('http')) {
    fullPath = `${window.location.origin}${path}`;
  }
  
  const res = await fetch(fullPath, options);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const form = $("loginForm");
const alertEl = $("alert");

function setAlert(msg, kind) {
  alertEl.style.display = "block";
  alertEl.classList.remove("ok", "err");
  alertEl.classList.add(kind === "ok" ? "ok" : "err");
  alertEl.textContent = msg;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertEl.style.display = "none";

  const email = $("email").value.trim().toLowerCase(); // Normalizar email
  const password = $("password").value;

  // No damos pistas del formato del correo:
  // la validación real se hace en backend y solo responde si está autorizado.

  $("submitBtn").disabled = true;
  $("submitBtn").textContent = "Ingresando...";

  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("token", data.token);
    window.location.href = "/index.html";
  } catch (err) {
    setAlert(err.message || "Error al iniciar sesión", "err");
  } finally {
    $("submitBtn").disabled = false;
    $("submitBtn").textContent = "Ingresar";
  }
});

// Si ya existe token, ir directo
if (localStorage.getItem("token")) {
  window.location.href = "/index.html";
}

