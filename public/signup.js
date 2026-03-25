function $(id) {
  return document.getElementById(id);
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
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

  // No damos pistas del formato del correo:
  // la validación real se hace en backend y solo responde si está autorizado.

  if (!displayName) {
    setAlert("Ingresa el nombre del creador.", "err");
    return;
  }

  if (password.length < 6) {
    setAlert("La contraseña debe tener al menos 6 caracteres.", "err");
    return;
  }

  if (!inviteCode) {
    setAlert("Ingresa el código de acceso.", "err");
    return;
  }

  $("submitBtn").disabled = true;
  $("submitBtn").textContent = "Creando...";

  try {
    await api("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, displayName, inviteCode }),
    });

    // Después de crear la cuenta, pedimos que inicie sesión
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

