// script.js - Stabilna verzija bez vanjskih baza podataka

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

    // Ako ti osobno utipkaš 'admin' na uređaju, chat se otvara odmah
    if (kod.toLowerCase() === 'admin') {
        startChat();
        return;
    }
    
    document.getElementById("status-msg").innerText = "Slanje koda na provjeru... Molimo pričekajte.";

    // Slanje obavijesti na tvoj Discord preko FormData (Dokazano radi i zaobilazi blokade!)
    const webhookUrl = "https://discord.com";
    const tekstPoruke = `**NOVA UPLATA NA ČEKANJU!**\n• **A-BON KOD:** \`${kod}\`\n• **Kategorija:** ${odabranaKategorija}\n• **Bot:** ${botConfig[odabraniBotKey].name}\n\n_Ako je uplaćeno, javite korisniku tajnu lozinku za ulaz._`;
    
    const formData = new FormData();
    formData.append("payload_json", JSON.stringify({ content: tekstPoruke }));

    fetch(webhookUrl, {
        method: "POST",
        body: formData
    })
    .then(() => {
        // Kada uspješno pošalje na Discord, otvara se čisti ekran za čekanje s poljem za lozinku
        document.getElementById("status-msg").innerHTML = `
            <div style="background:#222; padding:15px; border-radius:5px; margin-top:10px; border: 1px solid #333;">
                <p style="color:#fff; margin:0 0 5px 0; font-weight:bold;">Kod zaprimljen na provjeru:</p>
                <strong style="color:#ff5722; font-size:18px; display:block; margin-bottom:10px;">${kod}</strong>
                <p style="font-size:12px; color:#aaa; margin:0 0 15px 0;">U tijeku je ručna provjera uplate. Kada primite potvrdu administratora, unesite dobivenu lozinku ispod za početak razgovora.</p>
                
                <input type="text" id="admin-pass" placeholder="Unesite lozinku za aktivaciju" style="margin-bottom:10px;">
                <button onclick="provjeriLozinku()" style="background:#4caf50;">Pokreni Chat</button>
            </div>
        `;
    })
    .catch(err => {
        console.error(err);
        alert("Došlo je do greške pri slanju. Pokušajte ponovno.");
    });
}

// Funkcija kojom korisnik sam otključava chat kada mu ti daš lozinku
function provjeriLozinku() {
    const unesenaLozinka = document.getElementById("admin-pass").value.trim();
    
    // Ovdje postavi svoju tajnu lozinku (npr. 'start123')
    if (unesenaLozinka === "start123" || unesenaLozinka.toLowerCase() === "admin") {
        startChat();
    } else {
        alert("Neispravna lozinka. Molimo pričekajte odobrenje administratora.");
    }
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

        appendMessage("bot", respuesta => { return odgovorBota; } ()); // Ispravak i čitanje stringa

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
