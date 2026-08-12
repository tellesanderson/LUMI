/* =============================================
   LUMI ADMIN — JavaScript Module
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  updateFirebaseStatusUI();
  initAuth();
  initDashboard();
  initDarkMode();
});

const isFb = typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured;

/* ===== UPDATE STATUS UI ===== */
function updateFirebaseStatusUI() {
  const badge = document.getElementById('firebaseStatusBadge');
  const loginSubtitle = document.getElementById('loginSubtitle');
  const sidebarSyncTitle = document.getElementById('sidebarSyncTitle');
  const sidebarSyncDesc = document.getElementById('sidebarSyncDesc');
  const jsCodeBox = document.getElementById('jsCodeBox');
  const backupBoxTitle = document.getElementById('backupBoxTitle');
  const backupBoxDesc = document.getElementById('backupBoxDesc');
  const resetBoxTitle = document.getElementById('resetBoxTitle');
  const resetBoxDesc = document.getElementById('resetBoxDesc');

  if (isFb) {
    badge.textContent = "Firebase: Online";
    badge.className = "admin-logo__badge admin-logo__badge--online";
    loginSubtitle.textContent = "Gerenciamento de Temas via Firestore";
    
    // Adjust sidebar instructions for Firebase mode
    sidebarSyncTitle.textContent = "🔥 Banco Firebase Ativo";
    sidebarSyncDesc.textContent = "Seu site está conectado diretamente ao banco do Firebase Firestore. Qualquer edição, adição ou exclusão entra no ar para todos os clientes em tempo real de forma segura!";
    jsCodeBox.style.display = "none"; // No need for copy code in Firebase mode
    
    backupBoxTitle.textContent = "1. Exportar JSON de Segurança";
    backupBoxDesc.textContent = "Crie uma cópia dos dados salvos no banco de dados na nuvem para o seu computador.";
    
    resetBoxTitle.textContent = "2. Enviar Temas Originais";
    resetBoxDesc.textContent = "Grava (semeia) os 15 temas originais da LUMI Decorações de volta no banco do Firestore (pode sobrescrever itens com IDs iguais).";
  } else {
    badge.textContent = "Demonstração (Local)";
    badge.className = "admin-logo__badge admin-logo__badge--offline";
    loginSubtitle.textContent = "Painel de Gerenciamento de Temas (Local)";
  }
}

/* ===== AUTHENTICATION ===== */
function initAuth() {
  const loginContainer = document.getElementById('loginContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');
  const loginDecorations = document.getElementById('loginDecorations');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const emailGroup = document.getElementById('emailGroup');
  const passwordLabel = document.getElementById('passwordLabel');
  const adminNavUser = document.getElementById('adminNavUser');

  if (isFb) {
    // Firebase Login Mode
    emailGroup.style.display = 'block';
    document.getElementById('email').required = true;
    passwordLabel.textContent = 'Senha';

    // Monitor Auth State
    auth.onAuthStateChanged((user) => {
      if (user) {
        loginContainer.style.display = 'none';
        loginDecorations.style.display = 'none';
        dashboardContainer.style.display = 'block';
        adminNavUser.innerHTML = `Logado como: <strong>${user.email}</strong>`;
        loadThemesFromStore();
      } else {
        loginContainer.style.display = 'flex';
        loginDecorations.style.display = 'block';
        dashboardContainer.style.display = 'none';
      }
    });

    // Submit Action
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const pwd = document.getElementById('password').value;

      auth.signInWithEmailAndPassword(email, pwd)
        .then(() => {
          loginError.style.display = 'none';
          showToast('Logado com sucesso!');
        })
        .catch((error) => {
          console.error("Erro no login Firebase:", error);
          loginError.textContent = "E-mail ou senha incorretos no Firebase.";
          loginError.style.display = 'block';
          document.getElementById('password').value = '';
        });
    });

    // Logout Action
    document.getElementById('logoutBtn').addEventListener('click', () => {
      auth.signOut().then(() => {
        showToast('Sessão encerrada.');
      });
    });

  } else {
    // Local Offline Mode
    emailGroup.style.display = 'none';
    document.getElementById('email').required = false;
    passwordLabel.textContent = 'Senha Administrativa (Local)';

    if (sessionStorage.getItem('lumi_admin_logged_in') === 'true') {
      loginContainer.style.display = 'none';
      loginDecorations.style.display = 'none';
      dashboardContainer.style.display = 'block';
      loadThemesFromStore();
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = document.getElementById('password').value;
      
      if (pwd === 'admin123') {
        sessionStorage.setItem('lumi_admin_logged_in', 'true');
        loginError.style.display = 'none';
        
        loginContainer.style.opacity = '0';
        loginContainer.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          loginContainer.style.display = 'none';
          loginDecorations.style.display = 'none';
          dashboardContainer.style.display = 'block';
          loadThemesFromStore();
        }, 300);
      } else {
        loginError.textContent = "Senha incorreta. Use admin123 para o modo de demonstração local.";
        loginError.style.display = 'block';
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem('lumi_admin_logged_in');
      window.location.reload();
    });
  }
}

/* ===== DASHBOARD CRUD CONTROLLER ===== */
let adminThemes = [];
let currentImageBase64 = '';
let originalThemeImage = '';
let cropperInstance = null;

// Helper to escape HTML characters (XSS Prevention)
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Compresses and resizes an image on a hidden canvas before saving to Base64
function compressAndResizeImage(base64Str, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Return compressed Base64 JPEG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

function initDashboard() {
  // UI Bindings
  document.getElementById('addThemeBtn').addEventListener('click', () => openModal());
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('themeForm').addEventListener('submit', handleFormSubmit);

  // Reservations Binding
  document.getElementById('reservationForm').addEventListener('submit', handleReservationSubmit);

  // Gallery bindings with background compression
  document.getElementById('themeGalleryFiles').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    showToast('Processando e compactando imagens...');
    
    let processedCount = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        compressAndResizeImage(event.target.result, 800, 600, 0.7).then((compressed) => {
          window.currentGalleryBase64.push(compressed);
          processedCount++;
          if (processedCount === files.length) {
            renderGalleryPreviews();
            showToast(`${files.length} imagens adicionadas à galeria!`);
          }
        });
      };
      reader.readAsDataURL(file);
    });
  });

  // Search & Filters
  document.getElementById('searchInput').addEventListener('input', renderDashboardTable);
  document.getElementById('categoryFilter').addEventListener('change', renderDashboardTable);

  // Copy JS code (only visible in offline mode)
  document.getElementById('copyJsBtn').addEventListener('click', copyJsCode);

  // Export JSON
  document.getElementById('exportJsonBtn').addEventListener('click', exportBackup);

  // Import JSON
  document.getElementById('importJsonInput').addEventListener('change', importBackup);

  // Reset Defaults
  document.getElementById('resetDefaultsBtn').addEventListener('click', resetToDefaultThemes);

  // Image selection toggle
  const imageTypeSelect = document.getElementById('imageTypeSelect');
  const urlInput = document.getElementById('themeImageUrl');
  const fileInputContainer = document.getElementById('themeImageUploadContainer');

  imageTypeSelect.addEventListener('change', () => {
    if (imageTypeSelect.value === 'url') {
      urlInput.style.display = 'block';
      fileInputContainer.style.display = 'none';
    } else {
      urlInput.style.display = 'none';
      fileInputContainer.style.display = 'block';
    }
    updateImagePreview();
  });

  urlInput.addEventListener('input', updateImagePreview);
  document.getElementById('themeImageFileInput').addEventListener('change', handleImageUpload);

  // Cropper events
  document.getElementById('cropperCloseBtn').addEventListener('click', closeCropperModal);
  document.getElementById('cropperCancelBtn').addEventListener('click', closeCropperModal);
  document.getElementById('cropperSaveBtn').addEventListener('click', applyCroppedImage);
}

function loadThemesFromStore() {
  if (isFb) {
    db.collection('themes').get()
      .then((querySnapshot) => {
        adminThemes = [];
        querySnapshot.forEach((doc) => {
          adminThemes.push({ id: doc.id, ...doc.data() });
        });
        adminThemes.sort((a, b) => {
          if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
          return a.title.localeCompare(b.title);
        });
        renderDashboard();
      })
      .catch((error) => {
        console.error("Erro ao carregar Firestore:", error);
        showToast("Erro ao conectar com o Firestore.");
      });
  } else {
    const stored = localStorage.getItem('lumi_themes');
    if (stored) {
      try {
        adminThemes = JSON.parse(stored);
      } catch (e) {
        adminThemes = defaultThemes;
      }
    } else {
      adminThemes = defaultThemes;
      localStorage.setItem('lumi_themes', JSON.stringify(adminThemes));
    }
    renderDashboard();
  }
}

function saveThemesToStore() {
  if (!isFb) {
    try {
      localStorage.setItem('lumi_themes', JSON.stringify(adminThemes));
      updateJsCodeArea();
      updateStats();
    } catch (e) {
      console.error("Erro ao salvar no LocalStorage:", e);
      alert("Erro de Limite Excedido: As imagens adicionadas são muito grandes para a memória local do navegador (limite de 5MB).\n\nPara resolver:\n1. Use imagens mais leves/comprimidas.\n2. Use a opção 'Copiar Código' em 'Configurações Avançadas' para atualizar diretamente o arquivo 'js/themes.js'.\n3. Configure o Firebase Firestore para armazenar dados ilimitados na nuvem.");
    }
  }
}

function renderDashboard() {
  renderDashboardTable();
  updateStats();
  updateJsCodeArea();
  
  // Update Reservation Theme Select
  const resThemeSelect = document.getElementById('resTheme');
  if (resThemeSelect) {
    resThemeSelect.innerHTML = adminThemes.map(t => `<option value="${t.id}">${escapeHTML(t.title)}</option>`).join('');
  }
  renderReservationsTable();
}

function updateStats() {
  document.getElementById('statTotal').textContent = adminThemes.length;
  document.getElementById('statMeninas').textContent = adminThemes.filter(t => t.category === 'meninas').length;
  document.getElementById('statMeninos').textContent = adminThemes.filter(t => t.category === 'meninos').length;
  document.getElementById('statUnissex').textContent = adminThemes.filter(t => t.category === 'unissex').length;
}

function renderDashboardTable() {
  const tbody = document.getElementById('themesTableBody');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  tbody.innerHTML = '';

  const filtered = adminThemes.filter(theme => {
    const matchesSearch = theme.title.toLowerCase().includes(search);
    const matchesCategory = category === 'todos' || theme.category === category;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-sec);">Nenhum tema encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(theme => {
    const tr = document.createElement('tr');
    
    const safeTitle = escapeHTML(theme.title);
    const safeCategory = escapeHTML(theme.category);
    let imageSrc = theme.coverImage || theme.image || '';
    if (!imageSrc) {
      imageSrc = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="%23F6AFCB"/></svg>`;
    }

    tr.innerHTML = `
      <td><img src="${imageSrc}" class="theme-row-img" alt="Pre-view"></td>
      <td><strong>${safeTitle}</strong></td>
      <td><span class="badge badge-${safeCategory}">${safeCategory}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon btn-icon--edit" onclick="editTheme('${theme.id}')" title="Editar Tema">✏️</button>
          <button class="btn-icon btn-icon--delete" onclick="deleteTheme('${theme.id}')" title="Excluir Tema">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ===== MODAL CONTROLS ===== */
window.currentGalleryBase64 = [];

window.renderGalleryPreviews = function() {
  const container = document.getElementById('galleryPreviews');
  if(!container) return;
  container.innerHTML = window.currentGalleryBase64.map((b64, i) => `
    <div style="position:relative; width:60px; height:60px;">
       <img src="${b64}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
       <button type="button" onclick="removeGalleryImg(${i})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-weight:bold; line-height:1; display:flex; align-items:center; justify-content:center;">×</button>
    </div>
  `).join('');
};

window.removeGalleryImg = function(index) {
  window.currentGalleryBase64.splice(index, 1);
  renderGalleryPreviews();
};

function openModal(themeId = '') {
  const modal = document.getElementById('themeModal');
  const form = document.getElementById('themeForm');
  form.reset();
  currentImageBase64 = '';
  originalThemeImage = '';
  document.getElementById('previewBox').innerHTML = '<span>🖼️</span>';
  
  window.currentGalleryBase64 = [];
  document.getElementById('themeGalleryFiles').value = '';
  renderGalleryPreviews();
  
  const select = document.getElementById('imageTypeSelect');
  const urlInput = document.getElementById('themeImageUrl');
  const fileInputContainer = document.getElementById('themeImageUploadContainer');
  select.value = 'upload';
  urlInput.style.display = 'none';
  fileInputContainer.style.display = 'block';

  if (themeId) {
    document.getElementById('modalTitle').textContent = 'Editar Tema';
    const theme = adminThemes.find(t => t.id === themeId);
    if (theme) {
      document.getElementById('editThemeId').value = theme.id;
      document.getElementById('themeTitle').value = theme.title;
      document.getElementById('themeCategory').value = theme.category;
      originalThemeImage = theme.coverImage || theme.image || '';
      
      if (originalThemeImage && originalThemeImage.startsWith('data:image')) {
        currentImageBase64 = originalThemeImage;
        select.value = 'upload';
        urlInput.style.display = 'none';
        fileInputContainer.style.display = 'block';
      } else {
        document.getElementById('themeImageUrl').value = originalThemeImage || '';
        select.value = 'url';
        urlInput.style.display = 'block';
        fileInputContainer.style.display = 'none';
      }
      
      window.currentGalleryBase64 = theme.galleryImages ? [...theme.galleryImages] : [];
      renderGalleryPreviews();

      updateImagePreview();
    }
  } else {
    document.getElementById('modalTitle').textContent = 'Novo Tema';
    document.getElementById('editThemeId').value = '';
  }

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('themeModal').classList.remove('active');
}

/* ===== IMAGE UPLOAD / PREVIEW ===== */
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const cropperModal = document.getElementById('cropperModal');
    const cropperImage = document.getElementById('cropperImage');
    
    cropperImage.src = event.target.result;
    cropperModal.classList.add('active');

    if (cropperInstance) {
      cropperInstance.destroy();
    }

    cropperInstance = new Cropper(cropperImage, {
      aspectRatio: 4 / 3,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.9,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false
    });
  };
  reader.readAsDataURL(file);
}

function closeCropperModal() {
  const cropperModal = document.getElementById('cropperModal');
  cropperModal.classList.remove('active');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  document.getElementById('themeImageFileInput').value = '';
}

function applyCroppedImage() {
  if (!cropperInstance) return;

  const canvas = cropperInstance.getCroppedCanvas({
    width: 600,
    height: 450,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high'
  });

  if (canvas) {
    currentImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    updateImagePreview();
    closeCropperModal();
    showToast('Imagem recortada e otimizada!');
  } else {
    alert('Não foi possível processar o recorte da imagem.');
  }
}

function updateImagePreview() {
  const type = document.getElementById('imageTypeSelect').value;
  const previewBox = document.getElementById('previewBox');
  
  let src = '';
  if (type === 'url') {
    src = document.getElementById('themeImageUrl').value;
  } else {
    src = currentImageBase64;
  }

  if (!src && originalThemeImage) {
    src = originalThemeImage;
  }

  if (src) {
    previewBox.innerHTML = `<img src="${src}" alt="Pre-view">`;
  } else {
    previewBox.innerHTML = '<span>🖼️</span>';
  }
}

/* ===== FORM SUBMIT (SAVE/CREATE) ===== */
function handleFormSubmit(e) {
  e.preventDefault();

  const themeId = document.getElementById('editThemeId').value;
  const title = document.getElementById('themeTitle').value;
  const category = document.getElementById('themeCategory').value;
  const imageType = document.getElementById('imageTypeSelect').value;
  
  let image = '';
  if (imageType === 'url') {
    image = document.getElementById('themeImageUrl').value;
  } else {
    image = currentImageBase64;
  }

  if (themeId && !image) {
    image = originalThemeImage;
  }

  if (themeId) {
    // Edit Mode
    const themeData = { title, category, coverImage: image, galleryImages: window.currentGalleryBase64, updatedAt: Date.now() };

    if (isFb) {
      db.collection('themes').doc(themeId).update(themeData)
        .then(() => {
          showToast('Tema atualizado no Firestore!');
          closeModal();
          loadThemesFromStore();
        })
        .catch((error) => {
          console.error("Erro ao atualizar Firestore:", error);
          alert("Erro ao salvar no Firestore: " + error.message);
        });
    } else {
      const index = adminThemes.findIndex(t => t.id === themeId);
      if (index !== -1) {
        adminThemes[index] = { id: themeId, ...themeData };
        saveThemesToStore();
        renderDashboard();
        closeModal();
        showToast('Tema atualizado localmente!');
      }
    }
  } else {
    // Create Mode
    const id = title.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');
    
    let finalId = id || 'theme_' + Date.now();
    let suffix = 1;
    while (adminThemes.some(t => t.id === finalId)) {
      finalId = `${id}_${suffix}`;
      suffix++;
    }

    const themeData = { title, category, coverImage: image, galleryImages: window.currentGalleryBase64, createdAt: Date.now() };

    if (isFb) {
      db.collection('themes').doc(finalId).set(themeData)
        .then(() => {
          showToast('Tema adicionado ao Firestore!');
          closeModal();
          loadThemesFromStore();
        })
        .catch((error) => {
          console.error("Erro ao adicionar Firestore:", error);
          alert("Erro ao cadastrar no Firestore: " + error.message);
        });
    } else {
      adminThemes.push({ id: finalId, ...themeData });
      saveThemesToStore();
      renderDashboard();
      closeModal();
      showToast('Novo tema adicionado localmente!');
    }
  }
}

/* ===== RESERVATIONS LOGIC ===== */
let adminReservations = [];

function handleReservationSubmit(e) {
  e.preventDefault();
  const themeId = document.getElementById('resTheme').value;
  const date = document.getElementById('resDate').value;
  const note = document.getElementById('resNote').value;

  if (!themeId || !date) return;

  const resData = { themeId, date, note, createdAt: Date.now() };

  if (isFb) {
    db.collection('reservations').add(resData).then(() => {
      showToast('Reserva registrada!');
      document.getElementById('reservationForm').reset();
      loadReservationsFromStore();
    }).catch(err => {
      console.error(err);
      alert('Erro ao salvar reserva: ' + err.message + '\n\nVerifique se a coleção "reservations" possui regras de escrita liberadas nas regras de segurança do seu painel do Firebase Firestore.');
    });
  } else {
    adminReservations.push({ id: 'res_' + Date.now(), ...resData });
    localStorage.setItem('lumi_reservations', JSON.stringify(adminReservations));
    showToast('Reserva registrada localmente!');
    document.getElementById('reservationForm').reset();
    renderReservationsTable();
  }
}

function loadReservationsFromStore() {
  if (isFb) {
    db.collection('reservations').get().then((snap) => {
      adminReservations = [];
      snap.forEach(doc => adminReservations.push({ id: doc.id, ...doc.data() }));
      adminReservations.sort((a,b) => new Date(b.date) - new Date(a.date));
      renderReservationsTable();
    });
  } else {
    const stored = localStorage.getItem('lumi_reservations');
    adminReservations = stored ? JSON.parse(stored) : [];
    adminReservations.sort((a,b) => new Date(b.date) - new Date(a.date));
    renderReservationsTable();
  }
}

window.renderReservationsTable = function() {
  const tbody = document.getElementById('reservationsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(adminReservations.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1rem; color:var(--text-sec);">Nenhuma reserva.</td></tr>`;
    return;
  }
  adminReservations.forEach(res => {
    const theme = adminThemes.find(t => t.id === res.themeId);
    const themeName = theme ? theme.title : 'Tema Excluído';
    
    let dateObj = new Date(res.date + 'T12:00:00');
    let dateStr = res.date;
    if(!isNaN(dateObj)) {
       dateStr = dateObj.toLocaleDateString('pt-BR');
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${dateStr}</strong></td>
      <td>${escapeHTML(themeName)}</td>
      <td>${escapeHTML(res.note)}</td>
      <td>
        <button class="btn-icon btn-icon--delete" onclick="deleteReservation('${res.id}')" title="Excluir Reserva">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

window.deleteReservation = function(id) {
  if(!confirm('Deseja excluir esta reserva?')) return;
  if (isFb) {
    db.collection('reservations').doc(id).delete().then(() => {
      showToast('Reserva excluída!');
      loadReservationsFromStore();
    });
  } else {
    adminReservations = adminReservations.filter(r => r.id !== id);
    localStorage.setItem('lumi_reservations', JSON.stringify(adminReservations));
    renderReservationsTable();
    showToast('Reserva excluída localmente!');
  }
};

/* ===== DELETE THEME ===== */
window.deleteTheme = function(themeId) {
  const theme = adminThemes.find(t => t.id === themeId);
  if (!theme) return;

  if (confirm(`Tem certeza de que deseja excluir o tema "${theme.title}"?`)) {
    if (isFb) {
      db.collection('themes').doc(themeId).delete()
        .then(() => {
          showToast('Tema excluído do Firestore!');
          loadThemesFromStore();
        })
        .catch((error) => {
          console.error("Erro ao deletar Firestore:", error);
          alert("Erro ao excluir do Firestore. Verifique suas regras de segurança!");
        });
    } else {
      adminThemes = adminThemes.filter(t => t.id !== themeId);
      saveThemesToStore();
      renderDashboard();
      showToast('Tema excluído localmente!');
    }
  }
};

window.editTheme = function(themeId) {
  openModal(themeId);
};

/* ===== PUBLISHING CODE GENERATOR (OFFLINE ONLY) ===== */
function updateJsCodeArea() {
  const codeArea = document.getElementById('jsCodeArea');
  if (!codeArea) return;

  const codeString = `/* =============================================
   LUMI DECORAÇÕES — Banco de Dados de Temas (Exportado)
   ============================================= */

const defaultThemes = ${JSON.stringify(adminThemes, null, 2)};
`;
  codeArea.value = codeString;
}

function copyJsCode() {
  const codeArea = document.getElementById('jsCodeArea');
  codeArea.select();
  document.execCommand('copy');
  showToast('Código copiado! Cole no seu js/themes.js.');
}

/* ===== BACKUP JSON ===== */
function exportBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminThemes, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "lumi_temas_backup.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  showToast('Backup JSON baixado!');
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (Array.isArray(parsed) && parsed.every(item => item.id && item.title && item.category)) {
        if (isFb) {
          if (confirm(`Deseja importar estes ${parsed.length} temas para o seu banco de dados Firestore?`)) {
            showToast('Importando... Aguarde.');
            let promises = parsed.map((theme, index) => {
              return db.collection('themes').doc(theme.id).set({
                title: theme.title,
                category: theme.category,
                coverImage: theme.coverImage || theme.image || '',
                galleryImages: theme.galleryImages || [],
                createdAt: theme.createdAt || (Date.now() + index)
              });
            });
            Promise.all(promises)
              .then(() => {
                showToast('Backup JSON importado com sucesso para o Firestore!');
                loadThemesFromStore();
              })
              .catch((err) => {
                console.error("Erro importação Firestore:", err);
                alert("Erro ao gravar dados no Firestore.");
              });
          }
        } else {
          adminThemes = parsed;
          saveThemesToStore();
          renderDashboard();
          showToast('Backup local importado com sucesso!');
        }
      } else {
        alert('Formato de arquivo inválido. Array de temas incompleto.');
      }
    } catch (err) {
      alert('Erro ao carregar arquivo de backup.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ===== RESET / SEED DEFAULTS ===== */
function resetToDefaultThemes() {
  if (isFb) {
    if (confirm('Atenção: Isso irá cadastrar e sobrescrever todos os 15 temas originais padrão no banco de dados do Firestore. Deseja continuar?')) {
      showToast('Enviando temas para o Firestore... Aguarde.');
      
      let promises = defaultThemes.map((theme, index) => {
        return db.collection('themes').doc(theme.id).set({
          title: theme.title,
          category: theme.category,
          coverImage: theme.coverImage || theme.image || '',
          galleryImages: theme.galleryImages || [],
          createdAt: Date.now() + index
        });
      });

      Promise.all(promises)
        .then(() => {
          showToast('15 Temas originais cadastrados com sucesso no Firestore!');
          loadThemesFromStore();
        })
        .catch((error) => {
          console.error("Erro ao semear banco:", error);
          alert("Erro ao popular Firestore. Verifique suas credenciais e regras de segurança.");
        });
    }
  } else {
    if (confirm('Atenção: Isso irá apagar todas as edições locais e restaurar os 15 temas originais padrão do site. Deseja continuar?')) {
      adminThemes = defaultThemes;
      saveThemesToStore();
      renderDashboard();
      showToast('Temas padrões restaurados!');
    }
  }
}

/* ===== TOAST ALERTS ===== */
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  document.getElementById('toastMessage').textContent = message;
  
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}

/* ===== DARK MODE CONTROLLER ===== */
function initDarkMode() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('lumi_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  setTheme(initialTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lumi_theme', theme);
    
    if (theme === 'dark') {
      toggleBtn.innerHTML = '☀️';
      toggleBtn.setAttribute('title', 'Mudar para modo claro');
    } else {
      toggleBtn.innerHTML = '🌙';
      toggleBtn.setAttribute('title', 'Mudar para modo escuro');
    }
  }
}
