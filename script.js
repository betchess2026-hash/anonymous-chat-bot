// script.js - Logika sustava, brojanje poruka i progresivni jackpot

// Konfiguracija cijena i osnovnih limita poruka bota
const botConfig = {
    yes: { name: "Yes-bot", price: 5, messages: 15 },
    empatican: { name: "Empatičan", price: 10, messages: 15 },
    logican: { name: "Logičan", price: 20, messages: 20 },
    brutalan: { name: "Brutalan", price: 25, messages: 20 },
    mastarija: { name: "Maštarija (18+)", price: 50, messages: 20 }
};

// Korištenje sessionStorage: ako zatvore tab ili osvježe stranicu, sve se resetira na nulu
let sexBotUplate = parseInt(sessionStorage.getItem("sexBotUplate")) || 0; 
let trenutniLimit = 0;
let trenutniBrojac = 0;
let odabraniBotKey = "";
let odabranaKategorija = "";

// Dinamičko ažuriranje opcija botova ovisno o odabranoj kategoriji
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

// Ažuriranje teksta o cijeni i broju poruka (uključujući skriveni jackpot)
function updatePriceInfo() {
    const botKey = document.getElementById("bot-type").value;
    const config = botConfig[botKey];
    let porukeTekst = config.messages;
    
    // Prikaz progresivnog jackpota na ekranu za plaćanje ako nastavljaju unutar istog prozora
    if (botKey === "mastarija" && sexBotUplate > 0) {
        porukeTekst = config.messages + (sexBotUplate * 2);
    }
    
    document.getElementById("price-info").innerText = `Cijena: ${config.price} € za ${porukeTekst} poruka bota.`;
}

// Pokretanje procesa nakon što korisnik unese A-bon i klikne gumb
function submitAbon() {
    const kod = document.getElementById("abon-code").value.trim();
    if(kod.length < 10) {
        alert("Molimo unesite ispravan A-bon kod.");
        return;
    }

    odabraniBotKey = document.getElementById("bot-type").value;
    odabranaKategorija = document.getElementById("category").value;
    
    document.getElementById("status-msg").innerText = "Provjera koda u tijeku... Molimo pričekajte.";
    
    // MVP Simulacija tvog ručnog zelenog svjetla (3 sekunde čekanja)
    setTimeout(() => {
        startChat();
    }, 3000);
}

// Otvaranje chat ekrana i postavljanje limita sesije
function startChat() {
    document.getElementById("setup-screen").classList.add("hidden");
    document.getElementById("chat-screen").classList.remove("hidden");
    
    const config = botConfig[odabraniBotKey];
    
    // Progresivni jackpot sustav (+2 poruke za svaku novu uzastopnu uplatu u istom prozoru)
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

// Slanje korisničke poruke i simulacija odgovora bota
function sendMessage() {
    const input = document.getElementById("user-input");
    const tekst = input.value.trim();
    if (!tekst) return;

    appendMessage("user", tekst);
    input.value = "";

    // Simulacija odgovora umjetne inteligencije (OpenAI API)
    setTimeout(() => {
        trenutniBrojac++;
        document.getElementById("current-count").innerText = trenutniBrojac;
        
        let odgovorBota = "Slušam te. Nastavi...";
        
        // Ponašanja botova ovisno o tvom odabiru
        if (odabraniBotKey === "yes") odgovorBota = `Apsolutno si u pravu! Potpuno se slažem s tobom, to što kažeš ima stopostotnog smisla.`;
        if (odabraniBotKey === "brutalan") odgovorBota = `Suoči se s činjenicama. Tvoje kukanje ništa ne rješava, preuzmi odgovornost.`;
        if (odabraniBotKey === "mastarija") odgovorBota = `To zvuči nevjerojatno uzbudljivo... Reci mi točno što radimo u tvom sljedećem koraku?`;

        appendMessage("bot", odgovorBota);

        // Kada se dosegne limit poruka bota, chat se zaključava
        if (trenutniBrojac >= trenutniLimit) {
            document.getElementById("user-input").disabled = true;
            appendMessage("bot", "Vaša sesija je istekla. Za nastavak razgovora unesite novi A-bon.");
            
            // Automatsko vraćanje na formu za plaćanje nakon 5 sekundi
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

// Dodavanje poruka u vizualni prozor chata
function appendMessage(sender, text) {
    const box = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.classList.add("msg", sender);
    msg.innerText = text;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}

// Omogućavanje slanja poruke pritiskom na tipku Enter
function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

// Pokretanje početnih opcija pri učitavanju stranice
updateBotOptions();
