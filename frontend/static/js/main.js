const API_CONFIG = {
    baseUrl: 'http://localhost:8000',
    endpoints: {
        csrf: '/api/v1/csrf-token',
        upload: '/api/v1/upload',
        image: '/api/v1/image',
        audio: '/api/v1/audio',
        text: '/api/v1/text',
        threeD: '/api/v1/3d'
    },
    isDevelopment: false
};

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
        autoProcessQueue: true,
        createImageThumbnails: true,
        init: function() {
            this.on("addedfile", handleFileAdded);
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
        container.innerHTML = `
            <div class="model-container">
                <div id="originalModelViewer" style="height: 400px; width: 100%;"></div>
                <div class="mt-2">
                    <small class="text-muted">
                        Vertices: ${response.validation.vertex_count}<br>
                        Faces: ${response.validation.face_count}<br>
                        Watertight: ${response.validation.is_watertight ? 'Yes' : 'No'}
                    </small>
                </div>
            </div>`;

        setTimeout(() => {
            const viewer = new ThreeDViewer('originalModelViewer');
            viewer.loadMesh(response.mesh_data);
        }, 100);
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
        case 'threeD':
            optionsHTML += `
                <div class="mb-3">
                    <h5>3D Model Processing Options</h5>
                    <button class="btn btn-primary me-2" onclick="preprocessFile('threeD')">Preprocess Model</button>
                    <button class="btn btn-secondary" onclick="augmentFile('threeD')">Augment Model</button>
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

    const formData = new FormData();
    formData.append('file', myDropzone.files[0]);

    if (fileType === 'threeD') {
        formData.append('remove_duplicates', true);
        formData.append('fix_normals', true);
        formData.append('fill_holes', true);
    }

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints[fileType]}/preprocess`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
            mode: 'cors',
            credentials: 'same-origin'
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
        case 'threeD':
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
                    ${result.steps ? `
                    <div class="mt-3">
                        <h6>Processing Steps:</h6>
                        <ul class="list-group">
                            ${result.steps.map(step => `
                                <li class="list-group-item">${step}</li>
                            `).join('')}
                        </ul>
                    </div>` : ''}
                </div>`;
            break;

        case 'threeD':
            container.innerHTML = `
                <div class="model-container">
                    <div id="processedModelViewer" style="height: 400px; width: 100%;"></div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <strong>Statistics:</strong><br>
                            Original Vertices: ${result.statistics.original.vertices}<br>
                            Processed Vertices: ${result.statistics.processed.vertices}<br>
                            Original Faces: ${result.statistics.original.faces}<br>
                            Processed Faces: ${result.statistics.processed.faces}<br>
                            ${result.statistics.improvements.vertices_reduced > 0 ? 
                                `Vertices Reduced: ${result.statistics.improvements.vertices_reduced}<br>` : ''}
                            ${result.statistics.improvements.faces_reduced > 0 ? 
                                `Faces Reduced: ${result.statistics.improvements.faces_reduced}<br>` : ''}
                            Watertight: ${result.statistics.processed.is_watertight ? 'Yes' : 'No'}
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
                </div>`;
            
            // Initialize the 3D viewer with the processed mesh data
            setTimeout(() => {
                const viewer = new ThreeDViewer('processedModelViewer');
                viewer.loadMesh(result.processed_mesh);
            }, 100);
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
        case 'threeD':
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