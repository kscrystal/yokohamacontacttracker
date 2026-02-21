const API_URL = "https://script.google.com/macros/s/AKfycbw55-G292BdO_oaA7KST9nEIQqbf7yXXsIXHV_gArrqWmy9PU9UohCdOfp5FfTTkOSK/exec";

const container = document.getElementById("cardsContainer");
const modal = document.getElementById("modal");
const form = document.getElementById("contactForm");

let contacts = [];

function renderStars(score) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (score >= i) stars += '⭐';
    else if (score >= i - 0.5) stars += '✨';
    else stars += '☆';
  }
  return stars;
}

async function fetchContacts() {
  const res = await fetch(API_URL);
  contacts = await res.json();
  contacts.forEach(c => c.MilestoneScore = parseFloat(c.MilestoneScore) || 0);
  displayContacts(contacts);
}

function displayContacts(list) {
  container.innerHTML = '';

  list.forEach(c => {
    const card = document.createElement("div");
    card.className = "contact-card";

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          ${c.PhotoURL ? `<img src="${c.PhotoURL}">` : ''}
          <div class="stars">${renderStars(c.MilestoneScore)}</div>
          <h3>${c.Name}</h3>
          <p>Gospel: ${c.GospelShared}</p>
          <p>Salvation: ${c.Salvation}</p>
          <p>Prayed: ${c.Prayed}</p>
          <p>${c.Remarks || ''}</p>
          <button onclick="editContact(${c._rowIndex})">Edit</button>
        </div>
        <div class="card-back">
          <p>LINE: ${c.LINEID || ''}</p>
          <p>Instagram: ${c.InstagramID || ''}</p>
          <p>HelloTalk: ${c.HelloTalkID || ''}</p>
          <p>Job/School: ${c.JobSchool || ''}</p>
          <p>Course: ${c.OccupationCourse || ''}</p>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

document.getElementById("searchInput").addEventListener("input", function() {
  const term = this.value.toLowerCase();
  displayContacts(
    contacts.filter(c => c.Name.toLowerCase().includes(term))
  );
});

document.getElementById("milestoneFilter").addEventListener("change", function() {
  if (this.value === "all") return displayContacts(contacts);
  const min = parseFloat(this.value);
  displayContacts(contacts.filter(c => c.MilestoneScore >= min));
});

document.getElementById("addBtn").onclick = () => {
  form.reset();
  document.getElementById("_rowIndex").value = "";
  modal.style.display = "block";
};

document.getElementById("closeModal").onclick = () => {
  modal.style.display = "none";
};

function editContact(rowIndex) {
  const contact = contacts.find(c => c._rowIndex === rowIndex);
  for (let key in contact) {
    if (document.getElementById(key))
      document.getElementById(key).value = contact[key];
  }
  modal.style.display = "block";
}

form.onsubmit = async e => {
  e.preventDefault();

  let photoURL = "";
  const file = document.getElementById("photo").files[0];

  if (file) photoURL = await compressImage(file);

  const data = {};
  [...form.elements].forEach(el => {
    if (el.id && el.id !== "photo")
      data[el.id] = el.value;
  });

  if (photoURL) data.PhotoURL = photoURL;

  const method = data._rowIndex ? "PUT" : "POST";

  await fetch(API_URL, {
    method: method,
    body: JSON.stringify(data)
  });

  modal.style.display = "none";
  fetchContacts();
};

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 400;
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

fetchContacts();
