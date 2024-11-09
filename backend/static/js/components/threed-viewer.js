class ThreeDViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.initScene();
        this.setupEventListeners();
    }

    initScene() {
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Set up camera
        const width = this.container.clientWidth;
        const height = 400; // Fixed height
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        // Set up controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);

        // Start animation loop
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    async handleFileUpload(response) {
        try {
            const meshData = response.mesh_data;
            if (!meshData) {
                throw new Error('No mesh data received');
            }

            // Create geometry
            const geometry = new THREE.BufferGeometry();
            
            // Set vertices
            const vertices = new Float32Array(meshData.vertices.flat());
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            // Set faces
            const indices = new Uint32Array(meshData.faces.flat());
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            
            // Calculate normals
            geometry.computeVertexNormals();
            
            // Create mesh
            const material = new THREE.MeshPhongMaterial({
                color: 0x808080,
                side: THREE.DoubleSide
            });
            
            if (this.mesh) {
                this.scene.remove(this.mesh);
            }
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);
            
            // Center and scale the model
            geometry.computeBoundingSphere();
            const center = geometry.boundingSphere.center;
            const radius = geometry.boundingSphere.radius;
            
            this.mesh.position.sub(center);
            const scale = 2 / radius;
            this.mesh.scale.multiplyScalar(scale);
            
            // Update camera
            this.camera.position.z = 5;
            this.controls.reset();
            
            // Display model info
            this.displayModelInfo(response.validation);
            
        } catch (error) {
            console.error('Error loading 3D model:', error);
            showAlert('danger', 'Error loading 3D model');
        }
    }

    displayModelInfo(validation) {
        const infoDiv = document.getElementById('originalModelInfo');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <div class="card mt-2">
                    <div class="card-body">
                        <p><strong>Vertices:</strong> ${validation.vertex_count}</p>
                        <p><strong>Faces:</strong> ${validation.face_count}</p>
                        <p><strong>Watertight:</strong> ${validation.is_watertight ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            `;
        }
    }
}