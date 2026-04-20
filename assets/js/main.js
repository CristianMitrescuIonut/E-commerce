/* =========================================================
   MAIN.JS - GLITCH CODE (BASADO EN TU DISEÑO ORIGINAL)
   Maneja la lógica multipágina con LocalStorage para
   mantener el carrito y la wishlist sincronizados.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initCartAndWishlist();
  initProductPage();
  initCheckout();
  initLegalTabs();
  initBlogFilters();
  initContactForm();
  initRealSearch();
  initAuthModal();
  initHeroCarousel();
});

/* =========================================
   PERSISTENCIA (LocalStorage)
========================================= */
let cart = JSON.parse(localStorage.getItem('gc_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('gc_wishlist')) || [];

function saveState() {
  localStorage.setItem('gc_cart', JSON.stringify(cart));
  localStorage.setItem('gc_wishlist', JSON.stringify(wishlist));
}

function formatPrice(value) {
  return Number(value).toFixed(2);
}

/* =========================================
   1. MENÚ MÓVIL
========================================= */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }
}

/* =========================================
   2. CARRITO Y WISHLIST
========================================= */
function initCartAndWishlist() {
  // Configuración de los paneles laterales (Drawers)
  const setupDrawer = (toggleId, closeId, drawerId, backdropId) => {
    const toggle = document.getElementById(toggleId), close = document.getElementById(closeId);
    const drawer = document.getElementById(drawerId), backdrop = document.getElementById(backdropId);
    if (!drawer) return;
    if (toggle) toggle.addEventListener('click', () => drawer.classList.add('open'));
    if (close) close.addEventListener('click', () => drawer.classList.remove('open'));
    if (backdrop) backdrop.addEventListener('click', () => drawer.classList.remove('open'));
  };

  setupDrawer('cartToggle', 'cartClose', 'cartDrawer', 'cartBackdrop');
  setupDrawer('wishlistToggle', 'wishlistClose', 'wishlistDrawer', 'wishlistBackdrop');

  // Funcionalidad de botones corazón en las tarjetas
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const name = btn.dataset.name;
    // Marca como activo si ya está en localStorage
    if (wishlist.find(item => item.name === name)) btn.classList.add('active');

    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const existingIdx = wishlist.findIndex(item => item.name === name);
      if (existingIdx > -1) {
        wishlist.splice(existingIdx, 1);
        btn.classList.remove('active');
      } else {
        wishlist.push({ name, price: btn.dataset.price, img: btn.dataset.img });
        btn.classList.add('active');
      }
      saveState(); renderDrawers();
    });
  });

  // Botón "Añadir al Carrito" en Ficha de Producto
  const addCartBtn = document.getElementById('addToCartBtn');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const name = document.querySelector('.product-title')?.innerText || 'Producto';
      const currentPriceEl = document.getElementById('currentPrice');
      const price = parseFloat(currentPriceEl ? currentPriceEl.innerText : 0);
      const img = document.getElementById('mainImage')?.src || '';
      const flavor = document.getElementById('flavor-text')?.innerText || 'Estándar';
      
      const selectedSizeBtn = document.querySelector('#sizeOptions .option-btn.selected');
      const size = selectedSizeBtn ? selectedSizeBtn.innerText.split('\n')[0].trim() : '1kg';
      const qty = parseInt(document.getElementById('qty')?.value || 1);
      
      const id = `${name}-${flavor}-${size}`;
      const existing = cart.find(i => i.id === id);
      
      if(existing) existing.qty += qty;
      else cart.push({ id, name, unitPrice: price, img, flavor, size, qty });
      
      saveState(); 
      renderDrawers();
      document.getElementById('cartDrawer').classList.add('open');
    });
  }

  renderDrawers();
}

function renderDrawers() {
  // Renderizar Carrito
  const cartContainer = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  
  if (cartContainer) {
    if (!cart.length) {
      cartContainer.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
      if (cartCount) cartCount.textContent = '0';
      if (cartTotal) cartTotal.textContent = '0.00';
    } else {
      let totalUnits = 0;
      let totalPrice = 0;

      cartContainer.innerHTML = cart.map((item, i) => {
        totalUnits += item.qty;
        totalPrice += item.unitPrice * item.qty;
        return `
          <div class="cart-item">
            <img src="${item.img}" alt="${item.name}">
            <div>
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-meta">Sabor: ${item.flavor}</div>
              <div class="cart-item-meta">Tamaño: ${item.size}</div>
              <div class="cart-item-meta">Cant: ${item.qty}</div>
            </div>
            <div class="cart-item-price">${formatPrice(item.unitPrice * item.qty)}€</div>
            <button onclick="removeFromCart(${i})" style="color:#ff4f6a; font-size:1.2rem; background:transparent; cursor:pointer;">✕</button>
          </div>
        `;
      }).join('');
      
      if(cartCount) cartCount.textContent = totalUnits;
      if(cartTotal) cartTotal.textContent = formatPrice(totalPrice);
    }
  }

  // Renderizar Wishlist
  const wishContainer = document.getElementById('wishlistItems');
  const wishCount = document.getElementById('wishlistCount');
  
  if (wishContainer) {
    if (!wishlist.length) {
      wishContainer.innerHTML = '<p class="cart-empty">Sin favoritos aún.</p>';
      if (wishCount) { wishCount.textContent = '0'; wishCount.style.display = 'none'; }
    } else {
      wishContainer.innerHTML = wishlist.map((item, i) => `
        <div class="wishlist-item">
          <img src="${item.img}" alt="${item.name}">
          <div>
            <div class="cart-item-name" style="font-size:0.9rem;">${item.name}</div>
            <div class="cart-item-price" style="font-size:0.8rem;">${item.price}</div>
          </div>
          <button onclick="removeFromWishlist(${i})" style="color:#ff4f6a; font-size:1.2rem; background:transparent; cursor:pointer;">✕</button>
        </div>
      `).join('');
      
      if(wishCount) {
        wishCount.textContent = wishlist.length;
        wishCount.style.display = 'flex';
      }
    }
  }
}

// Funciones globales para ser llamadas desde los onclick generados
window.removeFromCart = (idx) => { 
  cart.splice(idx, 1); 
  saveState(); 
  renderDrawers(); 
};

window.removeFromWishlist = (idx) => { 
  const removed = wishlist.splice(idx, 1)[0]; 
  saveState(); 
  renderDrawers(); 
  // Desactivar el botón visual si la tarjeta está en pantalla
  document.querySelectorAll(`.wishlist-btn[data-name="${removed.name}"]`).forEach(b => b.classList.remove('active'));
};


/* =========================================
   3. PÁGINA DE PRODUCTO
========================================= */
function initProductPage() {
  window.adjustQty = (change) => {
    const input = document.getElementById("qty");
    if (!input) return;
    let newVal = parseInt(input.value) + change;
    input.value = newVal < 1 ? 1 : newVal;
  };

  window.selectOption = (btn, type, value) => {
    Array.from(btn.parentElement.children).forEach(sib => sib.classList.remove("selected"));
    btn.classList.add("selected");
    
    if (type === "flavor") {
      const flavorText = document.getElementById("flavor-text");
      if (flavorText) flavorText.innerText = value;
    } else if (type === "size") {
      // Cambio de precio de tu diseño antiguo
      const prices = { "500g": 24.99, "1kg": 45.99, "2.5kg": 119.99 };
      if(prices[value]) document.getElementById('currentPrice').innerText = prices[value];
    }
  };
}

/* =========================================
   4. CHECKOUT
========================================= */
function initCheckout() {
  if (!document.getElementById('checkout-items')) return;
  
  // Renderizar items del localstorage en el resumen final
  const container = document.getElementById('checkout-items');
  container.innerHTML = cart.length ? cart.map(item => `
    <div style="display:flex; gap:1rem; margin-bottom:1rem; align-items:center;">
      <img src="${item.img}" style="width:60px; height:60px; border-radius:8px; background:#fff; padding:4px;">
      <div style="flex:1">
        <div style="font-weight:700; font-size:0.9rem">${item.name}</div>
        <div style="font-size:0.8rem; color:#888">${item.flavor} · ${item.size} · ×${item.qty}</div>
      </div>
      <div style="font-weight:700; color:#111;">${formatPrice(item.unitPrice * item.qty)}€</div>
    </div>
  `).join('') : '<p>No hay productos en el carrito.</p>';

  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  document.getElementById('checkout-subtotal').textContent = formatPrice(total) + '€';
  document.getElementById('checkout-total').textContent = formatPrice(total) + '€';

  window.selectPayment = (btn, method) => {
    document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const cardForm = document.getElementById('card-form');
    const altMsg = document.getElementById('alt-payment-msg');
    
    if (method === 'card') {
      cardForm.style.display = 'block'; altMsg.style.display = 'none';
    } else {
      cardForm.style.display = 'none'; altMsg.style.display = 'block';
      altMsg.innerText = `Has seleccionado un método de pago alternativo. Serás redirigido para completar el pago de forma segura.`;
    }
  };

  window.confirmOrder = () => {
    if(!document.getElementById('terms-check').checked) {
      document.getElementById('terms-error').style.display = 'block'; return;
    }
    document.querySelector('.confirm-btn').textContent = '⏳ Procesando...';
    setTimeout(() => {
      document.getElementById('order-confirmed').classList.add('show');
      localStorage.removeItem('gc_cart'); // Vaciamos carrito al comprar
    }, 1500);
  };
}

/* =========================================
   5. LEGALES - PESTAÑAS
========================================= */
function initLegalTabs() {
  const tabs = document.querySelectorAll('.legal-tab');
  if(!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.legal-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
}

/* =========================================
   6. FILTROS BLOG
========================================= */
function initBlogFilters() {
  window.filterBlog = (category, btn) => {
    document.querySelectorAll('.cta-btn').forEach(b => {
      if(b.classList.contains('active-filter')) {
        b.style.background = '#333';
        b.classList.remove('active-filter');
      }
    });
    btn.style.background = 'var(--color-secondary)';
    btn.classList.add('active-filter');

    const sections = ['guias', 'nutricion', 'recuperacion'];
    sections.forEach(sec => {
      const el = document.getElementById(sec);
      if(!el) return;
      if(category === 'todos' || category === sec) el.style.display = 'block';
      else el.style.display = 'none';
    });
  };
}

/* =========================================
   7. FORMULARIO CONTACTO
========================================= */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alert("¡Gracias por tu mensaje! Te responderemos lo antes posible.");
    form.reset();
  });
}

/* =========================================
    8.  LÓGICA DEL CARRUSEL 
========================================= */
function initHeroCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsNav = document.getElementById('carousel-dots');
  
  if (slides.length === 0) return;

  let currentIdx = 0;

  // Limpiar dots por si se duplican al recargar
  if (dotsNav) dotsNav.innerHTML = '';

  // Crear dots
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `dot ${i === 0 ? 'active' : ''}`;
    dot.onclick = () => goToSlide(i);
    if (dotsNav) dotsNav.appendChild(dot);
  });

  const dots = document.querySelectorAll('.dot');

  function goToSlide(index) {
    // Quitar activo de todos
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    // Activar el seleccionado
    slides[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentIdx = index;
  }

  // Intervalo automático
  setInterval(() => {
    let next = (currentIdx + 1) % slides.length;
    goToSlide(next);
  }, 5000);
}


/* =========================================
   SISTEMA DE BÚSQUEDA REAL
========================================= */

// 1. Base de datos de productos (puedes ampliarla)
const productsDB = [
  { name: "Proteína Iso-Tech", price: 45.99, img: "assets/img/imgproteina.png", category: "proteinas", url: "producto/producto.html" },
  { name: "Creatina Pura", price: 34.99, img: "assets/img/imgcreatina.png", category: "fuerza", url: "producto/producto.html#creatinas" },
  { name: "Glitch Fuel Pre-workout", price: 29.99, img: "assets/img/imgpreworkout.png", category: "suplementos", url: "producto/producto.html#suplementos" },
  { name: "Vitamina D3 + K2", price: 12.99, img: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=200", category: "vitaminas", url: "producto/producto.html#vitaminas" },
  { name: "Shaker Neon Pro", price: 9.99, img: "assets/img/imgshaker.jpg", category: "accesorios", url: "producto/producto.html" }
];

function initRealSearch() {
  const searchIcon = document.querySelector('.header-icons svg:nth-child(3)'); // Selecciona la lupa
  const overlay = document.getElementById('searchOverlay');
  const closeBtn = document.getElementById('searchClose');
  const backdrop = document.getElementById('searchBackdrop');
  const input = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResults');

  if (!overlay || !searchIcon) return;

  // Hacer que el icono de la lupa sea un botón clickable
  searchIcon.style.cursor = "pointer";
  searchIcon.addEventListener('click', () => {
    overlay.classList.add('open');
    setTimeout(() => input.focus(), 300); // Foco automático al abrir
  });

  // Cerrar overlay
  [closeBtn, backdrop].forEach(el => {
    el.addEventListener('click', () => overlay.classList.remove('open'));
  });

  // Lógica de búsqueda en tiempo real
  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    if (term.length < 2) {
      resultsContainer.innerHTML = '<p class="text-gray-500 text-center">Escribe al menos 2 caracteres...</p>';
      return;
    }

    const filtered = productsDB.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    );

    renderSearchResults(filtered);
  });
}

function renderSearchResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="text-gray-500 text-center">No se encontraron productos.</p>';
    return;
  }

  resultsContainer.innerHTML = results.map(product => `
    <a href="${product.url}" class="cart-item hover:border-blue-500 transition-colors">
      <img src="${product.img}" alt="${product.name}" style="background:white;">
      <div>
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-meta">${product.category.toUpperCase()}</div>
      </div>
      <div class="cart-item-price">${product.price}€</div>
    </a>
  `).join('');
}


// Modal de autenticación (login/register)
function initAuthModal() {
  const userBtn = document.getElementById('userBtn');
  const modal = document.getElementById('authModal');
  const closeBtn = document.getElementById('authClose');
  const switchBtn = document.getElementById('switchToRegister');
  
  if (!userBtn || !modal) return;

  userBtn.onclick = (e) => {
    e.preventDefault();
    console.log("Mostrando modal de login...");
    modal.style.display = 'flex'; // Cambiamos de none a flex
    document.body.style.overflow = 'hidden';
  };

  closeBtn.onclick = () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  // Cerrar al hacer clic fuera del recuadro
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  };

  // Lógica de cambio Registro/Login
  if (switchBtn) {
    switchBtn.onclick = () => {
      const isLogin = document.getElementById('authTitle').innerText === "INICIAR SESIÓN";
      const title = document.getElementById('authTitle');
      const regFields = document.getElementById('registerFields');
      const submitBtn = document.querySelector('#authForm button[type="submit"]');
      const toggleText = document.getElementById('authToggleText');

      if (isLogin) {
        title.innerText = "CREAR CUENTA";
        regFields.style.display = "block";
        submitBtn.innerText = "CREAR CUENTA AHORA";
        toggleText.innerHTML = '¿Ya tienes cuenta? <button type="button" id="switchToRegister" style="color: #007BFF; background: none; border: none; font-weight: bold; cursor: pointer; text-decoration: underline;">Inicia sesión</button>';
      } else {
        title.innerText = "INICIAR SESIÓN";
        regFields.style.display = "none";
        submitBtn.innerText = "ENTRAR AL SISTEMA";
        toggleText.innerHTML = '¿No tienes cuenta? <button type="button" id="switchToRegister" style="color: #007BFF; background: none; border: none; font-weight: bold; cursor: pointer; text-decoration: underline;">Regístrate gratis</button>';
      }
      // Re-vincular evento ya que innerHTML lo borra
      initAuthModal();
    };
  }
}


// Modal genérico para productos sin ficha específica
function openGenericModal(element) {
    const modal = document.getElementById('genericProductModal');
    
    // Extraer datos del elemento clickeado
    const title = element.getAttribute('data-title');
    const price = element.getAttribute('data-price');
    const img = element.getAttribute('data-img');
    const desc = element.getAttribute('data-desc');

    // Inyectar datos en el modal
    document.getElementById('modalGenericTitle').innerText = title;
    document.getElementById('modalGenericPrice').innerText = price + " €";
    document.getElementById('modalGenericImg').src = img;
    document.getElementById('modalGenericDesc').innerText = desc;
    document.getElementById('modalGenericQty').value = 1;

    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evita scroll
}

function closeGenericModal() {
    document.getElementById('genericProductModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function addToCartFromModal() {
    const title = document.getElementById('modalGenericTitle').innerText;
    const price = parseFloat(document.getElementById('modalGenericPrice').innerText);
    const img = document.getElementById('modalGenericImg').src;
    const qty = parseInt(document.getElementById('modalGenericQty').value);

    // Llamar a tu función existente de añadir al carrito
    // Ajusta según cómo funcione tu función 'addToCart' actual
    const productToAdd = {
        name: title,
        price: price,
        img: img,
        qty: qty,
        flavor: "Único",
        size: "Estándar"
    };

    cart.push(productToAdd);
    saveState();
    updateCartUI(); // La función que ya tienes para refrescar el carrito
    closeGenericModal();
}