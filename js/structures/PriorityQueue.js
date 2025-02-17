/**
 * Fila de prioridade para uso no algoritmo de Dijkstra
 * @class
 */
export class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    /**
     * Adiciona elemento à fila com prioridade
     * @method
     * @param {any} element - Elemento a ser enfileirado
     * @param {number} priority - Prioridade do elemento
     * @returns {void}
     */
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

        /**
     * Remove e retorna o elemento com maior prioridade
     * @method
     * @returns {Object} Elemento com propriedades:
     *  - element: Valor do elemento
     *  - priority: Prioridade numérica
     */
    dequeue() {
        return this.elements.shift();
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}