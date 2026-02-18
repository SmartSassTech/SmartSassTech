// Initialize Supabase client
const supabaseUrl = 'https://zwfsvjvpocpflmkmptji.supabase.co';
const supabaseKey = 'sb_publishable_hDElzKZJNkEgwhIgPdahRg_fdXkZ4S4';

// Check if supabase library is loaded
if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Please include the Supabase CDN script.');
} else {
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    document.addEventListener('DOMContentLoaded', async function () {
        // Update header based on auth state
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        updateHeader(session);

        // Listen for auth changes
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            updateHeader(session);
        });
    });
}

function updateHeader(session) {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    if (session) {
        // User is logged in
        headerActions.innerHTML = `
            <a href="account.html" class="btn btn-secondary">My Account</a>
            <a href="booking.html" class="btn btn-primary">Book Now</a>
        `;
    } else {
        // User is logged out
        headerActions.innerHTML = `
            <a href="login.html" class="btn btn-secondary">Log In</a>
            <a href="booking.html" class="btn btn-primary">Book Now</a>
        `;
    }
}

// Global logout function
window.logout = async function () {
    if (window.supabaseClient) {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error('Logout error:', error.message);
        } else {
            window.location.href = 'index.html';
        }
    }
};

