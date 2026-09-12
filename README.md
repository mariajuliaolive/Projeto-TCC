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
index.html   - estrutura da página e da cena 3D
style.css    - estilos da interface 2D
script.js    - lógica em JavaScript
```
