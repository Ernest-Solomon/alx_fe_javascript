// Load existing quotes or use default quotes
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
    { id: '1', text: "Success is not final, failure is not fatal.", category: "Motivation", lastModified: Date.now() },
    { id: '2', text: "Happiness depends upon ourselves.", category: "Philosophy", lastModified: Date.now() },
    { id: '3', text: "Simplicity is the ultimate sophistication.", category: "Wisdom", lastModified: Date.now() }
];

// Helper to generate a simple ID for new local quotes
function generateUniqueId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

// Function to save quotes to local storage
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to show a random quote
function showRandomQuote() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    const categoryFilter = document.getElementById('categoryFilter').value;

    let displayQuotes = quotes;
    if (categoryFilter !== 'all') {
        displayQuotes = quotes.filter(q => q.category === categoryFilter);
    }

    if (displayQuotes.length === 0) {
        quoteDisplay.innerHTML = "<p>No quotes available for this filter.</p>";
        return;
    }

    const randomIndex = Math.floor(Math.random() * displayQuotes.length);
    const quote = displayQuotes[randomIndex];

    // Save last viewed quote to sessionStorage
    sessionStorage.setItem('lastQuote', JSON.stringify(quote));

    quoteDisplay.innerHTML = `
        <p>${quote.text}</p>
        <p>Category: ${quote.category}</p>
    `;
}

// Function to display any quote
function displayQuote(quote) {
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `
        <p>${quote.text}</p>
        <p>Category: ${quote.category}</p>
    `;
}

// Function to add a new quote
function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();

    if (quoteText === '' || quoteCategory === '') {
        showNotification('Quote text and category cannot be empty.', 'error');
        return;
    }

    const newQuote = {
        id: generateUniqueId(), // Assign a local ID
        text: quoteText,
        category: quoteCategory,
        lastModified: Date.now() // Track modification time for conflict resolution
    };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    displayQuote(newQuote);

    // Post to mock server - simulate new quote creation
    // JSONPlaceholder doesn't support actual object IDs, so we'll just post title/body
    postQuoteToServer(newQuote);

    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    showNotification('New quote added locally and posted for sync.', 'success');
}

// Populate category dropdown
function populateCategories() {
    const select = document.getElementById('categoryFilter');
    // Ensure uniqueness based on category name
    const categories = Array.from(new Set(quotes.map(q => q.category)));

    // Clear and repopulate
    select.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    const savedFilter = localStorage.getItem('selectedCategory');
    if (savedFilter) {
        select.value = savedFilter;
    }
    // After populating, ensure a quote is displayed based on filter
    showRandomQuote();
}

// Filter quotes based on category (reusing showRandomQuote to filter and display)
function filterQuotes() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    localStorage.setItem('selectedCategory', selectedCategory);
    showRandomQuote(); // showRandomQuote now handles filtering based on the selected value
}


// Export quotes to JSON file
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
    showNotification('Quotes exported successfully!', 'success');
}

// Import quotes from a JSON file
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuotes)) {
                let importedCount = 0;
                importedQuotes.forEach(impQuote => {
                    // Ensure imported quotes have a basic structure
                    if (impQuote.text && impQuote.category) {
                        // Assign a new local ID and lastModified for imported quotes
                        const newQuote = {
                            id: generateUniqueId(),
                            text: impQuote.text,
                            category: impQuote.category,
                            lastModified: Date.now()
                        };
                        // Prevent exact duplicates on import if already in local storage
                        if (!quotes.some(q => q.text === newQuote.text && q.category === newQuote.category)) {
                            quotes.push(newQuote);
                            importedCount++;
                        }
                    }
                });
                if (importedCount > 0) {
                    saveQuotes();
                    populateCategories();
                    showNotification(`${importedCount} quotes imported successfully!`, 'success');
                } else {
                    showNotification('No new quotes found in the imported file or all were duplicates.', 'info');
                }
            } else {
                showNotification('Invalid file format. Expected a JSON array of quotes.', 'error');
            }
        } catch (error) {
            console.error("Error importing file:", error);
            showNotification('Failed to parse the file. Please check JSON format.', 'error');
        }
    };
    reader.readAsText(file);
}

// === Server Sync Section ===
// JSONPlaceholder provides mock 'posts'. We'll map 'title' to 'text' and 'body' to 'category'.
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

/**
 * Fetches quotes from the mock server and updates local storage.
 * Implements a conflict resolution strategy: server data takes precedence.
 */
async function fetchQuotesFromServer() {
    try {
        const response = await fetch(SERVER_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const serverData = await response.json();

        // Simulate server having a simplified representation without unique IDs
        // We'll map them back to our local quote structure
        const serverQuotes = serverData
            .slice(0, 10) // Limit to a reasonable number for simulation
            .filter(item => item.title && item.body)
            .map(item => ({
                // Use JSONPlaceholder 'id' as a server-side identifier if available, otherwise fallback
                // For simplicity with JSONPlaceholder, we'll map their `id` to a `serverId`
                // and use a simplified version of `body` for category.
                serverId: item.id, // Keep track of server's ID
                text: item.title,
                category: item.body.substring(0, Math.min(item.body.length, 30)).split('\n')[0].trim(), // Take first line of body as category
                lastModified: Date.now() // Simulate server timestamp for simplicity
            }));

        let newQuotesAdded = 0;
        let quotesUpdated = 0;
        let quotesRemoved = 0;
        let tempQuotes = [...quotes]; // Create a mutable copy to work with

        // 1. Add/Update based on server data (server precedence)
        serverQuotes.forEach(sQuote => {
            const localIndex = tempQuotes.findIndex(lQuote =>
                lQuote.text === sQuote.text && lQuote.category === sQuote.category
            );

            if (localIndex === -1) {
                // New quote from server: add it
                sQuote.id = generateUniqueId(); // Assign a local ID for it
                tempQuotes.push(sQuote);
                newQuotesAdded++;
            } else {
                // Quote exists locally, update if server version is newer or if 'lastModified' implies server precedence
                // For JSONPlaceholder, we don't have actual modification timestamps,
                // so we'll just assume server is always the authority if a match is found.
                // In a real app, you'd compare sQuote.lastModified vs lQuote.lastModified
                if (tempQuotes[localIndex].lastModified < sQuote.lastModified || !tempQuotes[localIndex].serverId) {
                     // Only update if server's timestamp is more recent or if local quote wasn't from server originally
                    Object.assign(tempQuotes[localIndex], sQuote);
                    quotesUpdated++;
                }
            }
        });

        // 2. Remove local quotes not present on the server (if server is source of truth)
        // This is a strict server-precedence rule.
        const originalLocalCount = tempQuotes.length;
        tempQuotes = tempQuotes.filter(lQuote => {
            // Keep local quotes that were added locally and never posted to server (no serverId)
            // Or keep local quotes that match a server quote
            return !lQuote.serverId || serverQuotes.some(sQuote => sQuote.serverId === lQuote.serverId);
        });
        quotesRemoved = originalLocalCount - tempQuotes.length;


        // Update global quotes array if changes occurred
        if (newQuotesAdded > 0 || quotesUpdated > 0 || quotesRemoved > 0) {
            quotes = tempQuotes;
            saveQuotes();
            populateCategories(); // Re-populate categories to reflect changes
            let notificationMessage = 'Quotes synced from server: ';
            if (newQuotesAdded) notificationMessage += `${newQuotesAdded} added. `;
            if (quotesUpdated) notificationMessage += `${quotesUpdated} updated. `;
            if (quotesRemoved) notificationMessage += `${quotesRemoved} removed. `;
            showNotification(notificationMessage.trim(), 'success');
        } else {
            showNotification('No new updates from server. Quotes are in sync.', 'info');
        }

    } catch (error) {
        console.error('Error fetching quotes from server:', error);
        showNotification('Failed to sync with server. Please check your connection.', 'error');
    }
}

/**
 * Posts a new quote to the mock server.
 * Note: JSONPlaceholder only simulates a POST, it doesn't actually store data persistently.
 */
async function postQuoteToServer(quote) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: quote.text, body: quote.category })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Quote posted to server simulation:', data);
        // In a real application, you'd get the actual ID from the server and update your local quote's serverId
        // quote.serverId = data.id;
        // saveQuotes(); // Potentially save the updated quote with serverId
    } catch (error) {
        console.error('Error posting quote to server:', error);
        showNotification('Failed to post quote to server simulation.', 'error');
    }
}

/**
 * Initiates the sync process and sets up periodic syncing.
 * This function is called once on DOMContentLoaded.
 */
let syncIntervalId; // To store the interval ID for clearing later if needed
function syncQuotes() {
    fetchQuotesFromServer(); // Initial sync
    if (syncIntervalId) {
        clearInterval(syncIntervalId); // Clear existing interval if any
    }
    syncIntervalId = setInterval(fetchQuotesFromServer, 30000); // Every 30 seconds
    console.log('Periodic sync initiated (every 30 seconds).');
}

/**
 * Shows a notification message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'info', or 'error' to style the notification.
 */
function showNotification(message, type = 'info') {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.textContent = message;

    // Apply basic styling based on type
    notificationDiv.style.display = 'block';
    notificationDiv.style.backgroundColor = ''; // Reset
    notificationDiv.style.color = ''; // Reset
    notificationDiv.style.border = ''; // Reset

    switch (type) {
        case 'success':
            notificationDiv.style.backgroundColor = '#dff0d8';
            notificationDiv.style.color = '#3c763d';
            notificationDiv.style.border = '1px solid #d6e9c6';
            break;
        case 'error':
            notificationDiv.style.backgroundColor = '#f2dede';
            notificationDiv.style.color = '#a94442';
            notificationDiv.style.border = '1px solid #ebccd1';
            break;
        case 'info':
        default:
            notificationDiv.style.backgroundColor = '#d9edf7';
            notificationDiv.style.color = '#31708f';
            notificationDiv.style.border = '1px solid #bce8f1';
            break;
    }

    // Hide after 5 seconds
    setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 5000);
}

// Event listeners
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
    document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
    document.getElementById('importFile').addEventListener('change', importFromJsonFile);

    // Manual Sync Button
    const manualSyncBtn = document.createElement('button');
    manualSyncBtn.textContent = 'Manual Sync Now';
    manualSyncBtn.onclick = fetchQuotesFromServer; // Directly call fetch for manual sync
    manualSyncBtn.style.padding = '10px';
    manualSyncBtn.style.marginTop = '10px';
    manualSyncBtn.style.marginRight = '5px';
    // Append it near the import/export buttons or under the add quote form
    document.querySelector('.form-group:last-of-type').after(manualSyncBtn);


    populateCategories();
    const lastQuote = sessionStorage.getItem('lastQuote');
    if (lastQuote) displayQuote(JSON.parse(lastQuote));

    syncQuotes(); // Start periodic syncing
});
