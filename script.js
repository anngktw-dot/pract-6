const grid = document.getElementById("grid");
const resultsInfo = document.getElementById("resultsInfo");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const categorySelect = document.getElementById("categorySelect");

const cartBtn = document.getElementById("cartBtn");
const overlay = document.getElementById("overlay");
const closeCart = document.getElementById("closeCart");
const cartList = document.getElementById("cartList");
const cartCount = document.getElementById("cartCount");

const subtotalEl = document.getElementById("subtotal");
const discountTotalEl = document.getElementById("discountTotal");
const totalEl = document.getElementById("total");
const checkoutBtn = document.getElementById("checkout");

const state = {
  products: [],
  filtered: [],
  cart: new Map(), // id -> qty
  query: "",
  category: "all",
};

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.includes("images.unsplash.com") && !url.includes("?")) {
    return url + "?auto=format&fit=crop&w=900&q=60";
  }
  if (url.includes("images.unsplash.com") && url.includes("?") && !url.includes("w=")) {
    return url + "&auto=format&fit=crop&w=900&q=60";
  }
  return url;
}

function fmtMoney(value, currency = "USD") {
  try {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function calcFinalPrice(p) {
  const d = Number(p.discount || 0);
  const price = Number(p.price || 0);
  const final = price * (1 - d / 100);
  return Math.round(final);
}

function stars(rating) {
  const r = Math.round(Number(rating || 0));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

async function loadProducts() {
  // IMPORTANT: requires Live Server (http://...)
  const res = await fetch("electronic_items_dataset.json");
  if (!res.ok) throw new Error("JSON not loaded");
  const items = await res.json();

  state.products = items.map((p) => ({
    ...p,
    imageUrl: normalizeImageUrl(p.imageUrl),
    finalPrice: calcFinalPrice(p),
  }));

  applyFilters();
  fillCategories();
  render();
}

function fillCategories() {
  const cats = Array.from(new Set(state.products.map((p) => p.category))).sort();
  categorySelect.innerHTML = `
    <option value="all">Всі категорії</option>
    ${cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
  `;
}

function applyFilters() {
  const q = state.query.trim().toLowerCase();
  const cat = state.category;

  state.filtered = state.products.filter((p) => {
    const matchesCat = cat === "all" ? true : p.category === cat;
    const text = `${p.name} ${p.category} ${p.shortDescription}`.toLowerCase();
    const matchesQ = q ? text.includes(q) : true;
    return matchesCat && matchesQ;
  });
}

function render() {
  resultsInfo.textContent = `Показано: ${state.filtered.length} з ${state.products.length}`;

  if (state.filtered.length === 0) {
    grid.innerHTML = `<div class="cart-empty">Нічого не знайдено. Спробуй інший запит.</div>`;
    return;
  }

  grid.innerHTML = state.filtered.map(productCard).join("");
  // bind add buttons
  grid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-add"));
      addToCart(id);
    });
  });

  updateCartBadge();
  renderCart();
}

function productCard(p) {
  const hasDiscount = Number(p.discount) > 0;
  const currency = p.currency || "USD";

  return `
    <article class="card">
      <div class="card__img">
        <img src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.name)}" loading="lazy"
             onerror="this.style.display='none'; this.parentElement.style.background='rgba(255,255,255,.04)';">
      </div>

      <div class="card__body">
        <h3 class="card__title">${escapeHtml(p.name)}</h3>
        <p class="card__desc">${escapeHtml(p.shortDescription || "")}</p>

        <div class="row">
          <div class="price">
            <span class="price__now">${fmtMoney(p.finalPrice, currency)}</span>
            ${hasDiscount ? `<span class="price__old">${fmtMoney(p.price, currency)}</span>` : ""}
          </div>
          <span class="pill">${stars(p.rating)} • -${Number(p.discount || 0)}%</span>
        </div>

        <div class="card__actions">
          <button class="btn primary" data-add="${p.id}">Додати в кошик</button>
        </div>
      </div>
    </article>
  `;
}

/* CART */
function addToCart(id) {
  const current = state.cart.get(id) || 0;
  state.cart.set(id, current + 1);
  updateCartBadge();
  renderCart();
}

function removeFromCart(id) {
  state.cart.delete(id);
  updateCartBadge();
  renderCart();
}

function changeQty(id, delta) {
  const current = state.cart.get(id) || 0;
  const next = current + delta;
  if (next <= 0) state.cart.delete(id);
  else state.cart.set(id, next);
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  let count = 0;
  for (const qty of state.cart.values()) count += qty;
  cartCount.textContent = String(count);
}

function renderCart() {
  if (state.cart.size === 0) {
    cartList.innerHTML = `<div class="cart-empty">Кошик порожній. Додай товари з каталогу 🙂</div>`;
    subtotalEl.textContent = "0";
    discountTotalEl.textContent = "0";
    totalEl.textContent = "0";
    return;
  }

  const items = [];
  let subtotal = 0;
  let total = 0;
  let currency = "USD";

  for (const [id, qty] of state.cart.entries()) {
    const p = state.products.find((x) => x.id === id);
    if (!p) continue;
    currency = p.currency || currency;

    subtotal += Number(p.price) * qty;
    total += Number(p.finalPrice) * qty;

    items.push({ p, qty });
  }

  const discountTotal = subtotal - total;

  cartList.innerHTML = items.map(({ p, qty }) => cartItem(p, qty)).join("");

  cartList.querySelectorAll("[data-minus]").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(Number(btn.dataset.minus), -1));
  });
  cartList.querySelectorAll("[data-plus]").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(Number(btn.dataset.plus), +1));
  });
  cartList.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.remove)));
  });

  subtotalEl.textContent = fmtMoney(Math.round(subtotal), currency);
  discountTotalEl.textContent = `-${fmtMoney(Math.round(discountTotal), currency)}`;
  totalEl.textContent = fmtMoney(Math.round(total), currency);
}

function cartItem(p, qty) {
  const currency = p.currency || "USD";
  return `
    <div class="cart-item">
      <div class="cart-item__img">
        <img src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.name)}" loading="lazy">
      </div>

      <div>
        <p class="cart-item__title">${escapeHtml(p.name)}</p>
        <p class="cart-item__meta">${fmtMoney(p.finalPrice, currency)} • ${escapeHtml(p.category)}</p>

        <div class="qty">
          <button type="button" data-minus="${p.id}">−</button>
          <span>${qty}</span>
          <button type="button" data-plus="${p.id}">+</button>
        </div>
      </div>

      <button class="trash" type="button" data-remove="${p.id}" aria-label="Видалити">
        <img src="delete.png" alt="delete">
      </button>
    </div>
  `;
}

/* UI events */
function openCart() {
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeCartDrawer() {
  overlay.classList.add("hidden");
  document.body.style.overflow = "";
}

cartBtn.addEventListener("click", openCart);
closeCart.addEventListener("click", closeCartDrawer);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeCartDrawer();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  clearSearch.style.opacity = state.query ? "1" : "0.35";
  applyFilters();
  render();
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  state.query = "";
  applyFilters();
  render();
  searchInput.focus();
});

categorySelect.addEventListener("change", () => {
  state.category = categorySelect.value;
  applyFilters();
  render();
});

checkoutBtn.addEventListener("click", () => {
  alert("✅ Оформлення (демо). Можна додати форму/сторінку, якщо треба.");
});

/* helpers */
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", " ");
}

/* start */
(async function init() {
  try {
    clearSearch.style.opacity = "0.35";
    await loadProducts();
  } catch (err) {
    console.error(err);
    resultsInfo.textContent =
      "Не завантажився JSON. Відкрий через Live Server (http://...), не через file://";
    grid.innerHTML =
      `<div class="cart-empty">
        <b>Помилка:</b> дані не завантажились.<br/>
        Запусти <b>Live Server</b> і онови сторінку.
      </div>`;
  }
})();
