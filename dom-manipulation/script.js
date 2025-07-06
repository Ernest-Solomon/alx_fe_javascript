// Initial quotes
const quotes = [
  { text: "The only limit is your mind.", category: "Motivation" },
  { text: "Stay hungry, stay foolish.", category: "Inspiration" },
  { text: "Life is short, code more.", category: "Programming" }
];

// Display a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  document.getElementById("quoteDisplay").textContent = `"${quote.text}" — ${quote.category}`;
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text === "" || category === "") {
    alert("Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text, category });

  // Optionally show the new quote
  document.getElementById("quoteDisplay").textContent = `"${text}" — ${category}`;

  // Clear input fields
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// Attach the event listener to the button after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
});
