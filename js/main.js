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
            const graphs = content.split('\n\n').filter(g => g.trim());
            
            graphs.forEach(graphText => {
                const lines = graphText.split('\n');
                let name = 'Imported Graph';
                let edges = [];
                let currentSection = null;

                lines.forEach(line => {
                    line = line.trim();
                    if (line.startsWith('Name:')) {
                        name = line.replace('Name:', '').trim();
                    } else if (line === 'Original:') {
                        currentSection = 'original';
                    } else if (line === 'Done:') {
                        currentSection = 'done';
                    } else if (currentSection === 'original' && line) {
                        edges.push(line);
                    }
                });

                // Add graph using the original edge format
                GraphManager.addGraph(name, edges.join('\n'));
            });

            UI.showToast('Import successful!', 'success');
            UI.showAllGraphs();

        } catch (error) {
            UI.showToast('Import failed: ' + error.message, 'error');
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

window.handleAddGraph = () => {
    const name = document.getElementById('graphName').value;
    const edgesText = document.getElementById('graphEdges').value;

    GraphManager.addGraph(name, edgesText);
    UI.showToast('Graph adicionado com sucesso!', 'success');
    UI.showAllGraphs();
    console.log(GraphManager.graphs);
};