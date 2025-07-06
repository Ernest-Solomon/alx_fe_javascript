

let quotes = JSON.parse(localStorage.getItem('quotes')) || [
 { text: "Success is not final, failure is not fatal.", category: "Motivation" },
 { text: "Happiness depends upon ourselves.", category: "Philosophy" },
 { text: "Simplicity is the ultimate sophistication.", category: "Wisdom" }
];


function showRandomQuote() {
 const quoteDisplay = document.getElementById('quoteDisplay');
 const randomIndex = Math.floor(Math.random() * quotes.length);
 const quote = quotes[randomIndex];


 quoteDisplay.innerHTML = `
   <p>${quote.text}</p>
   <p>Category: ${quote.category}</p>
 `;
}


function createAddQuoteForm() {
 
function addQuote() {
 const quoteText = document.getElementById('newQuoteText').value;
 const quoteCategory = document.getElementById('newQuoteCategory').value;


 if (quoteText.trim() === '' || quoteCategory.trim() === '') return;


 const newQuote = {
   text: quoteText,
   category: quoteCategory
 };


  quotes.push(newQuote);


  localStorage.setItem('quotes', JSON.stringify(quotes));


  const quoteDisplay = document.getElementById('quoteDisplay');
 quoteDisplay.innerHTML = '';


 
 const quoteTextElem = document.createElement('p');
 quoteTextElem.textContent = newQuote.text;


 const quoteCategoryElem = document.createElement('p');
 quoteCategoryElem.textContent = 'Category: ' + newQuote.category;


 quoteDisplay.appendChild(quoteTextElem);
 quoteDisplay.appendChild(quoteCategoryElem);
}


document.getElementById('newQuote').addEventListener('click', showRandomQuote);
