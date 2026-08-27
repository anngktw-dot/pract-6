# Electronics Catalog

A responsive electronics catalog built with **HTML, CSS, and vanilla JavaScript** using a local JSON dataset.

## Features

- Dynamic product rendering from JSON
- Text search
- Category filtering
- Product ratings and discounts
- Shopping cart drawer
- Add/remove products
- Quantity controls
- Automatic subtotal, discount, and total calculations
- Responsive UI

## Tech Stack

- HTML5
- CSS3
- JavaScript
- JSON
- Intl.NumberFormat

## How It Works

Products are loaded from `electronic_items_dataset.json`, normalized in JavaScript, filtered by the current search/category state, and rendered dynamically.

The cart is stored in an in-memory `Map`, with quantity changes and totals recalculated on every update.

## Run Locally

Because the project loads JSON with `fetch()`, run it through a local web server rather than opening `index.html` directly.

For example, with VS Code Live Server, open the project folder and launch `index.html`.

---

### What this project demonstrates

This project demonstrates DOM manipulation, asynchronous data loading, filtering, UI state management, cart logic, price calculations, and responsive front-end development without a framework.
