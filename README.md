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
index.html         pagina inicial (site institucional)
style.css          estilos da pagina inicial
script.js          menu do celular e animacao de entrada

experiencia.html   cena 3D em A-Frame
experiencia.css    estilos da cena
experiencia.js     script da cena

assets/
  models/          modelos 3D dos animais (.glb)
  textures/        imagens e texturas
  sounds/          audios
```

Cada pagina tem seu proprio trio de arquivos `nome.html` / `nome.css` /
`nome.js`. A pagina inicial usa `style.css` e `script.js` por convencao.
