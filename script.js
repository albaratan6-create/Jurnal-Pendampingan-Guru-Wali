// Global variables
let isDrawing = false;
let currentCanvas = null;

// DOM Elements
const form = document.getElementById('jurnalForm');
const previewBtn = document.getElementById('previewBtn');
const saveBtn = document.getElementById('saveBtn');
const printBtn = document.getElementById('printBtn');
const resetBtn = document.getElementById('resetBtn');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const closeBtn = document.querySelector('.close');
const closePreviewBtn = document.getElementById('closePreview');
const printFromPreviewBtn = document.getElementById('printFromPreview');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// History elements
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistory');
const searchHistoryInput = document.getElementById('searchHistory');
const clearAllHistoryBtn = document.getElementById('clearAllHistory');
const historyList = document.getElementById('historyList');
const noHistory = document.getElementById('noHistory');
const viewHistoryModal = document.getElementById('viewHistoryModal');
const closeViewHistoryBtn = document.getElementById('closeViewHistory');
const closeViewHistoryBtn2 = document.getElementById('closeViewHistoryBtn');
const viewHistoryContent = document.getElementById('viewHistoryContent');
const printHistoryBtn = document.getElementById('printHistory');
const deleteHistoryBtn = document.getElementById('deleteHistory');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSignaturePads();
    setupEventListeners();
    setDefaultDate();
    updateSignatureLabels();
    addScrollAnimations();
    addInteractiveEffects();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal').value = today;
}

// Setup all event listeners
function setupEventListeners() {
    // Form buttons
    previewBtn.addEventListener('click', showPreview);
    saveBtn.addEventListener('click', saveData);
    printBtn.addEventListener('click', printForm);
    resetBtn.addEventListener('click', resetForm);
    
    // Modal buttons
    closeBtn.addEventListener('click', closeModal);
    closePreviewBtn.addEventListener('click', closeModal);
    printFromPreviewBtn.addEventListener('click', printFromPreview);
    
    // History buttons
    historyBtn.addEventListener('click', showHistoryModal);
    closeHistoryBtn.addEventListener('click', closeHistoryModal);
    clearAllHistoryBtn.addEventListener('click', clearAllHistory);
    searchHistoryInput.addEventListener('input', filterHistory);
    
    // View history modal buttons
    closeViewHistoryBtn.addEventListener('click', closeViewHistoryModal);
    closeViewHistoryBtn2.addEventListener('click', closeViewHistoryModal);
    printHistoryBtn.addEventListener('click', printHistoryData);
    deleteHistoryBtn.addEventListener('click', deleteHistoryData);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === previewModal) {
            closeModal();
        }
        if (event.target === historyModal) {
            closeHistoryModal();
        }
        if (event.target === viewHistoryModal) {
            closeViewHistoryModal();
        }
    });
    
    // Clear signature buttons
    document.querySelectorAll('.clear-signature').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            clearSignature(targetId);
        });
    });
}

// Initialize signature pads
function initializeSignaturePads() {
    const canvases = ['ttdSiswa', 'ttdGuru'];
    
    canvases.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        // Set canvas properties
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Mouse events
        canvas.addEventListener('mousedown', (e) => startDrawing(e, canvas));
        canvas.addEventListener('mousemove', (e) => draw(e, canvas));
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvas.dispatchEvent(mouseEvent);
        });
    });
}

// Signature drawing functions
function startDrawing(e, canvas) {
    isDrawing = true;
    currentCanvas = canvas;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e, canvas) {
    if (!isDrawing || currentCanvas !== canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
    currentCanvas = null;
}

function clearSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Form validation
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#ef4444';
            isValid = false;
        } else {
            field.style.borderColor = '#e5e7eb';
        }
    });
    
    // Check if signatures are present
    const signatureCanvases = ['ttdSiswa', 'ttdGuru'];
    const hasSignatures = signatureCanvases.every(canvasId => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return !imageData.data.every(pixel => pixel === 0);
    });
    
    if (!hasSignatures) {
        showToast('Harap lengkapi tanda tangan siswa dan guru!', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Show preview modal
function showPreview() {
    if (!validateForm()) {
        showToast('Harap lengkapi semua field yang diperlukan!', 'error');
        return;
    }
    
    const formData = getFormData();
    const previewHTML = generatePreviewHTML(formData);
    previewContent.innerHTML = previewHTML;
    previewModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Get form data
function getFormData() {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Get signature data
    data.signatureSiswa = getSignatureData('ttdSiswa');
    data.signatureGuru = getSignatureData('ttdGuru');
    
    return data;
}

// Get signature data as base64
function getSignatureData(canvasId) {
    const canvas = document.getElementById(canvasId);
    return canvas.toDataURL();
}

// Generate preview HTML
function generatePreviewHTML(data) {
    return `
        <div class="preview-content">
            <div class="preview-header">
                <h1>Jurnal Bimbingan Individu</h1>
                <p>Tanggal: ${formatDate(data.tanggal)}</p>
            </div>
            
            <div class="preview-section">
                <h2>Identitas Siswa</h2>
                <div class="preview-field">
                    <strong>Nama:</strong>
                    <p>${data.nama}</p>
                </div>
                <div class="preview-field">
                    <strong>Kelas:</strong>
                    <p>${data.kelas}</p>
                </div>
                <div class="preview-field">
                    <strong>Tanggal:</strong>
                    <p>${formatDate(data.tanggal)}</p>
                </div>
                <div class="preview-field">
                    <strong>Bidang Fokus:</strong>
                    <p>${data.bidangFokus}</p>
                </div>
            </div>
            
            <div class="preview-section">
                <h2>Isi Bimbingan</h2>
                <div class="preview-field">
                    <strong>1. Permasalahan / Kebutuhan Siswa:</strong>
                    <p>${data.permasalahan}</p>
                </div>
                <div class="preview-field">
                    <strong>2. Tujuan Bimbingan:</strong>
                    <p>${data.tujuan}</p>
                </div>
                <div class="preview-field">
                    <strong>3. Materi / Kegiatan Bimbingan:</strong>
                    <p>${data.materi}</p>
                </div>
                <div class="preview-field">
                    <strong>4. Hasil / Tindak Lanjut:</strong>
                    <p>${data.hasil}</p>
                </div>
                <div class="preview-field">
                    <strong>5. Catatan Guru Wali:</strong>
                    <p>${data.catatanGuru}</p>
                </div>
            </div>
            
            <div class="signature-preview">
                <div class="signature-item">
                    <strong>Tanda Tangan ${data.nama}</strong>
                    <canvas width="200" height="100"></canvas>
                    <div class="signature-name">${data.nama}</div>
                </div>
                <div class="signature-item">
                    <strong>Tanda Tangan ${data.namaGuru}</strong>
                    <canvas width="200" height="100"></canvas>
                    <div class="signature-name">${data.namaGuru}</div>
                </div>
            </div>
        </div>
    `;
}

// Load signatures into preview
function loadSignaturesToPreview() {
    const previewCanvases = previewContent.querySelectorAll('canvas');
    const originalCanvases = ['ttdSiswa', 'ttdGuru'];
    
    previewCanvases.forEach((canvas, index) => {
        const originalCanvas = document.getElementById(originalCanvases[index]);
        const ctx = canvas.getContext('2d');
        const originalCtx = originalCanvas.getContext('2d');
        
        // Scale the signature to fit the preview canvas
        const scaleX = canvas.width / originalCanvas.width;
        const scaleY = canvas.height / originalCanvas.height;
        
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(originalCanvas, 0, 0);
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
}

// Save data to localStorage
function saveData() {
    if (!validateForm()) {
        showToast('Harap lengkapi semua field yang diperlukan!', 'error');
        return;
    }
    
    const formData = getFormData();
    const timestamp = new Date().toISOString();
    const dataKey = `jurnal_${timestamp}`;
    
    try {
        localStorage.setItem(dataKey, JSON.stringify(formData));
        showToast('Data berhasil disimpan!', 'success');
        
        // Reset form after successful save
        setTimeout(() => {
            resetFormAfterSave();
        }, 1500); // Wait for toast to show
        
    } catch (error) {
        showToast('Gagal menyimpan data!', 'error');
        console.error('Error saving data:', error);
    }
}

// Print form
function printForm() {
    if (!validateForm()) {
        showToast('Harap lengkapi semua field yang diperlukan!', 'error');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const formData = getFormData();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Jurnal Bimbingan Individu - ${formData.nama}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
                .section { margin-bottom: 25px; }
                .section h2 { color: #4f46e5; margin-bottom: 15px; }
                .field { margin-bottom: 10px; }
                .field strong { display: inline-block; min-width: 150px; color: #4f46e5; }
                .signatures { display: flex; justify-content: space-around; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ccc; }
                .signature-item { text-align: center; }
                .signature-item strong { display: block; margin-bottom: 10px; }
                .signature-item canvas { border: 1px solid #ccc; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Jurnal Bimbingan Individu</h1>
                <p>Tanggal: ${formatDate(formData.tanggal)}</p>
            </div>
            
            <div class="section">
                <h2>Identitas Siswa</h2>
                <div class="field"><strong>Nama:</strong> ${formData.nama}</div>
                <div class="field"><strong>Kelas:</strong> ${formData.kelas}</div>
                <div class="field"><strong>Tanggal:</strong> ${formatDate(formData.tanggal)}</div>
                <div class="field"><strong>Bidang Fokus:</strong> ${formData.bidangFokus}</div>
            </div>
            
            <div class="section">
                <h2>Isi Bimbingan</h2>
                <div class="field"><strong>1. Permasalahan / Kebutuhan Siswa:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${formData.permasalahan}</div>
                
                <div class="field"><strong>2. Tujuan Bimbingan:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${formData.tujuan}</div>
                
                <div class="field"><strong>3. Materi / Kegiatan Bimbingan:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${formData.materi}</div>
                
                <div class="field"><strong>4. Hasil / Tindak Lanjut:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${formData.hasil}</div>
                
                <div class="field"><strong>5. Catatan Guru Wali:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${formData.catatanGuru}</div>
            </div>
            
            <div class="signatures">
                <div class="signature-item">
                    <strong>Tanda Tangan Siswa</strong>
                    <canvas id="sig1" width="200" height="100"></canvas>
                </div>
                <div class="signature-item">
                    <strong>Tanda Tangan Guru</strong>
                    <canvas id="sig2" width="200" height="100"></canvas>
                </div>
            </div>
            
            <script>
                // Load signatures
                const sig1 = document.getElementById('sig1');
                const sig2 = document.getElementById('sig2');
                const ctx1 = sig1.getContext('2d');
                const ctx2 = sig2.getContext('2d');
                
                const img1 = new Image();
                const img2 = new Image();
                
                img1.onload = function() {
                    ctx1.drawImage(img1, 0, 0, 200, 100);
                };
                img2.onload = function() {
                    ctx2.drawImage(img2, 0, 0, 200, 100);
                };
                
                img1.src = '${formData.signatureSiswa}';
                img2.src = '${formData.signatureGuru}';
                
                // Auto print
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Print from preview
function printFromPreview() {
    const formData = getFormData();
    printForm();
    closeModal();
}

// Reset form
function resetForm() {
    if (confirm('Apakah Anda yakin ingin mereset semua data?')) {
        resetFormAfterSave();
        showToast('Form berhasil direset!', 'success');
    }
}

// Reset form after save (without confirmation)
function resetFormAfterSave() {
    isFormBeingReset = true;
    
    form.reset();
    
    // Clear signatures
    clearSignature('ttdSiswa');
    clearSignature('ttdGuru');
    
    // Reset date to today
    setDefaultDate();
    
    // Reset field styles
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.style.borderColor = '#e5e7eb';
    });
    
    // Update signature labels to default
    updateSignatureLabels();
    
    // Clear auto-save data
    localStorage.removeItem('jurnal_autosave');
    
    // Re-enable auto-save after a short delay
    setTimeout(() => {
        isFormBeingReset = false;
    }, 100);
}

// Close modal
function closeModal() {
    previewModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    // Different duration based on type
    const duration = type === 'success' ? 2000 : 3000;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Auto-save functionality (optional)
let autoSaveTimeout;
let isFormBeingReset = false;

form.addEventListener('input', function() {
    // Skip auto-save if form is being reset
    if (isFormBeingReset) return;
    
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        const formData = getFormData();
        localStorage.setItem('jurnal_autosave', JSON.stringify(formData));
    }, 2000);
});

// Load auto-saved data on page load
window.addEventListener('load', function() {
    const autoSavedData = localStorage.getItem('jurnal_autosave');
    if (autoSavedData) {
        try {
            const data = JSON.parse(autoSavedData);
            loadFormData(data);
        } catch (error) {
            console.error('Error loading auto-saved data:', error);
        }
    }
});

// Load form data
function loadFormData(data) {
    Object.keys(data).forEach(key => {
        const element = form.querySelector(`[name="${key}"]`);
        if (element && key !== 'signatureSiswa' && key !== 'signatureGuru') {
            element.value = data[key];
        }
    });
    
    // Load signatures
    if (data.signatureSiswa) {
        loadSignatureToCanvas('ttdSiswa', data.signatureSiswa);
    }
    if (data.signatureGuru) {
        loadSignatureToCanvas('ttdGuru', data.signatureGuru);
    }
}

// Load signature to canvas
function loadSignatureToCanvas(canvasId, signatureData) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    };
    
    img.src = signatureData;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveData();
    }
    
    // Ctrl+P to print
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        printForm();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
});

    // Form validation on input
    form.addEventListener('input', function(e) {
        if (e.target.hasAttribute('required')) {
            if (e.target.value.trim()) {
                e.target.style.borderColor = '#10b981';
            } else {
                e.target.style.borderColor = '#e5e7eb';
            }
        }
        
        // Update signature labels when name fields change
        if (e.target.id === 'nama' || e.target.id === 'namaGuru') {
            updateSignatureLabels();
        }
    });

// Add loading states to buttons
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        // Restore original content based on button type
        if (button.id === 'saveBtn') {
            button.innerHTML = '<i class="fas fa-save"></i> Simpan';
        } else if (button.id === 'printBtn') {
            button.innerHTML = '<i class="fas fa-print"></i> Cetak';
        }
    }
}

// ==================== HISTORY FUNCTIONS ====================

// Show history modal
function showHistoryModal() {
    loadHistoryData();
    historyModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close history modal
function closeHistoryModal() {
    historyModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Load history data from localStorage
function loadHistoryData() {
    const historyData = getAllHistoryData();
    displayHistoryList(historyData);
}

// Get all history data from localStorage
function getAllHistoryData() {
    const historyData = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('jurnal_') && key !== 'jurnal_autosave') {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                data.key = key;
                data.timestamp = new Date(key.replace('jurnal_', ''));
                historyData.push(data);
            } catch (error) {
                console.error('Error parsing history data:', error);
            }
        }
    }
    return historyData.sort((a, b) => b.timestamp - a.timestamp);
}

// Display history list
function displayHistoryList(historyData) {
    if (historyData.length === 0) {
        historyList.style.display = 'none';
        noHistory.style.display = 'block';
        return;
    }
    
    historyList.style.display = 'block';
    noHistory.style.display = 'none';
    
    historyList.innerHTML = historyData.map(data => createHistoryItem(data)).join('');
    
    // Add event listeners to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            viewHistoryItem(key);
        });
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.history-action-btn.view').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const key = this.getAttribute('data-key');
            viewHistoryItem(key);
        });
    });
    
    document.querySelectorAll('.history-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const key = this.getAttribute('data-key');
            deleteHistoryItem(key);
        });
    });
}

// Create history item HTML
function createHistoryItem(data) {
    const date = formatDate(data.tanggal);
    const summary = data.permasalahan ? data.permasalahan.substring(0, 100) + '...' : 'Tidak ada ringkasan';
    
    return `
        <div class="history-item" data-key="${data.key}">
            <div class="history-item-header">
                <h3 class="history-student-name">${data.nama}</h3>
                <span class="history-date">${date}</span>
            </div>
            <div class="history-details">
                <div class="history-detail-item">
                    <div class="history-detail-label">Kelas</div>
                    <div class="history-detail-value">${data.kelas}</div>
                </div>
                <div class="history-detail-item">
                    <div class="history-detail-label">Bidang Fokus</div>
                    <div class="history-detail-value">${data.bidangFokus}</div>
                </div>
            </div>
            <div class="history-summary">${summary}</div>
            <div class="history-actions">
                <button class="history-action-btn view" data-key="${data.key}">
                    <i class="fas fa-eye"></i> Lihat
                </button>
                <button class="history-action-btn delete" data-key="${data.key}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `;
}

// View history item
function viewHistoryItem(key) {
    const data = JSON.parse(localStorage.getItem(key));
    if (!data) {
        showToast('Data tidak ditemukan!', 'error');
        return;
    }
    
    currentHistoryKey = key;
    const historyHTML = generateHistoryViewHTML(data);
    viewHistoryContent.innerHTML = historyHTML;
    viewHistoryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Load signatures after modal is displayed
    setTimeout(() => {
        loadHistorySignatures();
    }, 100);
}

// Generate history view HTML
function generateHistoryViewHTML(data) {
    return `
        <div class="history-view-content">
            <div class="history-view-header">
                <h1>Jurnal Bimbingan Individu</h1>
                <p>Tanggal: ${formatDate(data.tanggal)}</p>
            </div>
            
            <div class="history-view-section">
                <h2>Identitas Siswa</h2>
                <div class="history-view-field">
                    <strong>Nama:</strong>
                    <p>${data.nama}</p>
                </div>
                <div class="history-view-field">
                    <strong>Kelas:</strong>
                    <p>${data.kelas}</p>
                </div>
                <div class="history-view-field">
                    <strong>Tanggal:</strong>
                    <p>${formatDate(data.tanggal)}</p>
                </div>
                <div class="history-view-field">
                    <strong>Bidang Fokus:</strong>
                    <p>${data.bidangFokus}</p>
                </div>
                <div class="history-view-field">
                    <strong>Guru Wali:</strong>
                    <p>${data.namaGuru}</p>
                </div>
            </div>
            
            <div class="history-view-section">
                <h2>Isi Bimbingan</h2>
                <div class="history-view-field">
                    <strong>1. Permasalahan / Kebutuhan Siswa:</strong>
                    <p>${data.permasalahan}</p>
                </div>
                <div class="history-view-field">
                    <strong>2. Tujuan Bimbingan:</strong>
                    <p>${data.tujuan}</p>
                </div>
                <div class="history-view-field">
                    <strong>3. Materi / Kegiatan Bimbingan:</strong>
                    <p>${data.materi}</p>
                </div>
                <div class="history-view-field">
                    <strong>4. Hasil / Tindak Lanjut:</strong>
                    <p>${data.hasil}</p>
                </div>
                <div class="history-view-field">
                    <strong>5. Catatan Guru Wali:</strong>
                    <p>${data.catatanGuru}</p>
                </div>
            </div>
            
            <div class="history-view-signatures">
                <div class="history-view-signature-item">
                    <strong>Tanda Tangan ${data.nama}</strong>
                    <canvas id="historySig1" width="200" height="100"></canvas>
                    <div class="history-view-signature-name">${data.nama}</div>
                </div>
                <div class="history-view-signature-item">
                    <strong>Tanda Tangan ${data.namaGuru}</strong>
                    <canvas id="historySig2" width="200" height="100"></canvas>
                    <div class="history-view-signature-name">${data.namaGuru}</div>
                </div>
            </div>
        </div>
    `;
}

// Load signatures to history view
function loadHistorySignatures() {
    const data = JSON.parse(localStorage.getItem(currentHistoryKey));
    if (!data) return;
    
    // Load student signature
    if (data.signatureSiswa) {
        const canvas1 = document.getElementById('historySig1');
        if (canvas1) {
            const ctx1 = canvas1.getContext('2d');
            const img1 = new Image();
            img1.onload = function() {
                ctx1.drawImage(img1, 0, 0, 200, 100);
            };
            img1.src = data.signatureSiswa;
        }
    }
    
    // Load teacher signature
    if (data.signatureGuru) {
        const canvas2 = document.getElementById('historySig2');
        if (canvas2) {
            const ctx2 = canvas2.getContext('2d');
            const img2 = new Image();
            img2.onload = function() {
                ctx2.drawImage(img2, 0, 0, 200, 100);
            };
            img2.src = data.signatureGuru;
        }
    }
}

// Close view history modal
function closeViewHistoryModal() {
    viewHistoryModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentHistoryKey = null;
}

// Print history data
function printHistoryData() {
    if (!currentHistoryKey) return;
    
    const data = JSON.parse(localStorage.getItem(currentHistoryKey));
    if (!data) {
        showToast('Data tidak ditemukan!', 'error');
        return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Jurnal Bimbingan Individu - ${data.nama}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
                .section { margin-bottom: 25px; }
                .section h2 { color: #4f46e5; margin-bottom: 15px; }
                .field { margin-bottom: 10px; }
                .field strong { display: inline-block; min-width: 150px; color: #4f46e5; }
                .signatures { display: flex; justify-content: space-around; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ccc; }
                .signature-item { text-align: center; }
                .signature-item strong { display: block; margin-bottom: 10px; }
                .signature-item canvas { border: 1px solid #ccc; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Jurnal Bimbingan Individu</h1>
                <p>Tanggal: ${formatDate(data.tanggal)}</p>
            </div>
            
            <div class="section">
                <h2>Identitas Siswa</h2>
                <div class="field"><strong>Nama:</strong> ${data.nama}</div>
                <div class="field"><strong>Kelas:</strong> ${data.kelas}</div>
                <div class="field"><strong>Tanggal:</strong> ${formatDate(data.tanggal)}</div>
                <div class="field"><strong>Bidang Fokus:</strong> ${data.bidangFokus}</div>
                <div class="field"><strong>Guru Wali:</strong> ${data.namaGuru}</div>
            </div>
            
            <div class="section">
                <h2>Isi Bimbingan</h2>
                <div class="field"><strong>1. Permasalahan / Kebutuhan Siswa:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${data.permasalahan}</div>
                
                <div class="field"><strong>2. Tujuan Bimbingan:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${data.tujuan}</div>
                
                <div class="field"><strong>3. Materi / Kegiatan Bimbingan:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${data.materi}</div>
                
                <div class="field"><strong>4. Hasil / Tindak Lanjut:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${data.hasil}</div>
                
                <div class="field"><strong>5. Catatan Guru Wali:</strong></div>
                <div style="margin-left: 20px; margin-bottom: 15px;">${data.catatanGuru}</div>
            </div>
            
            <div class="signatures">
                <div class="signature-item">
                    <strong>Tanda Tangan ${data.nama}</strong>
                    <canvas id="sig1" width="200" height="100"></canvas>
                    <div class="signature-name">${data.nama}</div>
                </div>
                <div class="signature-item">
                    <strong>Tanda Tangan ${data.namaGuru}</strong>
                    <canvas id="sig2" width="200" height="100"></canvas>
                    <div class="signature-name">${data.namaGuru}</div>
                </div>
            </div>
            
            <script>
                const sig1 = document.getElementById('sig1');
                const sig2 = document.getElementById('sig2');
                const ctx1 = sig1.getContext('2d');
                const ctx2 = sig2.getContext('2d');
                
                const img1 = new Image();
                const img2 = new Image();
                
                img1.onload = function() {
                    ctx1.drawImage(img1, 0, 0, 200, 100);
                };
                img2.onload = function() {
                    ctx2.drawImage(img2, 0, 0, 200, 100);
                };
                
                img1.src = '${data.signatureSiswa}';
                img2.src = '${data.signatureGuru}';
                
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    closeViewHistoryModal();
}

// Delete history item
function deleteHistoryItem(key) {
    if (confirm('Apakah Anda yakin ingin menghapus data bimbingan ini?')) {
        localStorage.removeItem(key);
        showToast('Data berhasil dihapus!', 'success');
        loadHistoryData(); // Refresh the list
    }
}

// Delete current history data
function deleteHistoryData() {
    if (!currentHistoryKey) return;
    
    if (confirm('Apakah Anda yakin ingin menghapus data bimbingan ini?')) {
        localStorage.removeItem(currentHistoryKey);
        showToast('Data berhasil dihapus!', 'success');
        closeViewHistoryModal();
        loadHistoryData(); // Refresh the list
    }
}

// Clear all history
function clearAllHistory() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data bimbingan? Tindakan ini tidak dapat dibatalkan!')) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('jurnal_') && key !== 'jurnal_autosave') {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        showToast('Semua data berhasil dihapus!', 'success');
        loadHistoryData();
    }
}

// Filter history
function filterHistory() {
    const searchTerm = searchHistoryInput.value.toLowerCase();
    const historyItems = document.querySelectorAll('.history-item');
    
    historyItems.forEach(item => {
        const studentName = item.querySelector('.history-student-name').textContent.toLowerCase();
        const className = item.querySelector('.history-detail-value').textContent.toLowerCase();
        
        if (studentName.includes(searchTerm) || className.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Global variable for current history key
let currentHistoryKey = null;

// ==================== INTERACTIVE EFFECTS ====================

// Add scroll animations
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // Observe form sections
    document.querySelectorAll('.form-section').forEach(section => {
        observer.observe(section);
    });

    // Observe buttons
    document.querySelectorAll('.btn').forEach(btn => {
        observer.observe(btn);
    });
}

// Add interactive effects
function addInteractiveEffects() {
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add typing effect to form inputs
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', function() {
            this.style.borderColor = '#10b981';
            this.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
            
            setTimeout(() => {
                if (this.value.trim()) {
                    this.style.borderColor = '#4f46e5';
                    this.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                } else {
                    this.style.borderColor = '#e5e7eb';
                    this.style.boxShadow = 'none';
                }
            }, 1000);
        });
    });

    // Add hover sound effect (visual feedback)
    document.querySelectorAll('.btn, .history-item, .signature-pad').forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = this.style.transform.replace('scale(1)', 'scale(1.05)');
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = this.style.transform.replace('scale(1.05)', 'scale(1)');
        });
    });
}

// Add ripple effect CSS
function addRippleCSS() {
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Call ripple CSS function
addRippleCSS();

// ==================== SIGNATURE LABEL FUNCTIONS ====================

// Update signature labels with actual names
function updateSignatureLabels() {
    const namaSiswa = document.getElementById('nama').value;
    const namaGuru = document.getElementById('namaGuru').value;
    
    // Update student signature label
    const labelTtdSiswa = document.getElementById('labelTtdSiswa');
    const signatureNameSiswa = document.getElementById('signatureNameSiswa');
    
    if (namaSiswa.trim()) {
        labelTtdSiswa.textContent = `Tanda Tangan ${namaSiswa}`;
        signatureNameSiswa.textContent = namaSiswa;
    } else {
        labelTtdSiswa.textContent = 'Tanda Tangan Siswa';
        signatureNameSiswa.textContent = 'Nama Siswa';
    }
    
    // Update teacher signature label
    const labelTtdGuru = document.getElementById('labelTtdGuru');
    const signatureNameGuru = document.getElementById('signatureNameGuru');
    
    if (namaGuru.trim()) {
        labelTtdGuru.textContent = `Tanda Tangan ${namaGuru}`;
        signatureNameGuru.textContent = namaGuru;
    } else {
        labelTtdGuru.textContent = 'Tanda Tangan Guru';
        signatureNameGuru.textContent = 'Nama Guru Wali';
    }
}
