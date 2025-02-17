import { GraphManager } from './structures/GraphManager.js';
import { HelpModal } from './helper.js';
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

        GraphManager.graphs.forEach(graph => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${graph.id}</td>
                <td>${graph.name}</td>
                <td>${Object.keys(graph.original.nodes).length}</td>
                <td>${graph.original.edges.length}</td>
            `;
            tbody.appendChild(row);
        });

        this.loadContent(template);
    }

    static showSection(templateId, callback) {
        const template = document.getElementById(templateId).content.cloneNode(true);

        if (templateId === 'deleteGraphTemplate' || templateId === 'visualizeGraphTemplate' || templateId === 'testAlgorithmTemplate') {
            const select = template.querySelector('#graphId');
            select.innerHTML = this.generateIdOptions();
        }
        if (templateId === 'showAllTemplate' || templateId === 'addGraphTemplate' || templateId === 'deleteGraphTemplate') {
            document.getElementById('graph-container').replaceChildren();
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
        document.querySelectorAll('.graph-select').forEach(select => {
            select.innerHTML = options.map(opt =>
                `<option value="${opt.value}">${opt.text}</option>`
            ).join('');
        });
    }

    static visualizeGraph(stateType) {
        try {
            const graphIdSelect = document.getElementById('graphId');
            if (!graphIdSelect) {
                throw new Error('Graph selection not available');
            }

            const id = parseInt(graphIdSelect.value);
            const graph = GraphManager.getGraph(id);
            
            if (!graph) {
                this.showToast('Graph not found!', 'error');
                return;
            }

            const container = document.getElementById('graph-container');
            const tableContainer = document.getElementById('iterationTableContainer');
            const tableBody = document.getElementById('iterationTableBody');

            // Clear previous visualization
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
            this.showToast(error.message, 'error');
        }
    }
}