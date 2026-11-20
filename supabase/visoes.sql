-- =========================================================
-- VISÕES DE ANÁLISE
-- ---------------------------------------------------------
-- As sete tabelas do banco foram feitas para GRAVAR bem:
-- cada dado num lugar só, ligado aos outros por um id longo
-- (a3f1c2…). Isso é bom para o sistema e ruim para quem lê:
-- abrir "metricas" mostra uma fileira de ids e não diz de
-- quem é cada linha.
--
-- Uma VISÃO resolve isso sem mexer nos dados. Ela é uma
-- consulta guardada com nome, que o painel mostra como se
-- fosse uma tabela. Não copia nada: toda vez que você abre,
-- ela lê as tabelas de verdade e monta a planilha na hora.
-- Chegou um participante novo, a visão já o mostra.
--
-- Aqui os ids longos somem e entram dois códigos legíveis:
--
--   P03       o participante
--   P03-S02   a segunda sessão do participante P03
--
-- COMO INSTALAR (uma vez só)
--   Supabase → SQL Editor → cole o CONTEÚDO deste arquivo → Run.
--   Pode rodar de novo quando quiser: ele recria as visões e
--   não toca em nenhum dado.
--
-- COMO USAR
--   Supabase → Table Editor → no seletor "schema", troque
--   "public" por "analise". As seis visões aparecem na lista.
--
-- POR QUE UM ESQUEMA SEPARADO ("analise")
--
-- O site só enxerga o esquema "public", e lá ele só pode
-- INSERIR. Se estas visões ficassem em "public", o Supabase
-- as publicaria na mesma porta por onde o site envia dados —
-- e uma visão lê as tabelas com os poderes de quem a criou,
-- passando por cima da regra "pode inserir, não pode ler".
-- Qualquer pessoa com a chave pública leria as respostas.
--
-- Fora de "public", elas simplesmente não existem para o
-- site. Só quem entra no painel com a sua senha as vê.
-- =========================================================

create schema if not exists analise;

-- Recriar do zero permite mudar as colunas de uma visão
-- rodando este arquivo de novo.
drop view if exists analise.conferencia;
drop view if exists analise.rastreio;
drop view if exists analise.por_animal;
drop view if exists analise.sessoes;
drop view if exists analise.questionario_final;
drop view if exists analise.participantes;

-- ---------------------------------------------------------
-- 1. PARTICIPANTES — quem participou, SEM o e-mail
--
-- O e-mail fica só na tabela original. Assim esta planilha
-- pode ser exportada e mostrada ao orientador sem identificar
-- ninguém, como o termo de consentimento promete.
-- ---------------------------------------------------------
create view analise.participantes
with (security_invoker = true) as
select p.codigo,
       p.sexo,
       date_part('year', age(p.nascimento))::int as idade,
       p.curso,
       p.usou_vr,
       p.criado_em as cadastrado_em
  from public.participantes p
 order by p.codigo;

-- ---------------------------------------------------------
-- 2. SESSÕES — uma linha por nível percorrido
--
-- É a planilha principal: tudo o que foi medido em cada
-- passagem, com o medo que a pessoa declarou ao lado.
--
-- Parte de "sessoes" e não de "metricas" de propósito. Uma
-- sessão é registrada quando o nível ABRE; as métricas,
-- quando ele FECHA. Se as métricas de alguma sessão não
-- chegaram, a linha aparece aqui com as medidas vazias — e
-- o buraco fica à vista, em vez de a linha sumir.
--
-- As unidades estão no nome da coluna, para ninguém ter de
-- adivinhar se "1.3" é metro ou segundo.
-- ---------------------------------------------------------
create view analise.sessoes
with (security_invoker = true) as
with numeradas as (
  select s.*,
         row_number() over (partition by s.participante_id
                            order by s.inicio, s.id) as ordem
    from public.sessoes s
)
select p.codigo || '-S' || lpad(n.ordem::text, 2, '0') as sessao,
       p.codigo                                        as participante,
       n.ordem::int                                    as ordem,
       n.animal,
       n.nivel,
       r.medo                                          as medo_declarado,
       m.concluida,
       round(m.distancia_minima::numeric, 2)           as chegou_a_m,
       round(m.distancia_media::numeric, 2)            as distancia_media_m,
       m.recuos,
       round(m.agitacao_media::numeric, 1)             as agitacao_graus_por_s,
       round((m.tempo_olhando * 100)::numeric, 0)      as olhando_pct,
       round(m.deslocamento::numeric, 2)               as andou_m,
       m.encontrados,
       m.tocou,
       m.desconforto,
       round(m.duracao::numeric, 0)                    as duracao_s,
       n.dispositivo,
       n.inicio                                        as iniciada_em,
       (m.id is not null)                              as metricas_chegaram
  from numeradas n
  join public.participantes p        on p.id = n.participante_id
  left join public.metricas m        on m.sessao_id = n.id
  left join public.respostas_perfil r on r.participante_id = n.participante_id
                                     and r.animal = n.animal
 order by p.codigo, n.ordem;

-- ---------------------------------------------------------
-- 3. POR ANIMAL — uma linha por participante e animal
--
-- A pergunta central do trabalho numa planilha só: quem
-- declarou mais medo foi menos longe e ficou mais distante?
-- Ordene por "medo_declarado" no painel e compare com
-- "nivel_maximo" e "chegou_a_m".
-- ---------------------------------------------------------
create view analise.por_animal
with (security_invoker = true) as
select s.participante,
       s.animal,
       max(s.medo_declarado)                     as medo_declarado,
       count(*)::int                             as sessoes,
       max(s.nivel)                              as nivel_maximo,
       count(*) filter (where s.concluida)::int  as niveis_concluidos,
       min(s.chegou_a_m)                         as chegou_a_m,
       sum(s.recuos)::int                        as recuos,
       round(avg(s.agitacao_graus_por_s), 1)     as agitacao_graus_por_s,
       round(avg(s.olhando_pct), 0)              as olhando_pct,
       max(s.desconforto)                        as desconforto_maximo,
       bool_or(s.tocou)                          as tocou,
       sum(s.duracao_s)::int                     as tempo_total_s
  from analise.sessoes s
 group by s.participante, s.animal
 order by s.participante, s.animal;

-- ---------------------------------------------------------
-- 4. QUESTIONÁRIO FINAL — uma coluna por pergunta
--
-- ATENÇÃO à coluna "desconforto_invertido": nela, nota alta
-- é coisa RUIM. Ela não entra na média junto com as outras.
-- ---------------------------------------------------------
create view analise.questionario_final
with (security_invoker = true) as
select p.codigo                                     as participante,
       f.respostas->>'animal'                       as animal,
       (f.respostas->>'nivel_alcancado')::int       as nivel_alcancado,
       f.respostas->>'motivo_saida'                 as motivo_saida,
       (f.respostas->'escala'->>'presenca')::int    as presenca,
       (f.respostas->'escala'->>'realismo')::int    as realismo,
       (f.respostas->'escala'->>'facilidade')::int  as facilidade,
       (f.respostas->'escala'->>'deslocar')::int    as deslocar,
       (f.respostas->'escala'->>'instrucoes')::int  as instrucoes,
       (f.respostas->'escala'->>'controle')::int    as controle,
       (f.respostas->'escala'->>'desconforto')::int as desconforto_invertido,
       f.respostas->'texto'->>'interromperia'       as interromperia,
       f.respostas->'texto'->>'mudaria'             as mudaria,
       f.criado_em                                  as respondido_em
  from public.respostas_finais f
  join public.participantes p on p.id = f.participante_id
 order by p.codigo, f.criado_em;

-- ---------------------------------------------------------
-- 5. RASTREIO — o questionário de rastreio, uma linha por pessoa
--
-- Junta as duas partes: a nota (0 a 5) que a pessoa deu ao
-- animal-alvo e as somas do impacto (0 a 4 por frase).
-- As dez frases aparecem uma por coluna no fim, para
-- conferir qualquer soma.
--
-- Não é escore clínico nem diagnóstico: descreve a amostra.
-- ---------------------------------------------------------
create view analise.rastreio
with (security_invoker = true) as
select p.codigo                                       as participante,
       r.animal_alvo,
       m.medo                                         as medo_do_alvo_0a5,
       r.alvo_por_empate,
       r.trauma,
       r.trauma_qual,
       r.atencao                                      as atencao_0a12,
       r.autorregulacao                               as autorregulacao_0a12,
       r.esquiva                                      as esquiva_0a16,
       r.total                                        as total_0a40,
       (r.respostas->>'atencao_1')::int               as atencao_1,
       (r.respostas->>'atencao_2')::int               as atencao_2,
       (r.respostas->>'atencao_3')::int               as atencao_3,
       (r.respostas->>'autorregulacao_1')::int        as autorregulacao_1,
       (r.respostas->>'autorregulacao_2')::int        as autorregulacao_2,
       (r.respostas->>'autorregulacao_3')::int        as autorregulacao_3,
       (r.respostas->>'esquiva_1')::int               as esquiva_1,
       (r.respostas->>'esquiva_2')::int               as esquiva_2,
       (r.respostas->>'esquiva_3')::int               as esquiva_3,
       (r.respostas->>'esquiva_4')::int               as esquiva_4,
       r.criado_em                                    as respondido_em
  from public.rastreio r
  join public.participantes p on p.id = r.participante_id
  left join public.respostas_perfil m on m.participante_id = r.participante_id
                                     and m.animal = r.animal_alvo
 order by p.codigo, r.criado_em;

-- ---------------------------------------------------------
-- 6. CONFERÊNCIA — chegou tudo de cada pessoa?
--
-- Para abrir no dia da coleta, entre um participante e
-- outro. Uma linha por pessoa, com a contagem do que chegou
-- e uma coluna "situacao" que diz em palavras o que falta.
--
-- Um participante completo tem: 5 medos declarados, o
-- rastreio (parte 2), pelo menos uma sessão, as métricas de
-- todas as sessões e o questionário final.
-- ---------------------------------------------------------
create view analise.conferencia
with (security_invoker = true) as
with contagem as (
  select p.id,
         p.codigo,
         p.criado_em,
         (select count(*) from public.respostas_perfil r
           where r.participante_id = p.id)::int          as medos_declarados,
         exists (select 1 from public.rastreio x
                  where x.participante_id = p.id)        as respondeu_rastreio,
         (select count(*) from public.sessoes s
           where s.participante_id = p.id)::int          as sessoes,
         (select count(*) from public.sessoes s
           where s.participante_id = p.id
             and not exists (select 1 from public.metricas m
                              where m.sessao_id = s.id))::int as sessoes_sem_metricas,
         (select count(*) from public.eventos e
            join public.sessoes s on s.id = e.sessao_id
           where s.participante_id = p.id)::int          as eventos,
         exists (select 1 from public.respostas_finais f
                  where f.participante_id = p.id)        as respondeu_questionario
    from public.participantes p
)
select c.codigo as participante,
       c.criado_em as cadastrado_em,
       c.medos_declarados,
       c.respondeu_rastreio,
       c.sessoes,
       c.sessoes_sem_metricas,
       c.eventos,
       c.respondeu_questionario,
       case
         when c.medos_declarados < 5      then 'faltam medos declarados'
         when not c.respondeu_rastreio    then 'falta o rastreio (parte 2)'
         when c.sessoes = 0               then 'ainda não entrou na experiência'
         when c.sessoes_sem_metricas > 0  then 'faltam métricas de ' || c.sessoes_sem_metricas || ' sessão(ões)'
         when not c.respondeu_questionario then 'falta o questionário final'
         else 'completo'
       end as situacao
  from contagem c
 order by c.codigo;

-- ---------------------------------------------------------
-- TRANCA
--
-- O esquema novo já nasce fechado para o site. As linhas
-- abaixo dizem isso por escrito, para não depender de um
-- padrão do Supabase que pode mudar.
-- ---------------------------------------------------------
revoke all on schema analise from anon, authenticated;
revoke all on all tables in schema analise from anon, authenticated;
