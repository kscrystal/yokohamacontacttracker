const WEB_APP_URL="https://script.google.com/macros/s/AKfycby7avZjGQeabr-hfFYYq5K1ACTSURqV8KwWQ5qHuuxWjXW8D6bPxuR9rTEvbMdyjgff/exec";
const LOCAL_KEY="contacts_local";

const milestoneMap = {
  "0": "Not Open",
  "0.5": "Open",
  "1": "Salvation",
  "1.5": "Next Step Started",
  "2": "Next Step Completed",
  "2.5": "Next Step Weekend 1",
  "3": "Baptism of Holy Spirit",
  "4": "Baptism"
};

// ------------------- IMAGE COMPRESSION -------------------
function compressImage(file,maxWidth=500,maxHeight=500,quality=0.7){
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=function(e){
      const img=new Image();
      img.onload=function(){
        let canvas=document.createElement("canvas");
        let width=img.width,height=img.height;
        if(width>height){if(width>maxWidth){height*=maxWidth/width;width=maxWidth}}else{if(height>maxHeight){width*=maxHeight/height;height=maxHeight}}
        canvas.width=width;canvas.height=height;
        canvas.getContext("2d").drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL("image/png",quality).split(",")[1]);
      }
      img.src=e.target.result;
    }
    reader.readAsDataURL(file);
  });
}

// ------------------- LOCAL STORAGE -------------------
function loadLocalContacts(){return JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]")}
function saveLocalContacts(contacts){localStorage.setItem(LOCAL_KEY,JSON.stringify(contacts))}

// ------------------- ADD CONTACT -------------------
async function addContact(contact){
  if(contact.PhotoFile){contact.PhotoBase64=await compressImage(contact.PhotoFile)}
  delete contact.PhotoFile;
  const contacts=loadLocalContacts();
  contact.synced=false;
  contacts.push(contact);
  saveLocalContacts(contacts);
  if(navigator.onLine) await syncToServer();
  renderContacts();
}

// ------------------- SYNC TO SERVER -------------------
async function syncToServer(){
  const contacts=loadLocalContacts();
  for(let c of contacts){
    if(!c.synced){
      try{
        const res=await fetch(WEB_APP_URL,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(c)
        });
        const data=await res.json();
        if(data.success) c.synced=true;
      }catch(err){console.log("Sync failed",err)}
    }
  }
  saveLocalContacts(contacts);
}

// ------------------- FORM SUBMISSION -------------------
document.getElementById("contactForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.target;const contact={};
  for(let el of form.elements){if(el.name) contact[el.name]=el.value}
  contact.PhotoFile=document.getElementById("PhotoFile").files[0];
  await addContact(contact);
  form.reset();
});

// ------------------- FILTERS -------------------
document.getElementById("searchName").addEventListener("input",()=>renderContactsFiltered());
document.getElementById("filterMilestone").addEventListener("change",()=>renderContactsFiltered());
document.getElementById("filterFollowUp").addEventListener("input",()=>renderContactsFiltered());

function renderContactsFiltered(){
  let contacts=loadLocalContacts();
  const nameFilter=document.getElementById("searchName").value.toLowerCase();
  const milestoneFilter=document.getElementById("filterMilestone").value;
  const followUpFilter=document.getElementById("filterFollowUp").value.toLowerCase();

  if(nameFilter) contacts=contacts.filter(c=>c.Name.toLowerCase().includes(nameFilter));
  if(milestoneFilter) contacts=contacts.filter(c=>c.MilestoneScore==milestoneFilter);
  if(followUpFilter) contacts=contacts.filter(c=>(c.FollowUpBy||"").toLowerCase().includes(followUpFilter));

  const container=document.getElementById("contactsList");
  container.innerHTML="";
  for(let c of contacts){
    const card=document.createElement("div");card.className="contact-card";
    const inner=document.createElement("div");inner.className="card-inner";
    const front=document.createElement("div");front.className="card-front";
    front.innerHTML=`<img src="${c.PhotoURL||''}" alt="${c.Name}"><h3>${c.Name}</h3><div class="milestone">${milestoneMap[c.MilestoneScore]||"Not Set"}</div>`;
    const back=document.createElement("div");back.className="card-back";
    back.innerHTML=`
      <p>Gospel Shared: ${c.GospelShared||"No"}</p>
      <p>Salvation: ${c.Salvation||"No"}</p>
      <p>Prayed: ${c.Prayed||"No"}</p>
      <p>Remarks: ${c.Remarks||""}</p>
      <p>Follow-up by: ${c.FollowUpBy||"N/A"}</p>
    `;
    inner.appendChild(front);inner.appendChild(back);card.appendChild(inner);container.appendChild(card);
  }
}

// ------------------- SYNC WHEN ONLINE -------------------
window.addEventListener("online",syncToServer);

// Initial render
renderContacts();
