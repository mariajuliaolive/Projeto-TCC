# Protótipo VR - Exposição Gradual (TCC)

Protótipo acadêmico de Realidade Virtual para navegador, desenvolvido como
Trabalho de Conclusão de Curso em Ciência da Computação.

O sistema simula cenários com cinco animais (cobra, rato, barata, aranha e sapo)
em cinco níveis progressivos de aproximação, com o objetivo de estudar
usabilidade, imersão, interação e percepção do usuário.

**Aviso:** este é um protótipo acadêmico. Não constitui tratamento médico ou
psicológico e não realiza diagnóstico.

## Tecnologias

HTML, CSS, JavaScript, A-Frame, Three.js e WebXR.

## Como executar

É necessário um servidor local (arquivos 3D não carregam abrindo o HTML
diretamente pelo sistema de arquivos).

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## Estrutura atual

```
index.html         pagina inicial
selecao.html       escolha do estimulo e do nivel
experiencia.html   cena 3D em A-Frame

base.css           estilos compartilhados por todas as paginas
base.js            menu do celular e animacao de entrada (compartilhado)
dados.js           os 5 animais e os 5 niveis (fonte unica de verdade)

inicio.css         estilos da pagina inicial
selecao.css        estilos da selecao
selecao.js         monta as opcoes e gera o link da experiencia
experiencia.css    estilos da cena
experiencia.js     le a escolha na URL e prepara a cena

assets/
  models/          modelos 3D dos animais (.glb)
  textures/        imagens e texturas
  sounds/          audios
```

Arquivos `base.*` sao compartilhados. Os demais levam o nome da pagina a
que pertencem.

## Fluxo de navegacao

```
index.html  ->  selecao.html  ->  experiencia.html?animal=<id>&nivel=<n>
```

A escolha viaja pela URL, entao cada cenario pode ser aberto direto para
teste isolado. Exemplos:

```
experiencia.html?animal=cobra&nivel=1
experiencia.html?animal=aranha&nivel=4
```

Os identificadores validos estao em `dados.js`.
