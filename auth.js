// auth.js - Password Protection System
const ADMIN_CONFIG = {
    password: "admin@renwar2026", // GANTI DENGAN PASSWORD KUAT ANDA
    maxAttempts: 3,
    lockoutTime: 300000, // 5 menit dalam milidetik
    sessionDuration: 3600000 // 1 jam dalam milidetik
};

class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        // Cek jika halaman adalah admin.html
        if (window.location.pathname.includes('admin.html')) {
            this.checkAuth();
        }
    }

    checkAuth() {
        const attempts = parseInt(localStorage.getItem('login_attempts') || '0');
        const lockoutUntil = parseInt(localStorage.getItem('lockout_until') || '0');
        const sessionExpiry = parseInt(localStorage.getItem('session_expiry') || '0');
        
        // Cek lockout
        if (Date.now() < lockoutUntil) {
            const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
            this.showLockoutMessage(minutesLeft);
            return;
        }
        
        // Cek session valid
        if (sessionExpiry > Date.now()) {
            return; // Session masih valid
        }
        
        // Minta password
        this.showPasswordPrompt();
    }

    showPasswordPrompt() {
        const html = `
            <div id="auth-overlay" style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <div style="margin-bottom: 30px;">
                        <div style="
                            background: #3498db;
                            color: white;
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                            font-weight: bold;
                            font-size: 24px;
                        ">RP</div>
                        <h2 style="margin: 0 0 10px 0; color: #2c3e50;">Admin Access</h2>
                        <p style="color: #7f8c8d; margin: 0;">Renwar Photobox Admin Panel</p>
                    </div>
                    
                    <div id="error-message" style="
                        color: #e74c3c;
                        background: #fadbd8;
                        padding: 10px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                        display: none;
                    "></div>
                    
                    <input type="password" id="admin-password" placeholder="Enter admin password" style="
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 16px;
                        margin-bottom: 20px;
                        transition: border 0.3s;
                        font-family: 'Poppins', sans-serif;
                    ">
                    
                    <button onclick="authManager.login()" style="
                        width: 100%;
                        padding: 15px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.3s;
                        font-family: 'Poppins', sans-serif;
                    ">Login</button>
                    
                    <div style="margin-top: 20px; color: #95a5a6; font-size: 12px;">
                        <i class="fas fa-lock"></i> Protected Area
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', html);
    }

    showLockoutMessage(minutes) {
        const html = `
            <div id="auth-overlay" style="
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                ">
                    <div style="margin-bottom: 30px;">
                        <div style="
                            background: #e74c3c;
                            color: white;
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                            font-size: 24px;
                        "><i class="fas fa-lock"></i></div>
                        <h2 style="margin: 0 0 10px 0; color: #2c3e50;">Access Locked</h2>
                        <p style="color: #7f8c8d; margin: 0;">
                            Too many failed attempts. Please try again in ${minutes} minutes.
                        </p>
                    </div>
                    
                    <button onclick="window.location.href='index.html'" style="
                        padding: 12px 30px;
                        background: #95a5a6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        cursor: pointer;
                        font-family: 'Poppins', sans-serif;
                    ">Go to Homepage</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', html);
    }

    login() {
        const passwordInput = document.getElementById('admin-password');
        const password = passwordInput.value;
        const errorDiv = document.getElementById('error-message');
        
        let attempts = parseInt(localStorage.getItem('login_attempts') || '0');
        
        if (password === ADMIN_CONFIG.password) {
            // Reset attempts
            localStorage.removeItem('login_attempts');
            localStorage.removeItem('lockout_until');
            
            // Set session
            const expiryTime = Date.now() + ADMIN_CONFIG.sessionDuration;
            localStorage.setItem('session_expiry', expiryTime);
            
            // Remove overlay
            document.getElementById('auth-overlay')?.remove();
        } else {
            attempts++;
            localStorage.setItem('login_attempts', attempts);
            
            if (attempts >= ADMIN_CONFIG.maxAttempts) {
                // Set lockout
                const lockoutTime = Date.now() + ADMIN_CONFIG.lockoutTime;
                localStorage.setItem('lockout_until', lockoutTime);
                this.showLockoutMessage(Math.ceil(ADMIN_CONFIG.lockoutTime / 60000));
            } else {
                // Show error
                errorDiv.textContent = `Incorrect password. ${ADMIN_CONFIG.maxAttempts - attempts} attempts remaining.`;
                errorDiv.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    logout() {
        localStorage.removeItem('session_expiry');
        window.location.reload();
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Auto logout after session expiry
setInterval(() => {
    const sessionExpiry = parseInt(localStorage.getItem('session_expiry') || '0');
    if (sessionExpiry > 0 && Date.now() > sessionExpiry) {
        authManager.logout();
    }
}, 60000); // Check every minute