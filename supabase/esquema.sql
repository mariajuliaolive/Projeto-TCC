-- =========================================================
-- ESQUEMA DO BANCO — protótipo de exposição gradual em RV
-- ---------------------------------------------------------
-- Cole este arquivo inteiro no SQL Editor do Supabase e
-- execute. Pode ser executado mais de uma vez sem estragar
-- nada: tudo usa "if not exists".
--
-- SÃO SETE TABELAS:
--
--   participantes      quem participou
--   respostas_perfil   o medo declarado (0 a 5), um animal por linha
--   rastreio           o impacto do medo sobre o animal-alvo (0 a 4)
--   sessoes            cada passagem por um nível
--   eventos            o que aconteceu durante a sessão
--   metricas           o resumo numérico de cada sessão
--   respostas_finais   o questionário de percepção
--
-- O identificador de cada linha é gerado no NAVEGADOR, e não
-- aqui. É o que permite ao sistema funcionar sem rede e
-- sincronizar depois: a linha já nasce com a identidade que
-- vai ter no banco.
-- =========================================================

-- ---------------------------------------------------------
-- 1. PARTICIPANTES
-- ---------------------------------------------------------
create table if not exists participantes (
  id                uuid primary key,
  codigo            text unique,
  email             text,
  sexo              text,
  nascimento        date,
  curso             text,
  usou_vr           text,
  consentimento_em  timestamptz,
  criado_em         timestamptz default now()
);

-- O código de participante (P01, P02, …) é gerado AQUI, e
-- não no navegador. Dois participantes cadastrando ao mesmo
-- tempo em computadores diferentes receberiam o mesmo número
-- se cada navegador contasse por conta própria; o banco é o
-- único lugar que enxerga os dois.
create sequence if not exists seq_codigo_participante start 1;

-- SECURITY DEFINER: a funcao roda com os poderes de quem a criou
-- (voce), e nao de quem disparou a insercao (o visitante anonimo).
-- Sem isso, gerar o codigo exigiria dar ao anonimo acesso direto a
-- sequence -- permissao a mais, pelo motivo errado.
--
-- O search_path fixo acompanha o SECURITY DEFINER por seguranca: sem
-- ele, alguem poderia criar um objeto de mesmo nome noutro esquema e
-- fazer a funcao chamar o objeto errado.
create or replace function define_codigo_participante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.codigo is null then
    new.codigo := 'P' || lpad(nextval('seq_codigo_participante')::text, 2, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_participante on participantes;
create trigger trg_codigo_participante
  before insert on participantes
  for each row execute function define_codigo_participante();

-- ---------------------------------------------------------
-- 2. MEDO DECLARADO (questionário de rastreio, parte 1)
-- Uma linha por animal, e não uma linha com cinco colunas:
-- acrescentar um sexto animal ao estudo não exige alterar a
-- estrutura da tabela.
--
-- A escala é de 0 a 5 (até 20/11/2026 era de 0 a 10; a
-- verificação abaixo aceita as duas para não recusar dados
-- de teste antigos — apague-os antes da coleta).
-- ---------------------------------------------------------
create table if not exists respostas_perfil (
  id               uuid primary key,
  participante_id  uuid references participantes(id),
  animal           text not null,
  medo             smallint check (medo between 0 and 10),
  criado_em        timestamptz default now()
);

-- ---------------------------------------------------------
-- 3. SESSÕES — uma por passagem em um nível
-- ---------------------------------------------------------
create table if not exists sessoes (
  id               uuid primary key,
  participante_id  uuid references participantes(id),
  animal           text,
  nivel            smallint,
  dispositivo      text,
  navegador        text,
  inicio           timestamptz,
  fim              timestamptz,
  concluida        boolean default false
);

-- ---------------------------------------------------------
-- 4. EVENTOS — o que aconteceu, e quando
-- O campo "dado" é jsonb porque cada tipo de evento carrega
-- informação diferente: abrir uma porta guarda qual porta,
-- relatar desconforto guarda a nota. Uma coluna para cada
-- seria uma tabela cheia de vazios.
-- ---------------------------------------------------------
create table if not exists eventos (
  id         uuid primary key,
  sessao_id  uuid references sessoes(id),
  tipo       text not null,
  dado       jsonb default '{}'::jsonb,
  instante   integer,          -- milissegundos desde o início da sessão
  criado_em  timestamptz default now()
);

-- ---------------------------------------------------------
-- 5. MÉTRICAS — o resumo numérico de cada sessão
-- É desta tabela que saem as figuras da seção de resultados.
-- ---------------------------------------------------------
create table if not exists metricas (
  id                 uuid primary key,
  sessao_id          uuid references sessoes(id),
  participante_id    uuid references participantes(id),
  animal             text,
  nivel              smallint,
  distancia_minima   real,     -- metros; o quanto chegou perto
  distancia_media    real,
  recuos             smallint, -- quantas vezes se afastou
  agitacao_media     real,     -- graus por segundo da cabeça
  tempo_olhando      real,     -- fração do tempo com o animal à vista
  deslocamento       real,     -- metros percorridos
  encontrados        smallint, -- animais escondidos descobertos
  tocou              boolean,  -- interagiu com o animal (nível 5)
  desconforto        smallint, -- autorrelato 0 a 10
  duracao            real,     -- segundos
  fim                timestamptz,
  concluida          boolean
);

-- ---------------------------------------------------------
-- 6. QUESTIONÁRIO FINAL
-- ---------------------------------------------------------
create table if not exists respostas_finais (
  id               uuid primary key,
  participante_id  uuid references participantes(id),
  respostas        jsonb,
  criado_em        timestamptz default now()
);

-- ---------------------------------------------------------
-- 7. RASTREIO — questionário de rastreio, parte 2
--
-- Uma linha por participante. As dez frases falam do
-- "animal-alvo": o de maior nota na parte 1 (em empate, o
-- participante escolheu; "alvo_por_empate" registra isso).
--
-- Cada frase vale de 0 (nunca) a 4 (sempre). As somas:
--   atencao         3 frases, 0 a 12
--   autorregulacao  3 frases, 0 a 12
--   esquiva         4 frases, 0 a 16
--   total          10 frases, 0 a 40
-- "respostas" guarda as dez notas, frase a frase.
--
-- Não é escore clínico: é descrição da amostra.
-- ---------------------------------------------------------
create table if not exists rastreio (
  id               uuid primary key,
  participante_id  uuid references participantes(id),
  animal_alvo      text,
  alvo_por_empate  boolean,
  trauma           boolean,
  trauma_qual      text,
  respostas        jsonb,
  atencao          smallint check (atencao between 0 and 12),
  autorregulacao   smallint check (autorregulacao between 0 and 12),
  esquiva          smallint check (esquiva between 0 and 16),
  total            smallint check (total between 0 and 40),
  criado_em        timestamptz default now()
);

-- =========================================================
-- POLÍTICAS DE ACESSO
-- ---------------------------------------------------------
-- Esta é a parte que torna a chave pública inofensiva.
--
-- A chave "anon" vai dentro do código que o navegador baixa
-- e, numa aplicação estática, não há como escondê-la. Então
-- a proteção não está nela: está aqui.
--
-- A regra é: PODE INSERIR, NÃO PODE LER.
--
-- Qualquer pessoa com a chave consegue enviar uma resposta,
-- o que é inevitável num formulário público de pesquisa.
-- Ninguém consegue recuperar as respostas de outra pessoa,
-- nem listar os participantes, nem alterar ou apagar o que
-- já foi gravado.
--
-- Quem lê é a pesquisadora, pelo painel do Supabase, com a
-- própria senha — que não passa por este código.
-- =========================================================

-- ---------------------------------------------------------
-- PRIMEIRO A PERMISSAO, DEPOIS A POLITICA
--
-- Sao duas camadas, e as duas precisam estar abertas:
--
--   GRANT   diz que o papel PODE mexer na tabela
--   POLICY  diz em QUAIS LINHAS ele pode mexer
--
-- Sem o GRANT, a politica nem chega a ser consultada: o banco
-- responde "permission denied" antes disso. O Supabase costuma
-- conceder esse GRANT sozinho para tabelas novas no esquema public,
-- mas depender disso e fragil -- se nao acontecer, o sintoma e um
-- erro que parece de politica e nao e. Declarar aqui custa tres
-- linhas e tira a duvida.
--
-- Damos INSERT e so. Nao damos select, update nem delete.
-- ---------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant insert on
  participantes, respostas_perfil, sessoes,
  eventos, metricas, respostas_finais, rastreio
  to anon, authenticated;

alter table participantes    enable row level security;
alter table respostas_perfil enable row level security;
alter table sessoes          enable row level security;
alter table eventos          enable row level security;
alter table metricas         enable row level security;
alter table respostas_finais enable row level security;
alter table rastreio         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['participantes', 'respostas_perfil', 'sessoes',
                           'eventos', 'metricas', 'respostas_finais',
                           'rastreio']
  loop
    execute format('drop policy if exists %I on %I', 'inserir_' || t, t);
    execute format(
      'create policy %I on %I for insert to anon, authenticated with check (true)',
      'inserir_' || t, t);
  end loop;
end $$;

-- Nenhuma política de SELECT, UPDATE ou DELETE é criada.
-- Com RLS ligado, o que não é explicitamente permitido fica
-- proibido — então ler, alterar e apagar estão fechados para
-- a chave pública, por ausência.

-- =========================================================
-- CONSULTA DE CONFERÊNCIA
-- Rode isto no painel depois da coleta para ver se chegou.
-- =========================================================
-- select p.codigo, p.sexo, count(distinct s.id) as sessoes,
--        max(s.nivel) as nivel_maximo
--   from participantes p
--   left join sessoes s on s.participante_id = p.id
--  group by p.codigo, p.sexo
--  order by p.codigo;
