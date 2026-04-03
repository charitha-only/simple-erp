import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase Configuration
const supabaseUrl = 'https://zxwhjermpiyofdqubblq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4d2hqZXJtcGl5b2ZkcXViYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTE5NjQsImV4cCI6MjA5MDQ2Nzk2NH0.vI2Q351FjRDFYe4aMUMyg_vy-bXG1EL6ZohZlwhnxzs';
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("LMS Dashboard/Profile Loaded.");

async function initApp() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Auth Protection
    const path = window.location.pathname;
    const isAuthPage = path.endsWith('index.html') || path.endsWith('signup.html') || path === '/';
    const isProtectedPage = path.includes('dashboard') || path.includes('profile');

    // Handle Password Recovery Event
    supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'PASSWORD_RECOVERY') {
            const newPassword = prompt("Set your new password:");
            if (newPassword && newPassword.length >= 6) {
                const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
                if (updateError) {
                    alert("Failed to update password: " + updateError.message);
                } else {
                    alert("Password updated successfully! You can now log in with the new password.");
                    await supabase.auth.signOut();
                    window.location.href = '/index.html';
                }
            } else {
                alert("Password must be at least 6 characters. Please try the recovery link again.");
                await supabase.auth.signOut();
                window.location.href = '/index.html';
            }
        }
    });

    if (!session && isProtectedPage) {
        window.location.href = '/index.html';
        return;
    }

    if (session && isAuthPage) {
        // Don't redirect immediately if it's a recovery flow so onAuthStateChange can trigger
        if (!window.location.hash.includes('type=recovery')) {
            window.location.href = '/dashboard.html';
            return;
        }
    }

    // Attempt to fill in user details if logged in
    if (session && session.user) {
        const userEmail = session.user.email;
        const userName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
        
        // Update generic name displays
        document.querySelectorAll('.user-name-display').forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = userName;
            } else {
                el.innerText = userName;
            }
        });

        document.querySelectorAll('.user-email-display').forEach(el => {
            if (el.tagName === 'INPUT') {
                el.value = userEmail;
            } else {
                el.innerText = userEmail;
            }
        });
        
        // Update first letter in avatar if applicable
        document.querySelectorAll('.user-avatar-text').forEach(el => {
            el.innerText = userName.charAt(0).toUpperCase();
        });
    }

    // Attach Logout Functionality
    const logoutBtns = document.querySelectorAll('a[href="/index.html"], a[href="index.html"], .logout-btn, #logout-btn');
    logoutBtns.forEach(btn => {
        if(btn.innerText.toLowerCase().includes('logout')) {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = '/index.html';
            });
        }
    });

    // Dark Mode Functionality
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeThumb = document.getElementById('dark-mode-thumb');

    // Check existing preference
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        if (darkModeToggle) {
            darkModeToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
            if (darkModeThumb) {
                darkModeThumb.classList.add('translate-x-6');
                darkModeThumb.classList.remove('translate-x-1');
            }
        }
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDarkNow = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');

            // Update toggle visual state
            if (isDarkNow) {
                darkModeToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
                if (darkModeThumb) {
                    darkModeThumb.classList.add('translate-x-6');
                    darkModeThumb.classList.remove('translate-x-1');
                }
            } else {
                darkModeToggle.classList.replace('bg-emerald-500', 'bg-slate-300');
                if (darkModeThumb) {
                    darkModeThumb.classList.add('translate-x-1');
                    darkModeThumb.classList.remove('translate-x-6');
                }
            }
        });
    }

    // Global Compact View Initialization
    const isCompact = localStorage.getItem('compact-view') === 'true';
    if (isCompact) {
        document.body.classList.add('text-sm', 'compact-mode');
    }
}

document.addEventListener('DOMContentLoaded', initApp);
