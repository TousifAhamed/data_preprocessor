class ThreeDViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.initScene();
    }

    initScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Create camera
        const width = this.container.clientWidth;
        const height = 400;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);

        // Add controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Start animation loop
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    loadMesh(meshData) {
        // Remove existing mesh if any
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        
        // Add vertices
        const vertices = new Float32Array(meshData.vertices.flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Add faces
        const indices = new Uint32Array(meshData.faces.flat());
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        
        // Add normals if available
        if (meshData.normals) {
            const normals = new Float32Array(meshData.normals.flat());
            geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        } else {
            geometry.computeVertexNormals();
        }

        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            side: THREE.DoubleSide,
            flatShading: false
        });

        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Center and scale the model
        geometry.computeBoundingSphere();
        const center = geometry.boundingSphere.center;
        const radius = geometry.boundingSphere.radius;
        
        this.mesh.position.sub(center);
        const scale = 2 / radius;
        this.mesh.scale.multiplyScalar(scale);

        // Reset camera
        this.camera.position.z = 5;
        this.controls.reset();
    }

    resize() {
        const width = this.container.clientWidth;
        const height = 400;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Function to initialize THREE.js viewer
function initThreeDViewer(containerId, meshData) {
    const viewer = new ThreeDViewer(containerId);
    viewer.loadMesh(meshData);
    return viewer;
}