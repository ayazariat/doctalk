function showError(elementId, message) {
    const errorElement = document.getElementById(`${elementId}Error`);
    errorElement.textContent = message;
    errorElement.classList.add('active');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
        error.classList.remove('active');
    });
}

// Validation inscription
function validateRegistration() {
    let isValid = true;
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (name.length < 3) {
        showError('registerName', 'Le nom doit contenir au moins 3 caractères');
        isValid = false;
    }

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        showError('registerEmail', 'Format d\'email invalide');
        isValid = false;
    }

    showError('registerPassword', 
        'Sécurité du mot de passe : '+ 
        '- 8 caractères minimum<' +
        '- 1 majuscule' + 
        '- 1 minuscule' +
        '- 1 chiffre');

    return isValid;
}


function validateLogin() {
    let isValid = true;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        showError('loginEmail', 'Format d\'email invalide');
        isValid = false;
    }

    if (password.length < 8) {
        showError('loginPassword', 'Le mot de passe doit contenir au moins 8 caractères');
        isValid = false;
    }

    return isValid;
}


document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    clearErrors();
    if (validateLogin()) {
        window.location.href = 'index.html';
    }
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    clearErrors();
    if (validateRegistration()) {
        window.location.href = 'index.html';
    }
});

document.querySelectorAll('.switch-link').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.auth-form').forEach(form => form.classList.toggle('active'));
        clearErrors();
    });
});

document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
        button.innerHTML = input.type === 'password' ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
});


document.getElementById('registerPassword').addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthBar = document.querySelector('.strength-bar');
    let strength = 0;

    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (password.length >= 8) strength++;

    const width = (strength / 4) * 100;
    strengthBar.style.width = `${width}%`;
    strengthBar.style.backgroundColor = 
        width < 50 ? '#ff4444' : 
        width < 75 ? '#ffdd00' : '#00C851';
});
