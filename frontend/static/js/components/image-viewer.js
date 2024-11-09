class ImageViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="image-viewer">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Original Image</h5>
                            </div>
                            <div class="card-body">
                                <img id="originalImage" class="img-fluid" alt="Original image">
                                <div class="mt-2" id="originalImageInfo"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Processed Image</h5>
                            </div>
                            <div class="card-body">
                                <img id="processedImage" class="img-fluid" alt="Processed image">
                                <div class="mt-2" id="processedImageInfo"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Preprocessing Options</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <label class="form-label">Resize Dimensions:</label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" id="resizeWidth" placeholder="Width">
                                            <span class="input-group-text">×</span>
                                            <input type="number" class="form-control" id="resizeHeight" placeholder="Height">
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="grayscale">
                                            <label class="form-check-label" for="grayscale">
                                                Convert to Grayscale
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="normalize">
                                            <label class="form-check-label" for="normalize">
                                                Normalize Colors
                                            </label>
                                        </div>
                                    </div>
                                    <button id="preprocessBtn" class="btn btn-primary">Preprocess Image</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Augmentation Options</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="flip">
                                            <label class="form-check-label" for="flip">
                                                Flip Horizontally
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="rotate">
                                            <label class="form-check-label" for="rotate">
                                                Rotate 90°
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <label class="form-label">Brightness Adjustment:</label>
                                        <input type="range" class="form-range" id="brightness" min="-100" max="100" value="0">
                                    </div>
                                    <button id="augmentBtn" class="btn btn-secondary">Augment Image</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="processingSteps" class="mt-3"></div>
            </div>
        `;
    }

    bindEvents() {
        const preprocessBtn = this.container.querySelector('#preprocessBtn');
        const augmentBtn = this.container.querySelector('#augmentBtn');

        preprocessBtn.addEventListener('click', () => this.preprocessImage());
        augmentBtn.addEventListener('click', () => this.augmentImage());

        const brightnessInput = this.container.querySelector('#brightness');
        brightnessInput.addEventListener('input', () => {
            const brightnessValue = this.container.querySelector('#brightnessValue');
            brightnessValue.textContent = brightnessInput.value;
        });
    }

    async preprocessImage() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('file', this.currentFile);
        
        // Add preprocessing parameters
        formData.append('resize_width', this.container.querySelector('#resizeWidth').value);
        formData.append('resize_height', this.container.querySelector('#resizeHeight').value);
        formData.append('grayscale', this.container.querySelector('#grayscale').checked);
        formData.append('normalize', this.container.querySelector('#normalize').checked);

        try {
            const response = await fetch('http://localhost:8000/api/v1/image/preprocess', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Preprocessing failed');

            const result = await response.json();
            this.displayProcessedImage(result);
            this.displayProcessingSteps(result.steps);
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Error preprocessing image');
        }
    }

    async augmentImage() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('file', this.currentFile);
        
        // Add augmentation parameters
        formData.append('flip', this.container.querySelector('#flip').checked);
        formData.append('rotate', this.container.querySelector('#rotate').checked);
        formData.append('brightness', this.container.querySelector('#brightness').value);

        try {
            const response = await fetch('http://localhost:8000/api/v1/image/augment', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Augmentation failed');

            const result = await response.json();
            this.displayAugmentedImages(result);
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Error augmenting image');
        }
    }

    displayProcessedImage(result) {
        const processedImage = this.container.querySelector('#processedImage');
        processedImage.src = `data:image/png;base64,${result.processed_image}`;
        
        const processedInfo = this.container.querySelector('#processedImageInfo');
        processedInfo.innerHTML = `
            <small class="text-muted">
                Size: ${result.processed_size[0]}×${result.processed_size[1]}
            </small>
        `;
    }

    displayAugmentedImages(result) {
        const processedContent = document.getElementById('processedContent');
        processedContent.innerHTML = `
            <div class="row">
                ${Object.entries(result.augmented_images).map(([name, imageData]) => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">${name.charAt(0).toUpperCase() + name.slice(1)}</h6>
                            </div>
                            <div class="card-body">
                                <img src="data:image/png;base64,${imageData}" class="img-fluid" alt="${name}">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayProcessingSteps(steps) {
        const stepsElem = this.container.querySelector('#processingSteps');
        stepsElem.innerHTML = `
            <div class="card">
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

    setFile(file) {
        this.currentFile = file;
        const originalImage = this.container.querySelector('#originalImage');
        originalImage.src = URL.createObjectURL(file);
        
        // Clear processed image when new file is loaded
        const processedImage = this.container.querySelector('#processedImage');
        processedImage.src = '';
        
        // Clear processing steps
        const stepsElem = this.container.querySelector('#processingSteps');
        stepsElem.innerHTML = '';
        
        // Display original image info
        originalImage.onload = () => {
            const originalInfo = this.container.querySelector('#originalImageInfo');
            originalInfo.innerHTML = `
                <small class="text-muted">
                    Size: ${originalImage.naturalWidth}×${originalImage.naturalHeight}
                </small>
            `;
        };
    }
}