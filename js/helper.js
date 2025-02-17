export class HelpModal {
    static currentStep = 1;
    static totalSteps = 4;
    static modalElement = document.getElementById('helpModal');

    static init() {
        this.setupEventListeners();
        this.setupFirstVisit();
    }

    static setupEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.navigate(-1));
        document.getElementById('nextBtn').addEventListener('click', () => this.navigate(1));
        document.getElementById('helpButton').addEventListener('click', () => this.show());

        // Close button
        document.getElementById('understandBtn').addEventListener('click', () => this.modalElement.close());
    }

    static setupFirstVisit() {
        if (!localStorage.getItem('seenHelp')) {
            this.show();
            localStorage.setItem('seenHelp', 'true');
        }
    }

    static show() {
        this.currentStep = 1;
        this.updateDisplay();
        this.modalElement.showModal();
    }

    static navigate(direction) {
        const newStep = this.currentStep + direction;
        if (newStep > 0 && newStep <= this.totalSteps) {
            this.currentStep = newStep;
            this.updateDisplay();
        }
    }

    static async updateDisplay() {
        // Update step indicators
        document.querySelectorAll('.step').forEach((el, index) => {
            el.classList.toggle('step-primary', (index + 1) === this.currentStep);
        });

        // Update button states
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const understandBtn = document.getElementById('understandBtn');

        prevBtn.disabled = this.currentStep === 1;
        nextBtn.classList.toggle('hidden', this.currentStep === this.totalSteps);
        understandBtn.classList.toggle('hidden', this.currentStep !== this.totalSteps);

        // Handle graph rendering for step 4
        if (this.currentStep === 4) {
            await this.renderExampleGraphs();
        } else {
            this.clearGraphs();
        }
    }

    static async renderExampleGraphs() {
        try {
            const viz = new Viz();
            const originalSvg = await viz.renderSVGElement(this.originalDot);
            const doneSvg = await viz.renderSVGElement(this.doneDot);

            document.getElementById('helpOriginalGraph').appendChild(originalSvg);
            document.getElementById('helpDoneGraph').appendChild(doneSvg);
        } catch (error) {
            console.error('Error rendering help graphs:', error);
        }
    }

    static clearGraphs() {
        document.getElementById('helpOriginalGraph').innerHTML = '';
        document.getElementById('helpDoneGraph').innerHTML = '';
    }

    // Example DOT definitions
    static originalDot = `digraph G {
    node [style=filled, fillcolor=white]
    edge [fontsize=10]
    
    A -> B [label="4"];
    A -> C [label="2"];
    B -> C [label="5"];
    B -> D [label="10"];
    C -> D [label="3"];
}`;

    static doneDot = `digraph G {
    node [style=filled, fillcolor=white]
    edge [fontsize=10]
    
    A [xlabel="Dist: 0"]
    B [xlabel="Dist: 4"]
    C [xlabel="Dist: 2"] 
    D [xlabel="Dist: 5"]
    
    A -> B [label="4", color="gray70"];
    A -> C [label="2", color="red", penwidth=2];
    B -> C [label="5", color="gray70"];
    B -> D [label="10", color="gray70"];
    C -> D [label="3", color="red", penwidth=2];
}`;
}