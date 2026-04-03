import { supabase } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. References
    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const changePwdBtn = document.getElementById('change-pwd-btn');
    
    // Original Toggles
    const origCompactToggle = document.getElementById('compact-view-toggle');
    const origDarkModeToggle = document.getElementById('dark-mode-toggle');
    
    const saveBtn = document.getElementById('save-settings-btn');
    const discardBtn = document.getElementById('discard-settings-btn');

    let originalName = '';
    let pendingPassword = null;

    // Load initial user data from Supabase
    setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            originalName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            if (nameInput) nameInput.value = originalName;
            if (emailInput) emailInput.value = session.user.email;
        }
    }, 500);

    // --- State Variables ---
    let originalDarkMode = localStorage.getItem('theme') === 'dark';
    let isDark = document.documentElement.classList.contains('dark') || originalDarkMode;
    
    let originalCompactMode = localStorage.getItem('compact-view') === 'true';
    let isCompact = document.body.classList.contains('compact-mode') || originalCompactMode;

    // --- Replace Toggles to Intercept Original Behavior (from main.js) ---
    let darkModeToggle = origDarkModeToggle;
    if (origDarkModeToggle) {
        darkModeToggle = origDarkModeToggle.cloneNode(true);
        origDarkModeToggle.parentNode.replaceChild(darkModeToggle, origDarkModeToggle);
        
        // Initial visual sync
        if (isDark) {
            darkModeToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
            const thumb = darkModeToggle.querySelector('#dark-mode-thumb');
            if (thumb) {
                thumb.classList.add('translate-x-6');
                thumb.classList.remove('translate-x-1');
            }
        }
        
        darkModeToggle.addEventListener('click', () => {
            isDark = !isDark;
            // Visual preview only
            if (isDark) {
                document.documentElement.classList.add('dark');
                darkModeToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
                const thumb = darkModeToggle.querySelector('#dark-mode-thumb');
                if (thumb) {
                    thumb.classList.add('translate-x-6');
                    thumb.classList.remove('translate-x-1');
                }
            } else {
                document.documentElement.classList.remove('dark');
                darkModeToggle.classList.replace('bg-emerald-500', 'bg-slate-300');
                const thumb = darkModeToggle.querySelector('#dark-mode-thumb');
                if (thumb) {
                    thumb.classList.remove('translate-x-6');
                    thumb.classList.add('translate-x-1');
                }
            }
        });
    }

    let compactToggle = origCompactToggle;
    if (origCompactToggle) {
        compactToggle = origCompactToggle.cloneNode(true);
        origCompactToggle.parentNode.replaceChild(compactToggle, origCompactToggle);

        // Initial visual sync
        if (isCompact) {
            compactToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
            compactToggle.classList.replace('dark:bg-slate-600', 'dark:bg-emerald-500');
            const thumb = compactToggle.querySelector('#compact-view-thumb');
            if (thumb) thumb.classList.add('translate-x-6');
        }

        compactToggle.addEventListener('click', () => {
            isCompact = !isCompact;
            // Visual preview only
            if (isCompact) {
                document.body.classList.add('text-sm', 'compact-mode');
                compactToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
                compactToggle.classList.replace('dark:bg-slate-600', 'dark:bg-emerald-500');
                const thumb = compactToggle.querySelector('#compact-view-thumb');
                if (thumb) thumb.classList.add('translate-x-6');
            } else {
                document.body.classList.remove('text-sm', 'compact-mode');
                compactToggle.classList.replace('bg-emerald-500', 'bg-slate-300');
                compactToggle.classList.replace('dark:bg-emerald-500', 'dark:bg-slate-600');
                const thumb = compactToggle.querySelector('#compact-view-thumb');
                if (thumb) thumb.classList.remove('translate-x-6');
            }
        });
    }

    // --- Change Password Action ---
    if (changePwdBtn) {
        changePwdBtn.addEventListener('click', () => {
            const newPassword = prompt("Enter your new password (min 6 characters). This will apply when you save settings:");
            if (newPassword && newPassword.length >= 6) {
                pendingPassword = newPassword;
                alert("Password change pending. Click 'Save Profile Settings' to apply.");
                // Update button text to show pending
                changePwdBtn.querySelector('div').innerHTML = `<svg class="w-5 h-5 mr-3 text-[#1e4a6a] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Password pending save`;
            } else if (newPassword) {
                alert("Password must be at least 6 characters.");
            }
        });
    }

    // --- Discard Changes ---
    if (discardBtn) {
        discardBtn.addEventListener('click', () => {
            if (nameInput) nameInput.value = originalName;
            
            pendingPassword = null;
            if (changePwdBtn) {
                changePwdBtn.querySelector('div').innerHTML = `<svg class="w-5 h-5 mr-3 text-[#1e4a6a] dark:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg> Change Password`;
            }

            // Revert dark mode
            isDark = originalDarkMode;
            if (isDark) {
                document.documentElement.classList.add('dark');
                if (darkModeToggle) {
                    darkModeToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
                    const t = darkModeToggle.querySelector('#dark-mode-thumb');
                    if(t) { t.classList.add('translate-x-6'); t.classList.remove('translate-x-1'); }
                }
            } else {
                document.documentElement.classList.remove('dark');
                if (darkModeToggle) {
                    darkModeToggle.classList.replace('bg-emerald-500', 'bg-slate-300');
                    const t = darkModeToggle.querySelector('#dark-mode-thumb');
                    if(t) { t.classList.remove('translate-x-6'); t.classList.add('translate-x-1'); }
                }
            }

            // Revert compact view
            isCompact = originalCompactMode;
            if (isCompact) {
                document.body.classList.add('text-sm', 'compact-mode');
                if (compactToggle) {
                    compactToggle.classList.replace('bg-slate-300', 'bg-emerald-500');
                    compactToggle.classList.replace('dark:bg-slate-600', 'dark:bg-emerald-500');
                    const t = compactToggle.querySelector('#compact-view-thumb');
                    if(t) t.classList.add('translate-x-6');
                }
            } else {
                document.body.classList.remove('text-sm', 'compact-mode');
                if (compactToggle) {
                    compactToggle.classList.replace('bg-emerald-500', 'bg-slate-300');
                    compactToggle.classList.replace('dark:bg-emerald-500', 'dark:bg-slate-600');
                    const t = compactToggle.querySelector('#compact-view-thumb');
                    if(t) t.classList.remove('translate-x-6');
                }
            }
        });
    }

    // --- Save Settings ---
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const newName = nameInput ? nameInput.value.trim() : originalName;
            
            const nameChanged = newName !== originalName;
            const passwordChanged = pendingPassword !== null;
            const darkChanged = isDark !== originalDarkMode;
            const compactChanged = isCompact !== originalCompactMode;

            if (!nameChanged && !passwordChanged && !darkChanged && !compactChanged) {
                 alert("No changes to save.");
                 return;
            }

            try {
                const originalText = saveBtn.innerText;
                saveBtn.innerText = "Saving...";
                saveBtn.disabled = true;

                // Handle Supabase Auth Updates
                if (nameChanged || passwordChanged) {
                    const updateData = {};
                    if (nameChanged) updateData.data = { full_name: newName };
                    if (passwordChanged) updateData.password = pendingPassword;

                    const { error } = await supabase.auth.updateUser(updateData);
                    if (error) throw error;

                    if (nameChanged) {
                        originalName = newName;
                        // Update UI everywhere
                        document.querySelectorAll('.user-name-display').forEach(el => {
                            if (el.tagName !== 'INPUT') el.innerText = newName;
                        });
                        document.querySelectorAll('.user-avatar-text').forEach(el => {
                            el.innerText = newName.charAt(0).toUpperCase();
                        });
                    }

                    if (passwordChanged) {
                        pendingPassword = null;
                        if (changePwdBtn) {
                            changePwdBtn.querySelector('div').innerHTML = `<svg class="w-5 h-5 mr-3 text-[#1e4a6a] dark:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg> Change Password`;
                        }
                    }
                }

                // Handle Local Preferences Updates
                if (darkChanged) {
                    localStorage.setItem('theme', isDark ? 'dark' : 'light');
                    originalDarkMode = isDark;
                }

                if (compactChanged) {
                    localStorage.setItem('compact-view', isCompact);
                    originalCompactMode = isCompact;
                }

                alert("Profile settings saved successfully!");

            } catch (err) {
                alert("Error saving settings: " + err.message);
            } finally {
                saveBtn.innerText = "Save Profile Settings";
                saveBtn.disabled = false;
            }
        });
    }
});
