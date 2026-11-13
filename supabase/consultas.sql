-- =========================================================
-- CONSULTAS ÚTEIS
-- ---------------------------------------------------------
-- Cole no SQL Editor do Supabase, uma de cada vez. Elas não
-- fazem parte da aplicação: são para você conferir a coleta e
-- preparar a análise.
--
-- As que APAGAM coisa estão no fim, separadas, e cada uma tem
-- antes a versão que só MOSTRA o que seria apagado. Rode
-- sempre a de mostrar primeiro.
-- =========================================================


-- ---------------------------------------------------------
-- 1. QUEM PARTICIPOU
-- Rode entre um participante e outro, no dia da coleta, para
-- conferir se o cadastro chegou.
-- ---------------------------------------------------------
select codigo,
       email,
       sexo,
       date_part('year', age(nascimento))::int as idade,
       curso,
       to_char(criado_em, 'DD/MM HH24:MI') as cadastrado
  from participantes
 order by codigo;


-- ---------------------------------------------------------
-- 2. RESUMO POR PARTICIPANTE
-- Quantos níveis percorreu, até onde chegou, se tocou no
-- animal. É a visão geral da coleta.
-- ---------------------------------------------------------
select p.codigo,
       count(distinct s.id)              as sessoes,
       max(s.nivel)                      as nivel_maximo,
       min(m.distancia_minima)           as chegou_a_metros,
       bool_or(m.tocou)                  as tocou_no_animal,
       sum(m.encontrados)                as encontrados,
       round(sum(m.duracao)::numeric, 0) as segundos_totais
  from participantes p
  left join sessoes s  on s.participante_id = p.id
  left join metricas m on m.sessao_id = s.id
 group by p.codigo
 order by p.codigo;


-- ---------------------------------------------------------
-- 3. MEDO DECLARADO × COMPORTAMENTO
-- A análise mais interessante do trabalho: quem declarou mais
-- medo manteve mais distância?
-- ---------------------------------------------------------
select p.codigo,
       r.animal,
       r.medo                                   as medo_declarado,
       round(min(m.distancia_minima)::numeric, 2) as chegou_a_metros,
       max(m.nivel)                             as nivel_maximo,
       bool_or(m.tocou)                         as tocou
  from participantes p
  join respostas_perfil r on r.participante_id = p.id
  left join metricas m    on m.participante_id = p.id
                         and m.animal = r.animal
 group by p.codigo, r.animal, r.medo
 having count(m.id) > 0
 order by r.medo desc, p.codigo;


-- ---------------------------------------------------------
-- 4. MÉTRICAS, UMA LINHA POR SESSÃO
-- É daqui que saem as figuras da seção de resultados.
-- Exporte como CSV pelo botão do painel.
-- ---------------------------------------------------------
select p.codigo,
       m.animal,
       m.nivel,
       m.concluida,
       m.distancia_minima,
       m.distancia_media,
       m.recuos,
       m.agitacao_media,
       m.tempo_olhando,
       m.deslocamento,
       m.encontrados,
       m.tocou,
       m.desconforto,
       m.duracao
  from metricas m
  join participantes p on p.id = m.participante_id
 order by p.codigo, m.nivel;


-- ---------------------------------------------------------
-- 5. QUESTIONÁRIO FINAL, UMA COLUNA POR PERGUNTA
-- O jsonb vira colunas. Lembre que "desconforto" tem direção
-- INVERTIDA: ali nota alta é coisa ruim, e ela não entra na
-- média junto com as outras.
-- ---------------------------------------------------------
select p.codigo,
       f.respostas->>'animal'                    as animal,
       (f.respostas->>'nivel_alcancado')::int    as nivel_alcancado,
       f.respostas->>'motivo_saida'              as motivo_saida,
       (f.respostas->'escala'->>'presenca')::int    as presenca,
       (f.respostas->'escala'->>'realismo')::int    as realismo,
       (f.respostas->'escala'->>'facilidade')::int  as facilidade,
       (f.respostas->'escala'->>'deslocar')::int    as deslocar,
       (f.respostas->'escala'->>'instrucoes')::int  as instrucoes,
       (f.respostas->'escala'->>'desconforto')::int as desconforto_invertido,
       (f.respostas->'escala'->>'controle')::int    as controle,
       f.respostas->'texto'->>'interromperia'    as interromperia,
       f.respostas->'texto'->>'mudaria'          as mudaria
  from respostas_finais f
  join participantes p on p.id = f.participante_id
 order by p.codigo;


-- ---------------------------------------------------------
-- 6. O QUE ACONTECEU DURANTE UMA SESSÃO
-- Útil para entender um caso específico: a ordem dos eventos
-- conta a história daquela pessoa naquele nível.
-- ---------------------------------------------------------
select p.codigo,
       s.animal,
       s.nivel,
       e.tipo,
       e.dado,
       round(e.instante / 1000.0, 1) as segundo
  from eventos e
  join sessoes s       on s.id = e.sessao_id
  join participantes p on p.id = s.participante_id
 order by p.codigo, s.nivel, e.instante;


-- =========================================================
-- LIMPEZA — rode as de MOSTRAR antes das de APAGAR
-- =========================================================

-- ---------------------------------------------------------
-- 7. MOSTRAR o que é teste e não participante de verdade
-- Confira esta lista ANTES de apagar. Acrescente aqui os
-- e-mails que você mesma usou nos ensaios.
-- ---------------------------------------------------------
select codigo, email, to_char(criado_em, 'DD/MM HH24:MI') as quando
  from participantes
 where email like '%exemplo.invalido'
    or email like '%@x.com'
    or email like '%teste%'
 order by criado_em;


-- ---------------------------------------------------------
-- 8. APAGAR os de teste
--
-- Tire o comentário das linhas abaixo só depois de conferir a
-- consulta 7. A ordem importa: as tabelas que APONTAM para
-- participantes saem primeiro, senão a chave estrangeira
-- recusa a remoção.
--
-- Ajuste a condição para casar com a lista que você conferiu.
-- ---------------------------------------------------------
-- with lixo as (
--   select id from participantes
--    where email like '%exemplo.invalido'
--       or email like '%@x.com'
--       or email like '%teste%'
-- )
-- delete from eventos
--  where sessao_id in (select id from sessoes
--                       where participante_id in (select id from lixo));
--
-- with lixo as (
--   select id from participantes
--    where email like '%exemplo.invalido'
--       or email like '%@x.com'
--       or email like '%teste%'
-- )
-- delete from metricas where participante_id in (select id from lixo);
--
-- with lixo as (
--   select id from participantes
--    where email like '%exemplo.invalido'
--       or email like '%@x.com'
--       or email like '%teste%'
-- )
-- delete from sessoes where participante_id in (select id from lixo);
--
-- with lixo as (
--   select id from participantes
--    where email like '%exemplo.invalido'
--       or email like '%@x.com'
--       or email like '%teste%'
-- )
-- delete from respostas_perfil where participante_id in (select id from lixo);
--
-- with lixo as (
--   select id from participantes
--    where email like '%exemplo.invalido'
--       or email like '%@x.com'
--       or email like '%teste%'
-- )
-- delete from respostas_finais where participante_id in (select id from lixo);
--
-- delete from participantes
--  where email like '%exemplo.invalido'
--     or email like '%@x.com'
--     or email like '%teste%';


-- ---------------------------------------------------------
-- 9. RECOMEÇAR A CONTAGEM DOS CÓDIGOS
--
-- Depois de limpar os testes, os códigos dos participantes de
-- verdade começariam de onde os testes pararam (P07, por
-- exemplo). Isto devolve a contagem ao início.
--
-- Só rode com a tabela de participantes VAZIA, e antes da
-- coleta de verdade.
-- ---------------------------------------------------------
-- select setval('seq_codigo_participante', 1, false);
