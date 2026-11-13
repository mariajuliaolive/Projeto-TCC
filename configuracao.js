/* =========================================================
   CONFIGURAÇÃO DO BANCO DE DADOS
   ---------------------------------------------------------
   Enquanto a "url" estiver vazia, o sistema funciona
   normalmente e guarda tudo no navegador — nada quebra, só
   não sincroniza.

   FALTA PREENCHER A URL

   No painel do Supabase:  Settings → API → Project URL
   É um endereço como  https://abcdefgh.supabase.co

   DEPOIS, CRIE AS TABELAS

   SQL Editor → cole o conteúdo de supabase/esquema.sql →
   Run. Ele cria as tabelas e, principalmente, as regras de
   acesso.

   E CONFIRA, ANTES DO DIA DA COLETA

   Abra qualquer página do site, aperte F12, vá em "Console"
   e digite:

       Armazenamento.testar()

   Ele grava uma linha de teste e diz, em português, se deu
   certo — e, se não deu, qual das três coisas está errada.
   ========================================================= */

const SUPABASE = {

  /* Settings → API → Project URL */
  url: '',

  /* A chave PUBLISHABLE (sb_publishable_…).
     Nunca a secret (sb_secret_…): ela ignora todas as regras
     de acesso e daria a qualquer pessoa poder de ler, alterar
     e apagar os dados dos participantes. A secret fica só no
     painel do Supabase, e não entra em arquivo nenhum deste
     projeto. */
  chave: 'sb_publishable_cPWKvauKiMqSN972Kl4FBQ_HTnpHitl'
};

/* ---------------------------------------------------------
   POR QUE ESTA CHAVE PODE FICAR NUM REPOSITÓRIO PÚBLICO

   O site é estático: o navegador precisa receber a chave para
   conseguir falar com o banco. Não existe onde escondê-la —
   quem abrir as ferramentas do navegador vai vê-la de
   qualquer jeito. O Supabase sabe disso, e é por isso que
   chama esta chave de "publishable".

   Quem protege os dados é a política declarada no banco:
   PODE INSERIR, NÃO PODE LER. Qualquer pessoa com a chave
   consegue enviar uma resposta — o que é inevitável num
   formulário público de pesquisa. Ninguém consegue recuperar
   as respostas de outra pessoa, listar participantes, alterar
   ou apagar o que já foi gravado.

   Isso vale APENAS depois que o esquema.sql tiver sido
   executado, porque é ele que liga a proteção. Enquanto não
   for, não há política nenhuma — e aí a chave não é segura.

   Ou seja: rode o SQL primeiro, publique depois.
   --------------------------------------------------------- */
