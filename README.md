# PDVSYSTEM (SmartM007 + Supabase)

## Documento do produto (para vender ao cliente)

## Rodar em desenvolvimento

```bash
npm install
npm run dev
```

## Base de dados

### Seed (cria utilizadores + categorias + produtos)

```bash
npm run db:seed
```

### Promover um utilizador para admin

```bash
npm run user:promote:admin -- <username>
```

## Pedido online (checkout)

- Em **Transferência**, o cliente anexa o **comprovativo (imagem)**.
- Os números **Mpesa/Emola** são configurados em **Configurações → Recibos & Faturas**.

