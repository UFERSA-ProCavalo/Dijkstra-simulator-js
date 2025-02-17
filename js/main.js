import { GraphManager } from './structures/GraphManager.js';
import { DijkstraAlgorithm } from './DijkstraAlgorithm.js';
import { UI } from './UI.js';

window.GraphManager = GraphManager;
window.UI = UI;
window.DijkstraAlgorithm = DijkstraAlgorithm;


UI.init();
// Event Listeners
document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let importedCount = 0;
            
            // Split content by empty lines and process each section
            const sections = content.split(/\n\s*\n/);
            let currentGraph = { name: '', edges: [] };
            
            sections.forEach(section => {
                const lines = section.trim().split('\n');
                
                // Process each section independently
                let currentName = '';
                let currentEdges = [];
                
                lines.forEach(line => {
                    line = line.trim();
                    if (line.startsWith('Name:')) {
                        currentName = line.replace('Name:', '').trim();
                    } else if (line === 'Original:') {
                        // Reset edges when new section starts
                        currentEdges = [];
                    } else if (line && !line.startsWith('Done:')) {
                        currentEdges.push(line);
                    }
                });

                // Only process if we have both name and edges
                if (currentName && currentEdges.length > 0) {
                    try {
                        const edgesText = currentEdges.join('\n');
                        const { edges, nodes } = GraphManager.parseEdges(edgesText);
                        
                        if (GraphManager.validateGraph(edges, nodes)) {
                            GraphManager.addGraph(currentName, edgesText);
                            importedCount++;
                        }
                    } catch (graphError) {
                        UI.showToast(`Erro no grafo "${currentName}": ${graphError.message}`, 'error');
                    }
                }
            });

            if (importedCount > 0) {
                UI.showToast(`Importação concluída: ${importedCount} grafo(s) importado(s)`, 'success');
                UI.showAllGraphs();
            }

        } catch (error) {
            UI.showToast('Falha na importação: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    console.log(GraphManager.graphs);
});

document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabId);
            content.classList.toggle('hidden', content.dataset.tab !== tabId);
        });
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.toggle('tab-active', t.dataset.tab === tabId);
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('seenHelp')) {
        helpModal.showModal();
        localStorage.setItem('seenHelp', 'true');
    }
});
/**
 * Função para exportar dados dos grafos em formato JSON
 * @function exportData
 * @throws {Error} Se não houver grafos para exportar
 * @returns {void}
 */
window.exportData = () => {
    if (GraphManager.graphs.length === 0) {
        UI.showToast('Não há grafos para exportar!', 'error');
        return;
    }

    const exportText = GraphManager.graphs.map(graph => {
        let content = `Name: ${graph.name}\nOriginal:\n`;
        content += graph.original.edges.map(e => `${e.source} ${e.target} ${e.weight}`).join('\n');
        
        if (graph.done) {
            content += `\nDone:\n`;
            const doneEdges = graph.original.edges.filter(e => 
                graph.done.predecessors[e.target] === e.source &&
                graph.done.distances[e.target] === graph.done.distances[e.source] + e.weight
            );
            content += doneEdges.map(e => `${e.source} ${e.target} ${e.weight}`).join('\n');
        }
        return content;
    }).join('\n\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graphs-export.txt';
    a.click();
    URL.revokeObjectURL(url);
    UI.showToast('Exportação realizada com sucesso!', 'success');
};

window.handleDeleteGraph = () => {
    const id = parseInt(document.getElementById('graphId').value);
    GraphManager.deleteGraph(id);
    UI.showAllGraphs();
}

window.handleAddGraph = () => {
    const name = document.getElementById('graphName').value;
    const edgesText = document.getElementById('graphEdges').value;

    GraphManager.addGraph(name, edgesText);
};