class AudioViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentFile = null;
        this.initializeUI();
        this.bindEvents();
    }

    initializeUI() {
        this.container.innerHTML = `
            <div class="audio-viewer">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Original Audio</h5>
                            </div>
                            <div class="card-body">
                                <audio id="originalAudio" controls class="w-100">
                                    <p>Your browser does not support the audio element.</p>
                                </audio>
                                <div id="originalWaveform" class="waveform-container mt-2"></div>
                                <div class="mt-2" id="originalAudioInfo"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Processed Audio</h5>
                            </div>
                            <div class="card-body">
                                <audio id="processedAudio" controls class="w-100">
                                    <p>Your browser does not support the audio element.</p>
                                </audio>
                                <div id="processedWaveform" class="waveform-container mt-2"></div>
                                <div class="mt-2" id="processedAudioInfo"></div>
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
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="normalizeAudio" checked>
                                            <label class="form-check-label" for="normalizeAudio">
                                                Normalize Audio
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="removeSilence" checked>
                                            <label class="form-check-label" for="removeSilence">
                                                Remove Silence
                                            </label>
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="reduceNoise" checked>
                                            <label class="form-check-label" for="reduceNoise">
                                                Reduce Noise
                                            </label>
                                        </div>
                                    </div>
                                    <button id="preprocessBtn" class="btn btn-primary">Preprocess Audio</button>
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
                                        <label class="form-label">Speed Adjustment:</label>
                                        <input type="range" class="form-range" id="speedAdjust" 
                                               min="0.5" max="2" step="0.1" value="1">
                                        <div class="small text-muted text-center">
                                            <span id="speedValue">1.0</span>x
                                        </div>
                                    </div>
                                    <div class="mb-2">
                                        <label class="form-label">Pitch Shift:</label>
                                        <input type="range" class="form-range" id="pitchShift" 
                                               min="-12" max="12" step="1" value="0">
                                        <div class="small text-muted text-center">
                                            <span id="pitchValue">0</span> semitones
                                        </div>
                                    </div>
                                    <button id="augmentBtn" class="btn btn-secondary">Augment Audio</button>
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
        
        preprocessBtn.addEventListener('click', () => this.preprocessAudio());
        augmentBtn.addEventListener('click', () => this.augmentAudio());
        
        // Range input event listeners
        this.container.querySelector('#speedAdjust').addEventListener('input', () => this.updateRangeDisplays());
        this.container.querySelector('#pitchShift').addEventListener('input', () => this.updateRangeDisplays());
    }

    updateRangeDisplays() {
        const speedValue = this.container.querySelector('#speedValue');
        const pitchValue = this.container.querySelector('#pitchValue');
        
        speedValue.textContent = this.container.querySelector('#speedAdjust').value;
        pitchValue.textContent = this.container.querySelector('#pitchShift').value;
    }

    async preprocessAudio() {
        if (!this.currentFile) {
            showAlert('warning', 'No file selected');
            return;
        }

        const formData = new FormData();
        formData.append('file', this.currentFile);
        
        // Add preprocessing parameters
        formData.append('normalize', this.container.querySelector('#normalizeAudio').checked);
        formData.append('remove_silence', this.container.querySelector('#removeSilence').checked);
        formData.append('reduce_noise', this.container.querySelector('#reduceNoise').checked);

        try {
            showAlert('info', 'Processing audio...');
            
            const response = await fetch('http://localhost:8000/api/v1/audio/preprocess', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Preprocessing failed');
            }

            const result = await response.json();
            
            if (!result.processed_audio) {
                throw new Error('No processed audio data received');
            }
            
            // Create audio URL from base64 data
            const audioBlob = this.base64ToBlob(result.processed_audio, 'audio/wav');
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Update processed audio player
            const processedAudio = this.container.querySelector('#processedAudio');
            processedAudio.src = audioUrl;
            
            // Display processing steps
            if (result.steps) {
                this.displayProcessingSteps(result.steps);
            }
            
            // Update processed audio info
            this.displayAudioInfo(audioBlob, 'processedAudioInfo');
            
            showAlert('success', 'Audio preprocessing completed');
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Error preprocessing audio: ' + error.message);
        }
    }

    base64ToBlob(base64, type = 'audio/wav') {
        try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: type });
        } catch (error) {
            console.error('Error converting base64 to blob:', error);
            throw new Error('Failed to convert audio data');
        }
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

    setFile(file) {
        this.currentFile = file;
        const originalAudio = this.container.querySelector('#originalAudio');
        originalAudio.src = URL.createObjectURL(file);
        
        // Clear processed audio when new file is loaded
        const processedAudio = this.container.querySelector('#processedAudio');
        processedAudio.src = '';
        
        // Clear processing steps
        const stepsElem = this.container.querySelector('#processingSteps');
        stepsElem.innerHTML = '';
        
        // Display original audio info
        this.displayAudioInfo(file, 'originalAudioInfo');
    }

    displayAudioInfo(file, containerId) {
        const infoElem = this.container.querySelector(`#${containerId}`);
        infoElem.innerHTML = `
            <small class="text-muted">
                Size: ${(file.size / 1024 / 1024).toFixed(2)} MB<br>
                Type: ${file.type || 'audio/wav'}
            </small>
        `;
    }
}