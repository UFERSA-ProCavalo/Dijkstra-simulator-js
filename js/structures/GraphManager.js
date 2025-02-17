export class GraphManager {
    static graphs = [];
    static nextId = 1;

    /**
     * Adds a new graph to the database
     * @param {string} name - Graph name
     * @param {string} edgesText - Edges in "source target weight" format
     */
    static addGraph(name, edgesText) {
        try {
            const { edges, nodes, dot } = this.parseEdges(edgesText);

            this.graphs.push({
                id: this.nextId++,
                name,
                original: {
                    nodes: structuredClone(nodes),
                    edges: structuredClone(edges),
                    dot: dot
                },
                done: null
            });

            UI.refreshSelects();
            UI.showToast('Graph added successfully!', 'success');
        } catch (error) {
            UI.showToast(`Error adding graph: ${error.message}`, 'error');
            throw error;
        }
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

        lines.forEach(line => {
            const [source, target, weight] = line.trim().split(/\s+/);
            if (source && target && weight) {
                // Add to edges array
                edges.push({
                    source,
                    target,
                    weight: parseInt(weight)
                });

                // Build nodes structure
                if (!nodes[source]) nodes[source] = [];
                nodes[source].push({
                    target,
                    weight: parseInt(weight)
                });

                // Ensure all nodes are present in the nodes object
                if (!nodes[target]) nodes[target] = [];
            }
        });

        return {
            edges,
            nodes,
            dot: this.generateOriginalDot(edges)
        };
    }

    static generateOriginalDot(edges) {
        const edgeStrings = edges.map(e =>
            `  ${e.source} -> ${e.target} [label="${e.weight}"];`
        );

        return `digraph G {
      node [style=filled, fillcolor=white, fontname="Helvetica"]
      edge [fontsize=8]
    ${edgeStrings.join('\n')}
    }`;
    }

    /**
     * Generates initial DOT representation
     * @param {Array} edges - Graph edges
     * @returns {string} DOT string
     */
    static generateOriginalDot(edges) {
        const edgeStrings = edges.map(e =>
            `${e.source} -> ${e.target} [label="${e.weight}"];`
        );

        return `digraph G {
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
        UI.showToast('Graph deleted!', 'success');
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
        } else {
            container.classList.add('hidden');
            UI.renderGraph(graph.original.dot);
        }
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