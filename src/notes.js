// src/notes.js
import { supabase } from './main.js'; // Optional: if we want to save to supabase later, we have it in scope.

const initNotes = () => {
    // DOM Elements
    const noteModal = document.getElementById('note-modal');
    const noteModalContent = document.getElementById('note-modal-content');
    const noteForm = document.getElementById('note-form');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');
    const noteIdInput = document.getElementById('note-id');
    const closeNoteModalBtn = document.getElementById('close-note-modal');
    const addNoteTopBtn = document.getElementById('add-note-top-btn');
    const addNoteCardBtn = document.getElementById('add-note-card-btn');
    const notesContainer = document.getElementById('notes-container');
    const modalTitle = document.getElementById('note-modal-title');

    if (!noteModal || !notesContainer) return; // Safeguard if DOM isn't ready or elements missing

    // Local Storage Key
    const NOTES_STORAGE_KEY = 'fluidScholar_notes';

    // State
    let notes = [];
    try {
        const stored = localStorage.getItem(NOTES_STORAGE_KEY);
        if (stored) {
            notes = JSON.parse(stored);
            if (!Array.isArray(notes)) notes = [];
        }
    } catch (e) {
        console.error("Failed to parse notes from local storage", e);
        notes = [];
    }

    // --- Modal Management ---
    
    const openModal = (note = null) => {
        if (note) {
            modalTitle.textContent = 'Edit Note';
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            noteIdInput.value = note.id;
        } else {
            modalTitle.textContent = 'Create Note';
            noteTitleInput.value = '';
            noteContentInput.value = '';
            noteIdInput.value = '';
        }
        
        // Setup GSAP animation or CSS classes for showing
        noteModal.classList.remove('opacity-0', 'pointer-events-none');
        noteModalContent.classList.remove('scale-95');
        noteModalContent.classList.add('scale-100');
    };

    const closeModal = () => {
        noteModal.classList.add('opacity-0', 'pointer-events-none');
        noteModalContent.classList.remove('scale-100');
        noteModalContent.classList.add('scale-95');
        noteForm.reset();
        noteIdInput.value = '';
    };

    // Event Listeners for opening/closing
    if (addNoteTopBtn) {
        addNoteTopBtn.addEventListener('click', () => openModal());
    }
    
    if (addNoteCardBtn) {
        addNoteCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (closeNoteModalBtn) {
        closeNoteModalBtn.addEventListener('click', closeModal);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !noteModal.classList.contains('opacity-0')) {
            closeModal();
        }
    });

    // Close when clicking outside content
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) {
            closeModal();
        }
    });

    // --- CRUD Operations ---
    
    // Save Note
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        const id = noteIdInput.value;

        if (!title || !content) return;

        if (id) {
            // Update existing
            const noteIndex = notes.findIndex(n => n.id === id);
            if (noteIndex > -1) {
                notes[noteIndex].title = title;
                notes[noteIndex].content = content;
                notes[noteIndex].updatedAt = new Date().toISOString();
            }
        } else {
            // Create new
            const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const newNote = {
                id: newId,
                title,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Add to beginning of array
            notes.unshift(newNote);
        }

        saveNotes();
        renderNotes();
        closeModal();
    });

    // Delete Note
    window.deleteNote = (id) => {
        if(confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            renderNotes();
        }
    };

    // Edit Note
    window.editNote = (id) => {
        const note = notes.find(n => n.id === id);
        if(note) {
            openModal(note);
        }
    };

    const saveNotes = () => {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // --- Rendering ---
    const renderNotes = () => {
        if (!notesContainer) return;

        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div class="col-span-full py-12 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <svg class="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    <h3 class="text-lg font-medium text-slate-900 dark:text-slate-200">No notes yet</h3>
                    <p class="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Jot down your thoughts, ideas, and summaries. They will appear here.</p>
                </div>
            `;
            return;
        }

        notesContainer.innerHTML = notes.map(note => `
             <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition duration-300 group flex flex-col relative overflow-hidden">
                <!-- Top Decoration -->
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white tracking-tight line-clamp-1">${note.title}</h3>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editNote('${note.id}')" class="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition bg-slate-50 hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-emerald-900/30 rounded-md" title="Edit Note">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteNote('${note.id}')" class="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/30 rounded-md" title="Delete Note">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed flex-1 whitespace-pre-wrap line-clamp-4">${note.content}</p>
                
                <div class="flex justify-between items-center text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span>${formatDate(note.updatedAt)}</span>
                    <span class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Note</span>
                </div>
            </div>
        `).join('');
    };

    // Initial render
    renderNotes();
};

// Safe initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotes);
} else {
    initNotes();
}
