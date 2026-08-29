# 🌐 LocalSocial — Sua Rede Social Local Multiusuário

Uma plataforma de rede social completa, inspirada na dinâmica e experiência de uso de redes modernas como o Instagram, com código 100% próprio, auto-hospedada diretamente no seu computador e projetada para funcionar em rede local (LAN) ou com exposição externa na Internet.

---

## 🌟 Recursos Principais

- 💻 **100% Auto-Hospedado no seu PC**: Banco de dados, contas de usuários, posts, fotos, vídeos, mensagens diretas, curtidas e comentários ficam armazenados localmente no seu computador.
- 📱 **Acesso Multiusuário na Rede Local (LAN)**: Inicie o servidor no seu PC e qualquer celular, notebook ou computador conectado ao mesmo Wi-Fi/cabo pode acessar pelo navegador, criar sua própria conta, seguir perfis, curtir e postar.
- ⚡ **Chat em Tempo Real (WebSockets)**: Conversas privadas instantâneas com suporte a texto, fotos e vídeos, indicador de "digitando...", status online e contadores de mensagens não lidas.
- 📸 **Publicações Multimídia**: Suporte para publicação de múltiplas fotos (carrossel), vídeos com reprodutor nativo, legendas com menções `@usuario`, localização e duplo clique para curtir com animação.
- 👥 **Sistema de Seguidores e Privacidade**: Perfis públicos ou privados com fluxo de aprovação/recusa de solicitações para seguir.
- 🔔 **Central de Notificações**: Alertas em tempo real e lista organizada para novos seguidores, solicitações, curtidas, comentários e respostas.
- 🛡️ **Painel Administrativo Completo**: Métricas em tempo real (usuários, posts, mensagens, espaço utilizado em disco), moderação de posts, bloqueio/desbloqueio e exclusão de contas.
- 📦 **Sistema de Backup com 1 Clique**: Geração de pacotes ZIP com carimbo de data/hora contendo todo o banco de dados e arquivos de mídia armazenados.
- 🌓 **Design Moderno e Responsivo**: Tema Escuro e Claro com transições suaves, interface de desktop com barra lateral e navegação móvel inferior nativa.

---

## 🏗️ Arquitetura e Tecnologias

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Prisma ORM, Multer, bcryptjs, jsonwebtoken, archiver.
- **Banco de Dados**: SQLite local por padrão (arquivo `localsocial.db` — funciona sem precisar instalar nenhum serviço extra no Windows/Linux/Mac), com suporte direto para PostgreSQL via Prisma.
- **Armazenamento de Arquivos**: Local (`/storage/avatars`, `/storage/posts`, `/storage/videos`, `/storage/chat`).

---

## 🚀 Como Instalar e Iniciar o Servidor

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior instalada.

### 2. Instalação das Dependências
Na raiz do projeto, execute:
```powershell
npm.cmd run install:all
```
*(Se estiver no Linux/macOS, pode usar `npm run install:all`)*

### 3. Inicialização e Seed do Banco de Dados
Para criar as tabelas e popular o usuário administrador e dados de demonstração:
```powershell
npm.cmd run db:push
npm.cmd run db:seed
```

### 4. Iniciar o Servidor Completo
Para iniciar o Backend e o Frontend simultaneamente:
```powershell
npm.cmd run dev
```

O terminal exibirá um banner com os endereços de acesso:
```
====================================================================
       🚀  LOCALSOCIAL - SERVIDOR LOCAL MULTIUSUÁRIO ONLINE  🚀
====================================================================

💻 ACESSO NESTE COMPUTADOR (Localhost):
   👉 Aplicação (Frontend): http://localhost:3000
   👉 API Backend:         http://localhost:5000/api
   👉 Mídias / Storage:     http://localhost:5000/storage

📱 ACESSO POR OUTROS COMPUTADORES / CELULARES NA MESMA REDE (Wi-Fi/LAN):
   👉 [Wi-Fi]: http://192.168.X.X:3000

🛡️ CONTA ADMINISTRADOR PADRÃO:
   👉 Usuário:  admin
   👉 Senha:    admin123
   👉 Painel:   http://localhost:3000/admin
====================================================================
```

---

## 📱 Como Conectar Celulares e Outros Computadores

1. Certifique-se de que o outro dispositivo (celular ou outro PC) está conectado à **mesma rede Wi-Fi** do computador que está rodando o servidor.
2. No celular/outro PC, abra o navegador (Chrome, Safari, Edge, etc.) e digite o endereço de IP da rede local mostrado no terminal:
   ```
   http://192.168.X.X:3000
   ```
   *(Substitua `192.168.X.X` pelo IP exibido no terminal ao iniciar o servidor)*.
3. Crie uma nova conta ou faça login. O banco de dados centralizado no seu computador registrará a conta e sincronizará tudo em tempo real!

> [!TIP]
> **Dica do Firewall do Windows**: Se o celular não conseguir carregar a página, certifique-se de que o Firewall do Windows permitiu conexões na rede privada para o Node.js, ou libere as portas 3000 e 5000 no Firewall do Windows.

---

## 🔑 Contas de Demonstração Pré-Configuradas

O comando `npm run db:seed` cria as seguintes contas para testes imediatos:

| Usuário | Senha | Função |
|---|---|---|
| `@admin` | `admin123` | Administrador Geral do Sistema |
| `@marina.tech` | `123456` | Conta de Demonstração (Desenvolvedora) |
| `@lucas.foto` | `123456` | Conta de Demonstração (Fotógrafo) |
| `@ana.design` | `123456` | Conta Privada de Demonstração (Designer) |
| `@carlos.dev` | `123456` | Conta de Demonstração (Fullstack) |

---

## 💾 Sistema de Backup Local

Você pode gerar backups completos contendo o banco de dados e todas as mídias salvas:

1. **Pelo Painel Admin no Navegador**:
   - Acesse `http://localhost:3000/admin`, vá na aba **Backups** e clique em **"Criar Backup Agora"**.
   - Você poderá fazer o download direto do arquivo `.zip`.

2. **Pela Linha de Comando (Terminal)**:
   ```powershell
   npm.cmd run backup
   ```
   O backup será salvo na pasta `/backups/` com nome no formato `localsocial_backup_AAAA-MM-DD_HH-mm-ss.zip`.

---

## 🐘 Como Migrar para PostgreSQL (Opcional)

Se preferir utilizar PostgreSQL em vez do SQLite local padrão:

1. No arquivo `.env`, altere a linha do banco para a sua string de conexão:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/localsocial?schema=public"
   ```
2. No arquivo `server/prisma/schema.prisma`, altere o provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Execute `npm.cmd run db:push` para criar as tabelas no PostgreSQL.

---

## 🌐 Como Expor para Acesso Externo pela Internet

Para que pessoas fora da sua rede local (em outras cidades ou usando 4G/5G) possam acessar seu servidor:

### Opção 1: Cloudflare Tunnels (Recomendado - Gratuito e Seguro)
Sem necessidade de abrir portas no roteador:
1. Instale o [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-tunnel/).
2. Execute o túnel apontando para o frontend:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. O Cloudflare gerará um endereço público HTTPS seguro (ex: `https://seu-tunel.trycloudflare.com`).

### Opção 2: ngrok ou LocalTunnel
```bash
npx ngrok http 3000
# ou
npx localtunnel --port 3000
```

### Opção 3: Tailscale ou ZeroTier (VPN Privada Segura)
Instale o Tailscale no computador servidor e nos celulares/dispositivos da sua família/amigos. Cada dispositivo ganha um IP seguro privado dentro da rede virtual.

---

## 🐳 Execução com Docker Compose

Se preferir rodar toda a aplicação via contêineres Docker:
```bash
docker-compose up --build
```
Acesse em `http://localhost:3000`.

---

## 📂 Estrutura do Projeto

```
localsocial/
├── server/                    # Backend Node.js + Express + Prisma + Socket.IO
│   ├── prisma/schema.prisma   # Definição das tabelas do banco de dados
│   ├── src/
│   │   ├── config/            # Detecção de IP LAN e variáveis de ambiente
│   │   ├── controllers/       # Lógica das rotas (Auth, Posts, Chat, Admin, etc.)
│   │   ├── middlewares/       # Auth JWT, Multer uploads e Admin
│   │   ├── socket/            # WebSockets em tempo real
│   │   └── index.ts           # Inicialização do servidor
│   └── storage/               # Armazenamento local de mídias (avatars, posts, chat)
│
├── client/                    # Frontend React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/               # Cliente Axios com detecção automática do host
│   │   ├── components/        # Componentes reutilizáveis (Feed, Chat, Profile, Admin)
│   │   ├── context/           # AuthContext, SocketContext, ThemeContext
│   │   ├── pages/             # Home, Explore, Chat, Notifications, Profile, Admin
│   │   └── App.tsx            # Roteamento e layout
│
├── backups/                   # Backups gerados em arquivo ZIP
├── docker-compose.yml         # Orquestração Docker
├── .env                       # Variáveis de configuração ativas
└── README.md                  # Documentação completa
```

---

## 📄 Licença
Distribuído sob a licença MIT. Desenvolvido para máxima privacidade, controle local e liberdade de dados.
