#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> Instalando dependencias…"
npm install
echo "==> Compilando (Vite + servidor TypeScript)…"
npm run build
echo "==> Listo."
echo "    Siguiente paso: git push origin main (o el botón Deploy en Render)."
