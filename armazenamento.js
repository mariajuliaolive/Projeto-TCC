/* =========================================================
   ARMAZENAMENTO — onde os dados da pesquisa ficam
   ---------------------------------------------------------
   Esta é a camada que o orientador chamou de "persistência
   segura". Ela guarda o cadastro dos participantes, as
   respostas dos questionários e as métricas da experiência.

   A ESTRATÉGIA: PRIMEIRO LOCAL, DEPOIS O SERVIDOR

   Tudo é gravado no navegador ANTES de qualquer tentativa de
   envio. Só depois o sistema tenta mandar para o banco.

   Isso não é cautela exagerada. No dia da coleta você vai
   estar num laboratório, com participantes esperando. Se a
   rede oscilar no meio de uma sessão e o sistema estivesse
   mandando tudo direto para o servidor, o dado daquela
   pessoa simplesmente sumiria — e dado de pesquisa perdido
   não se refaz, porque a pessoa já foi embora.

   Gravando local primeiro, três coisas ficam garantidas:

   1. a experiência NUNCA trava por causa de rede;
   2. o dado existe mesmo que o envio falhe;
   3. dá para exportar tudo do próprio navegador, como
      arquivo, e seguir a análise sem servidor nenhum.

   O banco, então, deixa de ser o lugar onde o dado nasce e
   passa a ser para onde ele é copiado. É a ordem certa para
   coleta de campo.

   COMO FALAMOS COM O SUPABASE

   Sem biblioteca. O Supabase expõe as tabelas por uma API
   REST comum, e o navegador já sabe fazer requisição HTTP
   com fetch. Uma dependência a menos para instalar, para
   atualizar e para explicar na banca.
   ========================================================= */

const Armazenamento = (function () {

  /* As chaves do navegador levam prefixo do projeto para não
     esbarrar em nada que outra página tenha guardado. */
  const CHAVE_PARTICIPANTE = 'vr-exposicao:participante';
  const CHAVE_FILA = 'vr-exposicao:fila';

  /* ---------------------------------------------------------
     LER E ESCREVER NO NAVEGADOR

     localStorage pode falhar: navegação anônima, cota cheia,
     permissão negada. Em nenhum desses casos a experiência
     pode quebrar — por isso tudo passa por try/catch e, no
     pior caso, o sistema segue em memória.
     --------------------------------------------------------- */
  let emMemoria = {};

  function ler(chave) {
    try {
      const texto = localStorage.getItem(chave);
      return texto ? JSON.parse(texto) : null;
    } catch (erro) {
      return emMemoria[chave] || null;
    }
  }

  function escrever(chave, valor) {
    emMemoria[chave] = valor;
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      /* Sem espaço ou sem permissão. O valor continua em
         memória e vale enquanto a aba estiver aberta. */
      console.warn('Armazenamento: não foi possível gravar no navegador.', erro);
      return false;
    }
  }

  /* ---------------------------------------------------------
     IDENTIFICADORES

     Cada participante e cada sessão recebem um identificador
     único, gerado no próprio navegador. Usamos UUID porque
     ele pode ser criado sem consultar o servidor — o que é
     justamente o que permite ao sistema funcionar offline e
     sincronizar depois sem risco de dois participantes
     receberem o mesmo número.
     --------------------------------------------------------- */
  function novoId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    /* Navegador antigo: montamos o UUID à mão. */
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /* ---------------------------------------------------------
     A FILA

     Toda gravação entra numa fila local. Cada item sabe para
     qual tabela vai e se já foi enviado.

     É a fila que torna o envio seguro de repetir: sincronizar
     duas vezes não duplica nada, porque o que já foi some da
     fila.
     --------------------------------------------------------- */
  function fila() {
    return ler(CHAVE_FILA) || [];
  }

  function enfileirar(tabela, linha) {
    const itens = fila();
    itens.push({ tabela: tabela, linha: linha, enviado: false });
    escrever(CHAVE_FILA, itens);
    return linha;
  }

  /* ---------------------------------------------------------
     O PARTICIPANTE

     Fica em localStorage, e não em sessionStorage, de
     propósito: a experiência troca de página a cada nível, e
     o participante precisa sobreviver a isso. Se fosse por
     aba, fechar a aba sem querer no meio da sessão exigiria
     refazer o cadastro.
     --------------------------------------------------------- */
  function participante() {
    return ler(CHAVE_PARTICIPANTE);
  }

  function registrar(dados) {
    const registro = {
      id: novoId(),
      email: dados.email || null,
      sexo: dados.sexo || null,
      nascimento: dados.nascimento || null,
      curso: dados.curso || null,
      usou_vr: dados.usouVR || null,
      consentimento_em: new Date().toISOString(),
      criado_em: new Date().toISOString()
    };

    escrever(CHAVE_PARTICIPANTE, registro);
    enfileirar('participantes', registro);

    return registro;
  }

  function encerrarParticipacao() {
    try {
      localStorage.removeItem(CHAVE_PARTICIPANTE);
    } catch (erro) {
      /* segue sem remover */
    }
    delete emMemoria[CHAVE_PARTICIPANTE];
  }

  /* ---------------------------------------------------------
     RESPOSTAS DOS QUESTIONÁRIOS
     --------------------------------------------------------- */
  function gravarMedoDeclarado(respostas) {
    const quem = participante();
    if (!quem) {
      return null;
    }

    /* Uma linha por animal, e não uma linha com cinco colunas.
       Assim, acrescentar um sexto animal ao estudo não exige
       mexer na estrutura da tabela. */
    Object.keys(respostas).forEach(function (animal) {
      enfileirar('respostas_perfil', {
        id: novoId(),
        participante_id: quem.id,
        animal: animal,
        medo: respostas[animal],
        criado_em: new Date().toISOString()
      });
    });

    return respostas;
  }

  function gravarQuestionarioFinal(respostas) {
    const quem = participante();
    if (!quem) {
      return null;
    }

    return enfileirar('respostas_finais', {
      id: novoId(),
      participante_id: quem.id,
      respostas: respostas,
      criado_em: new Date().toISOString()
    });
  }

  /* ---------------------------------------------------------
     SESSÕES E MÉTRICAS

     Uma sessão é uma passagem por um nível, com um animal.
     Quem percorre os cinco níveis gera cinco sessões.
     --------------------------------------------------------- */
  function abrirSessao(animal, nivel, dispositivo) {
    const quem = participante();

    const sessao = {
      id: novoId(),
      participante_id: quem ? quem.id : null,
      animal: animal,
      nivel: nivel,
      dispositivo: dispositivo || '',
      navegador: navigator.userAgent.slice(0, 200),
      inicio: new Date().toISOString(),
      fim: null,
      concluida: false
    };

    enfileirar('sessoes', sessao);
    return sessao;
  }

  function fecharSessao(sessao, metricas, concluida) {
    enfileirar('metricas', Object.assign({
      id: novoId(),
      sessao_id: sessao.id,
      participante_id: sessao.participante_id,
      animal: sessao.animal,
      nivel: sessao.nivel,
      fim: new Date().toISOString(),
      concluida: Boolean(concluida)
    }, metricas));
  }

  function gravarEvento(sessao, tipo, dado, instante) {
    if (!sessao) {
      return;
    }

    enfileirar('eventos', {
      id: novoId(),
      sessao_id: sessao.id,
      tipo: tipo,
      dado: dado || {},
      instante: Math.round(instante || 0)
    });
  }

  /* ---------------------------------------------------------
     ENVIO PARA O SUPABASE

     O Supabase publica cada tabela num endereço REST. Mandar
     uma linha é um POST com duas chaves no cabeçalho: a
     chave pública do projeto e a autorização.

     A chave usada aqui é a ANÔNIMA, que é pública por
     natureza — ela vai no código que o navegador baixa, e
     não há como escondê-la numa aplicação estática. Quem
     protege os dados não é ela, e sim a política de acesso
     declarada no banco: permitir INSERIR e proibir LER.
     Qualquer pessoa pode enviar uma resposta; ninguém pode
     recuperar as respostas de outra. Está no esquema.sql.
     --------------------------------------------------------- */
  function configurado() {
    return typeof SUPABASE !== 'undefined'
        && Boolean(SUPABASE.url)
        && Boolean(SUPABASE.chave);
  }

  /* O painel do Supabase mostra o endereço sem barra no fim,
     mas é fácil copiar uma junto. Duas barras seguidas no meio
     do caminho dão 404, e o erro não diz o motivo. */
  function endereco(tabela) {
    return SUPABASE.url.replace(/\/+$/, '') + '/rest/v1/' + tabela;
  }

  /* ---------------------------------------------------------
     OS CABEÇALHOS

     O Supabase mudou o formato das chaves, e os dois formatos
     convivem. Isso muda o que pode ser enviado:

       antigo  a chave é um JWT e começa com "eyJ". Vai no
               cabeçalho apikey E também em Authorization.

       novo    a chave começa com "sb_publishable_" e NÃO é um
               JWT. Vai só no apikey. Mandar em Authorization
               faz o servidor tentar lê-la como JWT e devolver
               erro.

     Como o apikey serve aos dois, ele vai sempre; o
     Authorization só entra quando a chave tem cara de JWT.
     Assim o sistema funciona com a chave que você tiver hoje
     e continua funcionando se você trocar depois. */
  function cabecalhos() {
    const cabecalho = {
      'apikey': SUPABASE.chave,
      'Content-Type': 'application/json',
      /* pede ao servidor que não devolva a linha criada: não
         precisamos dela, e pedir de volta exigiria permissão de
         leitura, que de propósito não damos */
      'Prefer': 'return=minimal'
    };

    if (SUPABASE.chave.startsWith('eyJ')) {
      cabecalho['Authorization'] = 'Bearer ' + SUPABASE.chave;
    }

    return cabecalho;
  }

  async function enviarLinha(tabela, linha) {
    const resposta = await fetch(endereco(tabela), {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify(linha)
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`${tabela}: ${resposta.status} ${detalhe.slice(0, 200)}`);
    }
  }

  /* Devolve quantas linhas foram enviadas e quantas ficaram.
     Nunca lança erro: falha de envio é situação prevista, não
     é exceção. */
  async function sincronizar() {
    if (!configurado()) {
      return { enviadas: 0, pendentes: pendentes(), motivo: 'sem configuração' };
    }

    const itens = fila();
    let enviadas = 0;

    /* As tabelas têm dependência entre si: uma sessão aponta
       para um participante. Enviar na ordem em que foram
       criadas respeita isso naturalmente, porque o cadastro
       sempre acontece antes da experiência. */
    for (const item of itens) {
      if (item.enviado) {
        continue;
      }

      try {
        await enviarLinha(item.tabela, item.linha);
        item.enviado = true;
        enviadas = enviadas + 1;
      } catch (erro) {
        console.warn('Armazenamento: envio falhou, fica na fila.', erro.message);
        break;   // rede caiu: não adianta insistir nas seguintes
      }
    }

    /* o que foi enviado sai da fila; o resto continua */
    escrever(CHAVE_FILA, itens.filter(function (i) { return !i.enviado; }));

    return { enviadas: enviadas, pendentes: pendentes() };
  }

  function pendentes() {
    return fila().filter(function (i) { return !i.enviado; }).length;
  }

  /* ---------------------------------------------------------
     TESTE DE LIGAÇÃO

     Grava uma linha de teste e diz o que aconteceu, em
     português. Serve para conferir a configuração ANTES do dia
     da coleta, em vez de descobrir na hora que algo está
     errado.

     Rode no console do navegador:   Armazenamento.testar()
     --------------------------------------------------------- */
  async function testar() {
    if (!configurado()) {
      console.log('Falta preencher url e chave em configuracao.js.');
      return false;
    }

    const linha = {
      id: novoId(),
      email: 'teste-de-ligacao@exemplo.invalido',
      sexo: 'nao_informado',
      consentimento_em: new Date().toISOString()
    };

    try {
      await enviarLinha('participantes', linha);
      console.log(
        'Ligação com o banco funcionando.\n' +
        'Foi criado um participante de teste com o e-mail\n' +
        '  teste-de-ligacao@exemplo.invalido\n' +
        'Apague essa linha pelo painel do Supabase antes da coleta.');
      return true;
    } catch (erro) {
      const texto = erro.message;
      console.log('A ligação falhou:', texto);

      if (texto.includes('401') || texto.includes('JWS')) {
        console.log('Parece a chave: confira se copiou a publishable, ' +
                    'inteira, e não a secret.');
      } else if (texto.includes('404')) {
        console.log('Parece o endereço ou a tabela: confira a url e se ' +
                    'o esquema.sql já foi executado no SQL Editor.');
      } else if (texto.includes('42501') || texto.includes('policy')) {
        console.log('Parece a política de acesso: rode o esquema.sql ' +
                    'inteiro, inclusive a parte das políticas.');
      }

      return false;
    }
  }

  /* ---------------------------------------------------------
     EXPORTAÇÃO

     A saída de emergência, e também o caminho normal se você
     decidir não usar banco nenhum: baixa tudo o que está no
     navegador como um arquivo.

     Vale guardar este arquivo ao fim de cada sessão de
     testes, mesmo com o banco funcionando. Custa um clique e
     é a sua cópia de segurança.
     --------------------------------------------------------- */
  function tudo() {
    return {
      exportado_em: new Date().toISOString(),
      participante: participante(),
      fila: fila()
    };
  }

  function baixar() {
    const quem = participante();
    const nome = 'coleta-' + (quem ? quem.id.slice(0, 8) : 'sem-cadastro')
               + '-' + new Date().toISOString().slice(0, 10) + '.json';

    const arquivo = new Blob([JSON.stringify(tudo(), null, 2)],
                             { type: 'application/json' });
    const endereco = URL.createObjectURL(arquivo);

    const link = document.createElement('a');
    link.href = endereco;
    link.download = nome;
    link.click();

    URL.revokeObjectURL(endereco);
    return nome;
  }

  /* ---------------------------------------------------------
     O que fica visível para o resto do sistema.
     --------------------------------------------------------- */
  return {
    participante: participante,
    registrar: registrar,
    encerrarParticipacao: encerrarParticipacao,

    gravarMedoDeclarado: gravarMedoDeclarado,
    gravarQuestionarioFinal: gravarQuestionarioFinal,

    abrirSessao: abrirSessao,
    fecharSessao: fecharSessao,
    gravarEvento: gravarEvento,

    sincronizar: sincronizar,
    pendentes: pendentes,
    configurado: configurado,
    testar: testar,

    tudo: tudo,
    baixar: baixar
  };

})();
