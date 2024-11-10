export class Settings {
    constructor() {
        this.ballSpeed = 1.0;
        this.handSize = 1.0;
        this.isSettingsOpen = false;
        this.settingsUI = null;
        this.hoverStartTime = null;
        this.initializeUI();
    }

    initializeUI() {
        // Create simple settings button
        const settingsButton = document.createElement('div');
        settingsButton.id = 'settings-button';
        settingsButton.innerHTML = '⚙️';
        settingsButton.style.position = 'absolute';
        settingsButton.style.top = '20px';
        settingsButton.style.right = '20px';
        settingsButton.style.width = '50px';
        settingsButton.style.height = '50px';
        settingsButton.style.background = 'rgba(0, 0, 0, 0.7)';
        settingsButton.style.color = 'white';
        settingsButton.style.borderRadius = '50%';
        settingsButton.style.display = 'flex';
        settingsButton.style.alignItems = 'center';
        settingsButton.style.justifyContent = 'center';
        settingsButton.style.fontSize = '24px';
        settingsButton.style.zIndex = '1000';
        settingsButton.style.cursor = 'pointer';
        document.body.appendChild(settingsButton);

        // Create settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settings-panel';
        settingsPanel.innerHTML = `
            <div class="settings-content">
                <h2>Settings</h2>
                <div class="setting-item">
                    <label>Ball Speed</label>
                    <div class="number-selector">
                        ${this.createNumberButtons('speed', 5)}
                    </div>
                </div>
                <div class="setting-item">
                    <label>Hand Size</label>
                    <div class="number-selector">
                        ${this.createNumberButtons('size', 5)}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(settingsPanel);
        this.settingsUI = settingsPanel;
    }

    createNumberButtons(type, count) {
        let buttons = '';
        for (let i = 1; i <= count; i++) {
            buttons += `<div class="number-button" data-type="${type}" data-value="${i}">${i}</div>`;
        }
        return buttons;
    }

    checkHandPosition(handPositions) {
        const settingsButton = document.getElementById('settings-button');
        const buttonRect = settingsButton.getBoundingClientRect();

        let handNearButton = false;
        for (const hand of Object.values(handPositions)) {
            if (!hand) continue;

            const screenX = ((1 + hand.x) / 2) * window.innerWidth;
            const screenY = ((1 + hand.y) / 2) * window.innerHeight;

            // Check if hand is near the button
            if (screenX >= buttonRect.left - 50 && 
                screenX <= buttonRect.right + 50 &&
                screenY >= buttonRect.top - 50 && 
                screenY <= buttonRect.bottom + 50) {
                
                handNearButton = true;
                break;
            }
        }

        // Handle hover state
        if (handNearButton) {
            if (!this.hoverStartTime) {
                this.hoverStartTime = Date.now();
                settingsButton.style.transform = 'scale(1.5)';
                settingsButton.style.background = 'rgba(255, 0, 0, 0.7)';
            } else if (Date.now() - this.hoverStartTime > 3000) {
                this.toggleSettings();
                this.resetButton();
            }
        } else {
            this.resetButton();
        }
    }

    resetButton() {
        const settingsButton = document.getElementById('settings-button');
        this.hoverStartTime = null;
        settingsButton.style.transform = 'scale(1)';
        settingsButton.style.background = 'rgba(0, 0, 0, 0.7)';
    }

    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
        this.settingsUI.style.display = this.isSettingsOpen ? 'block' : 'none';
    }
} 