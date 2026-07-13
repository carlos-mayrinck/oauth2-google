# OAuth2 Google Calendar Integration - Estudo

Um projeto de estudo sobre OAuth2 com Google Calendar API, implementando um fluxo de autenticação seguro onde os tokens do Google são armazenados no servidor (Redis) e o cliente recebe apenas um JWT com identificação do usuário.

## 📋 Conceito

Este projeto implementa um padrão de segurança onde:

1. **Frontend solicita autenticação** → Backend inicia o fluxo OAuth2 com Google
2. **Usuário autoriza no Google** → Backend recebe o access token OAuth2
3. **Backend armazena tokens no Redis** → Indexados pelo ID do usuário do Google
4. **Backend retorna apenas JWT** → Contendo o `userId` do Google
5. **Cliente usa JWT para recursos protegidos** → Backend recupera tokens OAuth2 do cache usando o `userId`

### ✅ Vantagens desta abordagem

- **Tokens OAuth2 nunca são expostos ao cliente**: Maior segurança contra vazamentos
- **Controle centralizado**: Tokens podem ser revogados no servidor sem depender do cliente
- **JWT simples**: Cliente só precisa gerenciar um token JWT leve
- **Cache eficiente**: Redis armazena credenciais OAuth2 temporariamente

## 🏗️ Arquitetura

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────1───▶│   Backend   │────2───▶│   Google    │
│             │         │             │         │   OAuth2    │
└─────────────┘         └─────────────┘         └─────────────┘
                              │                         │
                              │◀────────3───────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │    Redis    │
                        │   (Cache)   │
                        └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  JWT Token  │
                        │  (retorno)  │
                        └─────────────┘
```

### Fluxo de Autenticação

```
1. GET /oauth/google?scope=openid,calendar.readonly
   └─▶ Backend gera URL de autorização do Google
   └─▶ Abre navegador automaticamente
   └─▶ Usuário autoriza no Google
   └─▶ Google redireciona para callback local (porta 3001)
   └─▶ Backend troca code por access_token + refresh_token
   └─▶ Backend extrai userId do id_token
   └─▶ Backend armazena credentials no Redis (key: userId)
   └─▶ Backend gera JWT com userId
   └─▶ Retorna: { accessToken: "JWT...", expiresIn: 1234567890 }

2. GET /calendar/events/list?calendarId=primary
   Headers: { Authorization: "Bearer JWT..." }
   └─▶ Middleware valida JWT
   └─▶ Middleware extrai userId do JWT
   └─▶ Service busca credentials no Redis usando userId
   └─▶ Service usa credentials OAuth2 para chamar Google Calendar API
   └─▶ Retorna eventos da agenda
```

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express** - Framework web
- **Google Auth Library** - Cliente OAuth2
- **Google Calendar API** - Integração com Google Calendar
- **Redis** - Cache para armazenamento de tokens OAuth2
- **jsonwebtoken** - Geração e validação de JWT
- **Docker Compose** - Infraestrutura local (Redis)

## 📁 Estrutura do Projeto

```
src/
├── @types/
│   └── express/
│       └── index.d.ts           # Extensão do tipo Request (user)
├── clients/
│   └── redis.ts                 # Cliente Redis
├── controllers/
│   ├── auth.controller.ts       # Controller de autenticação
│   └── calendar.controller.ts   # Controller de agenda
├── middlewares/
│   └── auth.middleware.ts       # Validação de JWT
├── routes/
│   ├── app/
│   │   ├── auth.routes.ts       # Rotas de autenticação
│   │   └── calendar.routes.ts   # Rotas de agenda
│   ├── app.routes.ts            # Agregador de rotas da app
│   └── root.routes.ts           # Rotas raiz (health, cache)
├── services/
│   ├── auth.service.ts          # Lógica de autenticação
│   └── calendar.service.ts      # Lógica de agenda
├── usecases/
│   └── authenticateClient.usecase.ts  # Use case OAuth2
├── index.ts                     # Entry point
└── server.ts                    # Configuração do servidor Express
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
# Ambiente
API_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Servidor de callback OAuth2
REDIRECT_PORT=3001
REDIRECT_HOST=http://localhost:3001
REDIRECT_PATH=/oauth/google/callback

# Google OAuth2 Credentials
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/oauth/google/callback
GOOGLE_OAUTH_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=SEU_CLIENT_SECRET
GOOGLE_OAUTH_ENDPOINT=https://accounts.google.com/o/oauth2/v2/auth

# JWT
JWT_SECRET_KEY=sua_chave_secreta_aqui
```

### 2. Obter Credenciais do Google

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Calendar API**
4. Vá em **Credenciais** → **Criar credenciais** → **ID do cliente OAuth 2.0**
5. Configure:
   - **Tipo de aplicação**: Aplicativo da Web
   - **URIs de redirecionamento autorizados**: `http://localhost:3001/oauth/google/callback`
6. Copie o **Client ID** e **Client Secret** para o `.env`

## 🏃 Executando o Projeto

### 1. Instalar dependências

```bash
yarn install
# ou
npm install
```

### 2. Subir infraestrutura (Redis)

```bash
yarn infra:up
# ou
npm run infra:up
```

### 3. Rodar em desenvolvimento

```bash
yarn dev
# ou
npm run dev
```

### 4. Build para produção

```bash
yarn build
yarn start
# ou
npm run build
npm start
```

## 🔌 Endpoints

### Autenticação

#### `GET /oauth/google`

Inicia o fluxo de autenticação OAuth2 com Google.

**Query Parameters:**
- `scope` (string, required): Escopos separados por vírgula
  - Exemplo: `openid,https://www.googleapis.com/auth/calendar.readonly`
  - **Obrigatório**: `openid` (para obter o id_token com userId)

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1234567890
}
```

**Exemplo:**
```bash
curl "http://localhost:3000/oauth/google?scope=openid,https://www.googleapis.com/auth/calendar.readonly"
```

**Fluxo:**
1. Abre automaticamente o navegador para autorização no Google
2. Usuário autoriza os escopos solicitados
3. Google redireciona para callback local
4. Backend armazena tokens OAuth2 no Redis
5. Retorna JWT para o cliente

### Recursos Protegidos

#### `GET /calendar/events/list`

Lista eventos da agenda do Google Calendar.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `calendarId` (string, required): ID do calendário (geralmente `primary`)

**Response:**
```json
[
  {
    "id": "event_id",
    "summary": "Reunião importante",
    "start": {
      "dateTime": "2026-07-15T10:00:00-03:00"
    },
    "end": {
      "dateTime": "2026-07-15T11:00:00-03:00"
    }
  }
]
```

**Exemplo:**
```bash
curl -H "Authorization: Bearer SEU_JWT_TOKEN" \
  "http://localhost:3000/calendar/events/list?calendarId=primary"
```

### Utilitários

#### `GET /`

Health check.

**Response:** `Ok!`

#### `GET /cache/clear`

Limpa todos os dados do Redis (útil para desenvolvimento).

**Response:** `Done`

## 🔒 Segurança

### JWT (JSON Web Token)

- Assinado com `JWT_SECRET_KEY`
- Contém apenas `userId` (do Google)
- Expira junto com o token OAuth2 do Google
- Validado no middleware `AuthMiddleware`

### OAuth2 Tokens

- **Access Token**: Armazenado no Redis, nunca exposto ao cliente
- **Refresh Token**: Armazenado no Redis junto com as credentials
- **ID Token**: Usado apenas para extrair o `userId`, depois descartado
- Indexados por `userId` (subject do id_token do Google)

### Middleware de Autenticação

```typescript
// Valida formato: "Bearer <token>"
// Verifica assinatura JWT
// Extrai userId e adiciona a req.user
```

## 🧪 Testando

### Fluxo completo

```bash
# 1. Autenticar (abrirá o navegador)
curl "http://localhost:3000/oauth/google?scope=openid,https://www.googleapis.com/auth/calendar.readonly"

# Resposta:
# {
#   "accessToken": "eyJhbGci...",
#   "expiresIn": 1234567890
# }

# 2. Usar o JWT para acessar recursos
curl -H "Authorization: Bearer eyJhbGci..." \
  "http://localhost:3000/calendar/events/list?calendarId=primary"
```

## 📝 Escopos do Google

Escopos comuns para testes:

```
# Obrigatório
openid

# Google Calendar
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events.readonly

# Google Drive
https://www.googleapis.com/auth/drive.metadata.readonly
https://www.googleapis.com/auth/drive.readonly
```

**Documentação oficial:** [Google OAuth2 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## 🛠️ Desenvolvimento

### Type Definitions

O projeto estende o tipo `Request` do Express para incluir `user`:

```typescript
// src/@types/express/index.d.ts
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
      };
    }
  }
}
```

### Redis

- Porta padrão: `6379`
- Container: `cache`
- Volume persistente: `redis_data`

Gerenciar container:
```bash
# Subir
yarn infra:up

# Parar
yarn infra:down

# Ver logs
docker logs cache
```

## 🔍 Debugging

### Ver tokens no Redis

```bash
# Conectar ao Redis
docker exec -it cache redis-cli

# Listar todas as keys
KEYS *

# Ver valor de uma key específica
GET <userId>

# Limpar tudo
FLUSHDB
```

### Verificar JWT

Use [jwt.io](https://jwt.io) para decodificar e verificar o JWT retornado.

## 📚 Aprendizados do Projeto

1. **OAuth2 Flow**: Implementação prática do fluxo de autorização
2. **Token Management**: Separação entre tokens OAuth2 (servidor) e JWT (cliente)
3. **Security Best Practices**: Não expor tokens sensíveis ao cliente
4. **Redis Caching**: Uso de cache para armazenamento temporário
5. **TypeScript**: Tipagem forte e extensão de tipos de bibliotecas
6. **Google APIs**: Integração com serviços do Google

## 🚧 Melhorias Futuras

- [ ] Implementar refresh token automático quando access_token expirar
- [ ] Adicionar rate limiting
- [ ] Implementar logout (remover do Redis)
- [ ] Adicionar testes unitários e de integração
- [ ] Implementar CORS configurável
- [ ] Adicionar logging estruturado
- [ ] Suporte a múltiplos provedores OAuth2
- [ ] Health check com verificação de Redis
- [ ] Documentação OpenAPI/Swagger

## 📄 Licença

MIT

---

**Nota**: Este é um projeto de estudo. Para uso em produção, considere implementar as melhorias sugeridas e realizar uma revisão de segurança completa.
