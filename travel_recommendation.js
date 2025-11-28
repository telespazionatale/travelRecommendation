
const JSON_FILE_PATH = './travel_recommendation_api.json';
const IMAGE_BASE_PATH = './images/';


const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const outputDiv = document.getElementById('recommendations-output');
const messageElement = document.getElementById('message');

/**
 * Fetches data from the JSON file.
 * @returns {Promise<Object|null>} The parsed JSON data or null if an error occurs.
 */
async function fetchTravelRecommendations() {
    if (!outputDiv) {
        console.error("L'elemento 'recommendations-output' non è stato trovato.");
        return null;
    }
  
    try {
        // 1. Fetch the data from the JSON file
        const response = await fetch('./travel_recommendation_api.json'); 

        // Check if the fetch was successful
        if (!response.ok) {
            throw new Error(`Errore HTTP! Stato: ${response.status}. Controlla che il file travel_recommendation_api.json esista nel percorso corretto.`);
        }

        // 2. Parse the JSON data
        const data = await response.json();
        
        return data;

   } catch (error) {
        console.error('Impossibile caricare o analizzare i dati di viaggio:', error);
        // Display an error message to the user
        
        outputDiv.innerHTML = '<div style="text-align: center; padding: 20px;">' +
                                  '<p style="color: #dc3545; font-weight: bold;">Errore nel caricamento dei dati di viaggio.</p>' +
                                  '<p style="color: #6c757d;">Controlla il percorso del file JSON nella console (dovrebbe essere: ./travel_recommendation_api.json).</p>' +
                              '</div>';
        return null;
    }
}


/**
 * Filters recommendations based on the search term.
 */
async function searchRecommendations() {
    if (!searchInput || !outputDiv) return; // Controlla se gli elementi DOM sono pronti

    // 1. Ottieni il termine di ricerca e normalizzalo
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        outputDiv.innerHTML = '<h2 class="text-2xl font-semibold text-center text-gray-700">Per favore, inserisci una parola chiave (es. "tempio", "spiaggia", "Australia").</h2>';
        return;
    }

    // 2. Carica tutti i dati
    const data = await fetchTravelRecommendations();
    if (!data) return;

    let results = [];

    // Funzione helper per normalizzare i dati
    const processItem = (item, category) => ({
        name: item.name,
        imageUrl: item.imageUrl,
        description: item.description,
        category: category
    });

    // 3. Logica di ricerca: usa l'inglese per i dati nel JSON
    if (searchTerm.includes('beach') || searchTerm.includes('spiaggia')) {
        results.push(...data.beaches.map(item => processItem(item, 'Spiaggia')));
    } else if (searchTerm.includes('temple') || searchTerm.includes('tempio')) {
        results.push(...data.temples.map(item => processItem(item, 'Tempio')));
    } else {
        // Cerca per nome della città o nome del paese in tutti i paesi
        data.countries.forEach(country => {
            // Cerca il paese stesso
            if (country.name.toLowerCase().includes(searchTerm)) {
                 // Se trova il nome del paese, aggiunge tutte le sue città come risultati
                results.push(...country.cities.map(item => processItem(item, country.name)));
            }
            
            // Cerca il nome della città
            country.cities.forEach(city => {
                if (city.name.toLowerCase().includes(searchTerm)) {
                    results.push(processItem(city, country.name));
                }
            });
        });
    }
    
    // 4. Visualizza i risultati
    displayRecommendations(results);
}


/**
 * Displays the filtered recommendations in the output section using Tailwind CSS for styling.
 * @param {Array<Object>} recommendations - The list of recommended items.
 */
function displayRecommendations(recommendations) {
    if (!outputDiv) return;
    
    // Rimuove i duplicati in caso la ricerca per paese e città abbia incluso lo stesso elemento
    const uniqueResults = recommendations.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.name === item.name && t.category === item.category
        ))
    );

    if (uniqueResults.length === 0) {
        outputDiv.innerHTML = '<h2 class="text-2xl font-semibold text-center text-gray-700">Nessuna raccomandazione trovata per questa ricerca.</h2>';
        return;
    }
    
    // Inizializza il contenitore con layout a griglia (uso di classi Tailwind)
    let htmlContent = '<h2 class="text-3xl font-bold text-center mb-10 text-gray-800">Le Nostre Raccomandazioni</h2>';
    // Griglia 1 colonna su mobile (md:grid-cols-2) 2 colonne su desktop (lg:grid-cols-3)
    htmlContent += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">'; 

    uniqueResults.forEach(item => {
        // Costruisce il percorso completo dell'immagine
        const fullImagePath = IMAGE_BASE_PATH + item.imageUrl;
        // Immagine di fallback da placehold.co se l'immagine locale non viene trovata
        const fallbackImage = 'https://placehold.co/300x200/4F46E5/ffffff?text=Image+Missing';

        // Card di raccomandazione con classi Tailwind
        htmlContent += `
            <div class="card bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg p-5">
                <img 
                    src="${fullImagePath}" 
                    alt="${item.name}" 
                    class="w-full h-48 object-cover rounded-lg mb-4 border border-gray-100"
                    onerror="this.onerror=null; this.src='${fallbackImage}';"
                >
                <span class="text-xs font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">${item.category || 'Destinazione'}</span>
                <h3 class="text-xl font-bold text-gray-800 mt-2 mb-2">${item.name}</h3>
                <p class="text-gray-600 text-sm">${item.description}</p>
            </div>
        `;
    });
    
    htmlContent += '</div>';
    outputDiv.innerHTML = htmlContent;
}

/**
 * Clears the search input and the output section.
 */
function clearSearch() {
    if (searchInput) searchInput.value = '';
    if (outputDiv) outputDiv.innerHTML = '';
}


// --- 5. ASCOLTATORI DI EVENTI E INIZIALIZZAZIONE ---

// Aggiungi gli ascoltatori di eventi solo dopo che il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', () => {
    // Collega gli ascoltatori di eventi ai pulsanti
    if (searchBtn) searchBtn.addEventListener('click', searchRecommendations);
    if (clearBtn) clearBtn.addEventListener('click', clearSearch);

    // Consente la ricerca premendo INVIO nel campo di input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchRecommendations();
            }
        });
    }