# AGR Ponto Inteligente — Fase 1 (fundação e autenticação)

## Colocar no ar
1. Crie um projeto no Supabase (região São Paulo).
2. SQL Editor: execute `supabase/migrations/001_fundacao.sql`.
3. Authentication > Users: crie seu usuário; ajuste o e-mail em `supabase/seed_primeiro_admin.sql` e execute.
4. `cp .env.example .env.local` e preencha URL e chaves (Project Settings > API).
5. `npm install && npm run dev` e abra http://localhost:3000.
6. Produção: Vercel, com as mesmas variáveis de ambiente.

## O que a Fase 1 garante
- Login real (Supabase Auth). Token validado no servidor a cada requisição (middleware).
- Quatro papéis: agr_admin, company_admin, hr, employee. Cada um só acessa a própria área.
- Empresa suspensa/cancelada é bloqueada em todas as rotas.
- Isolamento por empresa no banco (RLS): mesmo com erro no código, uma empresa não lê dados de outra.
- Ninguém altera o próprio papel ou empresa.

## Fase 2: execute também `supabase/migrations/002_ponto.sql`. Login do funcionário: matrícula + código da empresa (slug) + senha.

## Fase 3: execute `supabase/migrations/003_restricao_ip.sql`
- Criação de empresas e administradores: Painel AGR > Nova empresa.
- IPs: Painel AGR > clique na empresa > Autorizar IP (IP fixo ou faixa CIDR). Sem IP cadastrado, a empresa fica bloqueada.
- O IP é lido dos cabeçalhos da plataforma (Vercel). Em outro servidor, configure o proxy para sobrescrever X-Forwarded-For.
- A função de ponto agora só é executável pelo servidor (service role): o funcionário não consegue burlar o IP chamando o banco direto.

## Fases 4 e 5: execute `004_camera_facial.sql` e `005_assinatura.sql`

### Câmera (Fase 4)
1. Painel AGR > empresa > Cadastrar câmera. Copie a chave (aparece uma vez).
2. No PC da empresa (mesma rede da câmera IP; Node 18+ e ffmpeg instalados):
   `SERVER_URL=https://seu-dominio CAMERA_KEY=... RTSP_URL=rtsp://usuario:senha@IP-DA-CAMERA/stream node agent/agent.mjs`
   Mantenha rodando como serviço (pm2 ou systemd). A câmera aparece como Online no painel.
3. Painel da empresa > Funcionários > "Cadastrar rosto" (marque o consentimento; o funcionário fica em frente à câmera).
4. Só depois: Painel AGR > "Exigir validação facial".
5. Reconhecimento: Amazon Rekognition (variáveis AWS_*). Confirme a região disponível e a base legal LGPD para o tratamento.

### Assinaturas (Fase 5)
- Webhook no Asaas: `https://seu-dominio/api/webhooks/asaas`, com o token em ASAAS_WEBHOOK_TOKEN.
- Painel AGR > empresa > Gerar cobrança mensal. Pagamento confirmado = ativa; atraso = suspensa (acesso bloqueado); cancelamento = cancelada.

### Relatórios
- Painel da empresa > Relatórios e inconsistências (tela, Excel e PDF; períodos de até 62 dias).

## Fase 6: execute `supabase/migrations/006_operacao.sql`
- **Quiosque:** Painel AGR > empresa > Cadastrar quiosque (copie a chave). No tablet, abra `https://seu-dominio/quiosque`, informe a chave uma vez e deixe em tela cheia. O IP do tablet precisa estar na lista de IPs autorizados.
- **Ajustes do RH:** Painel da empresa > Ajustes de ponto (inclui marcação esquecida, com motivo; a original nunca muda).
- **Unidades:** Painel da empresa > Unidades (respeita o limite do plano). O funcionário é vinculado a uma unidade no cadastro.
- **Turno noturno:** a sequência segue a última marcação (até 16h); relatórios agrupam por turno.
- **Fim do teste:** `expire_trials()` suspende empresas em teste vencido sem cobrança (agendado via pg_cron, se disponível).
- **Auditoria:** ações administrativas ficam em Painel da empresa > Auditoria.
- Modelos de LGPD/contrato em `docs/` (rascunhos para o seu advogado).
