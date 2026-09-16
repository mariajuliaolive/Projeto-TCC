/* =========================================================
   SELEÇÃO — monta as opções e leva para a experiência.
   Depende de dados.js (ANIMAIS, NIVEIS), carregado antes.
   ========================================================= */

const listaAnimais = document.querySelector('#listaAnimais');
const listaNiveis  = document.querySelector('#listaNiveis');
const formulario   = document.querySelector('#formularioSelecao');
const resumo       = document.querySelector('#resumo');
const botaoEntrar  = document.querySelector('#botaoEntrar');

/* Guarda o que já foi escolhido. Começa sem nada. */
let animalEscolhido = null;
let nivelEscolhido = null;

/* ---------------------------------------------------------
   1. MONTAR AS OPÇÕES DE ANIMAL
   --------------------------------------------------------- */
ANIMAIS.forEach(function (animal) {
  const opcao = document.createElement('label');
  opcao.className = 'opcao opcao--animal';

  opcao.innerHTML = `
    <input class="opcao__input" type="radio" name="animal" value="${animal.id}" />
    <span class="opcao__conteudo">
      <span class="opcao__marca" aria-hidden="true">${animal.icone}</span>
      <span class="opcao__nome">${animal.nome}</span>
      <span class="opcao__detalhe">Ambiente: ${animal.ambiente}</span>
    </span>
  `;

  listaAnimais.appendChild(opcao);
});

/* ---------------------------------------------------------
   2. MONTAR AS OPÇÕES DE NÍVEL
   --------------------------------------------------------- */
NIVEIS.forEach(function (nivel) {
  const opcao = document.createElement('label');
  opcao.className = 'opcao opcao--nivel';

  opcao.innerHTML = `
    <input class="opcao__input" type="radio" name="nivel" value="${nivel.numero}" />
    <span class="opcao__conteudo">
      <span class="opcao__numero" aria-hidden="true">${nivel.numero}</span>
      <span class="opcao__nome">Nível ${nivel.numero} &middot; ${nivel.nome}</span>
      <span class="opcao__detalhe">${nivel.descricao}</span>
    </span>
  `;

  listaNiveis.appendChild(opcao);
});

/* ---------------------------------------------------------
   3. REAGIR A QUALQUER ESCOLHA
   Um ouvinte só, no formulário inteiro (delegação de eventos).
   --------------------------------------------------------- */
formulario.addEventListener('change', function (evento) {
  const campo = evento.target;

  if (campo.name === 'animal') {
    animalEscolhido = campo.value;
  } else if (campo.name === 'nivel') {
    nivelEscolhido = campo.value;
  }

  atualizarResumo();
});

/* ---------------------------------------------------------
   4. ATUALIZAR O RESUMO E O BOTÃO
   --------------------------------------------------------- */
function atualizarResumo() {
  const animal = buscarAnimal(animalEscolhido);
  const nivel = buscarNivel(nivelEscolhido);

  // Falta escolher alguma coisa: botão continua desativado
  if (!animal || !nivel) {
    const faltando = !animal ? 'um estímulo' : 'um nível';
    resumo.textContent = `Escolha ${faltando} para continuar.`;

    botaoEntrar.classList.add('botao--desativado');
    botaoEntrar.setAttribute('aria-disabled', 'true');
    botaoEntrar.removeAttribute('href');   // sem href, o clique não faz nada
    return;
  }

  // Tudo escolhido: monta o endereço e libera o botão
  resumo.innerHTML =
    `Selecionado: <strong>${animal.nome}</strong> &middot; ` +
    `<strong>Nível ${nivel.numero}</strong> (${nivel.nome})`;

  botaoEntrar.classList.remove('botao--desativado');
  botaoEntrar.setAttribute('aria-disabled', 'false');
  botaoEntrar.href = `experiencia.html?animal=${animal.id}&nivel=${nivel.numero}`;
}
