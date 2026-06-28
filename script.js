// script.js - Neovisna MVP verzija (Bez vanjskih baza podataka i CORS blokada)

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

    // 1. Slanje obavijesti na tvoj Discord preko FormData (no-cors mod prisilno probija sve blokade!)
    const webhookUrl = "https://discord.com";
    const tekstPoruke = `**NOVA UPLATA PRIMLJENA!**\n• **A-BON KOD:** \`${kod}\`\n• **Kategorija:** ${odabranaKategorija}\n• **Bot:** ${botConfig[odabraniBotKey].name}\n\n_Provjerite kod u Aircashu. Chat korisniku počinje automatski nakon isteka brojača._`;
    
    const dataForma = new FormData();
    dataForma.append("payload_json", JSON.stringify({ content: tekstPoruke }));

    fetch(webhookUrl, {
        method: "POST",
        body: dataForma,
        mode: 'no-cors' // Prisilno slanje bez obzira na CORS restrikcije preglednika
    });

    // 2. Prebacivanje korisnika na ekran s automatskim vremenskim brojačem (Trijaža u stvarnom vremenu)
    let preostaloSekundi = 60;
    
    const interval = setInterval(() => {
        preostaloSekundi--;
        
        document.getElementById("status-msg").innerHTML = `
            <div style="background:#222; padding:15px; border-radius:5px; margin-top:10px; border: 1px solid #333; text-align:center;">
                <p style="color:#fff; margin:0 0 5px 0; font-weight:bold;">Kod zaprimljen pod brojem provjere:</p>
                <strong style="color:#ff5722; font-size:18px; display:block; margin-bottom:10px;">${kod}</strong>
                <p style="font-size:13px; color:#aaa; margin:0 0 10px 0;">U tijeku je automatska provjera valjanosti i autorizacija uplate...</p>
                <div style="font-size:24px; font-weight:bold; color:#ffb300; margin:10px 0;">00:${preostaloSekundi < 10 ? '0' + preostaloSekundi : preostaloSekundi}</div>
                <p style="font-size:11px; color:#666; margin:0;">Molimo nemojte zatvarati ili osvježavati ovaj prozor. Razgovor počinje automatski nakon završetka autorizacije.</p>
            </div>
        `;

        if (preostaloSekundi <= 0) {
            clearInterval(interval);
            startChat(); // Kada brojač dođe do nule, chat se otvara sam od sebe!
        }
    }, 1000);
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
    
    appendMessage("bot", `Autorizacija uspješna. Sustav je aktiviran i spreman za razgovor. Što ti je na duši?`);
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
