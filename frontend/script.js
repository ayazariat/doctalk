const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");

const API_KEY = "AIzaSyCAqmc2yAV8Ldeq2-VXjoYmxlw9SAVLCFA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

document.getElementById('emergency-btn').addEventListener('click', () => {
  window.location.href = 'tel:15';
});

const medicalResponses = {
  "fièvre": "Une fièvre persistante peut indiquer une infection. Surveillez votre température et hydratez-vous bien. Consultez un médecin si elle dépasse 39°C.",
  "blessure": "Nettoyez la plaie à l'eau claire. Appliquez une compresse stérile. Consultez aux urgences en cas de saignement abondant.",
  "maux de tête": "Reposez-vous dans un endroit calme, hydratez-vous. Si la douleur persiste plus de 24h, consultez un médecin.",
  "nausées": "Restez hydraté avec de petites gorgées d'eau. Évitez les aliments solides. Consultez si accompagné de fièvre élevée.",
  "évaluer des symptômes grippaux": "Pouvez-vous décrire vos symptômes (fièvre, toux, courbatures) ? Depuis combien de temps les ressentez-vous ?",
  "premiers soins pour blessure": "Quel type de blessure s'agit-il ? (coupure, brûlure, fracture) Est-ce qu'il y a un saignement actif ?",
  "interaction médicamenteuse": "Quels médicaments prenez-vous actuellement ? (liste des noms et dosages)",
  "trouver un hôpital proche": "Activez votre géolocalisation pour trouver les urgences les plus proches. Sinon, quelle est votre ville ?"
};

function getMedicalResponse(query) {
  const lowerQuery = query.toLowerCase();
  return medicalResponses[lowerQuery] || "Je vais vous aider. Pourriez-vous préciser vos symptômes ?";
}

function createMessageElement(content, isUser = false) {
  const div = document.createElement("div");
  div.classList.add("message", ...(isUser ? ["user-message"] : ["bot-message", "loading"]));

  if (isUser) {
    div.innerHTML = `<p class="message-text">${content}</p>`;
  } else {
    div.innerHTML = `
      <img src="public/assets/images/medibot.png" class="avatar" alt="Medibot"/>
      <p class="message-text">${content}</p>
    `;
  }
  return div;
}

async function generateMedicalResponse(userMessage) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ]
      })
    });

    if (!response.ok) throw new Error("Erreur de l'API");

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return generatedText || getMedicalResponse(userMessage);

  } catch (error) {
    console.error("Erreur API Gemini :", error);
    return getMedicalResponse(userMessage);
  }
}

function scrollToBottom() {
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

promptForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage) return;

  const userMsgElement = createMessageElement(userMessage, true);
  chatsContainer.appendChild(userMsgElement);
  promptInput.value = "";
  scrollToBottom();

  const botMsgElement = createMessageElement("Analyse en cours...");
  chatsContainer.appendChild(botMsgElement);
  scrollToBottom();

  try {
    const response = await generateMedicalResponse(userMessage);
    botMsgElement.querySelector(".message-text").textContent = response;
    botMsgElement.classList.remove("loading");
  } catch (error) {
    botMsgElement.querySelector(".message-text").textContent = "Désolé, une erreur est survenue. Veuillez réessayer.";
    botMsgElement.classList.remove("loading");
  }
});

document.querySelectorAll('.suggestions-item').forEach(item => {
  item.addEventListener('click', async () => {
    const theme = item.querySelector('.text').textContent;
    
    const userMsgElement = createMessageElement(theme, true);
    chatsContainer.appendChild(userMsgElement);
    scrollToBottom();

    const botMsgElement = createMessageElement("Analyse en cours...");
    chatsContainer.appendChild(botMsgElement);
    scrollToBottom();

    const contexts = {
      "Évaluer des symptômes grippaux": " analyse des symptômes grippaux. Pose des questions pertinentes et donne des conseils de soins basiques .maximum 5 lignes.",
      "Premiers soins pour blessure": "Agis comme un expert en premiers secours. Donne des étapes claires et concises pour stabiliser la blessure avant l'arrivée des secours.maximum 5 lignes",
      "Interaction médicamenteuse": "Comporte-toi comme un pharmacien vérifiant des interactions entre médicaments. Demande la liste des médicaments et fournis des informations précises.maximum 5 lignes",
      "Trouver un hôpital proche": "Propose une aide pour localiser les structures médicales proches. Demande la localisation et utilise des données géolocalisées."
    };

    try {
      const response = await generateMedicalResponse(`${theme}. ${contexts[theme] || ""}`);
      botMsgElement.querySelector(".message-text").textContent = response;
    } catch (error) {
      botMsgElement.querySelector(".message-text").textContent = getMedicalResponse(theme);
    }
    
    botMsgElement.classList.remove("loading");
  });
});

document.getElementById("delete-chats-btn").addEventListener("click", () => {
  chatsContainer.innerHTML = "";
});