import { PriorityQueue } from './structures/PriorityQueue.js';
import { GraphManager } from './structures/GraphManager.js';
import { UI } from './UI.js';

export class DijkstraAlgorithm {
    /**
     * Executes Dijkstra's algorithm based on UI inputs
     * @static
     * @returns {void}
     */
    static runTest() {
        try {
            const graphIdElem = document.getElementById('graphId');
            const startNodeElem = document.getElementById('startNode');

            if (!graphIdElem || !startNodeElem) {
                throw new Error('Required form elements not found');
            }

            const graphId = parseInt(graphIdElem.value);
            const startNode = startNodeElem.value.trim();

            if (isNaN(graphId)) {
                throw new Error('Invalid graph ID');
            }

            const graph = GraphManager.getGraph(graphId);
            if (!graph) {
                throw new Error(`Graph with ID ${graphId} not found`);
            }

            if (!graph.original.nodes[startNode]) {
                throw new Error(`Start node "${startNode}" not found in graph`);
            }

            // Run Dijkstra's algorithm
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

            UI.showToast('Algorithm executed successfully!', 'success');
            //UI.visualizeGraph('done');

        } catch (error) {
            UI.showToast(`Error: ${error.message}`, 'error');
            console.error('Algorithm execution failed:', error);
        }
    }

    /**
     * Core Dijkstra's algorithm implementation
     * @static
     * @param {Object} adjacencyList - Graph nodes and connections
     * @param {string} startNode - Starting node ID
     * @returns {Object} Execution results {distances, predecessors, iterations}
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
     * Creates a snapshot of algorithm state
     * @static
     * @param {number} step - Iteration number
     * @param {string} current - Current node being processed
     * @param {Object} distances - Current distance values
     * @param {Object} predecessors - Current predecessor map
     * @returns {Object} Iteration snapshot
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
     * Generates DOT representation of algorithm results
     * @static
     * @param {Array} edges - Original graph edges
     * @param {Object} distances - Final distance values
     * @param {Object} predecessors - Final predecessor map
     * @returns {string} DOT string for visualization
     */
    static generateDoneDot(edges, distances, predecessors) {
        const nodeDefinitions = Object.keys(distances).map(node =>
            `  ${node} [xlabel="Dist: ${distances[node] === Infinity ? '∞' : distances[node]}"];`
        );

        const edgeDefinitions = edges.map(edge => {
            const isOptimal = predecessors[edge.target] === edge.source &&
                distances[edge.target] === distances[edge.source] + edge.weight;

            return `  ${edge.source} -> ${edge.target} [
                label="${edge.weight}"
                ${isOptimal ? 'color="red" penwidth=2' : 'color="gray70"'}
            ];`;
        });

        return `digraph G {
            node [style=filled, fillcolor=white, fontname="Helvetica"]
            edge [fontsize=8]
            ${nodeDefinitions.join('\n')}
            ${edgeDefinitions.join('\n')}
        }`;
    }
}
