let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Success is not final, failure is not fatal.", category: "Motivation" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" },
  { text: "Simplicity is the ultimate sophistication.", category: "Wisdom" }
];

// Simulate server endpoint
const SERVER_API_URL = 'https://jsonplaceholder.typicode.com/posts';

// --- Display last viewed quote from sessionStorage ---
const lastQuote = sessionStorage.getItem('lastQuote');
if (lastQuote) {
  displayQuote(JSON.parse(lastQuote));
}

// --- Show random quote ---
function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');
  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
  displayQuote(quote);
}

// --- Display quote helper ---
function displayQuote(quote) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = `
    <p>${quote.text}</p>
    <p>Category: ${quote.category}</p>
  `;
}

// --- Add new quote ---
function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const quoteCategory = document.getElementById('newQuoteCategory').value.trim();

  if (!quoteText || !quoteCategory) return;

  const newQuote = { text: quoteText, category: quoteCategory };
  quotes.push(newQuote);
  localStorage.setItem('quotes', JSON.stringify(quotes));

  updateCategoryDropdown(); // update filter options
  displayQuote(newQuote);
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// --- Populate category filter dropdown ---
function populateCategories() {
  const filter = document.getElementById('categoryFilter');
  const categories = Array.from(new Set(quotes.map(q => q.category)));

  filter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filter.appendChild(opt);
  });

  // Load previously selected filter
  const lastFilter = localStorage.getItem('selectedCategory');
  if (lastFilter) {
    filter.value = lastFilter;
    filterQuotes();
  }
}

// --- Filter quotes by category ---
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);

  const filtered = selectedCategory === 'all'
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = "<p>No quotes found in this category.</p>";
  } else {
    displayQuote(filtered[Math.floor(Math.random() * filtered.length)]);
  }
}

// --- Export quotes to JSON ---
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// --- Import quotes from file ---
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error();

      quotes.push(...importedQuotes);
      localStorage.setItem('quotes', JSON.stringify(quotes));
      alert("Quotes imported successfully.");
      updateCategoryDropdown();
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

// --- Sync with server (fetch and push) ---
function syncWithServer() {
  fetch(SERVER_API_URL)
    .then(response => response.json())
    .then(serverQuotes => {
      const newData = serverQuotes.map(q => ({
        text: q.title,
        category: 'Server'
      }));

      // Conflict resolution: Server takes precedence
      const seen = new Set(quotes.map(q => q.text));
      const merged = [...quotes];

      newData.forEach(q => {
        if (!seen.has(q.text)) {
          merged.push(q);
        }
      });

      quotes = merged;
      localStorage.setItem('quotes', JSON.stringify(quotes));
      populateCategories();
      showNotification("Quotes synced from server.");
    })
    .catch(() => showNotification("Failed to sync from server."));
}

// --- Notification UI ---
function showNotification(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  div.style.cssText = "background: #eee; padding: 10px; margin: 10px 0; border-left: 4px solid green;";
  document.body.insertBefore(div, document.body.firstChild);
  setTimeout(() => div.remove(), 3000);
}

// --- Update dropdown after import or addition ---
function updateCategoryDropdown() {
  populateCategories();
}

// --- Event Listeners ---
document.getElementById('newQuote').addEventListener('click', showRandomQuote);
document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
document.getElementById('importFile').addEventListener('change', importFromJsonFile);

// --- Run on load ---
populateCategories();
setInterval(syncWithServer, 15000); // Sync every 15 seconds
