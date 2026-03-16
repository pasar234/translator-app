// State aplikasi
let currentTargetLang = 'en';
let isTranslating = false;
let currentUtterance = null;
let isSpeaking = {
    id: false,
    en: false,
    ar: false
};

// Elemen DOM
const inputText = document.getElementById('inputText');
const englishOutput = document.getElementById('englishOutput');
const arabicOutput = document.getElementById('arabicOutput');
const translateBtn = document.getElementById('translateBtn');
const clearBtn = document.getElementById('clearBtn');
const swapBtn = document.getElementById('swapBtn');
const charCounter = document.getElementById('charCounter');
const copyEnglishBtn = document.getElementById('copyEnglishBtn');
const copyArabicBtn = document.getElementById('copyArabicBtn');
const speakIndonesian = document.getElementById('speakIndonesian');
const speakEnglish = document.getElementById('speakEnglish');
const speakArabic = document.getElementById('speakArabic');
const apiStatus = document.getElementById('apiStatus');

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    initSpeechSynthesis();
});

// Inisialisasi speech synthesis
function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        showToast('Browser Anda tidak mendukung text-to-speech', 'error');
        disableSpeechButtons();
        return;
    }

    // Tunggu voices dimuat
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('Voices loaded:', speechSynthesis.getVoices().length);
        });
    }

    // Bersihkan speech saat halaman ditutup
    window.addEventListener('beforeunload', () => {
        stopAllSpeech();
    });
}

// Nonaktifkan tombol speech
function disableSpeechButtons() {
    [speakIndonesian, speakEnglish, speakArabic].forEach(btn => {
        btn.disabled = true;
        btn.title = 'Tidak didukung di browser ini';
    });
}

// Event listeners
inputText.addEventListener('input', updateCharCounter);
translateBtn.addEventListener('click', translate);
clearBtn.addEventListener('click', clearInput);
swapBtn.addEventListener('click', swapLanguages);

copyEnglishBtn.addEventListener('click', () => copyToClipboard('english'));
copyArabicBtn.addEventListener('click', () => copyToClipboard('arabic'));

// Event listeners untuk speech - VERSI PERBAIKAN
speakIndonesian.addEventListener('click', function() {
    const text = inputText.value.trim();
    if (!text) {
        showToast('Tidak ada teks Indonesia untuk dibacakan', 'warning');
        return;
    }
    toggleSpeech(text, 'id', 'Indonesia');
});

speakEnglish.addEventListener('click', function() {
    const text = getEnglishText();
    if (!text) {
        showToast('Tidak ada teks Inggris untuk dibacakan', 'warning');
        return;
    }
    toggleSpeech(text, 'en', 'Inggris');
});

speakArabic.addEventListener('click', function() {
    const text = getArabicText();
    if (!text) {
        showToast('Tidak ada teks Arab untuk dibacakan', 'warning');
        return;
    }
    toggleSpeech(text, 'ar', 'Arab');
});

// Fungsi toggle speech (play/stop)
function toggleSpeech(text, lang, langName) {
    // Jika sedang berbicara di bahasa yang sama, hentikan
    if (isSpeaking[lang]) {
        stopSpeech(lang);
        return;
    }
    
    // Hentikan semua speech yang sedang berlangsung
    stopAllSpeech();
    
    // Mulai speech baru
    speakText(text, lang, langName);
}

// Fungsi utama text-to-speech - VERSI PERBAIKAN
function speakText(text, lang, langName) {
    if (!('speechSynthesis' in window)) {
        showToast('Browser tidak mendukung text-to-speech', 'error');
        return;
    }

    // Batasi teks jika terlalu panjang
    const maxLength = 200;
    let textToSpeak = text;
    if (text.length > maxLength) {
        textToSpeak = text.substring(0, maxLength) + '...';
        showToast(`Teks terlalu panjang, hanya ${maxLength} karakter pertama yang dibacakan`, 'warning');
    }

    // Buat utterance baru
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtterance = utterance;
    
    // Set bahasa
    switch(lang) {
        case 'id':
            utterance.lang = 'id-ID';
            break;
        case 'en':
            utterance.lang = 'en-US';
            break;
        case 'ar':
            utterance.lang = 'ar-SA';
            break;
        default:
            utterance.lang = 'id-ID';
    }

    // Set kecepatan dan nada
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Pilih voice yang sesuai
    const voice = selectVoice(lang);
    if (voice) {
        utterance.voice = voice;
    }

    // Event handlers
    utterance.onstart = () => {
        isSpeaking[lang] = true;
        updateSpeechButton(lang, true);
        console.log(`Mulai membaca ${langName}`);
    };

    utterance.onend = () => {
        isSpeaking[lang] = false;
        updateSpeechButton(lang, false);
        currentUtterance = null;
        console.log(`Selesai membaca ${langName}`);
    };

    utterance.onerror = (event) => {
        console.error(`Error membaca ${langName}:`, event);
        isSpeaking[lang] = false;
        updateSpeechButton(lang, false);
        currentUtterance = null;
        
        // Tampilkan pesan error yang lebih informatif
        if (event.error === 'not-allowed') {
            showToast('Izin microphone diperlukan untuk text-to-speech', 'error');
        } else if (event.error === 'interrupted') {
            // Normal, diabaikan
        } else {
            showToast(`Gagal membaca teks ${langName}`, 'error');
        }
    };

    // Mulai berbicara
    try {
        window.speechSynthesis.cancel(); // Hentikan yang sedang berjalan
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Speech error:', error);
        showToast('Gagal memulai text-to-speech', 'error');
    }
}

// Pilih voice yang sesuai
function selectVoice(lang) {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prioritaskan voice berdasarkan bahasa
    const langCodes = {
        'id': ['id-ID', 'ms-MY', 'Indonesian'],
        'en': ['en-US', 'en-GB', 'en-AU', 'English'],
        'ar': ['ar-SA', 'ar-EG', 'Arabic']
    };

    // Cari voice yang cocok
    for (const code of langCodes[lang]) {
        const voice = voices.find(v => 
            v.lang.includes(code) || v.name.includes(code)
        );
        if (voice) return voice;
    }

    // Fallback: voice pertama dengan bahasa yang mendekati
    const fallback = voices.find(v => v.lang.includes(lang));
    if (fallback) return fallback;

    // Fallback terakhir: voice default
    return voices[0];
}

// Update tampilan tombol speech
function updateSpeechButton(lang, isActive) {
    const buttons = {
        'id': speakIndonesian,
        'en': speakEnglish,
        'ar': speakArabic
    };

    const labels = {
        'id': 'Indonesia',
        'en': 'Inggris',
        'ar': 'Arab'
    };

    const button = buttons[lang];
    if (!button) return;

    if (isActive) {
        button.classList.add('speaking');
        button.innerHTML = '<i class="fas fa-stop"></i> Berhenti';
        button.title = `Klik untuk berhenti`;
    } else {
        button.classList.remove('speaking');
        button.innerHTML = `<i class="fas fa-volume-up"></i> Dengarkan ${labels[lang]}`;
        button.title = `Dengarkan bahasa ${labels[lang]}`;
    }
}

// Hentikan speech di bahasa tertentu
function stopSpeech(lang) {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    isSpeaking[lang] = false;
    updateSpeechButton(lang, false);
    currentUtterance = null;
}

// Hentikan semua speech
function stopAllSpeech() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    isSpeaking = { id: false, en: false, ar: false };
    updateSpeechButton('id', false);
    updateSpeechButton('en', false);
    updateSpeechButton('ar', false);
    currentUtterance = null;
}

// Update karakter counter
function updateCharCounter() {
    const length = inputText.value.length;
    charCounter.textContent = `${length} karakter`;
    charCounter.classList.remove('warning', 'danger');
    
    if (length > 500) {
        charCounter.classList.add('danger');
    } else if (length > 300) {
        charCounter.classList.add('warning');
    }
}

// Clear input
function clearInput() {
    inputText.value = '';
    englishOutput.innerHTML = '<p class="placeholder">Hasil terjemahan Inggris akan muncul di sini...</p>';
    arabicOutput.innerHTML = '<p class="placeholder">نتيجة الترجمة العربية ستظهر هنا...</p>';
    updateCharCounter();
    stopAllSpeech();
    showToast('Teks telah dihapus', 'success');
}

// Swap bahasa target
function swapLanguages() {
    currentTargetLang = currentTargetLang === 'en' ? 'ar' : 'en';
    swapBtn.style.transform = 'rotate(180deg) scale(1.2)';
    setTimeout(() => {
        swapBtn.style.transform = 'rotate(0deg) scale(1)';
    }, 300);
    showToast(`Target language: ${currentTargetLang === 'en' ? 'Inggris' : 'Arab'}`, 'success');
}

// Fungsi utama terjemahan
async function translate() {
    const text = inputText.value.trim();
    
    if (!text) {
        showToast('Masukkan teks untuk diterjemahkan', 'warning');
        inputText.classList.add('error');
        setTimeout(() => inputText.classList.remove('error'), 500);
        return;
    }
    
    if (isTranslating) return;
    
    isTranslating = true;
    showLoading();
    stopAllSpeech();
    
    try {
        // Tampilkan loading di output
        englishOutput.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
        arabicOutput.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
        
        // Terjemahkan ke Inggris
        const englishResult = await translateText(text, 'en');
        updateOutput(englishOutput, englishResult);
        
        // Terjemahkan ke Arab
        const arabicResult = await translateText(text, 'ar');
        updateOutput(arabicOutput, arabicResult, true);
        
        apiStatus.innerHTML = '<i class="fas fa-check-circle"></i> Status: Berhasil diterjemahkan';
        apiStatus.style.color = '#28a745';
        showToast('Terjemahan berhasil!', 'success');
    } catch (error) {
        console.error('Translation error:', error);
        showToast('Gagal menerjemahkan. Coba lagi.', 'error');
        apiStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Status: Gagal';
        apiStatus.style.color = '#dc3545';
    } finally {
        isTranslating = false;
        hideLoading();
    }
}

// Fungsi untuk memanggil API terjemahan
async function translateText(text, targetLang) {
    try {
        // Gunakan MyMemory Translation API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=id|${targetLang}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else {
            throw new Error('Terjemahan tidak ditemukan');
        }
    } catch (error) {
        console.log('API Error, using fallback:', error);
        // Fallback translation
        return getFallbackTranslation(text, targetLang);
    }
}

// Fallback translation
function getFallbackTranslation(text, targetLang) {
    const dictionary = {
        'halo': { en: 'Hello', ar: 'مرحبا' },
        'hai': { en: 'Hi', ar: 'مرحبا' },
        'selamat pagi': { en: 'Good morning', ar: 'صباح الخير' },
        'selamat siang': { en: 'Good afternoon', ar: 'مساء الخير' },
        'selamat sore': { en: 'Good evening', ar: 'مساء الخير' },
        'selamat malam': { en: 'Good night', ar: 'تصبح على خير' },
        'terima kasih': { en: 'Thank you', ar: 'شكرا' },
        'terimakasih': { en: 'Thank you', ar: 'شكرا' },
        'makasih': { en: 'Thanks', ar: 'شكرا' },
        'sama sama': { en: 'You\'re welcome', ar: 'عفوا' },
        'apa kabar': { en: 'How are you?', ar: 'كيف حالك؟' },
        'kabar baik': { en: 'I\'m fine', ar: 'بخير' },
        'baik': { en: 'Good', ar: 'جيد' },
        'iya': { en: 'Yes', ar: 'نعم' },
        'ya': { en: 'Yes', ar: 'نعم' },
        'tidak': { en: 'No', ar: 'لا' },
        'maaf': { en: 'Sorry', ar: 'آسف' },
        'permisi': { en: 'Excuse me', ar: 'عفوا' },
        'selamat jalan': { en: 'Goodbye', ar: 'مع السلامة' },
        'sampai jumpa': { en: 'See you', ar: 'أراك لاحقا' },
        'saya cinta kamu': { en: 'I love you', ar: 'أحبك' },
        'aku cinta kamu': { en: 'I love you', ar: 'أحبك' },
        'siapa nama kamu': { en: 'What is your name?', ar: 'ما اسمك؟' },
        'nama saya': { en: 'My name is', ar: 'اسمي' },
        'selamat datang': { en: 'Welcome', ar: 'أهلا وسهلا' },
        'hati hati': { en: 'Take care', ar: 'اعتن بنفسك' },
        'cepat sembuh': { en: 'Get well soon', ar: 'سلامات' },
        'selamat ulang tahun': { en: 'Happy birthday', ar: 'عيد ميلاد سعيد' },
        'selamat tahun baru': { en: 'Happy new year', ar: 'سنة جديدة سعيدة' }
    };
    
    const lowerText = text.toLowerCase().trim();
    
    // Cek exact match
    if (dictionary[lowerText]) {
        return dictionary[lowerText][targetLang];
    }
    
    // Cek partial match
    for (const [key, value] of Object.entries(dictionary)) {
        if (lowerText.includes(key)) {
            return `${value[targetLang]} (${text})`;
        }
    }
    
    // Jika tidak ditemukan
    const prefix = targetLang === 'en' ? '[English]' : '[Arabic]';
    return `${prefix} ${text}`;
}

// Update output
function updateOutput(element, text, isArabic = false) {
    if (!text) {
        element.innerHTML = '<p class="placeholder">Terjemahan tidak tersedia</p>';
        return;
    }
    
    element.innerHTML = `<p>${escapeHtml(text)}</p>`;
}

// Escape HTML untuk keamanan
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy ke clipboard - VERSI PERBAIKAN
function copyToClipboard(target) {
    let text = '';
    let language = '';
    
    if (target === 'english') {
        text = getEnglishText();
        language = 'Inggris';
    } else {
        text = getArabicText();
        language = 'Arab';
    }
    
    if (!text) {
        showToast(`Tidak ada teks ${language} untuk disalin`, 'warning');
        return;
    }
    
    // Gunakan Clipboard API modern
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast(`✓ Teks ${language} berhasil disalin!`, 'success');
                
                // Animasi tombol copy
                const btn = target === 'english' ? copyEnglishBtn : copyArabicBtn;
                btn.style.transform = 'scale(1.2)';
                btn.style.color = '#28a745';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                    btn.style.color = '';
                }, 200);
            })
            .catch(() => {
                // Fallback ke metode lama
                copyTextFallback(text, language);
            });
    } else {
        // Fallback untuk browser lama
        copyTextFallback(text, language);
    }
}

// Fallback copy untuk browser lama
function copyTextFallback(text, language) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    
    try {
        const success = document.execCommand('copy');
        if (success) {
            showToast(`✓ Teks ${language} berhasil disalin!`, 'success');
        } else {
            showToast(`Gagal menyalin teks ${language}`, 'error');
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showToast(`Gagal menyalin teks ${language}`, 'error');
    }
    
    document.body.removeChild(textarea);
}

// Mendapatkan teks dari output
function getEnglishText() {
    const p = englishOutput.querySelector('p');
    if (!p || p.classList.contains('placeholder')) return '';
    
    // Ambil teks tanpa tag HTML
    return p.textContent || '';
}

function getArabicText() {
    const p = arabicOutput.querySelector('p');
    if (!p || p.classList.contains('placeholder')) return '';
    
    // Ambil teks tanpa tag HTML
    return p.textContent || '';
}

// UI Helpers
function showLoading() {
    translateBtn.innerHTML = '<span class="loading"></span> Menerjemahkan...';
    translateBtn.disabled = true;
}

function hideLoading() {
    translateBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Terjemahkan';
    translateBtn.disabled = false;
}

// Toast notification - VERSI PERBAIKAN
function showToast(message, type = 'info') {
    // Hapus toast yang sudah ada
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat toast baru
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Tambah icon sesuai tipe
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    // Tampilkan toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hapus setelah 3 detik
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Cek status API
async function checkAPIStatus() {
    try {
        const response = await fetch('https://api.mymemory.translated.net/get?q=test&langpair=id|en');
        if (response.ok) {
            apiStatus.innerHTML = '<i class="fas fa-wifi"></i> Status: API Terhubung';
            apiStatus.style.color = '#28a745';
        } else {
            throw new Error('API tidak merespons');
        }
    } catch (error) {
        apiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Status: Mode Demo';
        apiStatus.style.color = '#ffc107';
        showToast('Menggunakan mode demo (terjemahan terbatas)', 'warning');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter untuk translate
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        translate();
    }
    
    // Escape untuk clear
    if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement === inputText || activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            clearInput();
        }
    }
    
    // Ctrl+Shift+S untuk stop speech
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        stopAllSpeech();
        showToast('Speech dihentikan', 'info');
    }
    
    // Ctrl+C untuk copy (akan ditangani browser secara default)
    // Tapi kita tambahkan notifikasi
    if (e.ctrlKey && e.key === 'c') {
        const selection = window.getSelection().toString();
        if (selection) {
            showToast('Teks dipilih, gunakan tombol copy untuk menyalin', 'info');
        }
    }
});

// Double click pada output untuk copy
englishOutput.addEventListener('dblclick', () => {
    const text = getEnglishText();
    if (text) {
        copyToClipboard('english');
    }
});

arabicOutput.addEventListener('dblclick', () => {
    const text = getArabicText();
    if (text) {
        copyToClipboard('arabic');
    }
});

// Prevent multiple speech instances
window.addEventListener('blur', () => {
    // Hentikan speech saat pindah tab
    stopAllSpeech();
});
