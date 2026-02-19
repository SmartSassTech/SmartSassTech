document.addEventListener('DOMContentLoaded', async function () {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }

    const user = session.user;
    const profileInfo = document.getElementById('profile-info');
    const historyInfo = document.getElementById('history-info');
    const logoutBtn = document.getElementById('logout-btn');

    // Display basic profile info
    profileInfo.classList.remove('loading');
    profileInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Email Address</span>
            <span class="info-value">${user.email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Member Since</span>
            <span class="info-value">${new Date(user.created_at).toLocaleDateString()}</span>
        </div>
    `;

    // Fetch and display history
    try {
        const { data: sessions, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        historyInfo.classList.remove('loading');
        if (sessions && sessions.length > 0) {
            historyInfo.innerHTML = `
                <div class="history-list">
                    ${sessions.map(s => `
                        <div class="history-item">
                            <div class="history-item-header">
                                <span class="info-value">${new Date(s.created_at).toLocaleDateString()}</span>
                                <span class="status status-${s.status}">${s.status}</span>
                            </div>
                            <p class="info-label" style="margin-bottom: 0;">Issue: ${s.initial_issue || 'No description provided.'}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            historyInfo.innerHTML = '<p class="info-label">No session history yet. Need help? <a href="booking.html" style="text-decoration: underline;">Book a session!</a></p>';
        }

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        historyInfo.innerHTML = '<p class="info-label">Error loading history. Please try again later.</p>';
    }

    // Logout functionality
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Error logging out: ' + error.message);
        } else {
            window.location.href = 'index.html';
        }
    });
});
