// Konfigurasi API
const CONFIG = {
    // Gunakan MyMemory API (gratis, tanpa API key)
    MYMEMORY_API: 'https://api.mymemory.translated.net/get',
    
    // Untuk production, Anda bisa menggunakan API berbayar seperti Google Cloud Translation
    // GOOGLE_API_KEY: 'YOUR_API_KEY', // Ganti dengan API key Anda jika menggunakan Google
    
    // Pengaturan default
    DEFAULT_SOURCE_LANG: 'id',
    TARGET_LANGS: {
        ENGLISH: 'en',
        ARABIC: 'ar'
    }
};

// Pesan error dalam berbagai bahasa
const ERROR_MESSAGES = {
    id: {
        network: 'Kesalahan jaringan. Periksa koneksi internet Anda.',
        api: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        empty: 'Masukkan teks untuk diterjemahkan.'
    },
    en: {
        network: 'Network error. Check your internet connection.',
        api: 'Server error occurred. Please try again.',
        empty: 'Enter text to translate.'
    },
    ar: {
        network: 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت.',
        api: 'حدث خطأ في الخادم. حاول مرة اخرى.',
        empty: 'أدخل النص للترجمة.'
    }
};
