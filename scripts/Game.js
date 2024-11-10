import * as THREE from 'three';
import { Ball } from './Ball.js';
import { Player } from './Player.js';
import { HandTracker } from './HandTracker.js';
import { Settings } from './Settings.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ball = null;
        this.player = null;
        this.handTracker = null;
        this.settings = null;
        this.score = 0;
        this.missedBalls = 0;
        this.countdownDisplay = null;
        this.cameraSpeed = 0.1;
        this.goalDimensions = {
            width: 7,    // Goal width
            height: 5,   // Goal height
            depth: 0.1,  // Goal post thickness
            distance: 10 // Distance from camera
        };
        this.initializeScoreUI();
        this.createCountdownDisplay();
    }

    initializeScoreUI() {
        const scoreElement = document.createElement('div');
        scoreElement.id = 'score-display';
        scoreElement.innerHTML = `
            <div>Score: <span id="score">0</span></div>
            <div>Missed: <span id="missed">0</span></div>
        `;
        document.body.appendChild(scoreElement);
    }

    createCountdownDisplay() {
        const countdownElement = document.createElement('div');
        countdownElement.id = 'countdown-display';
        countdownElement.style.display = 'none';
        document.body.appendChild(countdownElement);
    }

    async initialize() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Set up camera with goalkeeper's perspective
        this.camera = new THREE.PerspectiveCamera(
            90,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x87CEEB, 1);
        this.renderer.shadowMap.enabled = true;

        // Set exact camera position from coordinates
        this.camera.position.set(
            0,                          // x
            0.8999999999999992,        // y
            -6.799999999999991         // z
        );
        this.camera.lookAt(0, 0, -20); // Look towards the field

        // Now that camera is initialized, add controls and display
        this.addCameraControls();
        this.addCameraPositionDisplay();

        // Add basic lighting first
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);

        // Initialize settings
        this.settings = new Settings();

        // Add environment
        this.setupEnvironment();

        // Initialize game objects
        this.ball = new Ball(this.scene, this.goalDimensions);
        this.player = new Player(this.scene, this.goalDimensions);
        this.handTracker = new HandTracker();
        await this.handTracker.initialize();

        // Start animation loop immediately
        this.animate();

        // Log scene contents for debugging
        console.log('Scene contents:', this.scene);
        console.log('Camera position:', this.camera.position);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupEnvironment() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x3c8f3c,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        this.scene.add(ground);

        // Add a large box for visual reference
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(0, 0, -5);
        this.scene.add(box);

        // Create goal posts
        this.createGoalPosts();

        // Add axes helper for debugging
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Add grid helper for reference
        const gridHelper = new THREE.GridHelper(20, 20);
        this.scene.add(gridHelper);
    }

    createGoalPosts() {
        const postMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            emissive: 0x111111
        });
        const postRadius = 0.1;

        // Left post
        const leftPost = new THREE.Mesh(
            new THREE.CylinderGeometry(postRadius, postRadius, this.goalDimensions.height),
            postMaterial
        );
        leftPost.position.set(
            -this.goalDimensions.width/2,
            -2 + this.goalDimensions.height/2,
            -this.goalDimensions.distance
        );
        leftPost.castShadow = true;
        this.scene.add(leftPost);

        // Right post
        const rightPost = new THREE.Mesh(
            new THREE.CylinderGeometry(postRadius, postRadius, this.goalDimensions.height),
            postMaterial
        );
        rightPost.position.set(
            this.goalDimensions.width/2,
            -2 + this.goalDimensions.height/2,
            -this.goalDimensions.distance
        );
        rightPost.castShadow = true;
        this.scene.add(rightPost);

        // Crossbar
        const crossbar = new THREE.Mesh(
            new THREE.CylinderGeometry(postRadius, postRadius, this.goalDimensions.width),
            postMaterial
        );
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(
            0,
            -2 + this.goalDimensions.height,
            -this.goalDimensions.distance
        );
        crossbar.castShadow = true;
        this.scene.add(crossbar);

        // Goal area visualization
        const goalAreaGeometry = new THREE.PlaneGeometry(
            this.goalDimensions.width,
            this.goalDimensions.height
        );
        const goalAreaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.goalArea = new THREE.Mesh(goalAreaGeometry, goalAreaMaterial);
        this.goalArea.position.set(
            0,
            -2 + this.goalDimensions.height/2,
            -this.goalDimensions.distance
        );
        this.scene.add(this.goalArea);
    }

    addInstructions() {
        const instructions = document.createElement('div');
        instructions.id = 'instructions';
        instructions.innerHTML = `
            <div class="instruction-item">🎯 Stop the ball before it reaches the red zone!</div>
            <div class="instruction-item">⚙️ Hold your hand over the settings icon for 3 seconds to open settings</div>
            <div class="instruction-item">✋ Keep your hands in the camera view</div>
        `;
        document.body.appendChild(instructions);

        // Hide instructions after 10 seconds
        setTimeout(() => {
            instructions.style.opacity = '0';
            setTimeout(() => instructions.remove(), 1000);
        }, 10000);
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('missed').textContent = this.missedBalls;
    }

    startCountdown() {
        const countdownElement = document.getElementById('countdown-display');
        countdownElement.style.display = 'block';
        
        let count = 3;
        countdownElement.textContent = count;

        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count;
            } else {
                countdownElement.textContent = 'SHOOT!';
                this.ball.startMoving();
                setTimeout(() => {
                    countdownElement.style.display = 'none';
                }, 1000);
                clearInterval(countInterval);
            }
        }, 1000);
    }

    animate() {
        // Ensure animation loop is running
        requestAnimationFrame(this.animate.bind(this));

        // Log camera position periodically for debugging
        if (Math.random() < 0.01) {
            console.log('Camera position:', this.camera.position);
            console.log('Scene is rendering:', this.scene.children.length, 'objects');
        }

        // Update game state
        const handPositions = this.handTracker.getHandPositions();
        this.settings.checkHandPosition(handPositions);
        this.player.updateHandPositions(handPositions);
        this.ball.update(this.settings.ballSpeed);

        // Check collisions
        if (this.ball.checkCollision(handPositions)) {
            this.score += 1;
            this.updateScore();
            this.ball.resetPosition();
            this.startCountdown();
        } else if (this.ball.isGoal()) {
            this.missedBalls += 1;
            this.updateScore();
            this.ball.resetPosition();
            this.startCountdown();
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    addCameraControls() {
        // WASD controls for camera
        document.addEventListener('keydown', (event) => {
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.camera.position.z -= this.cameraSpeed;
                    break;
                case 's':
                    this.camera.position.z += this.cameraSpeed;
                    break;
                case 'a':
                    this.camera.position.x -= this.cameraSpeed;
                    break;
                case 'd':
                    this.camera.position.x += this.cameraSpeed;
                    break;
                case 'q': // Up
                    this.camera.position.y += this.cameraSpeed;
                    break;
                case 'e': // Down
                    this.camera.position.y -= this.cameraSpeed;
                    break;
                case 'r': // Reset camera
                    this.resetCamera();
                    break;
                case 'c': // Copy position to clipboard
                    this.copyCameraPosition();
                    break;
            }
            this.updateCameraPositionDisplay();
        });
    }

    addCameraPositionDisplay() {
        const posDisplay = document.createElement('div');
        posDisplay.id = 'camera-position';
        posDisplay.style.position = 'absolute';
        posDisplay.style.top = '60px';
        posDisplay.style.left = '20px';
        posDisplay.style.color = 'white';
        posDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        posDisplay.style.padding = '10px';
        posDisplay.style.borderRadius = '5px';
        posDisplay.style.fontFamily = 'monospace';
        posDisplay.style.fontSize = '14px';
        posDisplay.style.zIndex = '1000';
        document.body.appendChild(posDisplay);
        this.updateCameraPositionDisplay();
    }

    updateCameraPositionDisplay() {
        const posDisplay = document.getElementById('camera-position');
        posDisplay.innerHTML = `
            Camera Position:<br>
            X: ${this.camera.position.x.toFixed(2)}<br>
            Y: ${this.camera.position.y.toFixed(2)}<br>
            Z: ${this.camera.position.z.toFixed(2)}<br>
            <br>
            Controls:<br>
            WASD: Move camera<br>
            Q/E: Up/Down<br>
            R: Reset camera<br>
            C: Copy position
        `;
    }

    resetCamera() {
        this.camera.position.set(
            0,                          // x
            0.8999999999999992,        // y
            -6.799999999999991         // z
        );
        this.camera.lookAt(0, 0, -20);
        this.updateCameraPositionDisplay();
    }

    copyCameraPosition() {
        const position = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };
        const positionString = JSON.stringify(position, null, 2);
        navigator.clipboard.writeText(positionString);
        
        // Show feedback
        const feedback = document.createElement('div');
        feedback.style.position = 'absolute';
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
        feedback.style.padding = '10px';
        feedback.style.borderRadius = '5px';
        feedback.style.color = 'white';
        feedback.textContent = 'Camera position copied!';
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
} 