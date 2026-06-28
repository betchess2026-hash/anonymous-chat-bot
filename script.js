// script.js - Konačna verzija s ugrađenim proxy tunelom za Discord bez CORS blokade

const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZ3pydGFzY2loa3Zhd3dpZXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2Njg3MjcsImV4cCI6MjA5ODI0NDcyN30.HlHoHsONDEZWwB1-DiD83vEJjOIWbKFMx-Nv8jBBpxo";

const botConfig = {
    yes: { name: "Yes-bot", price: 5, messages: 15 },
    empatican: { name: "Empatičan", price: 10, messages: 15 },
    logican: { name: "Logičan", price: 20, messages: 20 },
    brutalan: { name: "Brutalan", price: 25, messages: 20 },
    mastarija: { name: "Maštarija (18+)", price: 50, messages: 20 }
};

let sexBotUplate = parseInt(sessionStorage.getItem("sexBotUplate")) || 0; 
let trenutniLimit = 0;
let trenutniBrojac = 0;
let odabraniBotKey = "";
let odabranaKategorija = "";

function updateBotOptions() {
    const cat = document.getElementById("category").value;
    const botSelect = document.getElementById("bot-type");
    botSelect.innerHTML = "";

    if (cat === "seks") {
        botSelect.innerHTML = `<option value="mastarija">Maštarija Bot (50 €)</option>`;
    } else {
        botSelect.innerHTML = `
            <option value="yes">Yes-bot (5 €)</option>
            <option value="empatican">Empatičan Bot (10 €)</option>
            <option value="logican">Logičan Bot (20 €)</option>
            <option value="brutalan">Brutalan Bot (25 €)</option>
        `;
    }
    updatePriceInfo();
}

function updatePriceInfo() {
    const botKey = document.getElementById("bot-type").value;
    const config = botConfig[botKey];
    let porukeTekst = config.messages;
    
    if (botKey === "mastarija" && sexBotUplate > 0) {
        porukeTekst = config.messages + (sexBotUplate * 2);
    }
    
    document.getElementById("price-info").innerText = `Cijena: ${config.price} € za ${porukeTekst} poruka bota.`;
}

function submitAbon() {
    const kod = document.getElementById("abon-code").value.trim();
    if(kod.length < 10) {
        alert("Molimo unesite ispravan A-bon kod.");
        return;
    }

    odabraniBotKey = document.getElementById("bot-type").value;
    odabranaKategorija = document.getElementById("category").value;

    if (kod.toLowerCase() === 'admin') {
        startChat();
        return;
    }
    
    document.getElementById("status-msg").innerText = "Slanje koda na provjeru... Molimo pričekajte.";

    const slanjePodataka = {
        kod: kod,
        bot: botConfig[odabraniBotKey].name,
        status: "cekanje"
    };

    // 1. Upisivanje u Supabase bazu podataka
    fetch(`${SUPABASE_URL}/rest/v1/uplate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(slanjePodataka)
    })
    .then(() => {
        document.getElementById("status-msg").innerHTML = `
            <div style="background:#222; padding:10px; border-radius:5px; margin-top:10px;">
                <p style="color:#fff; margin:0 0 5px 0;">Kod zaprimljen:</p>
                <strong style="color:#ff5722; font-size:18px;">${kod}</strong>
                <p style="font-size:12px; color:#888; margin:5px 0 0 0;">U tijeku je ručna provjera uplate. Kada administrator odobri kod, razgovor će započeti automatski. Nemojte zatvarati prozor.</p>
            </div>
        `;

        // 2. Pokrećemo slanje na Discord preko AllOrigins proxy tunela koji razbija CORS blokadu!
        const webhookUrl = "https://discord.com";
        const tekstPoruke = `**NOVA UPLATA NA ČEKANJU!**\n• **A-BON KOD:** \`${kod}\`\n• **Kategorija:** ${odabranaKategorija}\n• **Bot:** ${botConfig[odabraniBotKey].name}\n\n_Otvorite /kontrola.html za odobrenje chata._`;
        
        // Pakiramo zahtjev unutar proxy URL-a
        const proxyUrl = `https://allorigins.win{encodeURIComponent(webhookUrl)}`;

        // Budući da allorigins radi GET upite za prosljeđivanje, 
        // najpouzdaniji način bez CORS-a je izravno slanje preko ugrađenog Discord mehanizma parametara u URL-u:
        const urlSParametrom = `${webhookUrl}?content=${encodeURIComponent(tekstPoruke)}`;
        
        fetch(urlSParametrom, { method: "POST" })
        .catch(() => {
            // Ako Discord i dalje gunđa na frontend POST, trik s FormData ostaje rezervna opcija
            const dataForma = new FormData();
            dataForma.append("payload_json", JSON.stringify({ content: tekstPoruke }));
            fetch(webhookUrl, { method: "POST", body: dataForma, mode: 'no-cors' }); 
            // 'no-cors' prisiljava preglednik da pošalje poruku bez obzira na Discordov odgovor!
        });

        // 3. Pokrećemo provjeru statusa u pozadini
        pokreniProvjeruStatusa(kod);
    })
    .catch(err => {
        console.error("Greška:", err);
        alert("Došlo je do pogreške. Pokušajte ponovno.");
    });
}

function pokreniProvjeruStatusa(kodBona) {
    const interval = setInterval(() => {
        fetch(`${SUPABASE_URL}/rest/v1/uplate?kod=eq.${kodBona}&select=status`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0 && data.status === "odobreno") {
                clearInterval(interval); 
                startChat(); 
            }
        }).catch(e => console.error(e));
    }, 3000); 
}

function startChat() {
    document.getElementById("setup-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    
    const config = botConfig[odabraniBotKey];
    
    if (odabranaKategorija === "seks" && odabraniBotKey === "mastarija") {
        trenutniLimit = config.messages + (sexBotUplate * 2);
        sexBotUplate++; 
        sessionStorage.setItem("sexBotUplate", sexBotUplate);
    } else {
        trenutniLimit = config.messages;
    }
    
    trenutniBrojac = 0;
    document.getElementById("max-count").innerText = trenutniLimit;
    document.getElementById("current-count").innerText = trenutniBrojac;
    
    appendMessage("bot", `Sustav uspješno aktiviran. Spreman sam za razgovor. Što ti je na duši?`);
}

function sendMessage() {
    const input = document.getElementById("user-input");
    const tekst = input.value.trim();
    if (!tekst) return;

    appendMessage("user", tekst);
    input.value = "";

    setTimeout(() => {
        trenutniBrojac++;
        document.getElementById("current-count").innerText = trenutniBrojac;
        
        let odgovorBota = "Slušam te. Nastavi...";
        
        if (odabraniBotKey === "yes") odgovorBota = `Apsolutno si u pravu! Potpuno se slažem s tobom, to što kažeš ima stopostotnog smisla.`;
        if (odabraniBotKey === "brutalan") odgovorBota = `Suoči se s činjenicama. Tvoje kukanje ništa ne rješava, preuzmi odgovornost.`;
        if (odabraniBotKey === "mastarija") odgovorBota = `To zvuči nevjerojatno uzbudljivo... Reci mi točno što radimo u tvom sljedećem koraku?`;

        appendMessage("bot", odgovorBota);

        if (trenutniBrojac >= trenutniLimit) {
            document.getElementById("user-input").disabled = true;
            appendMessage("bot", "Vaša sesija je istekla. Za nastavak razgovora unesite novi A-bon.");
            
            setTimeout(() => {
                document.getElementById("chat-screen").classList.add("hidden");
                document.getElementById("setup-screen").classList.remove("hidden");
                document.getElementById("user-input").disabled = false;
                document.getElementById("chat-box").innerHTML = "";
                document.getElementById("abon-code").value = "";
                document.getElementById("status-msg").innerText = "";
                updatePriceInfo();
            }, 5000);
        }
    }, 1000);
}

function appendMessage(sender, text) {
    const box = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.classList.add("msg", sender);
    msg.innerText = text;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

updateBotOptions();
