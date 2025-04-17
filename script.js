// React DOM init
import { createRoot } from 'react-dom/client';

// Initialisation de la racine React
document.body.innerHTML = '<div id="app"></div>';
const root = createRoot(document.getElementById('app'));
root.render(<h1>Bonjour tout le monde</h1>);

// Sélecteurs DOM
const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");

// Clé API Gemini (⚠️ à sécuriser en production)
const API_KEY = "AIzaSyCAqmc2yAV8Ldeq2-VXjoYmxlw9SAVLCFA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const chatHistory = [];

// Réponses médicales de secours (locales)
const medicalResponses = {
  "fièvre": "Une fièvre persistante peut indiquer une infection. Surveillez votre température et hydratez-vous bien. Consultez un médecin si elle dépasse 39°C.",
  "blessure": "Nettoyez la plaie à l'eau claire. Appliquez une compresse stérile. Consultez aux urgences en cas de saignement abondant.",
  "maux de tête": "Reposez-vous dans un endroit calme, hydratez-vous. Si la douleur persiste plus de 24h, consultez un médecin.",
  "nausées": "Restez hydraté avec de petites gorgées d'eau. Évitez les aliments solides. Consultez si accompagné de fièvre élevée."
};

// Récupère une réponse locale si nécessaire
function getMedicalResponse(query) {
  const lowerQuery = query.toLowerCase();
  return medicalResponses[lowerQuery] || "Je vais vous aider. Pourriez-vous préciser vos symptômes ?";
}

// Crée un message HTML
function createMessageElement(content, isUser = false) {
  const div = document.createElement("div");
  div.classList.add("message", ...(isUser ? ["user-message"] : ["bot-message"]));

  if (isUser) {
    div.innerHTML = `<p class="message-text">${content}</p>`;
  } else {
    div.innerHTML = `
      <img src="./assets/images/medibot.png" class="avatar" alt="Medibot" onerror="this.src='https://via.placeholder.com/40';"/>
      <p class="message-text">${content}</p>
    `;
  }

  return div;
}

// Appel à l'API Gemini
async function generateMedicalResponse(userMessage) {
  chatHistory.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userMessage }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error?.message || "Erreur API");

    console.log("Réponse API : ", data);

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    return getMedicalResponse(userMessage);
  } catch (error) {
    console.error("Erreur API Gemini : ", error);
    return getMedicalResponse(userMessage);
  }
}

// Animation de frappe
function showTypingIndicator() {
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("typing-indicator");
  typingIndicator.innerHTML = `
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  `;
  chatsContainer.appendChild(typingIndicator);
}

function hideTypingIndicator() {
  const typingIndicator = document.querySelector(".typing-indicator");
  if (typingIndicator) typingIndicator.remove();
}

// Défilement automatique
function scrollToBottom() {
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

// Gestion du formulaire utilisateur
promptForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage) return;

  const userMsgElement = createMessageElement(userMessage, true);
  chatsContainer.appendChild(userMsgElement);
  scrollToBottom();
  promptInput.value = "";

  showTypingIndicator();

  try {
    const response = await generateMedicalResponse(userMessage);
    hideTypingIndicator();
    const botMsgElement = createMessageElement(response);
    chatsContainer.appendChild(botMsgElement);
    scrollToBottom();
  } catch {
    hideTypingIndicator();
    const botMsgElement = createMessageElement("Désolé, une erreur est survenue. Veuillez réessayer.");
    chatsContainer.appendChild(botMsgElement);
    scrollToBottom();
  }
});

// Bouton urgence
document.getElementById('emergency-btn').addEventListener('click', () => {
  window.location.href = 'tel:15';
});

// Bouton suppression de l'historique
document.getElementById("delete-chats-btn").addEventListener("click", () => {
  chatsContainer.innerHTML = "";
});
