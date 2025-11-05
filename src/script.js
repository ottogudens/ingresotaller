document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');

    const dashboardUsername = document.getElementById('dashboard-username');
    const usersTableBody = document.querySelector('#users-table tbody');
    const logoutButton = document.getElementById('logout-button');

    // Función para mostrar/ocultar secciones
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
            loginMessage.textContent = ''; // Limpiar mensajes
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.style.display = 'none';
            loginSection.style.display = 'block';
            registerMessage.textContent = ''; // Limpiar mensajes
        });
    }

    // Lógica de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const address = document.getElementById('register-address').value;
            const phone = document.getElementById('register-phone').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password, address, phone }),
                });
                const data = await response.json();

                if (response.ok) {
                    registerMessage.textContent = data.message;
                    registerMessage.className = 'message success';
                    registerForm.reset();
                    // Opcional: Redirigir al login o al dashboard
                } else {
                    registerMessage.textContent = data.message;
                    registerMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Error during registration:', error);
                registerMessage.textContent = 'Error al conectar con el servidor.';
                registerMessage.className = 'message error';
            }
        });
    }

    // Lógica de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('loggedInUser', username);
                    window.location.href = 'dashboard.html';
                } else {
                    loginMessage.textContent = data.message;
                    loginMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Error during login:', error);
                loginMessage.textContent = 'Error al conectar con el servidor.';
                loginMessage.className = 'message error';
            }
        });
    }

    // Lógica del Dashboard
    if (window.location.pathname.endsWith('/dashboard.html')) {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            window.location.href = 'index.html'; // Redirigir si no hay usuario logueado
            return;
        }
        if (dashboardUsername) {
            dashboardUsername.textContent = loggedInUser;
        }

        // Cargar usuarios para el dashboard
        const loadUsers = async () => {
            try {
                const response = await fetch('/users');
                const users = await response.json();

                usersTableBody.innerHTML = ''; // Limpiar tabla
                users.forEach(user => {
                    const row = usersTableBody.insertRow();
                    row.insertCell(0).textContent = user.id;
                    row.insertCell(1).textContent = user.username;
                    row.insertCell(2).textContent = user.email;
                    row.insertCell(3).textContent = user.address || 'N/A';
                    row.insertCell(4).textContent = user.phone || 'N/A';
                });
            } catch (error) {
                console.error('Error fetching users:', error);
                // Mostrar un mensaje de error en el dashboard si es necesario
            }
        };

        loadUsers();

        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            });
        }
    }
});
