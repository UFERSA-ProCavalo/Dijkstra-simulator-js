import { UI } from '../UI.js';  // Add this import at the top

export class GraphManager {
    static graphs = [];
    static nextId = 1;

    /**
     * Adds a new graph to the database
     * @param {string} name - Graph name
     * @param {string} edgesText - Edges in "source target weight" format
     */
    static addGraph(name, edgesText) {

        if (!name || !edgesText) {
            UI.showToast('Nome do grafo e arestas são obrigatórios', 'error');
            return;
        }

        try {
            const { edges, nodes, dot } = this.parseEdges(edgesText);

            // Validate will now show toasts instead of throwing
            if (!this.validateGraph(edges, nodes)) {
                return; // Stop if validation failed
            }

            this.graphs.push({
                id: this.nextId++,
                name,
                original: { nodes, edges, dot },
                done: null
            });

            UI.showToast('Grafo adicionado com sucesso!', 'success');
            UI.showAllGraphs();
        } catch (error) {
            UI.showToast(error.message, 'error');
        }
    }

    /**
     * Valida o grafo de acordo com as restrições
     * @method
     * @static
     * @param {Array} edges - Lista de arestas
     * @param {Object} nodes - Mapeamento de nós
     * @throws {Error} Mensagem específica da restrição violada
     * @returns {void}
     */
    static validateGraph(edges, nodes) {
        // Verifica se os pesos são números
        const nonNumericWeight = edges.find(e => !Number.isInteger(e.weight) || isNaN(e.weight));
        if (nonNumericWeight) {
            UI.showToast(`Peso inválido (${nonNumericWeight.weight}) na aresta ${nonNumericWeight.source}-${nonNumericWeight.target}. Use apenas números inteiros.`, 'error');
            return false;
        }

        // Verifica pesos positivos
        const invalidWeight = edges.find(e => e.weight <= 0);
        if (invalidWeight) {
            UI.showToast(`Peso inválido (${invalidWeight.weight}) na aresta ${invalidWeight.source}-${invalidWeight.target}`, 'error');
            return false;
        }

        // Verifica arestas duplicadas considerando direção e tipo
        const edgeSet = new Set();
        for (const e of edges.filter(edge => !edge.isReverse)) {
            let key;
            if (e.type === 'directed') {
                // For directed edges, store exact direction
                key = `directed:${e.source}->${e.target}`;
            } else if (e.type === 'bidirectional') {
                // For bidirectional edges, order doesn't matter and they're distinct from other types
                const nodes = [e.source, e.target].sort();
                key = `bidirectional:${nodes[0]}-${nodes[1]}`;
            } else {
                // For undirected edges, order doesn't matter and they're distinct from other types
                const nodes = [e.source, e.target].sort();
                key = `undirected:${nodes[0]}-${nodes[1]}`;
            }

            if (edgeSet.has(key)) {
                UI.showToast(`Aresta duplicada: ${e.source} ${e.type === 'directed' ? '->' : e.type === 'bidirectional' ? '<->' : '--'} ${e.target}`, 'error');
                return false;
            }
            edgeSet.add(key);
        }

        // Verifica grafo conectado
        if (!this.isGraphConnected(nodes)) {
            UI.showToast('O grafo não é conectado', 'error');
            return false;
        }

        return true;
    }

    /**
     * Verifica conectividade do grafo (BFS)
     * @method
     * @static
     * @param {Object} nodes - Mapeamento de nós
     * @returns {boolean} True se o grafo for conectado
     */
    static isGraphConnected(nodes) {
        const allNodes = Object.keys(nodes);
        if (allNodes.length === 0) return false;

        const visited = new Set();
        const queue = [allNodes[0]];
        visited.add(allNodes[0]);

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = nodes[current]?.map(n => n.target) || [];

            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }

        return allNodes.every(node => visited.has(node));
    }

    /**
     * Parses edge text into graph structure
     * @param {string} text - Edge data
     * @returns {Object} Graph components
     */
    static parseEdges(text) {
        const edges = [];
        const nodes = {};
        const lines = text.split('\n').filter(line => line.trim());

        const edgePatterns = {
            bidirectional: /^(\w+)\s*<->\s*(\w+)\s+(\d+)$/,    // A <-> B 5
            undirected: /^(\w+)\s*--\s*(\w+)\s+(\d+)$/,        // A -- B 5
            directed: /^(\w+)\s*->\s*(\w+)\s+(\d+)$/           // A -> B 5
        };

        lines.forEach(line => {
            line = line.trim();
            let source, target, weight, edgeType;

            // Try each pattern
            for (const [type, pattern] of Object.entries(edgePatterns)) {
                const match = line.match(pattern);
                if (match) {
                    [, source, target, weight] = match;
                    edgeType = type;
                    break;
                }
            }

            if (source && target && weight) {
                const parsedWeight = parseInt(weight);

                // Add main edge
                edges.push({
                    source,
                    target,
                    weight: parsedWeight,
                    type: edgeType,
                    isReverse: false
                });

                // Add reverse connection to nodes for algorithm
                if (edgeType === 'undirected' || edgeType === 'bidirectional') {
                    edges.push({
                        source: target,
                        target: source,
                        weight: parsedWeight,
                        type: edgeType,
                        isReverse: true  // Mark as reverse edge
                    });
                }

                // Build nodes structure
                if (!nodes[source]) nodes[source] = [];
                nodes[source].push({
                    target,
                    weight: parsedWeight
                });

                // Add reverse connection for undirected/bidirectional
                if (edgeType === 'undirected' || edgeType === 'bidirectional') {
                    if (!nodes[target]) nodes[target] = [];
                    nodes[target].push({
                        target: source,
                        weight: parsedWeight
                    });
                }
            }
        });

        return {
            edges,
            nodes,
            dot: this.generateOriginalDot(edges)
        };
    }

    static generateOriginalDot(edges) {
        // Get the graph type from the first edge
        const graphType = edges[0]?.type === 'undirected' ? 'graph' : 'digraph';

        const processedEdges = new Set(); // Track processed edge pairs

        const edgeStrings = edges
            .filter(edge => {
                const edgeKey = `${edge.source}-${edge.target}`;
                const reverseKey = `${edge.target}-${edge.source}`;

                // Skip if we've already processed this edge pair
                if (processedEdges.has(edgeKey) || processedEdges.has(reverseKey)) {
                    return false;
                }

                processedEdges.add(edgeKey);
                return true;
            })
            .map(edge => {
                let edgeOp = '->';
                let attrs = [`label="${edge.weight}"`];

                if (edge.type === 'undirected') {
                    edgeOp = '--';
                } else if (edge.type === 'bidirectional') {
                    attrs.push('dir=both');
                }

                return `  ${edge.source} ${edgeOp} ${edge.target} [${attrs.join(', ')}];`;
            });

        return `${graphType} G {
            node [style=filled, fillcolor=white, fontname="Helvetica"]
            edge [fontsize=8]
            ${edgeStrings.join('\n')}
        }`;
    }

    /**
     * Deletes a graph by ID
     * @param {number} id - Graph ID
     */
    static deleteGraph(id) {
        this.graphs = this.graphs.filter(g => g.id !== id);
        UI.showToast('Grafo excluído com sucesso!', 'success');
        UI.refreshSelects();
    }

    /**
     * Finds a graph by ID
     * @param {number} id - Graph ID
     * @returns {Object|null} Graph object
     */
    static getGraph(id) {
        return this.graphs.find(g => g.id === id) || null;
    }

    /**
     * Updates the done state after algorithm execution
     * @param {number} id - Graph ID
     * @param {Object} results - Algorithm results
     */
    static updateDoneState(id, results) {
        const graph = this.getGraph(id);
        if (!graph) return;

        graph.done = {
            distances: structuredClone(results.distances),
            predecessors: structuredClone(results.predecessors),
            iterations: structuredClone(results.iterations),
            edges: this.getDoneEdges(graph.original.edges, results.predecessors, results.distances),
            dot: results.dot
        };
    }

    /**
     * Identifies edges in shortest path
     * @param {Array} edges - Original edges
     * @param {Object} predecessors - Predecessor map
     * @param {Object} distances - Distance map
     * @returns {Array} Done state edges
     */
    static getDoneEdges(edges, predecessors, distances) {
        return edges.filter(edge =>
            predecessors[edge.target] === edge.source &&
            distances[edge.target] === distances[edge.source] + edge.weight
        );
    }

    /**
     * Handles graph visualization
     * @param {string} stateType - 'original' or 'done'
     */
    static visualizeGraph(stateType) {
        const id = parseInt(document.getElementById('graphId').value);
        const graph = this.getGraph(id);

        if (!graph) {
            UI.showToast('Graph not found!', 'error');
            return;
        }

        const container = document.getElementById('iterationTableContainer');
        const tableBody = document.getElementById('iterationTableBody');

        if (stateType === 'done' && graph.done) {
            container.classList.remove('hidden');
            this.renderIterationTable(graph.done.iterations, tableBody);
            UI.renderGraph(graph.done.dot);
            

        } else if (stateType === 'done' && !graph.done) {
            container.classList.add('hidden');
            UI.showToast('Não há iterações disponíveis, teste o algoritmo primeiro!', 'info');
        } else {
            container.classList.add('hidden');
            UI.renderGraph(graph.original.dot);
        }
    }
    static visualizeGraphTest() {
        const id = parseInt(document.getElementById('graphId').value);
        const graph = this.getGraph(id);

        if (!graph) {
            UI.showToast('Graph not found!', 'error');
            return;
        }
        UI.renderGraph(graph.original.dot);
    }

    /**
     * Renders algorithm iteration table
     * @param {Array} iterations - Algorithm steps
     * @param {HTMLElement} container - Table body element
     */
    static renderIterationTable(iterations, container) {
        if (!iterations?.length) {
            container.innerHTML = `<tr>
                <td colspan="4" class="text-center py-4 text-gray-500">
                    No iteration data available
                </td>
            </tr>`;
            return;
        }

        container.innerHTML = iterations.map(({ step, current, distances, predecessors }) => `
            <tr>
                <td class="text-left px-4 font-bold">${step}</td>
                <td class="font-semibold text-purple-600 px-4">${current}</td>
                <td class="distance-cell">
                    ${Object.entries(distances).map(([node, dist]) => `
                        <div class="flex px-4 text-lg">
                            <span>${node}:</span>
                            <span>${dist === Infinity ? '∞' : dist}</span>
                        </div>
                    `).join('')}
                </td>
                <td class="predecessors-cell">
                    ${Object.entries(predecessors).map(([node, pred]) => `
                        <div class="inline-block bg-gray-100 px-2 py-1 rounded-md mr-1 mb-1 text-xs">
                            ${node} ← ${pred || 'None'}
                        </div>
                    `).join('')}
                </td>
            </tr>
        `).join('');
    }

    /**
     * Gets graph options for dropdowns
     * @returns {Array} Select options data
     */
    static getGraphOptions() {
        return this.graphs.map(g => ({
            value: g.id,
            text: `ID ${g.id} - ${g.name}`
        }));
    }
}