const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbynGs8pEJ11Rd8-PuUEUxWdY8pBB5AS6KLRISZmUSiq3u9DGnHwDW2cdSYfqTsg_pgZ/exec";
const LOCAL_KEY = "contacts_local";

// ------------------- Image Compression -------------------
async function compressImage(file,maxWidth=180){
  return new Promise((resolve,reject)=>{
    const img=document.createElement("img");
    const reader=new FileReader();
    reader.onload=e=>{ img.src=e.target.result;
      img.onload=()=>{
        const canvas=document.createElement("canvas");
        const scale=maxWidth/img.width;
        canvas.width=maxWidth;
        canvas.height=img.height*scale;
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/png").split(",")[1]);
      };
    };
    reader.readAsDataURL(file);
  });
}

// ------------------- Local Storage -------------------
function saveLocal(data){
  let contacts=JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]");
  if(data._row){ contacts=contacts.map(c=>c._row===data._row?data:c); }
  else { data._row=Date.now(); contacts.push(data); }
  localStorage.setItem(LOCAL_KEY,JSON.stringify(contacts));
  return contacts;
}

function loadLocal(){ return JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]"); }

async function syncToServer(){
  const contacts = loadLocal();
  for(const c of contacts){
    if(!c.synced){
      try{ 
        const res = await fetch(WEB_APP_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)});
        const result = await res.json();
        if(result.success){ c.synced=true; }
      } catch(e){ console.log("Offline, cannot sync"); }
    }
  }
  localStorage.setItem(LOCAL_KEY,JSON.stringify(contacts));
}

// ------------------- Render Cards -------------------
async function fetchContacts(){
  let contacts=loadLocal();
  const nameFilter=document.getElementById("searchName").value.toLowerCase();
  const starFilter=document.getElementById("filterStars").value;
  if(nameFilter) contacts=contacts.filter(c=>c.Name.toLowerCase().includes(nameFilter));
  if(starFilter) contacts=contacts.filter(c=>c.MilestoneScore==starFilter);

  const list=document.getElementById("contactsList");
  list.innerHTML="";
  contacts.forEach(c=>{
    const card=document.createElement("div"); card.className="contact-card";
    const stars="★".repeat(c.MilestoneScore||0);
    card.innerHTML=`
      <div class="card-inner">
        <div class="card-front">
          <img src="${c.PhotoURL||'https://via.placeholder.com/180x140'}">
          <h3>${c.Name}</h3>
          <div class="stars">${stars}</div>
        </div>
        <div class="card-back">
          GospelShared: ${c.GospelShared}<br>
          Salvation: ${c.Salvation}<br>
          Prayed: ${c.Prayed}<br>
          LINE: ${c.LINEID||'-'}<br>
          IG: ${c.InstagramID||'-'}<br>
          HT: ${c.HelloTalkID||'-'}<br>
          Job/School: ${c.JobSchool||'-'}<br>
          Course: ${c.OccupationCourse||'-'}<br>
          Remarks: ${c.Remarks||'-'}<br>
          Updated: ${c.UpdatedRemarks||'-'}<br>
          <div>
            <button onclick="editContact(${c._row})">Edit</button>
            <button onclick="deleteContact(${c._row})">Delete</button>
          </div>
        </div>
      </div>`;
    list.appendChild(card);
  });
}

// ------------------- Form Submit -------------------
document.getElementById("contactForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.target; const data={};
  new FormData(form).forEach((v,k)=>data[k]=v);
  const fileInput=document.getElementById("PhotoFile");
  if(fileInput.files[0]) data.PhotoBase64=await compressImage(fileInput.files[0]);
  saveLocal(data); fetchContacts();
  if(navigator.onLine) syncToServer();
  form.reset();
});

// ------------------- Edit Modal -------------------
const modal=document.getElementById("editModal");
const editForm=document.getElementById("editForm");
const spanClose=modal.querySelector(".close");
spanClose.onclick=()=>modal.style.display="none";
window.onclick=e=>{if(e.target==modal) modal.style.display="none";}

async function editContact(row){
  const contacts=loadLocal(); const c=contacts.find(c=>c._row===row);
  if(!c) return alert("Contact not found");
  Object.keys(c).forEach(k=>{const input=editForm.querySelector(`[name="${k}"]`); if(input) input.value=c[k];});
  let rowInput=editForm.querySelector("#_row");
  if(!rowInput){ rowInput=document.createElement("input"); rowInput.type="hidden"; rowInput.id="_row"; editForm.appendChild(rowInput);}
  rowInput.value=row;
  modal.style.display="block";
}

editForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const data={}; new FormData(editForm).forEach((v,k)=>data[k]=v);
  const fileInput=document.getElementById("EditPhotoFile");
  if(fileInput.files[0]) data.PhotoBase64=await compressImage(fileInput.files[0]);
  const rowInput=editForm.querySelector("#_row"); if(rowInput){ data._row=parseInt(rowInput.value); rowInput.remove();}
  saveLocal(data); fetchContacts(); if(navigator.onLine) syncToServer();
  editForm.reset(); modal.style.display="none";
});

// ------------------- Delete -------------------
async function deleteContact(row){
  if(!confirm("Delete?")) return;
  let contacts=loadLocal(); contacts=contacts.filter(c=>c._row!==row); localStorage.setItem(LOCAL_KEY,JSON.stringify(contacts));
  fetchContacts(); if(navigator.onLine) await fetch(WEB_APP_URL,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({_row:row})});
}

// ------------------- Filters -------------------
document.getElementById("searchName").addEventListener("input",fetchContacts);
document.getElementById("filterStars").addEventListener("change",fetchContacts);
window.addEventListener("online",syncToServer);

fetchContacts();
