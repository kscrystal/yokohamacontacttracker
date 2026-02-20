// script.js
const API_URL = 'https://script.google.com/macros/s/AKfycbw55-G292BdO_oaA7KST9nEIQqbf7yXXsIXHV_gArrqWmy9PU9UohCdOfp5FfTTkOSK/exec';
const container = document.getElementById('cardsContainer');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const form = document.getElementById('contactForm');
const addBtn = document.getElementById('addContactBtn');
const closeModal = document.getElementById('closeModal');

let contacts = [];

async function fetchContacts() {
  const res = await fetch(API_URL);
  contacts = await res.json();
  displayContacts(contacts);
}

function displayContacts(list) {
  container.innerHTML = '';
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'contact-card';
    card.innerHTML = `
      ${c.PhotoURL ? `<img src="${c.PhotoURL}" />` : ''}
      <h3>${c.Name}</h3>
      <p>${c.Phone}</p>
      <p>${c.Email || ''}</p>
      <p>${c.Notes || ''}</p>
    `;
    container.appendChild(card);
  });
}

// Filter
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  displayContacts(contacts.filter(c => c.Name.toLowerCase().includes(term)));
});

// Modal
addBtn.onclick = () => modal.style.display = 'block';
closeModal.onclick = () => modal.style.display = 'none';

// Form Submit
form.onsubmit = async e => {
  e.preventDefault();
  let photoURL = '';
  const file = document.getElementById('photo').files[0];
  if (file) {
    photoURL = await compressAndUpload(file);
  }

  const newContact = {
    Name: form.name.value,
    Phone: form.phone.value,
    Email: form.email.value,
    Notes: form.notes.value,
    PhotoURL: photoURL
  };

  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(newContact)
  });
  modal.style.display = 'none';
  form.reset();
  fetchContacts();
};

// Photo compression using canvas
function compressAndUpload(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400;
        const maxH = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > maxW) {
            height *= maxW / width;
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width *= maxH / height;
            height = maxH;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        // Optional: Upload to Drive via Apps Script endpoint
        resolve(compressed); 
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

fetchContacts();
