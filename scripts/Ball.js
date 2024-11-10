import * as THREE from 'three';

export class Ball {
    constructor(scene, goalDimensions) {
        this.scene = scene;
        this.mesh = null;
        this.isMoving = false;
        this.countdown = 3;
        this.goalDimensions = goalDimensions;
        this.initialize();
    }

    initialize() {
        // Create a more visible ball
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            shininess: 100
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.resetPosition();
        this.scene.add(this.mesh);

        // Add black pentagon patterns
        this.addPatterns();
    }

    addPatterns() {
        const patternGeometry = new THREE.SphereGeometry(0.201, 32, 32);
        const patternMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 100
        });
        
        for (let i = 0; i < 12; i++) {
            const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
            pattern.scale.setScalar(0.2);
            pattern.position.x = Math.sin(i * Math.PI / 6) * 0.15;
            pattern.position.y = Math.cos(i * Math.PI / 6) * 0.15;
            this.mesh.add(pattern);
        }
    }

    resetPosition() {
        // Calculate random position within goal area
        const spreadX = this.goalDimensions.width * 0.8; // 80% of goal width
        const spreadY = this.goalDimensions.height * 0.8; // 80% of goal height
        
        const randomX = (Math.random() - 0.5) * spreadX;
        const randomY = Math.random() * spreadY + 1; // Add 1 to raise minimum height
        
        // Position ball far behind goal
        this.mesh.position.set(
            randomX,
            randomY,
            -this.goalDimensions.distance - 10 // Start further back
        );

        // Reset scale
        this.mesh.scale.set(1, 1, 1);
        
        // Calculate trajectory
        const targetX = randomX * 0.1; // Slight curve
        const targetY = randomY * 0.1;
        
        // Set velocity for smooth motion
        this.velocity = {
            x: (targetX - randomX) / 100,
            y: (targetY - randomY) / 100,
            z: 0.15 // Slower forward speed
        };
        
        this.isMoving = false;
        this.countdown = 3;

        // Show countdown
        this.showCountdown();
    }

    showCountdown() {
        const countdownElement = document.getElementById('countdown-display');
        countdownElement.style.display = 'block';
        countdownElement.textContent = this.countdown;

        const countInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown > 0) {
                countdownElement.textContent = this.countdown;
            } else {
                countdownElement.textContent = 'SHOOT!';
                this.startMoving();
                setTimeout(() => {
                    countdownElement.style.display = 'none';
                }, 1000);
                clearInterval(countInterval);
            }
        }, 1000);
    }

    startMoving() {
        this.isMoving = true;
    }

    update(speed = 1.0) {
        if (!this.isMoving) return;

        // Update position
        this.mesh.position.x += this.velocity.x * speed;
        this.mesh.position.y += this.velocity.y * speed;
        this.mesh.position.z += this.velocity.z * speed;

        // Add rotation for realism
        this.mesh.rotation.x += 0.05;
        this.mesh.rotation.y += 0.05;

        // Scale ball based on distance for depth effect
        const distanceFromStart = this.mesh.position.z + this.goalDimensions.distance + 10;
        const scale = 1 + (distanceFromStart * 0.05);
        this.mesh.scale.set(scale, scale, scale);
    }

    checkCollision(handPositions) {
        if (!this.isMoving || !handPositions.left && !handPositions.right) return false;

        const ballPos = this.mesh.position;
        const threshold = 1.2; // Increased threshold for easier catching

        // Only check collision when ball is near the goal
        if (ballPos.z < -this.goalDimensions.distance - 2 || ballPos.z > 0) return false;

        for (const hand of Object.values(handPositions)) {
            if (!hand) continue;

            // Transform hand coordinates to match goal dimensions
            const handX = hand.x * (this.goalDimensions.width / 2);
            const handY = (hand.y + 1) * (this.goalDimensions.height / 2) - 2;
            const handZ = -this.goalDimensions.distance + 0.5;

            // Calculate 3D distance between ball and hand
            const distance = Math.sqrt(
                Math.pow(ballPos.x - handX, 2) +
                Math.pow(ballPos.y - handY, 2) +
                Math.pow(ballPos.z - handZ, 2)
            );

            // Debug collision information
            console.log('Ball position:', ballPos);
            console.log('Hand position:', { x: handX, y: handY, z: handZ });
            console.log('Distance:', distance);

            if (distance < threshold) {
                this.showCatchEffect();
                return true;
            }
        }

        return false;
    }

    showCatchEffect() {
        const burstGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.7
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.copy(this.mesh.position);
        this.scene.add(burst);

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 500) {
                this.scene.remove(burst);
                return;
            }
            burst.scale.multiplyScalar(1.05);
            burst.material.opacity -= 0.02;
            requestAnimationFrame(animate);
        };
        animate();
    }

    isGoal() {
        return this.mesh.position.z > 0;
    }
} 