import { GraphManager } from './structures/GraphManager.js';
/**
 * Classe para gerenciamento da interface do usuário
 * @class
 */

export class UI {
    /**
     * Inicializa a interface do usuário
     * @method
     * @static
     * @returns {void}
     */
    static init() {
        this.showAllGraphs();
    }
    /**
     * Exibe a tela inicial
     * @method
     * @static
     * @returns {void}
     */
    static showAllGraphs() {
        const template = document.getElementById('showAllTemplate').content.cloneNode(true);
        const tbody = template.querySelector('#graphsTableBody');
        document.getElementById('graph-container').classList.add('hidden');

        GraphManager.graphs.forEach(graph => {
            // Create main row
            const row = document.createElement('tr');
            row.className = 'cursor-pointer hover:bg-base-200';
            row.innerHTML = `
                <td>${graph.id}</td>
                <td>${graph.name}</td>
                <td>${Object.keys(graph.original.nodes).length}</td>
                <td>${graph.original.edges.filter(e => !e.isReverse).length}</td>
            `;

            // Create expandable details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'hidden details-row';
            detailsRow.innerHTML = `
                <td colspan="4">
                    <div class="p-4 bg-base-200 rounded-lg">
                        <!-- Graph Details -->
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <!-- Original Graph Info -->
                            <div class="bg-base-100 p-4 rounded-lg">
                                <h3 class="font-bold text-lg mb-2 text-primary">Grafo Original</h3>
                                <div class="space-y-2">
                                    <div>
                                        <span class="font-semibold">Nós:</span>
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            ${Object.keys(graph.original.nodes).map(node => 
                                                `<span class="badge badge-neutral">${node}</span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                    <div>
                                        <span class="font-semibold">Arestas:</span>
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            ${graph.original.edges.filter(e => !e.isReverse).map(e => 
                                                `<span class="badge badge-outline">
                                                    ${e.source}${e.type === 'directed' ? '→' : e.type === 'bidirectional' ? '↔' : '—'}${e.target}
                                                    <span class="ml-1 opacity-75">${e.weight}</span>
                                                </span>`
                                            ).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            ${graph.done ? `
                                <!-- Algorithm Results -->
                                <div class="bg-base-100 p-4 rounded-lg">
                                    <h3 class="font-bold text-lg mb-2 text-secondary">Resultados do Algoritmo</h3>
                                    <div class="space-y-2">
                                        <div>
                                            <span class="font-semibold">Distâncias:</span>
                                            <div class="flex flex-wrap gap-1 mt-1">
                                                ${Object.entries(graph.done.distances)
                                                    .map(([node, dist]) => 
                                                        `<span class="badge badge-info">
                                                            ${node}: ${dist === Infinity ? '∞' : dist}
                                                        </span>`
                                                    ).join('')}
                                            </div>
                                        </div>
                                        <div>
                                            <span class="font-semibold">Predecessores:</span>
                                            <div class="flex flex-wrap gap-1 mt-1">
                                                ${Object.entries(graph.done.predecessors)
                                                    .map(([node, pred]) => 
                                                        `<span class="badge badge-ghost">
                                                            ${node} ← ${pred || '∅'}
                                                        </span>`
                                                    ).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex justify-end gap-2 mt-2">
                            <button onclick="UI.showSection('visualizeGraphTemplate'); document.getElementById('graphId').value=${graph.id}; GraphManager.visualizeGraph('original')" 
                                class="btn btn-sm btn-primary">
                                Visualizar
                            </button>
                            ${graph.done ? `
                                <button onclick="UI.showSection('visualizeGraphTemplate'); document.getElementById('graphId').value=${graph.id}; GraphManager.visualizeGraph('done')" 
                                    class="btn btn-sm btn-secondary">
                                    Ver Resultado
                                </button>
                            ` : `
                                <button onclick="UI.showSection('testAlgorithmTemplate'); document.getElementById('graphId').value=${graph.id};" 
                                    class="btn btn-sm btn-accent">
                                    Testar Algoritmo
                                </button>
                            `}
                        </div>
                    </div>
                </td>
            `;

            // Add click handler
            row.addEventListener('click', () => {
                detailsRow.classList.toggle('hidden');
                row.classList.toggle('bg-base-200');
                // Hide other expanded rows
                document.querySelectorAll('.details-row').forEach(otherRow => {
                    if (otherRow !== detailsRow) {
                        otherRow.classList.add('hidden');
                        otherRow.previousElementSibling?.classList.remove('bg-base-200');
                    }
                });
            });

            tbody.appendChild(row);
            tbody.appendChild(detailsRow);
        });

        this.loadContent(template);
    }

    static showSection(templateId, callback) {
        const template = document.getElementById(templateId).content.cloneNode(true);
        const graphContainer = document.getElementById('graph-container');

        if (templateId === 'deleteGraphTemplate' || templateId === 'visualizeGraphTemplate' || templateId === 'testAlgorithmTemplate') {
            const select = template.querySelector('#graphId');
            select.innerHTML = this.generateIdOptions();

            // Add change handler for test algorithm template
            if (templateId === 'testAlgorithmTemplate') {
                select.addEventListener('change', () => {
                    graphContainer.classList.remove('hidden');
                    GraphManager.visualizeGraphTest();
                });
            } else if (templateId === 'visualizeGraphTemplate') {
                select.addEventListener('change', () => {
                    GraphManager.visualizeGraph('original');
                });
            }
        }

        // Show graph container only for visualize and test templates
        if (templateId === 'visualizeGraphTemplate' || templateId === 'testAlgorithmTemplate') {
            graphContainer.classList.remove('hidden');
        } else {
            graphContainer.classList.add('hidden');
        }

        this.loadContent(template);
        if (callback) callback();
    }

    static loadContent(content) {
        document.getElementById('content').replaceChildren(content);
    }

    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-bottom toast-end`;
        toast.innerHTML = `
            <div class="alert alert-${type}">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Renderiza um grafo usando formato DOT (Graphviz)
     * @method
     * @static
     * @param {string} dotString - Descrição do grafo em formato DOT
     * @throws {Error} Se ocorrer erro na renderização
     * @returns {void}
     */
    static renderGraph(dotString) {
        const viz = new Viz();
        viz.renderSVGElement(dotString)
            .then(svg => {
                document.getElementById('graph-container').replaceChildren(svg);
            })
            .catch(error => {
                this.showToast('Erro ao renderizar o grafo!', 'error');
                console.error(error);
            });
    }

    static generateIdOptions() {
        if (GraphManager.graphs.length === 0) {
            return '<option disabled selected>Não há grafos disponíveis</option>';
        }
        return GraphManager.graphs
            .map(g => `<option value="${g.id}">ID ${g.id} - ${g.name}</option>`)
            .join('');
    }

    static refreshSelects() {
        const options = GraphManager.getGraphOptions();
        document.querySelectorAll('.graphId').forEach(select => {
            select.innerHTML = options.map(opt =>
                `<option value="${opt.value}">${opt.text}</option>`
            ).join('');
        });
    }

    static visualizeGraph(stateType) {
        try {
            const graphIdSelect = document.getElementById('graphId');
            if (!graphIdSelect) {
                throw new Error('Seleção de grafo não disponível');
            }

            const id = parseInt(graphIdSelect.value);
            const graph = GraphManager.getGraph(id);
            
            if (!graph) {
                this.showToast('Grafo não encontrado!', 'error');
                return;
            }

            const container = document.getElementById('graph-container');
            const tableContainer = document.getElementById('iterationTableContainer');
            const tableBody = document.getElementById('iterationTableBody');

            // Limpa visualização anterior
            container.innerHTML = '';

            if (stateType === 'done' && graph.done) {
                this.renderGraph(graph.done.dot);
                tableContainer.classList.remove('hidden');
                GraphManager.renderIterationTable(graph.done.iterations, tableBody);
            } else {
                this.renderGraph(graph.original.dot);
                tableContainer.classList.add('hidden');
            }
        } catch (error) {
            this.showToast(`Erro: ${error.message}`, 'error');
        }
    }

    static renderIterationTable(iterations, container) {
        if (!iterations?.length) {
            container.innerHTML = `<tr>
                <td colspan="4" class="text-center py-4 text-gray-500">
                    Nenhum dado de iteração disponível
                </td>
            </tr>`;
            return;
        }
    }
}