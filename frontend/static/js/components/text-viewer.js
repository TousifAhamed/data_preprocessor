class TextViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="text-viewer">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Original Text</h5>
                            </div>
                            <div class="card-body">
                                <pre id="originalText" class="text-content"></pre>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Processed Text</h5>
                            </div>
                            <div class="card-body">
                                <pre id="processedText" class="text-content"></pre>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <button id="preprocessBtn" class="btn btn-primary">Preprocess Text</button>
                    <button id="downloadBtn" class="btn btn-secondary">Download Processed Text</button>
                </div>
                <div id="processingSteps" class="mt-3"></div>
            </div>
        `;
    }

    bindEvents() {
        const preprocessBtn = this.container.querySelector('#preprocessBtn');
        const downloadBtn = this.container.querySelector('#downloadBtn');

        preprocessBtn.addEventListener('click', () => this.preprocessText());
        downloadBtn.addEventListener('click', () => this.downloadProcessedText());
    }

    async preprocessText() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('file', this.currentFile);

        try {
            const response = await fetch('http://localhost:8000/api/v1/text/preprocess', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Preprocessing failed');

            const result = await response.json();
            this.displayProcessedText(result);
            this.displayProcessingSteps(result.steps);
        } catch (error) {
            console.error('Error:', error);
            alert('Error preprocessing text');
        }
    }

    displayProcessedText(result) {
        const processedTextElem = this.container.querySelector('#processedText');
        processedTextElem.textContent = result.processed_text;
    }

    displayProcessingSteps(steps) {
        const stepsElem = this.container.querySelector('#processingSteps');
        stepsElem.innerHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="mb-0">Processing Steps</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group">
                        ${steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    downloadProcessedText() {
        const processedText = this.container.querySelector('#processedText').textContent;
        if (!processedText) return;

        const blob = new Blob([processedText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processed_text.txt';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    setFile(file) {
        this.currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalTextElem = this.container.querySelector('#originalText');
            originalTextElem.textContent = e.target.result;
            
            // Clear processed text when new file is loaded
            const processedTextElem = this.container.querySelector('#processedText');
            processedTextElem.textContent = '';
            
            // Clear processing steps
            const stepsElem = this.container.querySelector('#processingSteps');
            stepsElem.innerHTML = '';
        };
        reader.readAsText(file);
    }
}