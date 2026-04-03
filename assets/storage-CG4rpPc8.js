import{n as e,r as t,t as n}from"./main-B8DfoAiC.js";var r=t((()=>{n();var t=[],r=-1,i=null;document.addEventListener(`DOMContentLoaded`,async()=>{let{data:{session:t}}=await e.auth.getSession();if(!t)return;let n=t.user.id,r=window.location.pathname;r.includes(`files.html`)?(a(`upload-zone`,`file-input`,`files`,n),c(`files`,`files-list`,`table`)):r.includes(`audio.html`)?(a(`audio-upload-zone`,`audio-input`,`audio`,n),c(`audio`,`audio-list`,`audio-list`)):r.includes(`pdf.html`)&&(a(`pdf-upload-zone`,`pdf-input`,`pdf`,n),c(`pdf`,`pdf-grid`,`grid`))});function a(e,t,n,r){let i=document.getElementById(e),a=document.getElementById(t);!i||!a||(i.addEventListener(`click`,()=>a.click()),a.addEventListener(`change`,e=>s(e.target.files,n,r,i)),i.addEventListener(`dragover`,e=>{e.preventDefault(),i.style.transform=`scale(1.02)`,i.style.opacity=`0.8`}),i.addEventListener(`dragleave`,e=>{e.preventDefault(),i.style.transform=`scale(1)`,i.style.opacity=`1`}),i.addEventListener(`drop`,e=>{e.preventDefault(),i.style.transform=`scale(1)`,i.style.opacity=`1`,s(e.dataTransfer.files,n,r,i)}))}function o(e,t=2){if(!+e)return`0 Bytes`;let n=1024,r=t<0?0:t,i=[`Bytes`,`KB`,`MB`,`GB`,`TB`],a=Math.floor(Math.log(e)/Math.log(n));return`${parseFloat((e/n**+a).toFixed(r))} ${i[a]}`}async function s(t,n,r,i){if(!t||t.length===0)return;let a=i.innerHTML;i.innerHTML=`
        <div class="animate-pulse flex flex-col items-center">
            <svg class="animate-spin h-8 w-8 text-slate-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="font-medium text-slate-600 dark:text-slate-300">Uploading...</p>
        </div>
    `;try{for(let i of t){let t=i.name.replace(/[^a-zA-Z0-9.\-_]/g,``),a=`${r}/${n}/${Date.now()}_${t}`,{data:o,error:s}=await e.storage.from(`uploads`).upload(a,i,{cacheControl:`3600`,upsert:!1});if(s)throw s}i.innerHTML=a,n===`files`&&c(`files`,`files-list`,`table`),n===`audio`&&c(`audio`,`audio-list`,`audio-list`),n===`pdf`&&c(`pdf`,`pdf-grid`,`grid`)}catch(e){console.error(`Upload error:`,e),i.innerHTML=`<div class="text-red-500 text-center"><p class="font-bold">Error uploading</p><p class="text-sm">${e.message}</p></div>`,setTimeout(()=>i.innerHTML=a,3e3)}}async function c(n,r,i){let{data:{session:a}}=await e.auth.getSession();if(!a)return;let s=a.user.id,{data:c,error:l}=await e.storage.from(`uploads`).list(`${s}/${n}`,{limit:100,sortBy:{column:`created_at`,order:`desc`}});if(l){console.error(`Error fetching files:`,l);return}let u=document.getElementById(r);if(!u||!c||c.length===0||c.length===1&&c[0].name===`.emptyFolderPlaceholder`)return;i===`audio-list`&&(t=[]);let d=``;for(let r of c){if(r.name===`.emptyFolderPlaceholder`)continue;let a=`${s}/${n}/${r.name}`,{data:c}=e.storage.from(`uploads`).getPublicUrl(a),l=c.publicUrl,u=r.name.substring(r.name.indexOf(`_`)+1),f=new Date(r.created_at).toLocaleDateString(),p=o(r.metadata.size);if(i===`audio-list`){t.push({url:l,name:u,path:a,date:f});let e=t.length-1;d+=`
                <li class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between group transition">
                    <div class="flex items-center space-x-4">
                        <button onclick="window.playAudioIndex(${e})" class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                        </button>
                        <div>
                            <p class="text-sm font-bold text-slate-900 dark:text-white transition-colors">${u}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">Uploaded on ${f}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm font-medium text-slate-500 dark:text-slate-400">${p}</span>
                        <button onclick="window.deleteFile('${a}', '${n}')" class="text-slate-400 hover:text-red-500 transition-colors inline-block p-1 opacity-0 group-hover:opacity-100">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </li>
            `;continue}i===`table`?d+=`
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td class="py-4 px-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div>
                                <a href="${l}" target="_blank" class="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors">${u}</a>
                                <p class="text-xs text-slate-500 line-clamp-1">Uploaded file</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">${f}</td>
                    <td class="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">${p}</td>
                    <td class="py-4 px-6 text-right">
                        <a href="${l}" download class="text-slate-400 hover:text-emerald-600 transition-colors inline-block p-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </a>
                        <button onclick="window.deleteFile('${a}', '${n}')" class="text-slate-400 hover:text-red-500 transition-colors inline-block p-1 ml-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `:i===`grid`&&(d+=`
                <div class="group cursor-pointer relative">
                    <button onclick="window.deleteFile('${a}', '${n}')" class="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <a href="${l}" target="_blank" class="block">
                        <div class="relative w-full aspect-[2/3] bg-gradient-to-br from-[#1e4a6a] to-[#122e43] rounded-r-xl rounded-l-sm book-card overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[15px_15px_30px_rgba(0,0,0,0.15)] flex flex-col justify-between p-4 mb-4">
                            <span class="bg-white/10 text-white/90 text-[10px] font-bold uppercase tracking-widest self-start px-2 py-1 rounded backdrop-blur-md">PDF</span>
                            <div class="mt-auto">
                                <h3 class="text-white font-bold text-lg leading-tight mb-1 break-words line-clamp-3">${u}</h3>
                                <p class="text-blue-200 text-xs font-medium">${p}</p>
                            </div>
                        </div>
                        <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm truncate transition-colors">${u}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 transition-colors">${f}</p>
                    </a>
                </div>
            `)}d!==``&&(u.innerHTML=d)}window.deleteFile=async function(t,n){if(confirm(`Are you sure you want to delete this file?`))try{let{error:r}=await e.storage.from(`uploads`).remove([t]);if(r)throw r;n===`files`&&c(`files`,`files-list`,`table`),n===`audio`&&c(`audio`,`audio-list`,`audio-list`),n===`pdf`&&c(`pdf`,`pdf-grid`,`grid`)}catch(e){console.error(`Delete failed`,e),alert(`Failed to delete file.`)}},window.playAudioIndex=function(e){if(e<0||e>=t.length)return;r=e;let n=t[e];i||(i=new Audio,i.id=`global-dynamic-audio`,document.body.appendChild(i),l()),i.src=n.url,i.play().catch(e=>console.error(`Could not play audio:`,e)),u(n.name),f(!0),d(!0)},window.playAudio=function(e,t){};function l(){if(!i)return;i.addEventListener(`timeupdate`,()=>{let e=i.currentTime/i.duration*100,t=document.getElementById(`progress-bar`),n=document.getElementById(`current-time`);t&&(t.style.width=`${e}%`),n&&(n.innerText=p(i.currentTime))}),i.addEventListener(`loadedmetadata`,()=>{let e=document.getElementById(`total-time`);e&&(e.innerText=p(i.duration))}),i.addEventListener(`ended`,()=>{r<t.length-1?window.playAudioIndex(r+1):(f(!1),d(!1))});let e=document.getElementById(`progress-container`);e&&e.addEventListener(`click`,t=>{let n=e.getBoundingClientRect(),r=(t.clientX-n.left)/n.width;i.duration&&(i.currentTime=r*i.duration)});let n=document.getElementById(`play-pause-btn`);n&&n.addEventListener(`click`,()=>{!i||!i.src||(i.paused?(i.play(),f(!0),d(!0)):(i.pause(),f(!1),d(!1)))});let a=document.getElementById(`prev-btn`);a&&a.addEventListener(`click`,()=>{i&&i.currentTime>3?i.currentTime=0:r>0&&window.playAudioIndex(r-1)});let o=document.getElementById(`next-btn`);o&&o.addEventListener(`click`,()=>{r<t.length-1&&window.playAudioIndex(r+1)})}function u(e){let t=document.getElementById(`player-title`),n=document.getElementById(`player-subtitle`);t&&(t.innerText=e),n&&(n.innerText=`Playing via Supabase Storage`)}function d(e){let t=document.getElementById(`play-icon`),n=document.getElementById(`pause-icon`);t&&n&&(e?(t.classList.add(`hidden`),n.classList.remove(`hidden`)):(t.classList.remove(`hidden`),n.classList.add(`hidden`)))}function f(e){let t=document.querySelectorAll(`.wave`),n=document.getElementById(`music-waves`);e?(n&&n.classList.remove(`opacity-50`),t.forEach(e=>e.style.animationPlayState=`running`)):(n&&n.classList.add(`opacity-50`),t.forEach(e=>e.style.animationPlayState=`paused`))}function p(e){if(isNaN(e))return`00:00`;let t=Math.floor(e/60),n=Math.floor(e%60);return`${t.toString().padStart(2,`0`)}:${n.toString().padStart(2,`0`)}`}}));export{r as t};