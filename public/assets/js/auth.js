const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const submitBtn = document.getElementById('submit-btn');
const toggleAuth = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');
const messageDiv = document.getElementById('message');

let isLogin = true;

// use window.supabaseClient from auth-init.js
const getSupabase = () => window.supabaseClient;

toggleAuth.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Log In' : 'Sign Up';
    submitBtn.textContent = isLogin ? 'Log In' : 'Sign Up';
    toggleText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleAuth.textContent = isLogin ? 'Sign Up' : 'Log In';
    messageDiv.style.display = 'none';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    messageDiv.style.display = 'none';
    messageDiv.className = 'message';

    // Set loading state
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');

    try {
        if (isLogin) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                let errorMsg = error.message;
                if (error.message.toLowerCase().includes('invalid login credentials')) {
                    errorMsg = 'Incorrect email or password. Please try again.';
                }
                showMessage(errorMsg, 'error');
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            } else {
                showToast('Welcome back! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800);
            }
        } else {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                let errorMsg = error.message;
                if (error.status === 400 && error.message.toLowerCase().includes('user already registered')) {
                    errorMsg = 'An account with this email already exists. Please log in instead.';
                }
                showMessage(errorMsg, 'error');
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            } else {
                showToast('Success! Check your email to confirm.', 'success');
                showMessage('Sign up successful! Please check your email for a confirmation link.', 'success');
            }
        }
    } catch (err) {
        showToast('Connection lost. Please try again.', 'error');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Check current session
async function checkUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // User is logged in, you could update UI here or redirect if they are on login page
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
    }
}

checkUser();

function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.style.display = 'block';
    messageDiv.classList.add(type === 'error' ? 'message-error' : 'message-success');
}
