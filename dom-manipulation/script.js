// Constants for mock server endpoints
const SERVER_API_URL = 'https://jsonplaceholder.typicode.com/posts'; // mock placeholder
const SYNC_INTERVAL = 10000; // Sync every 10 seconds

// Load quotes from localStorage or use defaults
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "Success is not final, failure is not fatal.", category: "Motivation" },
  { text: "Happiness depends upon ourselves.", category: "Philosophy" },
  { text: "Simplicity is the ultimate sophistication.", category: "Wisdom" }
];

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_API_URL);
    const serverData = await response.json();

    // Simulate quote format: extract only valid quote entries
    const serverQuotes = serverData.map(item => ({
      text: item.title || 'No text',
      category: item.body || 'General'
    })).slice(0, 5); // limit for simplicity

    return serverQuotes;
  } catch (error) {
    console.error('Error fetching from server:', error);
    return [];
  }
}

// Post new quotes to the server (simulation only)
async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_API_URL, {
      method: 'POST',
      body: JSON.stringify(quote),
      headers: { 'Content-type': 'application/json; charset=UTF-8' }
    });
  } catch (error) {
    console.warn('Failed to sync to server:', error);
  }
}

// Display any quote
function displayQuote(quote) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = `
    <p>${quote.text}</p>
    <p>Category: ${quote.category}</p>
  `;
}

// Show random quote
function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');

  if (quotes.length === 0) {
    quoteDisplay.innerHTML = '<p>No quotes available.</p>';
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  sessionStorage.setItem('lastQuote', JSON.stringify(quote));
  displayQuote(quote);
}

// Add new quote
function addQuote() {
  const text = document.getElementById('newQuoteText').value;
  const category = document.getElementById('newQuoteCategory').value;
  if (text.trim() === '' || category.trim() === '') return;

  const newQuote = { text, category };
  quotes.push(newQuote);
  localStorage.setItem('quotes', JSON.stringify(quotes));
  displayQuote(newQuote);
  populateCategories();
  postQuoteToServer(newQuote);

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';
}

// Export quotes to JSON
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

// Import quotes from file
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes.push(...imported);
        localStorage.setItem('quotes', JSON.stringify(quotes));
        alert('Quotes imported successfully!');
        populateCategories();
      } else {
        alert('Invalid file format.');
      }
    } catch (err) {
      alert('Error parsing file.');
    }
  };
  reader.readAsText(file);
}

// Populate categories
function populateCategories() {
  const select = document.getElementById('categoryFilter');
  const selected = select.value;

  const uniqueCategories = [...new Set(quotes.map(q => q.category))];
  select.innerHTML = '<option value="all">All Categories</option>' +
    uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

  if (localStorage.getItem('lastCategory')) {
    select.value = localStorage.getItem('lastCategory');
    filterQuotes();
  } else {
    select.value = selected;
  }
}

// Filter quotes
function filterQuotes() {
  const selected = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastCategory', selected);

  const filtered = selected === 'all' ? quotes : quotes.filter(q => q.category === selected);

  if (filtered.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = '<p>No quotes found in this category.</p>';
  } else {
    displayQuote(filtered[Math.floor(Math.random() * filtered.length)]);
  }
}

// Sync quotes with server
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const serverKeys = new Set(serverQuotes.map(q => q.text + q.category));
  const localKeys = new Set(quotes.map(q => q.text + q.category));

  const newQuotes = serverQuotes.filter(q => !localKeys.has(q.text + q.category));

  if (newQuotes.length > 0) {
    quotes.push(...newQuotes);
    localStorage.setItem('quotes', JSON.stringify(quotes));
    alert('Quotes updated from server!');
    populateCategories();
  }
}

// Setup
window.onload = function () {
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('exportBtn').addEventListener('click', exportToJsonFile);
  document.getElementById('importFile').addEventListener('change', importFromJsonFile);
  document.getElementById('categoryFilter').addEventListener('change', filterQuotes);

  const last = sessionStorage.getItem('lastQuote');
  if (last) displayQuote(JSON.parse(last));

  populateCategories();
  syncQuotes();
  setInterval(syncQuotes, SYNC_INTERVAL);
};
