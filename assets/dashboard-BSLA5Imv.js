import{r as e,t}from"./main-B8DfoAiC.js";var n=e((()=>{t();var e=()=>{let e=document.getElementById(`note-modal`),t=document.getElementById(`note-modal-content`),n=document.getElementById(`note-form`),r=document.getElementById(`note-title`),i=document.getElementById(`note-content`),a=document.getElementById(`note-id`),o=document.getElementById(`close-note-modal`),s=document.getElementById(`add-note-top-btn`),c=document.getElementById(`add-note-card-btn`),l=document.getElementById(`notes-container`),u=document.getElementById(`note-modal-title`);if(!e||!l)return;let d=`fluidScholar_notes`,f=[];try{let e=localStorage.getItem(d);e&&(f=JSON.parse(e),Array.isArray(f)||(f=[]))}catch(e){console.error(`Failed to parse notes from local storage`,e),f=[]}let p=(n=null)=>{n?(u.textContent=`Edit Note`,r.value=n.title,i.value=n.content,a.value=n.id):(u.textContent=`Create Note`,r.value=``,i.value=``,a.value=``),e.classList.remove(`opacity-0`,`pointer-events-none`),t.classList.remove(`scale-95`),t.classList.add(`scale-100`)},m=()=>{e.classList.add(`opacity-0`,`pointer-events-none`),t.classList.remove(`scale-100`),t.classList.add(`scale-95`),n.reset(),a.value=``};s&&s.addEventListener(`click`,()=>p()),c&&c.addEventListener(`click`,e=>{e.preventDefault(),p()}),o&&o.addEventListener(`click`,m),document.addEventListener(`keydown`,t=>{t.key===`Escape`&&!e.classList.contains(`opacity-0`)&&m()}),e.addEventListener(`click`,t=>{t.target===e&&m()}),n.addEventListener(`submit`,e=>{e.preventDefault();let t=r.value.trim(),n=i.value.trim(),o=a.value;if(!(!t||!n)){if(o){let e=f.findIndex(e=>e.id===o);e>-1&&(f[e].title=t,f[e].content=n,f[e].updatedAt=new Date().toISOString())}else{let e={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),title:t,content:n,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};f.unshift(e)}h(),_(),m()}}),window.deleteNote=e=>{confirm(`Are you sure you want to delete this note?`)&&(f=f.filter(t=>t.id!==e),h(),_())},window.editNote=e=>{let t=f.find(t=>t.id===e);t&&p(t)};let h=()=>{localStorage.setItem(d,JSON.stringify(f))},g=e=>new Date(e).toLocaleDateString(void 0,{month:`short`,day:`numeric`,year:`numeric`}),_=()=>{if(l){if(f.length===0){l.innerHTML=`
                <div class="col-span-full py-12 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <svg class="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    <h3 class="text-lg font-medium text-slate-900 dark:text-slate-200">No notes yet</h3>
                    <p class="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">Jot down your thoughts, ideas, and summaries. They will appear here.</p>
                </div>
            `;return}l.innerHTML=f.map(e=>`
             <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition duration-300 group flex flex-col relative overflow-hidden">
                <!-- Top Decoration -->
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-bold text-lg text-slate-900 dark:text-white tracking-tight line-clamp-1">${e.title}</h3>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editNote('${e.id}')" class="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition bg-slate-50 hover:bg-emerald-50 dark:bg-slate-700 dark:hover:bg-emerald-900/30 rounded-md" title="Edit Note">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="deleteNote('${e.id}')" class="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/30 rounded-md" title="Delete Note">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed flex-1 whitespace-pre-wrap line-clamp-4">${e.content}</p>
                
                <div class="flex justify-between items-center text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span>${g(e.updatedAt)}</span>
                    <span class="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Note</span>
                </div>
            </div>
        `).join(``)}};_()};document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,e):e()}));t(),n();