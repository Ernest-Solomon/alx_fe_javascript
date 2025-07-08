// Load existing quotes or use default quotes
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Success is not final, failure is not fatal.", category: "Motivation" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" },
  { text: "Simplicity is the ultimate sophistication.", category: "Wisdom" }
];

// Function to save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to show a random quote
function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');

  if (quotes.length === 0) {
    quoteDisplay.innerHTML = "<p>No quotes available.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

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
  const quoteText = document.getElementById('newQuoteText').value;
  const quoteCategory = document.getElementById('newQuoteCategory').value;

  if (quoteText.trim() === '' || quoteCategory.trim() === '') return;

  const newQuote = { text: quoteText, category: quoteCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  displayQuote(newQuote);

  // Post to mock server
  postQuoteToServer(newQuote);

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// Populate category dropdown
function populateCategories() {
  const select = document.getElementById('categoryFilter');
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
    filterQuotes();
  }
}

// Filter quotes based on category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);

  let filtered = selectedCategory === 'all' ? quotes : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = '<p>No quotes found for selected category.</p>';
  } else {
    displayQuote(filtered[Math.floor(Math.random() * filtered.length)]);
  }
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
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid file format.');
      }
    } catch {
      alert('Failed to parse the file.');
    }
  };
  reader.readAsText(file);
}

// === Server Sync Section ===
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';

// Fetch quotes from mock server
function fetchQuotesFromServer() {
  fetch(SERVER_URL)
    .then(res => res.json())
    .then(serverData => {
      const newQuotes = serverData
        .filter(item => item.title && item.body)
        .map(item => ({ text: item.title, category: item.body.substring(0, 20) }));

      let updated = false;
      newQuotes.forEach(q => {
        if (!quotes.some(local => local.text === q.text && local.category === q.category)) {
          quotes.push(q);
          updated = true;
        }
      });

      if (updated) {
        saveQuotes();
        populateCategories();
        showNotification('Quotes synced from server.');
      }
    })
    .catch(err => console.error('Sync error:', err));
}

// Post new quote to mock server
function postQuoteToServer(quote) {
  fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: quote.text, body: quote.category })
  })
    .then(res => res.json())
    .then(() => console.log('Quote posted to server'))
    .catch(err => console.error('Post error:', err));
}

// Sync quotes periodically
function syncQuotes() {
  fetchQuotesFromServer();
  setInterval(fetchQuotesFromServer, 30000); // Every 30 seconds
}

// Show notification
function showNotification(message) {
  alert(message); // You can improve this with a better UI
}

// Event listeners
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
  document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
  document.getElementById('importFile').addEventListener('change', importFromJsonFile);

  populateCategories();
  const lastQuote = sessionStorage.getItem('lastQuote');
  if (lastQuote) displayQuote(JSON.parse(lastQuote));

  syncQuotes();
});
