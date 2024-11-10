import * as THREE from 'three';

export class Player {
    constructor(scene, goalDimensions) {
        this.scene = scene;
        this.goalDimensions = goalDimensions;
        this.hands = {
            left: null,
            right: null
        };
        this.initialize();
    }

    initialize() {
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });

        this.hands.left = new THREE.Mesh(geometry, material);
        this.hands.right = new THREE.Mesh(geometry, material);

        this.scene.add(this.hands.left);
        this.scene.add(this.hands.right);
    }

    updateHandPositions(handPositions) {
        // Map hand positions to goal area
        if (handPositions.left) {
            const mappedPos = this.mapHandToGoal(handPositions.left);
            this.hands.left.position.set(mappedPos.x, mappedPos.y, mappedPos.z);
        }

        if (handPositions.right) {
            const mappedPos = this.mapHandToGoal(handPositions.right);
            this.hands.right.position.set(mappedPos.x, mappedPos.y, mappedPos.z);
        }
    }

    mapHandToGoal(handPos) {
        // Map x from [-1, 1] to goal width
        const x = handPos.x * (this.goalDimensions.width / 2);
        
        // Map y from [-1, 1] to goal height, accounting for ground offset
        const y = (handPos.y + 1) * (this.goalDimensions.height / 2) - 2;
        
        // Set z slightly in front of goal
        const z = -(this.goalDimensions.distance - 0.5);

        return { x, y, z };
    }
} 