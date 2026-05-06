// NÃO carregar .env em produção - usar variáveis de ambiente do Render
if (process.env.NODE_ENV !== 'production') {
  await import("../env");
}

import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express, { type Express } from "express";

import { app } from "./app";
import runApp from "./runApp";

// Verificar variáveis obrigatórias
console.log('\n🔍 Verificando variáveis de ambiente (PRODUÇÃO)...');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT || 'não definida'}`);

if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não está definida!');
  console.error('   Configure a variável de ambiente no Render Dashboard');
  process.exit(1);
}

// Mostrar hostname da DATABASE_URL (sem senha)
try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log(`   DATABASE_URL host: ${dbUrl.hostname}`);
  console.log(`   DATABASE_URL database: ${dbUrl.pathname.slice(1)}`);
} catch (error) {
  console.error('❌ DATABASE_URL inválida:', error);
  process.exit(1);
}

console.log('✅ Variáveis de ambiente OK\n');

export async function serveStatic(app: Express, _server: Server) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  await runApp(app, serveStatic);
})();