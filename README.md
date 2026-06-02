# nl-drugstore-api

API REST em Node.js (Express + Sequelize + Postgres/Neon) para farmácia pública comunitária, com **notificações em tempo real via SSE (Server-Sent Events)**.

## Configuração (Neon)

1) Crie um arquivo `.env` baseado em `.env.example`.

2) No Neon, copie a connection string e preencha:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
DB_SSL=true
JWT_SECRET=...
```

3) Instale dependências e rode:

```bash
npm install
npm run dev
```

## SSE (teste manual)

Depois de fazer login e obter um JWT, conecte:

```js
const eventSource = new EventSource('http://localhost:3000/api/notifications/stream?token=SEU_JWT');

eventSource.addEventListener('notification', (e) => {
  console.log('notification', JSON.parse(e.data));
});

eventSource.addEventListener('favorite_restock', (e) => {
  console.log('favorite_restock', JSON.parse(e.data));
});

eventSource.addEventListener('sla_warning', (e) => {
  console.log('sla_warning', JSON.parse(e.data));
});
```
