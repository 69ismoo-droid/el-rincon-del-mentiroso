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

const form = $("signupForm");
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

  const displayName = $("displayName").value.trim();
  const email = $("email").value.trim();
  const password = $("password").value;
  const inviteCode = $("inviteCode").value.trim();

  if (!displayName) {
    setAlert("Ingresa el nombre del creador.", "err");
    return;
  }

  if (password.length < 6) {
    setAlert("La contraseña debe tener al menos 6 caracteres.", "err");
    return;
  }

  if (!inviteCode) {
    setAlert("Ingresa tu código personal.", "err");
    return;
  }

  $("submitBtn").disabled = true;
  $("submitBtn").textContent = "Creando...";

  try {
    const body = { email, password, displayName, inviteCode };

    await api("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    window.location.href = "/login.html";
  } catch (err) {
    setAlert(err.message || "Error al crear cuenta", "err");
  } finally {
    $("submitBtn").disabled = false;
    $("submitBtn").textContent = "Crear cuenta";
  }
});

// Si ya existe token, ir directo
if (localStorage.getItem("token")) {
  window.location.href = "/index.html";
}

