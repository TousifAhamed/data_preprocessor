const API_CONFIG = {
    baseUrl: window.location.origin,
    endpoints: {
        csrf: '/api/v1/csrf-token',
        upload: '/api/v1/upload',
        image: '/api/v1/image',
        audio: '/api/v1/audio',
        text: '/api/v1/text',
        threeD: '/api/v1/3d'
    },
    isDevelopment: true
};

const MOCK_RESPONSES = {
    text: {
        upload: {
            text_content: "Sample text content",
            validation: { lines: 10, words: 100, is_valid: true }
        },
        preprocess: {
            processed_text: "preprocessed sample text content\nwith multiple lines\nand normalized structure",
            original_text: "Sample Text Content\nWith Multiple Lines\nAnd Different Structure",
            steps: [
                "Removed leading/trailing whitespace",
                "Normalized whitespace",
                "Converted to lowercase",
                "Removed special characters",
                "Split into sentences",
                "Tokenized words",
                "Removed stop words",
                "Lemmatized tokens",
                "Reconstructed sentences"
            ]
        },
        augment: {
            augmented_texts: {
                "reversed": "content text sample",
                "shuffled": "text sample content",
                "simplified": "simple text content",
                "expanded": "Sample text content\n\nExpanded version:\nSample text content"
            },
            steps: [
                "Reversed text",
                "Shuffled sentences",
                "Simplified text",
                "Expanded text"
            ]
        }
    },
    image: {
        upload: {
            image_data: "base64_encoded_image_data",
            validation: { width: 800, height: 600, format: "PNG" }
        },
        preprocess: {
            processed_image: "base64_encoded_processed_image",
            original_size: [800, 600],
            processed_size: [400, 300],
            steps: [
                "Converted to RGB",
                "Resized to max 1024px",
                "Normalized pixel values",
                "Applied color correction"
            ]
        },
        augment: {
            augmented_images: {
                "rotated": "base64_encoded_rotated_image",
                "flipped": "base64_encoded_flipped_image",
                "brightened": "base64_encoded_bright_image",
                "darkened": "base64_encoded_dark_image"
            },
            steps: [
                "90-degree rotation",
                "Horizontal flip",
                "Brightness adjustment (+20%)",
                "Brightness adjustment (-20%)"
            ]
        }
    },
    audio: {
        upload: {
            audio_data: "base64_encoded_audio_data",
            validation: { 
                duration: "00:02:30",
                sample_rate: 44100,
                channels: 2
            }
        },
        preprocess: {
            processed_audio: "base64_encoded_processed_audio",
            waveform_data: [],
            steps: [
                "Converted to mono",
                "Normalized audio levels",
                "Removed silence",
                "Reduced noise"
            ]
        },
        augment: {
            augmented_audio: {
                "time_stretched": "base64_encoded_stretched_audio",
                "pitch_shifted": "base64_encoded_pitched_audio",
                "reversed": "base64_encoded_reversed_audio"
            },
            steps: [
                "Time stretching (1.5x)",
                "Pitch shifting (+4 semitones)",
                "Audio reversal"
            ]
        }
    },
    threeD: {
        upload: {
            mesh_data: "base64_encoded_mesh_data",
            validation: {
                vertices: 1000,
                faces: 500,
                is_watertight: true
            }
        },
        preprocess: {
            processed_mesh: "base64_encoded_processed_mesh",
            statistics: {
                original_vertices: 1000,
                processed_vertices: 800,
                original_faces: 500,
                processed_faces: 400
            },
            steps: [
                "Removed duplicate vertices",
                "Fixed surface normals",
                "Filled holes",
                "Optimized mesh"
            ]
        },
        augment: {
            augmented_meshes: {
                "scaled": "base64_encoded_scaled_mesh",
                "rotated": "base64_encoded_rotated_mesh",
                "mirrored": "base64_encoded_mirrored_mesh"
            },
            steps: [
                "Scaled by 1.5",
                "Rotated 90° on Y-axis",
                "Mirrored along X-axis"
            ]
        }
    }
};

async function fetchWithFallback(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Accept': 'application/json',
                ...options.headers
            }
        });
        
        if (response.ok) {
            return await response.json();
        }

        if (process.env.NODE_ENV === 'development') {
            const mockResponse = getMockResponse(url);
            if (mockResponse) {
                console.warn('Using mock response for:', url);
                return mockResponse;
            }
        }

        throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
        console.warn('API call failed:', error);
        if (process.env.NODE_ENV === 'development') {
            const mockResponse = getMockResponse(url);
            if (mockResponse) {
                console.warn('Using mock response for:', url);
                return mockResponse;
            }
        }
        throw error;
    }
}

function getMockResponse(url) {
    if (url.includes('/api/v1/text/upload')) {
        return MOCK_RESPONSES.text.upload;
    }
    if (url.includes('/api/v1/text/preprocess')) {
        return MOCK_RESPONSES.text.preprocess;
    }
    if (url.includes('/api/v1/image/upload')) {
        return MOCK_RESPONSES.image.upload;
    }
    if (url.includes('/api/v1/audio/upload')) {
        return MOCK_RESPONSES.audio.upload;
    }
    if (url.includes('/api/v1/3d/upload')) {
        return MOCK_RESPONSES.threeD.upload;
    }
    return null;
}

let csrfToken = '';

async function getCsrfToken() {
    if (API_CONFIG.isDevelopment) {
        console.log('Development mode: Skipping CSRF token');
        return null;
    }

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.csrf}`);
        if (!response.ok) {
            console.warn('CSRF endpoint not available, proceeding without CSRF token');
            return null;
        }
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.warn('Error fetching CSRF token:', error);
        return null;
    }
}

Dropzone.autoDiscover = false;
let myDropzone;

function initializeFileUploads() {
    myDropzone = new Dropzone("#file-upload", {
        url: function() {
            const file = this.files[0];
            if (!file) return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.upload}`;
            
            const ext = file.name.toLowerCase().split('.').pop();
            const endpoints = {
                'jpg': 'image',
                'jpeg': 'image',
                'png': 'image',
                'gif': 'image',
                'mp3': 'audio',
                'wav': 'audio',
                'txt': 'text',
                'obj': 'threeD',
                'stl': 'threeD',
                'off': 'threeD',
                'ply': 'threeD'
            };
            
            const endpoint = endpoints[ext] || 'upload';
            return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}/upload`;
        },
        method: "POST",
        maxFilesize: 100,
        acceptedFiles: ".jpg,.jpeg,.png,.gif,.mp3,.wav,.txt,.obj,.stl,.off,.ply",
        addRemoveLinks: true,
        autoProcessQueue: false,
        createImageThumbnails: true,
        init: function() {
            this.on("addedfile", function(file) {
                if (API_CONFIG.isDevelopment) {
                    // In development mode, simulate successful upload
                    const fileType = getFileType(file);
                    if (fileType) {
                        showProcessingOptions(fileType);
                        handleUploadSuccess(file, MOCK_RESPONSES[fileType].upload);
                    }
                } else {
                    this.processQueue(); // Process upload in production
                }
            });

            this.on("success", handleUploadSuccess);
            this.on("error", handleUploadError);
            this.on("uploadprogress", handleUploadProgress);
        }
    });

    return myDropzone;
}

function handleFileAdded(file) {
    clearDisplays();
    const fileType = getFileType(file);
    if (fileType) {
        showProcessingOptions(fileType);
        if (API_CONFIG.isDevelopment) {
            // Simulate successful upload in development
            setTimeout(() => {
                handleUploadSuccess(file, MOCK_RESPONSES[fileType].upload);
            }, 1000);
        }
    }
}

function handleUploadSuccess(file, response) {
    const fileType = getFileType(file);
    if (fileType && response) {
        displayContent(response, fileType);
        showAlert('success', 'File uploaded successfully');
    }
}

function handleUploadError(file, errorMessage) {
    if (API_CONFIG.isDevelopment) {
        const fileType = getFileType(file);
        if (fileType) {
            console.warn('Development mode: Using mock response');
            handleUploadSuccess(file, MOCK_RESPONSES[fileType].upload);
            return;
        }
    }
    showAlert('danger', 'Upload failed: ' + errorMessage);
}

function getFileType(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    const typeMap = {
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
        'mp3': 'audio', 'wav': 'audio',
        'txt': 'text',
        'obj': 'threeD', 'stl': 'threeD', 'off': 'threeD', 'ply': 'threeD'
    };
    return typeMap[ext];
}

function clearDisplays() {
    ['originalContent', 'processedContent', 'alertArea'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = '';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeFileUploads();
});

function displayImageContent(response) {
    const container = document.getElementById('originalContent');
    if (container && response.image_data) {
        container.innerHTML = `
            <div class="image-container">
                <img src="data:image/png;base64,${response.image_data}" class="img-fluid" alt="Uploaded image" />
            </div>`;
    }
}

function displayAudioContent(response) {
    const container = document.getElementById('originalContent');
    if (container && response.audio_data) {
        container.innerHTML = `
            <div class="audio-container">
                <audio controls class="w-100">
                    <source src="data:audio/mpeg;base64,${response.audio_data}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            </div>`;
    }
}

function displayTextContent(response) {
    const container = document.getElementById('originalContent');
    if (container && response.text_content) {
        container.innerHTML = `
            <div class="text-container">
                <pre class="text-content">${escapeHtml(response.text_content)}</pre>
            </div>`;
    }
}

function displayThreeDContent(response) {
    const container = document.getElementById('originalContent');
    if (container && response.mesh_data) {
        container.innerHTML = `<div id="3d-viewer" class="viewer-container"></div>`;
        initThreeDViewer(response.mesh_data);
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showAlert(type, message) {
    const alertArea = document.getElementById('alertArea');
    if (alertArea) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        alertArea.innerHTML = alertHtml;

        if (type !== 'danger') {
            setTimeout(() => {
                const alert = alertArea.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }
}

function showProcessingOptions(fileType) {
    let processingOptions = document.getElementById('processingOptions');
    if (!processingOptions) {
        const mainContent = document.querySelector('.col-md-9');
        processingOptions = document.createElement('div');
        processingOptions.id = 'processingOptions';
        processingOptions.className = 'card mt-3';
        mainContent.appendChild(processingOptions);
    }

    let controls = document.getElementById('processingControls');
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'processingControls';
        processingOptions.appendChild(controls);
    }

    let optionsHTML = `
        <div class="card-header">
            <h4>Processing Options</h4>
        </div>
        <div class="card-body">
    `;
    
    switch(fileType) {
        case 'image':
            optionsHTML += `
                <div class="mb-3">
                    <h5>Image Processing Options</h5>
                    <button class="btn btn-primary me-2" onclick="preprocessFile('image')">Preprocess Image</button>
                    <button class="btn btn-secondary" onclick="augmentFile('image')">Augment Image</button>
                </div>
            `;
            break;
        case 'audio':
            optionsHTML += `
                <div class="mb-3">
                    <h5>Audio Processing Options</h5>
                    <button class="btn btn-primary me-2" onclick="preprocessFile('audio')">Preprocess Audio</button>
                    <button class="btn btn-secondary" onclick="augmentFile('audio')">Augment Audio</button>
                </div>
            `;
            break;
        case 'text':
            optionsHTML += `
                <div class="mb-3">
                    <h5>Text Processing Options</h5>
                    <button class="btn btn-primary me-2" onclick="preprocessFile('text')">Preprocess Text</button>
                    <button class="btn btn-secondary" onclick="augmentFile('text')">Augment Text</button>
                </div>
            `;
            break;
        case '3d':
            optionsHTML += `
                <div class="mb-3">
                    <h5>3D Model Processing Options</h5>
                    <button class="btn btn-primary me-2" onclick="preprocessFile('3d')">Preprocess Model</button>
                    <button class="btn btn-secondary" onclick="augmentFile('3d')">Augment Model</button>
                </div>
            `;
            break;
    }
    
    optionsHTML += `</div>`;
    processingOptions.innerHTML = optionsHTML;
    processingOptions.style.display = 'block';
}

async function preprocessFile(fileType) {
    if (!myDropzone.files[0]) {
        showAlert('warning', 'Please upload a file first');
        return;
    }

    showAlert('info', 'Processing file...');

    if (API_CONFIG.isDevelopment) {
        // Use mock response in development
        const mockResponse = MOCK_RESPONSES[fileType].preprocess;
        setTimeout(() => {
            displayProcessedContent(mockResponse, fileType);
            showAlert('success', 'File preprocessed successfully (Development Mode)');
        }, 1000);
        return;
    }

    const formData = new FormData();
    formData.append('file', myDropzone.files[0]);

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints[fileType]}/preprocess`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Preprocessing failed');

        const result = await response.json();
        displayProcessedContent(result, fileType);
        showAlert('success', 'File preprocessed successfully');
    } catch (error) {
        showAlert('danger', 'Error preprocessing file');
        console.error('Preprocessing error:', error);
    }
}

async function augmentFile(fileType) {
    if (!myDropzone.files[0]) {
        showAlert('warning', 'Please upload a file first');
        return;
    }

    showAlert('info', 'Augmenting file...');

    if (API_CONFIG.isDevelopment) {
        // Use mock response in development
        const mockResponse = MOCK_RESPONSES[fileType].augment;
        setTimeout(() => {
            displayAugmentedContent(mockResponse, fileType);
            showAlert('success', 'File augmented successfully (Development Mode)');
        }, 1000);
        return;
    }

    const formData = new FormData();
    formData.append('file', myDropzone.files[0]);

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints[fileType]}/augment`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Augmentation failed');

        const result = await response.json();
        displayAugmentedContent(result, fileType);
        showAlert('success', 'File augmented successfully');
    } catch (error) {
        showAlert('danger', 'Error augmenting file');
        console.error('Augmentation error:', error);
    }
}

function handleUploadProgress(file, progress) {
    if (!API_CONFIG.isDevelopment) {
        showAlert('info', `Uploading: ${Math.round(progress)}%`);
    }
}

function displayContent(response, fileType) {
    switch(fileType) {
        case 'image':
            displayImageContent(response);
            break;
        case 'audio':
            displayAudioContent(response);
            break;
        case 'text':
            displayTextContent(response);
            break;
        case '3d':
            displayThreeDContent(response);
            break;
    }
}

function displayProcessedContent(result, fileType) {
    const container = document.getElementById('processedContent');
    if (!container) return;

    switch(fileType) {
        case 'text':
            container.innerHTML = `
                <div class="text-container">
                    <pre class="text-content">${escapeHtml(result.processed_text)}</pre>
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Processing Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            break;
        case 'image':
            container.innerHTML = `
                <div class="image-container">
                    <img src="data:image/png;base64,${result.processed_image}" 
                         class="img-fluid" alt="Processed image" />
                    <div class="mt-2">
                        <small class="text-muted">
                            Original size: ${result.original_size.join('×')}px<br>
                            Processed size: ${result.processed_size.join('×')}px
                        </small>
                    </div>
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Processing Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            break;
        case 'audio':
            container.innerHTML = `
                <div class="audio-container">
                    <audio controls class="w-100">
                        <source src="data:audio/wav;base64,${result.processed_audio}" type="audio/wav">
                        Your browser does not support the audio element.
                    </audio>
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Processing Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            break;
        case '3d':
            container.innerHTML = `
                <div class="model-container" style="height: 400px;">
                    <div id="processedModelViewer"></div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        Vertices: ${result.statistics.processed_vertices} 
                        (was ${result.statistics.original_vertices})<br>
                        Faces: ${result.statistics.processed_faces} 
                        (was ${result.statistics.original_faces})
                    </small>
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Processing Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            // Initialize 3D viewer for processed model
            if (result.processed_mesh) {
                initThreeDViewer('processedModelViewer', result.processed_mesh);
            }
            break;
    }
}

function displayAugmentedContent(result, fileType) {
    const container = document.getElementById('processedContent');
    if (!container) return;

    switch(fileType) {
        case 'text':
            container.innerHTML = `
                <div class="accordion" id="augmentedTextAccordion">
                    ${Object.entries(result.augmented_texts).map(([name, text], index) => `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                                        type="button" 
                                        data-bs-toggle="collapse" 
                                        data-bs-target="#collapse${name}">
                                    ${name.charAt(0).toUpperCase() + name.slice(1)} Version
                                </button>
                            </h2>
                            <div id="collapse${name}" 
                                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                                 data-bs-parent="#augmentedTextAccordion">
                                <div class="accordion-body">
                                    <pre class="text-content">${escapeHtml(text)}</pre>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Augmentation Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            break;
        case 'image':
            container.innerHTML = `
                <div class="row">
                    ${Object.entries(result.augmented_images).map(([name, imageData]) => `
                        <div class="col-md-6 mb-3">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">${name.charAt(0).toUpperCase() + name.slice(1)}</h6>
                                </div>
                                <div class="card-body">
                                    <img src="data:image/png;base64,${imageData}" 
                                         class="img-fluid" alt="${name}" />
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Augmentation Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            break;
        case 'audio':
            container.innerHTML = `
                <div class="accordion" id="augmentedAudioAccordion">
                    ${Object.entries(result.augmented_audio).map(([name, audioData], index) => `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                                        type="button" 
                                        data-bs-toggle="collapse" 
                                        data-bs-target="#collapse${name}">
                                    ${name.charAt(0).toUpperCase() + name.slice(1)} Version
                                </button>
                            </h2>
                            <div id="collapse${name}" 
                                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                                 data-bs-parent="#augmentedAudioAccordion">
                                <div class="accordion-body">
                                    <audio controls class="w-100">
                                        <source src="data:audio/wav;base64,${audioData}" type="audio/wav">
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Augmentation Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            break;
        case '3d':
            container.innerHTML = `
                <div class="accordion" id="augmented3DAccordion">
                    ${Object.entries(result.augmented_meshes).map(([name, meshData], index) => `
                        <div class="accordion-item">
                            <h2 class="accordion-header">
                                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                                        type="button" 
                                        data-bs-toggle="collapse" 
                                        data-bs-target="#collapse${name}">
                                    ${name.charAt(0).toUpperCase() + name.slice(1)} Version
                                </button>
                            </h2>
                            <div id="collapse${name}" 
                                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                                 data-bs-parent="#augmented3DAccordion">
                                <div class="accordion-body">
                                    <div class="model-container" style="height: 300px;">
                                        <div id="viewer${name}"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${result.steps ? `
                <div class="mt-3">
                    <h6>Augmentation Steps:</h6>
                    <ul class="list-group">
                        ${result.steps.map(step => `
                            <li class="list-group-item">${step}</li>
                        `).join('')}
                    </ul>
                </div>` : ''}
            `;
            // Initialize 3D viewers for each augmented mesh
            Object.entries(result.augmented_meshes).forEach(([name, meshData]) => {
                initThreeDViewer(`viewer${name}`, meshData);
            });
            break;
    }
}

// Remove any duplicate declarations or conflicting scripts