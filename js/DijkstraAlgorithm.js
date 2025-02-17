import { PriorityQueue } from './structures/PriorityQueue.js';
import { GraphManager } from './structures/GraphManager.js';
import { UI } from './UI.js';

/**
 * Classe que implementa o algoritmo de Dijkstra para encontrar caminhos mínimos em grafos
 * @class
 */
export class DijkstraAlgorithm {
    /**
     * Executa o algoritmo de Dijkstra com base nos dados da interface
     * @static
     * @returns {void}
     * @throws {Error} Se elementos do formulário não forem encontrados
     * @throws {Error} Se o ID do grafo for inválido
     * @throws {Error} Se o grafo não for encontrado
     * @throws {Error} Se o nó inicial não existir no grafo
     */
    static runTest() {
        try {
            const graphIdElem = document.getElementById('graphId');
            const startNodeElem = document.getElementById('startNode');

            if (!graphIdElem || !startNodeElem) {
                throw new Error('Elementos do formulário necessários não encontrados');
            }

            const graphId = parseInt(graphIdElem.value);
            const startNode = startNodeElem.value.trim();

            if (isNaN(graphId)) {
                throw new Error('ID do grafo inválido');
            }

            const graph = GraphManager.getGraph(graphId);
            if (!graph) {
                throw new Error(`Grafo com ID ${graphId} não encontrado`);
            }

            if (!graph.original.nodes[startNode]) {
                throw new Error(`Nó inicial "${startNode}" não encontrado no grafo`);
            }

            // Executa o algoritmo de Dijkstra
            const { distances, predecessors, iterations } = this.runDijkstra(
                graph.original.nodes,
                startNode
            );

            GraphManager.updateDoneState(graphId, {
                distances,
                predecessors,
                iterations,
                dot: this.generateDoneDot(graph.original.edges, distances, predecessors)
            });

            UI.showToast('Algoritmo executado com sucesso!', 'success');

        } catch (error) {
            UI.showToast(`Erro: ${error.message}`, 'error');
            console.error('Falha na execução do algoritmo:', error);
        }
    }

    /**
     * Implementação principal do algoritmo de Dijkstra
     * @static
     * @param {Object} adjacencyList - Lista de adjacência representando o grafo
     * @param {string} startNode - Identificador do nó inicial
     * @returns {Object} Resultados da execução contendo:
     *  - distances: Distâncias mínimas calculadas
     *  - predecessors: Predecessores no caminho mínimo
     *  - iterations: Lista de estados do algoritmo por iteração
     */
    static runDijkstra(adjacencyList, startNode) {
        const distances = {};
        const predecessors = {};
        const iterations = [];
        const queue = new PriorityQueue();

        // Initialize data structures
        Object.keys(adjacencyList).forEach(node => {
            distances[node] = Infinity;
            predecessors[node] = null;
        });
        distances[startNode] = 0;

        // Record initial state
        iterations.push(this.createIterationSnapshot(0, 'Start', distances, predecessors));

        queue.enqueue(startNode, 0);

        let step = 1;

        while (!queue.isEmpty()) {
            const { element: current, priority: currentDist } = queue.dequeue();

            // Skip if better path already found
            if (currentDist > distances[current]) continue;

            // Process neighbors
            adjacencyList[current].forEach(neighbor => {
                const alt = distances[current] + neighbor.weight;

                if (alt < distances[neighbor.target]) {
                    distances[neighbor.target] = alt;
                    predecessors[neighbor.target] = current;
                    queue.enqueue(neighbor.target, alt);
                }
            });

            // Record pre-processing state
            iterations.push(this.createIterationSnapshot(step++, current, distances, predecessors));
        }

        return {
            distances,
            predecessors,
            iterations
        };
    }

    /**
     * Cria um snapshot do estado atual do algoritmo
     * @static
     * @param {number} step - Número da iteração
     * @param {string} current - Nó atual sendo processado
     * @param {Object} distances - Distâncias atuais calculadas
     * @param {Object} predecessors - Mapa atual de predecessores
     * @returns {Object} Snapshot da iteração
     */
    static createIterationSnapshot(step, current, distances, predecessors) {
        return {
            step: step,
            current: current,
            distances: structuredClone(distances),
            predecessors: structuredClone(predecessors)
        };
    }

    /**
     * Gera a representação DOT do grafo após execução do algoritmo
     * @static
     * @param {Array} edges - Arestas do grafo original
     * @param {Object} distances - Distâncias finais calculadas
     * @param {Object} predecessors - Mapa final de predecessores
     * @returns {string} String DOT para visualização
     */
    static generateDoneDot(edges, distances, predecessors) {
        // Determine graph type based on edge types - if any edge is directed or bidirectional, use digraph
        const edgeTypes = new Set(edges.filter(e => !e.isReverse).map(e => e.type));
        const isDirected = edgeTypes.has('directed') || edgeTypes.has('bidirectional');
        const graphType = isDirected ? 'digraph' : 'graph';
        
        const nodeDefinitions = Object.keys(distances).map(node =>
            `  ${node} [xlabel="Dist: ${distances[node] === Infinity ? '∞' : distances[node]}"];`
        );

        const processedEdges = new Set();
        const edgeDefinitions = edges
            .filter(edge => {
                const edgeKey = `${edge.source}-${edge.target}`;
                const reverseKey = `${edge.target}-${edge.source}`;
                if (processedEdges.has(edgeKey) || processedEdges.has(reverseKey)) {
                    return false;
                }
                processedEdges.add(edgeKey);
                return true;
            })
            .map(edge => {
                // Check both directions for optimal path
                const isForwardOptimal = predecessors[edge.target] === edge.source &&
                    distances[edge.target] === distances[edge.source] + edge.weight;
                const isReverseOptimal = (edge.type === 'undirected' || edge.type === 'bidirectional') &&
                    predecessors[edge.source] === edge.target &&
                    distances[edge.source] === distances[edge.target] + edge.weight;

                const isOptimal = isForwardOptimal || isReverseOptimal;
                const edgeOp = isDirected ? '->' : '--';
                let attrs = [
                    `label="${edge.weight}"`,
                    isOptimal ? 'color="red" penwidth=2' : 'color="gray70"'
                ];

                if (edge.type === 'bidirectional' && isDirected) {
                    attrs.push('dir=both');
                }

                return `  ${edge.source} ${edgeOp} ${edge.target} [${attrs.join(', ')}];`;
            });

        return `${graphType} G {
            node [style=filled, fillcolor=white, fontname="Helvetica"]
            edge [fontsize=12]
            ${nodeDefinitions.join('\n')}
            ${edgeDefinitions.join('\n')}
        }`;
    }
}
