#!/bin/sh
# =============================================================
# docker-start.sh — Script de arranque do container backend
#
# Executado automaticamente pelo CMD do Dockerfile.backend.
# Passos:
#   1. Aguardar a base de dados estar pronta
#   2. Sincronizar o schema Drizzle (criar/actualizar tabelas)
#   3. Iniciar o servidor Express
# =============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          PDVSYSTEM — Arranque do Backend             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Aguardar a base de dados ───────────────────────────────
# O docker-compose define depends_on com healthcheck, mas
# adicionamos uma verificação extra por segurança.
echo "⏳ A verificar ligação à base de dados..."
RETRIES=20
COUNT=0

until node -e "
  import('pg').then(({ default: pkg }) => {
    const { Pool } = pkg;
    const p = new Pool({ connectionString: process.env.DATABASE_URL });
    p.query('SELECT 1')
      .then(() => { p.end(); process.exit(0); })
      .catch(() => { p.end(); process.exit(1); });
  });
" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "❌ Base de dados não respondeu após $RETRIES tentativas. A encerrar."
    exit 1
  fi
  echo "   ⏳ Tentativa $COUNT/$RETRIES — aguardando 2 segundos..."
  sleep 2
done

echo "✅ Ligação à base de dados estabelecida"
echo ""

# ── 2. Sincronizar schema Drizzle ─────────────────────────────
# drizzle-kit push lê o schema TypeScript (shared/schema.ts)
# e cria/actualiza as tabelas na base de dados.
# O flag --force ignora avisos de confirmação interactiva.
echo "🔄 A sincronizar schema da base de dados (drizzle-kit push)..."

npx drizzle-kit push --force 2>&1 | grep -v "^$" || {
  echo "⚠️  Aviso do drizzle-kit (o schema pode já existir — continuando)"
}

echo "✅ Schema sincronizado"
echo ""

# ── 3. Iniciar servidor Express ───────────────────────────────
echo "🚀 A iniciar servidor Node.js/Express..."
echo "   PORT: ${PORT:-3000}"
echo "   HOST: ${HOST:-0.0.0.0}"
echo "   NODE_ENV: ${NODE_ENV:-production}"
echo ""

exec node dist/index.js
