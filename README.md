# Dijkstra-simulator-js

Uma ferramenta web para visualização do algoritmo de caminho mínimo de Dijkstra, desenvolvida para a disciplina de Teoria dos Grafos no curso de Ciência da Computação da UFERSA.

## Funcionalidades

- Visualização interativa de grafos
- Execução passo a passo do algoritmo
- Comparação visual entre grafos originais e processados
- Importação/exportação de definições de grafos
- Acompanhamento detalhado das iterações com informações de distância e predecessores

## Como Usar

1. Abra o arquivo `index.html` em um navegador moderno
2. Adicione grafos usando um destes métodos:
   - Entrada manual no formato "origem destino peso"
   - Importação de arquivo texto
3. Selecione um grafo e nó inicial para executar o algoritmo
4. Visualize os resultados com caminhos coloridos:
   - Arestas vermelhas: caminho mais curto
   - Arestas cinzas: caminhos não ótimos
   - Rótulos dos nós: distância mínima do início

## Estrutura de Arquivos

- `js/`
  - `DijkstraAlgorithm.js` - Implementação principal do algoritmo
  - `UI.js` - Gerenciamento da interface do usuário
  - `structures/`
    - `GraphManager.js` - Manipulação de dados do grafo
    - `PriorityQueue.js` - Fila de prioridade para o algoritmo de Dijkstra
- `index.html` - Interface principal da aplicação

## Dependências

- Viz.js para renderização de grafos
- Tailwind CSS para estilização
- DaisyUI para componentes de interface

## Desenvolvimento

Este projeto foi desenvolvido como parte da disciplina de Teoria dos Grafos na UFERSA, demonstrando aplicações práticas de algoritmos em grafos através de visualização interativa.
