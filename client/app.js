class AuthManager {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.isSigningUp = false;
        this.invoices = [];
        // Wait a bit to ensure storage is set
        setTimeout(() => {
            this.init();
        }, 100);
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.setupRouting();
        this.setupInvoiceModal();
    }

    checkAuthentication() {
        const token = localStorage.getItem('auth-token');
        const overlay = document.getElementById('signInOverlay');
        const mainContent = document.getElementById('mainContent');
        const path = window.location.pathname;

        console.log('Checking auth, token:', token, 'path:', path);

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

        this.setupHomepageEvents();
    }

    setupHomepageEvents() {
        const signInBtn = document.getElementById('signInBtn');
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

        console.log('Attempting homepage sign-in with:', email);

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
                localStorage.setItem('auth-token', data.token);
                window.location.href = '/dashboard';
            } else {
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

    async showContent() {
        const mainContent = document.getElementById('mainContent');
        mainContent.style.filter = 'none';

        const path = window.location.pathname;
        const pageTitle = document.getElementById('pageTitle');
        const contentArea = document.getElementById('contentArea');

        if (path === '/invoices') {
            pageTitle.textContent = 'Invoices';
            await this.loadInvoices();
            contentArea.innerHTML = `
                <nav class="main-nav">
                    <a href="/dashboard" class="nav-link">Dashboard</a>
                    <a href="/invoices" class="nav-link active">Invoices</a>
                </nav>
                <div class="invoices-page">
                    <div class="invoice-header">
                        <h2>Purchase Invoices</h2>
                        <button class="btn" onclick="window.authManager.openInvoiceModal()">New invoice</button>
                    </div>
                    <div class="invoice-list" data-testid="invoice-list">
                        ${this.renderInvoiceList()}
                    </div>
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
                <nav class="main-nav">
                    <a href="/dashboard" class="nav-link active">Dashboard</a>
                    <a href="/invoices" class="nav-link">Invoices</a>
                </nav>
                <div class="dashboard">
                    <p>Welcome to FluxFinance Dashboard!</p>
                    <p>You are successfully authenticated.</p>
                    <div class="dashboard-actions">
                        <a href="/invoices" class="btn">Go to Invoices</a>
                        <button onclick="logout()">Logout</button>
                    </div>
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

    async loadInvoices() {
        try {
            const response = await fetch('/api/invoices');
            const data = await response.json();
            if (data.success) {
                this.invoices = data.invoices;
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.invoices = [];
        }
    }

    renderInvoiceList() {
        if (!this.invoices || this.invoices.length === 0) {
            return '<p>No invoices found.</p>';
        }

        return this.invoices.map(invoice => `
            <div class="invoice-item">
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div class="invoice-description">${invoice.description}</div>
                <div class="invoice-date">${invoice.date}</div>
                <div class="invoice-sum">${invoice.currency} ${invoice.sum.toFixed(2)}</div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        const form = document.getElementById('signInForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Overlay form submitted');
            await this.handleSignIn(e);
        });

        window.addEventListener('popstate', () => {
            this.checkAuthentication();
        });

        window.logout = () => {
            localStorage.removeItem('auth-token');
            window.location.href = '/';
        };

        // Make authManager globally available
        window.authManager = this;
    }

    setupRouting() {
        const currentPath = window.location.pathname;
        if (currentPath !== '/') {
            this.intendedPath = currentPath;
        }
    }

    async handleSignIn(event) {
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const errorMessage = document.getElementById('errorMessage');
        const submitButton = event.target.querySelector('button[type="submit"]');

        console.log('Attempting overlay sign-in with:', email);

        errorMessage.classList.remove('show');
        errorMessage.style.display = 'none';
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';

        try {
            console.log('Making fetch request to /api/sign-in');
            const response = await fetch('/api/sign-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Response received:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success && data.token) {
                console.log('Login successful, storing token');
                localStorage.setItem('auth-token', data.token);
                window.location.reload();
            } else {
                console.log('Login failed, showing error');
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

    setupInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        const form = document.getElementById('invoiceForm');
        const cancelBtn = document.getElementById('cancelInvoice');

        // Cancel button functionality
        cancelBtn?.addEventListener('click', () => {
            this.closeInvoiceModal();
        });

        // Form submission
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleInvoiceSubmit(e);
        });

        // Calculate sum when relevant fields change
        ['quantity', 'price', 'vatPercentage'].forEach(fieldName => {
            const field = document.getElementById(fieldName);
            field?.addEventListener('input', () => this.calculateSum());
        });
    }

    openInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        const form = document.getElementById('invoiceForm');

        // Reset form
        form.reset();
        this.calculateSum();

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invoiceDate').value = today;

        modal.style.display = 'flex';
    }

    closeInvoiceModal() {
        const modal = document.getElementById('invoiceModal');
        modal.style.display = 'none';
    }

    calculateSum() {
        const quantity = parseFloat(document.getElementById('quantity').value) || 0;
        const price = parseFloat(document.getElementById('price').value) || 0;
        const vatPercentage = parseFloat(document.getElementById('vatPercentage').value) || 0;

        const subtotal = quantity * price;
        const vatAmount = subtotal * (vatPercentage / 100);
        const sum = subtotal + vatAmount;

        document.querySelector('[data-testid="calculated-sum"]').textContent = sum.toFixed(2);
    }

    async handleInvoiceSubmit(event) {
        const formData = new FormData(event.target);
        const errorMessage = document.getElementById('invoiceErrorMessage');
        const submitButton = event.target.querySelector('button[type="submit"]');

        errorMessage.style.display = 'none';
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        try {
            const invoiceData = {
                date: formData.get('date'),
                description: formData.get('description'),
                quantity: parseInt(formData.get('quantity')),
                paymentMethod: formData.get('paymentMethod'),
                currency: formData.get('currency'),
                invoiceNumber: formData.get('invoiceNumber'),
                vatPercentage: parseFloat(formData.get('vatPercentage')),
                price: parseFloat(formData.get('price'))
            };

            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invoiceData)
            });

            const data = await response.json();

            if (data.success) {
                this.closeInvoiceModal();
                // Reload the invoices page to show the new invoice
                if (window.location.pathname === '/invoices') {
                    await this.showContent();
                }
            } else {
                errorMessage.textContent = data.message || 'Error creating invoice';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save';
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AuthManager');
    new AuthManager();
});