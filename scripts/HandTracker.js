export class HandTracker {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.handsVisible = false;
        this.handPositions = { left: null, right: null };
        this.handIndicators = { left: null, right: null };
        this.createHandIndicators();
        this.createDebugDisplay();
    }

    createHandIndicators() {
        // Create camera preview container
        const cameraPreview = document.createElement('div');
        cameraPreview.id = 'camera-preview';
        cameraPreview.style.position = 'absolute';
        cameraPreview.style.bottom = '20px';
        cameraPreview.style.left = '20px';
        cameraPreview.style.width = '320px';
        cameraPreview.style.height = '240px';
        cameraPreview.style.border = '2px solid rgba(255, 0, 0, 0.5)';
        cameraPreview.style.borderRadius = '10px';
        cameraPreview.style.overflow = 'hidden';
        cameraPreview.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        cameraPreview.style.zIndex = '1000';
        document.body.appendChild(cameraPreview);

        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.style.width = '100%';
        videoContainer.style.height = '100%';
        videoContainer.style.transform = 'scaleX(-1)';
        cameraPreview.appendChild(videoContainer);

        // Set up video element with contain instead of cover
        const videoElement = document.getElementById('input-video');
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'contain';
        videoContainer.appendChild(videoElement);

        // Create indicators container that matches video scaling
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.style.position = 'absolute';
        indicatorsContainer.style.top = '0';
        indicatorsContainer.style.left = '0';
        indicatorsContainer.style.width = '100%';
        indicatorsContainer.style.height = '100%';
        indicatorsContainer.style.transform = 'scaleX(-1)';
        indicatorsContainer.style.pointerEvents = 'none';
        cameraPreview.appendChild(indicatorsContainer);

        // Create hand indicators
        const leftHand = document.createElement('div');
        leftHand.className = 'hand-indicator';
        leftHand.style.display = 'none';
        leftHand.style.position = 'absolute';
        leftHand.style.width = '10px';
        leftHand.style.height = '10px';
        leftHand.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        leftHand.style.borderRadius = '50%';
        indicatorsContainer.appendChild(leftHand);

        const rightHand = document.createElement('div');
        rightHand.className = 'hand-indicator';
        rightHand.style.display = 'none';
        rightHand.style.position = 'absolute';
        rightHand.style.width = '10px';
        rightHand.style.height = '10px';
        rightHand.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        rightHand.style.borderRadius = '50%';
        indicatorsContainer.appendChild(rightHand);

        this.handIndicators = {
            left: leftHand,
            right: rightHand
        };
    }

    updateHandIndicators(landmarks, handedness) {
        const previewRect = document.getElementById('camera-preview').getBoundingClientRect();

        landmarks.forEach((hand, index) => {
            const handType = handedness[index].label.toLowerCase();
            const indicator = this.handIndicators[handType];
            
            if (indicator) {
                // Calculate center of palm using multiple landmarks
                // 0: wrist
                // 5, 9, 13, 17: finger MCP joints (base of fingers)
                const centerX = (hand[0].x + hand[5].x + hand[9].x + hand[13].x + hand[17].x) / 5;
                const centerY = (hand[0].y + hand[5].y + hand[9].y + hand[13].y + hand[17].y) / 5;

                // Convert to preview coordinates
                const x = centerX * previewRect.width;
                const y = centerY * previewRect.height;

                indicator.style.display = 'block';
                // Adjust for indicator size to center it
                indicator.style.transform = `translate(${x - indicator.offsetWidth/2}px, ${y - indicator.offsetHeight/2}px)`;
                indicator.style.width = '10px';  // Made smaller for more precise indication
                indicator.style.height = '10px'; // Made smaller for more precise indication
                indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            }
        });

        // Hide indicators for hands that are not visible
        if (landmarks.length === 0) {
            this.handIndicators.left.style.display = 'none';
            this.handIndicators.right.style.display = 'none';
        } else if (landmarks.length === 1) {
            const visibleHand = handedness[0].label.toLowerCase();
            const hiddenHand = visibleHand === 'left' ? 'right' : 'left';
            this.handIndicators[hiddenHand].style.display = 'none';
        }
    }

    async initialize() {
        await this.waitForMediaPipe();

        const hands = new window.Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults(this.onResults.bind(this));

        // Check if navigator.mediaDevices exists
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Your browser does not support getUserMedia API');
            alert('Your browser does not support camera access. Please use a modern browser.');
            return;
        }

        try {
            // Create video constraints with minimum zoom
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };

            const camera = new window.Camera(document.querySelector('video'), {
                onFrame: async () => {
                    await hands.send({image: document.querySelector('video')});
                },
                width: 1280,
                height: 720
            });

            // Try to apply constraints directly to video element
            const videoElement = document.querySelector('video');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoElement.srcObject = stream;

            this.hands = hands;
            this.camera = camera;
            await camera.start();

        } catch (err) {
            console.error('Error initializing camera:', err);
            alert('Could not access your camera. Please make sure you have a camera connected and have granted permission to use it.');
        }
    }

    // Add helper method to wait for MediaPipe to load
    waitForMediaPipe() {
        return new Promise((resolve) => {
            if (window.Hands && window.Camera) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.Hands && window.Camera) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    onResults(results) {
        this.handsVisible = results.multiHandLandmarks.length > 0;
        this.handPositions = this.processHandPositions(results.multiHandLandmarks, results.multiHandedness);
        
        // Update hand indicators
        this.updateHandIndicators(results.multiHandLandmarks, results.multiHandedness);
        
        // Update debug info with current hand positions
        this.updateDebugInfo(this.handPositions);
        
        const warningElement = document.getElementById('warning-message');
        warningElement.style.display = this.handsVisible ? 'none' : 'block';
    }

    processHandPositions(landmarks, handedness) {
        const positions = { left: null, right: null };
        
        if (!landmarks.length) return positions;

        landmarks.forEach((hand, index) => {
            // Calculate palm center using multiple landmarks
            const palmX = (hand[0].x + hand[5].x + hand[17].x) / 3;
            const palmY = (hand[0].y + hand[5].y + hand[17].y) / 3;
            const palmZ = (hand[0].z + hand[5].z + hand[17].z) / 3;

            // Map coordinates to screen space directly
            const palmPosition = {
                x: -((palmX - 0.5) * 2),  // Flip for mirrored view
                y: -((palmY - 0.5) * 2),  // Flip Y coordinate
                z: palmZ
            };

            const handType = handedness[index].label.toLowerCase();
            positions[handType] = palmPosition;
        });

        return positions;
    }

    createDebugDisplay() {
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        debugInfo.style.position = 'absolute';
        debugInfo.style.top = '10px';
        debugInfo.style.left = '50%';
        debugInfo.style.transform = 'translateX(-50%)';
        debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        debugInfo.style.color = 'rgba(0, 255, 0, 0.7)';
        debugInfo.style.padding = '15px';
        debugInfo.style.borderRadius = '5px';
        debugInfo.style.fontFamily = 'monospace';
        debugInfo.style.fontSize = '16px';
        debugInfo.style.zIndex = '2000';
        debugInfo.style.width = '400px';
        debugInfo.style.textAlign = 'left';
        debugInfo.style.backdropFilter = 'blur(5px)';
        document.body.appendChild(debugInfo);
    }

    updateDebugInfo(handPositions) {
        const debugInfo = document.getElementById('debug-info');
        const settingsButton = document.getElementById('settings-button');
        const buttonRect = settingsButton.getBoundingClientRect();
        
        let debugText = '<span style="opacity: 0.8">Debug Information:</span><br><br>';
        
        // Settings button position
        debugText += '<span style="opacity: 0.8">Settings Button:</span><br>';
        debugText += `<span style="opacity: 0.6">Left: ${Math.round(buttonRect.left)}, Top: ${Math.round(buttonRect.top)}</span><br>`;
        debugText += `<span style="opacity: 0.6">Right: ${Math.round(buttonRect.right)}, Bottom: ${Math.round(buttonRect.bottom)}</span><br><br>`;
        
        // Hand positions
        debugText += '<span style="opacity: 0.8">Hand Positions:</span><br>';
        for (const [handType, pos] of Object.entries(handPositions)) {
            if (pos) {
                const screenX = ((1 + pos.x) / 2) * window.innerWidth;
                const screenY = ((1 + pos.y) / 2) * window.innerHeight;
                debugText += `<span style="opacity: 0.8">${handType.toUpperCase()} Hand:</span><br>`;
                debugText += `<span style="opacity: 0.6">Raw (x, y): (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})</span><br>`;
                debugText += `<span style="opacity: 0.6">Screen (x, y): (${Math.round(screenX)}, ${Math.round(screenY)})</span><br><br>`;
            }
        }

        debugInfo.innerHTML = debugText;
    }

    checkHandPosition(handPositions) {
        const settingsButton = document.getElementById('settings-button');
        const buttonRect = settingsButton.getBoundingClientRect();
        
        // Update debug info
        this.updateDebugInfo(handPositions);

        let handNearButton = false;
        for (const hand of Object.values(handPositions)) {
            if (!hand) continue;

            // Convert normalized coordinates to screen coordinates
            const screenX = ((1 + hand.x) / 2) * window.innerWidth;
            const screenY = ((1 + hand.y) / 2) * window.innerHeight;

            // Calculate distance from hand to button center
            const distance = Math.sqrt(
                Math.pow(screenX - buttonRect.left, 2) +
                Math.pow(screenY - buttonRect.top, 2)
            );

            // Increased detection radius and added debug visualization
            const detectionRadius = 100; // Increased from 70
            if (distance < detectionRadius) {
                handNearButton = true;
                
                // Add visual feedback when hand is near button
                settingsButton.style.transform = 'scale(1.2)';
                settingsButton.style.background = 'rgba(255, 0, 0, 0.7)';
                break;
            }
        }

        if (!handNearButton) {
            // Reset button appearance when no hand is near
            settingsButton.style.transform = 'scale(1)';
            settingsButton.style.background = 'rgba(0, 0, 0, 0.7)';
        }

        if (handNearButton) {
            if (!this.hoverStartTime) {
                this.hoverStartTime = Date.now();
                // Add visual feedback for hover start
                settingsButton.style.transition = 'all 0.3s ease';
            } else if (Date.now() - this.hoverStartTime > 3000) { // 3 seconds
                this.toggleSettings();
                this.hoverStartTime = null;
                // Reset button appearance
                settingsButton.style.transform = 'scale(1)';
                settingsButton.style.background = 'rgba(0, 0, 0, 0.7)';
            }
        } else {
            this.hoverStartTime = null;
        }

        if (this.isSettingsOpen) {
            this.checkSettingsSelection(handPositions);
        }
    }

    getHandPositions() {
        return this.handPositions;
    }

    isHandsVisible() {
        return this.handsVisible;
    }

    isSettingsGestureDetected() {
        if (!this.hands || !this.hands.multiHandLandmarks) return false;

        for (let i = 0; i < this.hands.multiHandLandmarks.length; i++) {
            const landmarks = this.hands.multiHandLandmarks[i];
            if (!landmarks) continue;

            // Check if only index finger is up
            const indexFingerUp = landmarks[8].y < landmarks[6].y;
            const otherFingersDown = 
                landmarks[12].y > landmarks[10].y && // middle finger
                landmarks[16].y > landmarks[14].y && // ring finger
                landmarks[20].y > landmarks[18].y;   // pinky

            if (indexFingerUp && otherFingersDown) {
                return true;
            }
        }
        return false;
    }
} 