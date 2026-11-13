/* =========================================================
   CONFIGURAÇÃO DO BANCO DE DADOS
   ---------------------------------------------------------
   Preencha os dois campos abaixo com os dados do SEU projeto
   no Supabase. Enquanto estiverem vazios, o sistema funciona
   normalmente e guarda tudo no navegador — nada quebra, só
   não sincroniza.

   ONDE ENCONTRAR ESSES VALORES

   1. Crie uma conta em https://supabase.com (o plano
      gratuito basta para este trabalho)
   2. Crie um projeto novo
   3. No painel do projeto, abra  Settings → API
   4. Copie "Project URL" para  url
   5. Copie a chave "anon public" para  chave

   DEPOIS, CRIE AS TABELAS

   No painel do Supabase, abra o SQL Editor, cole o conteúdo
   de  supabase/esquema.sql  e execute. Ele cria as tabelas e
   as regras de acesso.

   SOBRE A CHAVE SER PÚBLICA

   A chave "anon" é pública por natureza: ela vai dentro do
   código que o navegador baixa, e não existe forma de
   escondê-la numa aplicação estática. Isso não é descuido do
   Supabase nem deste projeto — é como a arquitetura funciona.

   Quem protege os dados é a política declarada no banco:
   permitir INSERIR e proibir LER. Qualquer pessoa com a
   chave pode enviar uma resposta; ninguém consegue recuperar
   as respostas já gravadas. Quem lê é você, pelo painel do
   Supabase, com a sua senha.

   A chave que NÃO pode aparecer aqui é a "service_role", que
   ignora todas as políticas. Ela fica só no painel.
   ========================================================= */

const SUPABASE = {
  url: '',
  chave: ''
};
