const AWGm1 = document.querySelector('.get-btn2');
const AWGm2 = document.querySelector('.get-btn3');
const AWGm3 = document.querySelector('.get-btn4');

function generateRandomEndpoint() {
    const ports = [500, 854, 859, 864, 878, 880, 890, 891, 894, 903, 908, 928, 934, 939, 942, 943, 945, 946, 955, 968, 987, 988, 1002, 1010, 1014, 1018, 1070, 1074, 1180, 1387, 1701, 1843, 2371, 2408, 2506, 3138, 3476, 3581, 3854, 4177, 4198, 4233, 4500, 5279, 5956, 7103, 7152, 7156, 7281, 7559, 8319, 8742, 8854, 8886];
    
    const port = ports[Math.floor(Math.random() * ports.length)];
    
    const prefixes = ["162.159.192.", "162.159.195.", "engage.cloudflareclient.com"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    if (prefix === "engage.cloudflareclient.com") {
        return `${prefix}:${port}`;
    } else {
        const randomNumber = Math.floor(Math.random() * 10) + 1;
        return `${prefix}${randomNumber}:${port}`;
    }
}

function getRandomJcParams() {
    const options = [
        "Jc = 4\nJmin = 40\nJmax = 70",
        "Jc = 120\nJmin = 23\nJmax = 911"
    ];
    return options[Math.floor(Math.random() * options.length)];
}

const fetchWithTimeout = async (url, options = {}, timeout = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout for ${url}`);
        }
        throw error;
    }
};

// Кэш для хранения данных сессии (действует до обновления страницы)
const sessionCache = {
    keys: null,
    accountData: null,
    installId: null,
    fcmToken: null
};

const generateRandomString = (length) => {
    // Если есть кэшированный installId, используем его
    if (sessionCache.installId && sessionCache.installId.length === length) {
        return sessionCache.installId;
    }
    
    const randomString = Array.from({ length }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
            Math.floor(Math.random() * 62)
        )
    ).join('');
    
    // Кэшируем только если это installId (длина 22)
    if (length === 22) {
        sessionCache.installId = randomString;
    }
    
    return randomString;
};

const fetchKeys = async (primaryOnly = false) => {
    // Проверяем кэш
    if (sessionCache.keys) {
        console.log('Using cached keys');
        return sessionCache.keys;
    }
    
    const endpoints = [
        'https://keygen.warp-generator.workers.dev',
        'https://warp-generation.vercel.app/keys'
    ];
    
    let lastError;
    
    for (let i = 0; i < endpoints.length; i++) {
        try {
            console.log(`Trying keys endpoint: ${i}`);
            const response = await fetchWithTimeout(endpoints[i]);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch keys from ${i}: ${response.status}`);
            }
            
            const data = await response.text();
            const keys = {
                publicKey: extractKey(data, 'PublicKey'),
                privateKey: extractKey(data, 'PrivateKey'),
            };
            
            // Сохраняем в кэш
            sessionCache.keys = keys;
            
            return keys;
        } catch (error) {
            console.warn(`Failed to fetch from ${i}:`, error.message);
            lastError = error;
            
            if (primaryOnly) break;
            
            if (i === endpoints.length - 1) {
                throw lastError;
            }
        }
    }
    
    throw lastError;
};

const fetchAccount = async (publicKey, installId, fcmToken, primaryOnly = false) => {
    // Проверяем кэш
    if (sessionCache.accountData) {
        // Проверяем, что ключи соответствуют
        if (sessionCache.keys && sessionCache.keys.publicKey === publicKey) {
            console.log('Using cached account data');
            return sessionCache.accountData;
        }
    }
    
    const endpoints = [
        'https://www.warp-generator.workers.dev/wg',
        'https://warp.sub-aggregator.workers.dev/wg',
        'https://warp-generation.vercel.app/wg'
    ];
    
    let lastError;
    
    for (let i = 0; i < endpoints.length; i++) {
        try {
            console.log(`Trying account endpoint: ${i}`);
            const response = await fetchWithTimeout(endpoints[i], {
                method: 'POST',
                headers: {
                    'User-Agent': 'okhttp/3.12.1',
                    'CF-Client-Version': 'a-6.10-2158',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    key: publicKey,
                    install_id: installId,
                    fcm_token: fcmToken,
                    tos: new Date().toISOString(),
                    model: 'PC',
                    serial_number: installId,
                    locale: 'de_DE',
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch account from ${i}: ${response.status}`);
            }
            
            const accountData = await response.json();
            
            // Сохраняем в кэш
            sessionCache.accountData = accountData;
            sessionCache.fcmToken = fcmToken;
            
            return accountData;
        } catch (error) {
            console.warn(`Failed to fetch account from ${i}:`, error.message);
            lastError = error;
            
            if (primaryOnly) break;
            
            if (i === endpoints.length - 1) {
                throw lastError;
            }
        }
    }
    
    throw lastError;
};

const extractKey = (data, keyName) =>
    data.match(new RegExp(`${keyName}:\\s(.+)`))?.[1].trim() || null;

const generateReserved = (clientId) =>
    Array.from(atob(clientId))
        .map((char) => char.charCodeAt(0))
        .slice(0, 3)
        .join(', ');

// Show popup notification
const showPopup = (message, type = 'success') => {
    const popup = document.createElement('div');
    popup.className = 'popup-message';
    popup.textContent = message;
    
    if (type === 'error') {
        popup.style.backgroundColor = '#d32f2f';
    }
    
    document.body.appendChild(popup);
    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 2500);
};

const downloadConfig = (fileName, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'application/octet-stream' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

// AWGm1
AWGm1.addEventListener('click', async () => {
    const button = document.getElementById('generateButton2');
    const randomEndpoint = generateRandomEndpoint();
    const randomNumber = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    button.disabled = true;
    button.classList.add("button--loading");
    try {
        const { publicKey, privateKey } = await fetchKeys();
        const installId = generateRandomString(22);
        const fcmToken = `${installId}:APA91b${generateRandomString(134)}`;
        const accountData = await fetchAccount(publicKey, installId, fcmToken);
        
        // Фиксированные значения вместо выбора пользователя
        const selectedDNS = "1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001";
        const allowedIPs = "0.0.0.0/0, ::/0";
        
        const wireGuardText = `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4
I1 = <b 0xce000000010897a297ecc34cd6dd000044d0ec2e2e1ea2991f467ace4222129b5a098823784694b4897b9986ae0b7280135fa85e196d9ad980b150122129ce2a9379531b0fd3e871ca5fdb883c369832f730e272d7b8b74f393f9f0fa43f11e510ecb2219a52984410c204cf875585340c62238e14ad04dff382f2c200e0ee22fe743b9c6b8b043121c5710ec289f471c91ee414fca8b8be8419ae8ce7ffc53837f6ade262891895f3f4cecd31bc93ac5599e18e4f01b472362b8056c3172b513051f8322d1062997ef4a383b01706598d08d48c221d30e74c7ce000cdad36b706b1bf9b0607c32ec4b3203a4ee21ab64df336212b9758280803fcab14933b0e7ee1e04a7becce3e2633f4852585c567894a5f9efe9706a151b615856647e8b7dba69ab357b3982f554549bef9256111b2d67afde0b496f16962d4957ff654232aa9e845b61463908309cfd9de0a6abf5f425f577d7e5f6440652aa8da5f73588e82e9470f3b21b27b28c649506ae1a7f5f15b876f56abc4615f49911549b9bb39dd804fde182bd2dcec0c33bad9b138ca07d4a4a1650a2c2686acea05727e2a78962a840ae428f55627516e73c83dd8893b02358e81b524b4d99fda6df52b3a8d7a5291326e7ac9d773c5b43b8444554ef5aea104a738ed650aa979674bbed38da58ac29d87c29d387d80b526065baeb073ce65f075ccb56e47533aef357dceaa8293a523c5f6f790be90e4731123d3c6152a70576e90b4ab5bc5ead01576c68ab633ff7d36dcde2a0b2c68897e1acfc4d6483aaaeb635dd63c96b2b6a7a2bfe042f6aed82e5363aa850aace12ee3b1a93f30d8ab9537df483152a5527faca21efc9981b304f11fc95336f5b9637b174c5a0659e2b22e159a9fed4b8e93047371175b1d6d9cc8ab745f3b2281537d1c75fb9451871864efa5d184c38c185fd203de206751b92620f7c369e031d2041e152040920ac2c5ab5340bfc9d0561176abf10a147287ea90758575ac6a9f5ac9f390d0d5b23ee12af583383d994e22c0cf42383834bcd3ada1b3825a0664d8f3fb678261d57601ddf94a8a68a7c273a18c08aa99c7ad8c6c42eab67718843597ec9930457359dfdfbce024afc2dcf9348579a57d8d3490b2fa99f278f1c37d87dad9b221acd575192ffae1784f8e60ec7cee4068b6b988f0433d96d6a1b1865f4e155e9fe020279f434f3bf1bd117b717b92f6cd1cc9bea7d45978bcc3f24bda631a36910110a6ec06da35f8966c9279d130347594f13e9e07514fa370754d1424c0a1545c5070ef9fb2acd14233e8a50bfc5978b5bdf8bc1714731f798d21e2004117c61f2989dd44f0cf027b27d4019e81ed4b5c31db347c4a3a4d85048d7093cf16753d7b0d15e078f5c7a5205dc2f87...

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = ${allowedIPs}
Endpoint = ${randomEndpoint}`;
        
        const content = wireGuardText || "No configuration available";
        if (content === "No configuration available") {
            showPopup('No configuration to download', 'Ошибка');
            return;
        }
        
        downloadConfig(`WARPm1_${randomNumber}.conf`, content);
        showPopup('Скачивание конфигурации');
    } catch (error) {
        console.error('Error processing configuration:', error);
        showPopup('Failed to generate config. Please try again.', 'error');
    } finally {
        button.disabled = false;
        button.classList.remove("button--loading");
    }
});

// AWGm2
AWGm2.addEventListener('click', async () => {
    const button = document.getElementById('generateButton3');
    const randomEndpoint = generateRandomEndpoint();
    const randomNumber = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    button.disabled = true;
    button.classList.add("button--loading");
    try {
        const { publicKey, privateKey } = await fetchKeys();
        const installId = generateRandomString(22);
        const fcmToken = `${installId}:APA91b${generateRandomString(134)}`;
        const accountData = await fetchAccount(publicKey, installId, fcmToken);
        const jcParams = getRandomJcParams();
        
        // Фиксированные значения вместо выбора пользователя
        const selectedDNS = "1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001";
        const allowedIPs = "0.0.0.0/0, ::/0";
        
        const wireGuardText = `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}	
MTU = 1280
S1 = 0
S2 = 0
${jcParams}
H1 = 1
H2 = 2
H3 = 3
H4 = 4

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = ${allowedIPs}
Endpoint = ${randomEndpoint}`;
        
        const content = wireGuardText || "No configuration available";
        if (content === "No configuration available") {
            showPopup('No configuration to download', 'Ошибка');
            return;
        }
        
        downloadConfig(`WARPm2_${randomNumber}.conf`, content);
        showPopup('Скачивание конфигурации');
    } catch (error) {
        console.error('Error processing configuration:', error);
        showPopup('Failed to generate config. Please try again.', 'error');
    } finally {
        button.disabled = false;
        button.classList.remove("button--loading");
    }
});

// AWGm3
AWGm3.addEventListener('click', async () => {
    const button = document.getElementById('generateButton4');
    const randomEndpoint = generateRandomEndpoint();
    const randomNumber = Math.floor(Math.random() * (99 - 10 + 1)) + 10;
    button.disabled = true;
    button.classList.add("button--loading");
    try {
        const { publicKey, privateKey } = await fetchKeys();
        const installId = generateRandomString(22);
        const fcmToken = `${installId}:APA91b${generateRandomString(134)}`;
        const accountData = await fetchAccount(publicKey, installId, fcmToken);
        
        // Фиксированные значения вместо выбора пользователя
        const selectedDNS = "1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001";
        const allowedIPs = "0.0.0.0/0, ::/0";
        
        const wireGuardText = `[Interface]
PrivateKey = ${privateKey}
Address = ${accountData.config.interface.addresses.v4}, ${accountData.config.interface.addresses.v6}
DNS = ${selectedDNS}
MTU = 1280
S1 = 0
S2 = 0
Jc = 4
Jmin = 40
Jmax = 70
H1 = 1
H2 = 2
H3 = 3
H4 = 4

[Peer]
PublicKey = ${accountData.config.peers[0].public_key}
AllowedIPs = ${allowedIPs}
Endpoint = ${randomEndpoint}`;
        
        const content = wireGuardText || "No configuration available";
        if (content === "No configuration available") {
            showPopup('No configuration to download', 'Ошибка');
            return;
        }
        
        downloadConfig(`WARPm3_${randomNumber}.conf`, content);
        showPopup('Скачивание конфигурации');
    } catch (error) {
        console.error('Error processing configuration:', error);
        showPopup('Failed to generate config. Please try again.', 'error');
    } finally {
        button.disabled = false;
        button.classList.remove("button--loading");
    }
});
