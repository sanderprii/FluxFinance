class AuthManager {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.isSigningUp = false; // Track if we're in sign-up mode
        // Wait a bit to ensure storage is set
        setTimeout(() => {
            this.init();
        }, 100);
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.setupRouting();
    }

    checkAuthentication() {
        const token = localStorage.getItem('auth-token');
        const overlay = document.getElementById('signInOverlay');
        const mainContent = document.getElementById('mainContent');
        const path = window.location.pathname;

        console.log('Checking auth, token:', token, 'path:', path); // Debug log

        if (token && token === 'valid-token') {
            // User is authenticated
            overlay.classList.add('hidden');
            this.showContent();
        } else {
            // User is not authenticated
            if (path === '/') {
                // On homepage, hide overlay and show login form in page
                overlay.classList.add('hidden');
                this.showHomepageWithAuth();
            } else {
                // On protected pages, show overlay
                overlay.classList.remove('hidden');
                mainContent.style.filter = 'blur(5px)';
            }
        }
    }

    showHomepageWithAuth() {
        const mainContent = document.getElementById('mainContent');
        mainContent.style.filter = 'none';

        const pageTitle = document.getElementById('pageTitle');
        const contentArea = document.getElementById('contentArea');

        pageTitle.textContent = 'FluxFinance';
        contentArea.innerHTML = `
            <div class="homepage">
                <h2>Welcome to FluxFinance</h2>
                <p>Please sign in to access your account or create a new one.</p>
                
                <div class="auth-buttons">
                    <button id="signInBtn" class="btn">Sign In</button>
                 
                </div>
                
                <div id="homeSignInForm" class="home-sign-in-form" style="display: none;">
                    <h3 id="formTitle">Sign In</h3>
                    <form id="homeSignInFormElement">
                        <div class="form-group">
                            <label for="homeEmail">Email:</label>
                            <input type="email" id="homeEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="homePassword">Password:</label>
                            <input type="password" id="homePassword" name="password" required>
                        </div>
                        <button type="submit" id="submitBtn">Sign In</button>
                        <div id="homeErrorMessage" class="error-message"></div>
                        <div id="homeSuccessMessage" class="success-message" style="display: none;"></div>
                    </form>
                </div>
            </div>
        `;

        // Setup homepage specific events
        this.setupHomepageEvents();
    }

    setupHomepageEvents() {
        const signInBtn = document.getElementById('signInBtn');
        const signUpBtn = document.getElementById('signUpBtn');
        const homeSignInForm = document.getElementById('homeSignInForm');
        const homeSignInFormElement = document.getElementById('homeSignInFormElement');
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');

        signInBtn?.addEventListener('click', () => {
            this.isSigningUp = false;
            formTitle.textContent = 'Sign In';
            submitBtn.textContent = 'Sign In';
            homeSignInForm.style.display = 'block';
        });



        homeSignInFormElement?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.isSigningUp) {
                await this.handleHomeSignUp(e);
            } else {
                await this.handleHomeSignIn(e);
            }
        });
    }



    async handleHomeSignIn(event) {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const errorMessage = document.getElementById('homeErrorMessage');
        const successMessage = document.getElementById('homeSuccessMessage');
        const submitButton = event.target.querySelector('button[type="submit"]');

        console.log('Attempting homepage sign-in with:', email); // Debug log

        // Reset error message
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';

        try {
            const response = await fetch('/api/sign-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Store authentication token
                localStorage.setItem('auth-token', data.token);

                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                // Show error message
                errorMessage.textContent = data.message || 'Email or password is incorrect';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    }

    showContent() {
        const mainContent = document.getElementById('mainContent');
        mainContent.style.filter = 'none';

        // Set content based on current path
        const path = window.location.pathname;
        const pageTitle = document.getElementById('pageTitle');
        const contentArea = document.getElementById('contentArea');

        if (path === '/invoices') {
            pageTitle.textContent = 'Invoices';
            contentArea.innerHTML = `
                <div class="invoices-page">
                    <p>invoices</p>
                    <button onclick="logout()">Logout</button>
                </div>
            `;
        } else if (path.includes('/invoices/')) {
            const invoiceId = path.split('/')[2];
            pageTitle.textContent = `Invoice #${invoiceId}`;
            contentArea.innerHTML = `
                <div class="invoice-details">
                    <p>Invoice details for #${invoiceId} would go here.</p>
                    <p>This is protected content that requires authentication.</p>
                    <button onclick="logout()">Logout</button>
                </div>
            `;
        } else if (path === '/dashboard' || path === '/') {
            pageTitle.textContent = 'Dashboard';
            contentArea.innerHTML = `
                <div class="dashboard">
                    <p>Welcome to FluxFinance Dashboard!</p>
                    <p>You are successfully authenticated.</p>
                    <button onclick="logout()">Logout</button>
                </div>
            `;
        } else {
            pageTitle.textContent = 'Protected Area';
            contentArea.innerHTML = `
                <div class="protected-content">
                    <p>Protected content would go here.</p>
                    <button onclick="logout()">Logout</button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        const form = document.getElementById('signInForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Overlay form submitted'); // Debug log
            await this.handleSignIn(e);
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.checkAuthentication();
        });

        // Logout function
        window.logout = () => {
            localStorage.removeItem('auth-token');
            window.location.href = '/';
        };
    }

    setupRouting() {
        // Ensure we maintain the URL when showing sign-in form
        const currentPath = window.location.pathname;
        if (currentPath !== '/') {
            // Keep the current URL as intended destination
            this.intendedPath = currentPath;
        }
    }

    async handleSignIn(event) {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const errorMessage = document.getElementById('errorMessage');
        const submitButton = event.target.querySelector('button[type="submit"]');

        console.log('Attempting overlay sign-in with:', email); // Debug log

        // Reset error message
        errorMessage.classList.remove('show');
        errorMessage.style.display = 'none';
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';

        try {
            console.log('Making fetch request to /api/sign-in'); // Debug log
            const response = await fetch('/api/sign-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Response received:', response.status); // Debug log
            const data = await response.json();
            console.log('Response data:', data); // Debug log

            if (data.success && data.token) {
                console.log('Login successful, storing token'); // Debug log
                // Store authentication token
                localStorage.setItem('auth-token', data.token);

                // Refresh the page to reveal content
                window.location.reload();
            } else {
                console.log('Login failed, showing error'); // Debug log
                // Show error message
                errorMessage.textContent = data.message || 'Email or password is incorrect';
                errorMessage.classList.add('show');
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.classList.add('show');
            errorMessage.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AuthManager'); // Debug log
    new AuthManager();
});