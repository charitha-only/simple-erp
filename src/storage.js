import { supabase } from './main.js';

let currentPlaylist = [];
let currentAudioIndex = -1;
let globalAudioElement = null;
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for session info to be available
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Only signed-in users can upload

    const userId = session.user.id;

    // Detect which page we are on
    const path = window.location.pathname;
    
    if (path.includes('files.html')) {
        setupUploader('upload-zone', 'file-input', 'files', userId);
        loadFiles('files', 'files-list', 'table');
    } else if (path.includes('audio.html')) {
        setupUploader('audio-upload-zone', 'audio-input', 'audio', userId);
        loadFiles('audio', 'audio-list', 'audio-list');
    } else if (path.includes('pdf.html')) {
        setupUploader('pdf-upload-zone', 'pdf-input', 'pdf', userId);
        loadFiles('pdf', 'pdf-grid', 'grid');
    }
});

function setupUploader(zoneId, inputId, folder, userId) {
    const dropZone = document.getElementById(zoneId);
    const fileInput = document.getElementById(inputId);

    if (!dropZone || !fileInput) return;

    // Click to open file dialog
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files, folder, userId, dropZone));

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.transform = 'scale(1.02)';
        dropZone.style.opacity = '0.8';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.transform = 'scale(1)';
        dropZone.style.opacity = '1';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.transform = 'scale(1)';
        dropZone.style.opacity = '1';
        handleFiles(e.dataTransfer.files, folder, userId, dropZone);
    });
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function handleFiles(files, folder, userId, dropZone) {
    if (!files || files.length === 0) return;
    
    const originalContent = dropZone.innerHTML;
    // Show loading state
    dropZone.innerHTML = `
        <div class="animate-pulse flex flex-col items-center">
            <svg class="animate-spin h-8 w-8 text-slate-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="font-medium text-slate-600 dark:text-slate-300">Uploading...</p>
        </div>
    `;

    try {
        for (const file of files) {
            // Upload path: {userId}/{folder}/{timestamp}_{filename}
            const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
            const filePath = `${userId}/${folder}/${Date.now()}_${cleanName}`;
            
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;
        }

        // Restore content and refresh files
        dropZone.innerHTML = originalContent;
        
        if (folder === 'files') loadFiles('files', 'files-list', 'table');
        if (folder === 'audio') loadFiles('audio', 'audio-list', 'audio-list');
        if (folder === 'pdf') loadFiles('pdf', 'pdf-grid', 'grid');
        
    } catch (error) {
        console.error("Upload error:", error);
        dropZone.innerHTML = `<div class="text-red-500 text-center"><p class="font-bold">Error uploading</p><p class="text-sm">${error.message}</p></div>`;
        setTimeout(() => dropZone.innerHTML = originalContent, 3000);
    }
}

async function loadFiles(folder, containerId, renderType) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    const { data, error } = await supabase.storage
        .from('uploads')
        .list(`${userId}/${folder}`, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error) {
        console.error("Error fetching files:", error);
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0 || (data.length === 1 && data[0].name === '.emptyFolderPlaceholder')) {
        return; // Keep initial empty state
    }

    if (renderType === 'audio-list') {
        currentPlaylist = [];
    }
    
    let html = '';
    
    for (const file of data) {
        if (file.name === '.emptyFolderPlaceholder') continue;
        
        const path = `${userId}/${folder}/${file.name}`;
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
        const publicUrl = urlData.publicUrl;
        
        const prettyName = file.name.substring(file.name.indexOf('_') + 1);
        const dateStr = new Date(file.created_at).toLocaleDateString();
        const sizeStr = formatBytes(file.metadata.size);

        if (renderType === 'audio-list') {
            currentPlaylist.push({
                url: publicUrl,
                name: prettyName,
                path: path,
                date: dateStr
            });
            const index = currentPlaylist.length - 1;
            
            html += `
                <li class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between group transition">
                    <div class="flex items-center space-x-4">
                        <button onclick="window.playAudioIndex(${index})" class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                        </button>
                        <div>
                            <p class="text-sm font-bold text-slate-900 dark:text-white transition-colors">${prettyName}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">Uploaded on ${dateStr}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm font-medium text-slate-500 dark:text-slate-400">${sizeStr}</span>
                        <button onclick="window.deleteFile('${path}', '${folder}')" class="text-slate-400 hover:text-red-500 transition-colors inline-block p-1 opacity-0 group-hover:opacity-100">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </li>
            `;
            continue;
        }        
        
        if (renderType === 'table') {
            html += `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td class="py-4 px-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div>
                                <a href="${publicUrl}" target="_blank" class="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors">${prettyName}</a>
                                <p class="text-xs text-slate-500 line-clamp-1">Uploaded file</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">${dateStr}</td>
                    <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">${sizeStr}</td>
                    <td class="py-4 px-6 text-right">
                        <a href="${publicUrl}" download class="text-slate-400 hover:text-emerald-600 transition-colors inline-block p-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </a>
                        <button onclick="window.deleteFile('${path}', '${folder}')" class="text-slate-400 hover:text-red-500 transition-colors inline-block p-1 ml-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `;
        } else if (renderType === 'grid') {
            html += `
                <div class="group cursor-pointer relative">
                    <button onclick="window.deleteFile('${path}', '${folder}')" class="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <a href="${publicUrl}" target="_blank" class="block">
                        <div class="relative w-full aspect-[2/3] bg-gradient-to-br from-[#1e4a6a] to-[#122e43] rounded-r-xl rounded-l-sm book-card overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[15px_15px_30px_rgba(0,0,0,0.15)] flex flex-col justify-between p-4 mb-4">
                            <span class="bg-white/10 text-white/90 text-[10px] font-bold uppercase tracking-widest self-start px-2 py-1 rounded backdrop-blur-md">PDF</span>
                            <div class="mt-auto">
                                <h3 class="text-white font-bold text-lg leading-tight mb-1 break-words line-clamp-3">${prettyName}</h3>
                                <p class="text-blue-200 text-xs font-medium">${sizeStr}</p>
                            </div>
                        </div>
                        <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm truncate transition-colors">${prettyName}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 transition-colors">${dateStr}</p>
                    </a>
                </div>
            `;
        }
    }
    
    if (html !== '') {
        container.innerHTML = html;
    }
}

// Ensure functions are available globally in the HTML for inline events
window.deleteFile = async function(path, folder) {
    if(!confirm('Are you sure you want to delete this file?')) return;
    
    try {
        const { error } = await supabase.storage.from('uploads').remove([path]);
        if (error) throw error;
        
        // Refresh appropriate view
        if (folder === 'files') loadFiles('files', 'files-list', 'table');
        if (folder === 'audio') loadFiles('audio', 'audio-list', 'audio-list');
        if (folder === 'pdf') loadFiles('pdf', 'pdf-grid', 'grid');
    } catch(err) {
        console.error("Delete failed", err);
        alert("Failed to delete file.");
    }
}

window.playAudioIndex = function(index) {
    if (index < 0 || index >= currentPlaylist.length) return;
    currentAudioIndex = index;
    const audioData = currentPlaylist[index];
    
    // Create audio element if doesn't exist
    if (!globalAudioElement) {
        globalAudioElement = new Audio();
        globalAudioElement.id = 'global-dynamic-audio';
        document.body.appendChild(globalAudioElement);
        setupAudioEventListeners();
    }
    
    globalAudioElement.src = audioData.url;
    globalAudioElement.play().catch(e => console.error("Could not play audio:", e));
    
    // Update UI
    updatePlayerUI(audioData.name);
    toggleWaves(true);
    updatePlayPauseButton(true);
};

window.playAudio = function(url, prettyName) {
    // Left for backwards compatibility if needed elsewhere,
    // though audio-list now uses playAudioIndex
};

function setupAudioEventListeners() {
    if (!globalAudioElement) return;

    // Time update for progress bar
    globalAudioElement.addEventListener('timeupdate', () => {
        const progress = (globalAudioElement.currentTime / globalAudioElement.duration) * 100;
        const progressBar = document.getElementById('progress-bar');
        const currentTimeEl = document.getElementById('current-time');
        
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (currentTimeEl) currentTimeEl.innerText = formatTime(globalAudioElement.currentTime);
    });

    // Device loaded metadata to get total duration
    globalAudioElement.addEventListener('loadedmetadata', () => {
        const totalTimeEl = document.getElementById('total-time');
        if (totalTimeEl) totalTimeEl.innerText = formatTime(globalAudioElement.duration);
    });

    // Auto-play next song on ended
    globalAudioElement.addEventListener('ended', () => {
        if (currentAudioIndex < currentPlaylist.length - 1) {
            window.playAudioIndex(currentAudioIndex + 1);
        } else {
            toggleWaves(false);
            updatePlayPauseButton(false);
        }
    });

    // Fix click to seek
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) {
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            if (globalAudioElement.duration) {
                globalAudioElement.currentTime = clickPos * globalAudioElement.duration;
            }
        });
    }

    // Play/Pause button
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (!globalAudioElement || !globalAudioElement.src) return;
            
            if (globalAudioElement.paused) {
                globalAudioElement.play();
                toggleWaves(true);
                updatePlayPauseButton(true);
            } else {
                globalAudioElement.pause();
                toggleWaves(false);
                updatePlayPauseButton(false);
            }
        });
    }

    // Prev button
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (globalAudioElement && globalAudioElement.currentTime > 3) {
                // If past 3 seconds, just restart song
                globalAudioElement.currentTime = 0;
            } else if (currentAudioIndex > 0) {
                window.playAudioIndex(currentAudioIndex - 1);
            }
        });
    }

    // Next button
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentAudioIndex < currentPlaylist.length - 1) {
                window.playAudioIndex(currentAudioIndex + 1);
            }
        });
    }
}

function updatePlayerUI(title) {
    const titleEl = document.getElementById('player-title');
    const subtitleEl = document.getElementById('player-subtitle');
    
    if (titleEl) titleEl.innerText = title;
    if (subtitleEl) subtitleEl.innerText = "Playing via Supabase Storage";
}

function updatePlayPauseButton(isPlaying) {
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    if (playIcon && pauseIcon) {
        if (isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }
}

function toggleWaves(animating) {
    const waves = document.querySelectorAll('.wave');
    const waveContainer = document.getElementById('music-waves');
    
    if (animating) {
        if (waveContainer) waveContainer.classList.remove('opacity-50');
        waves.forEach(w => w.style.animationPlayState = 'running');
    } else {
        if (waveContainer) waveContainer.classList.add('opacity-50');
        waves.forEach(w => w.style.animationPlayState = 'paused');
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
