/* ========================================
   ZEROWASTE MARKET - MAIN JAVASCRIPT
   ======================================== */

// ----------------------------------------
// STATE MANAGEMENT
// ----------------------------------------
const state = {
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  products: [],
  categories: [],
  currentCategory: 'all',
  currentSort: '',
  searchQuery: '',
  isLoading: false
};

// ----------------------------------------
// DOM ELEMENTS
// ----------------------------------------
const elements = {
  // Loader
  loader: document.getElementById('loader'),
  
  // Header
  header: document.getElementById('header'),
  nav: document.getElementById('nav'),
  mobileMenuToggle: document.getElementById('mobileMenuToggle'),
  mobileNavOverlay: document.getElementById('mobileNavOverlay'),
  
  // Search
  searchToggle: document.getElementById('searchToggle'),
  searchBar: document.getElementById('searchBar'),
  searchInput: document.getElementById('searchInput'),
  searchClose: document.getElementById('searchClose'),
  
  // Cart
  cartToggle: document.getElementById('cartToggle'),
  cartCount: document.getElementById('cartCount'),
  cartSidebar: document.getElementById('cartSidebar'),
  cartOverlay: document.getElementById('cartOverlay'),
  cartClose: document.getElementById('cartClose'),
  cartItems: document.getElementById('cartItems'),
  cartEmpty: document.getElementById('cartEmpty'),
  cartFooter: document.getElementById('cartFooter'),
  cartSubtotal: document.getElementById('cartSubtotal'),
  cartShopNow: document.getElementById('cartShopNow'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  
  // Products
  filterCategories: document.getElementById('filterCategories'),
  sortSelect: document.getElementById('sortSelect'),
  productsGrid: document.getElementById('productsGrid'),
  productsLoading: document.getElementById('productsLoading'),
  productsEmpty: document.getElementById('productsEmpty'),
  clearFilters: document.getElementById('clearFilters'),
  
  // Testimonials
  testimonialTrack: document.getElementById('testimonialTrack'),
  testimonialPrev: document.getElementById('testimonialPrev'),
  testimonialNext: document.getElementById('testimonialNext'),
  testimonialDots: document.getElementById('testimonialDots'),
  
  // Forms
  newsletterForm: document.getElementById('newsletterForm'),
  contactForm: document.getElementById('contactForm'),
  
  // Back to top
  backToTop: document.getElementById('backToTop'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// ----------------------------------------
// UTILITY FUNCTIONS
// ----------------------------------------
const utils = {
  formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  },
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    if (hasHalf) {
      stars += '☆';
    }
    return stars;
  }
};

// ----------------------------------------
// API FUNCTIONS
// ----------------------------------------
const api = {
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    
    const response = await fetch('/api/products');
    return response.json();
  },
  
  async getCategories() {
    const response = await fetch('/api/categories');
    return response.json();
  },
  
  async submitNewsletter(email) {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return response.json();
  },
  
  async submitContact(data) {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// ----------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------
const toast = {
  show(message, type = 'success') {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠'
    };
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    
    elements.toastContainer.appendChild(toastEl);
    
    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toastEl));
    
    setTimeout(() => this.remove(toastEl), 5000);
  },
  
  remove(toastEl) {
    toastEl.classList.add('removing');
    setTimeout(() => toastEl.remove(), 300);
  }
};

// ----------------------------------------
// CART FUNCTIONS
// ----------------------------------------
const cart = {
  add(product) {
    const existingItem = state.cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      state.cart.push({ ...product, quantity: 1 });
    }
    
    this.save();
    this.updateUI();
    toast.show(`${product.name} added to cart!`);
    
    // Animate cart count
    elements.cartCount.classList.add('bump');
    setTimeout(() => elements.cartCount.classList.remove('bump'), 300);
  },
  
  remove(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    this.save();
    this.updateUI();
  },
  
  updateQuantity(productId, delta) {
    const item = state.cart.find(item => item.id === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        this.remove(productId);
        return;
      }
    }
    this.save();
    this.updateUI();
  },
  
  save() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
  },
  
  getTotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  getCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  },
  
  updateUI() {
    // Update cart count
    const count = this.getCount();
    elements.cartCount.textContent = count;
    
    // Update cart items
    if (state.cart.length === 0) {
      elements.cartItems.style.display = 'none';
      elements.cartEmpty.style.display = 'flex';
      elements.cartFooter.style.display = 'none';
    } else {
      elements.cartItems.style.display = 'block';
      elements.cartEmpty.style.display = 'none';
      elements.cartFooter.style.display = 'block';
      
      elements.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}">
          </div>
          <div class="cart-item-details">
            <h4 class="cart-item-name">${item.name}</h4>
            <span class="cart-item-price">${utils.formatPrice(item.price)}</span>
            <div class="cart-item-controls">
              <button class="quantity-btn minus" data-id="${item.id}">−</button>
              <span class="cart-item-quantity">${item.quantity}</span>
              <button class="quantity-btn plus" data-id="${item.id}">+</button>
              <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `).join('');
      
      // Update subtotal
      elements.cartSubtotal.textContent = utils.formatPrice(this.getTotal());
      
      // Add event listeners to cart items
      elements.cartItems.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => this.updateQuantity(parseInt(btn.dataset.id), -1));
      });
      
      elements.cartItems.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => this.updateQuantity(parseInt(btn.dataset.id), 1));
      });
      
      elements.cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => this.remove(parseInt(btn.dataset.id)));
      });
    }
  },
  
  open() {
    elements.cartSidebar.classList.add('active');
    elements.cartOverlay.classList.add('active');
    document.body.classList.add('no-scroll');
  },
  
  close() {
    elements.cartSidebar.classList.remove('active');
    elements.cartOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
};

// ----------------------------------------
// PRODUCTS FUNCTIONS
// ----------------------------------------
const products = {
  async load() {
    state.isLoading = true;
    elements.productsLoading.style.display = 'flex';
    elements.productsGrid.style.display = 'none';
    elements.productsEmpty.style.display = 'none';
    
    try {
      const data = await api.getProducts({
        category: state.currentCategory,
        search: state.searchQuery,
        sort: state.currentSort
      });
      
      state.products = data.products;
      this.render();
    } catch (error) {
      console.error('Error loading products:', error);
      toast.show('Failed to load products', 'error');
    } finally {
      state.isLoading = false;
      elements.productsLoading.style.display = 'none';
    }
  },
  
  render() {
    if (state.products.length === 0) {
      elements.productsGrid.style.display = 'none';
      elements.productsEmpty.style.display = 'block';
      return;
    }
    
    elements.productsGrid.style.display = 'grid';
    elements.productsEmpty.style.display = 'none';
    
    elements.productsGrid.innerHTML = state.products.map(product => `
      <article class="product-card animate-on-scroll" data-id="${product.id}">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          ${product.badge ? `<span class="product-badge ${product.badge}">${product.badge.replace('-', ' ')}</span>` : ''}
          <button class="product-wishlist" aria-label="Add to wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-rating">
            <span class="rating-stars">${utils.generateStars(product.rating)}</span>
            <span class="rating-count">(${product.reviews})</span>
          </div>
          <div class="product-footer">
            <span class="product-price">${utils.formatPrice(product.price)}</span>
            <button class="add-to-cart-btn" ${!product.inStock ? 'disabled' : ''} data-id="${product.id}" aria-label="Add to cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `).join('');
    
    // Add event listeners
    elements.productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = parseInt(btn.dataset.id);
        const product = state.products.find(p => p.id === productId);
        if (product && product.inStock) {
          cart.add(product);
        }
      });
    });
    
    elements.productsGrid.querySelectorAll('.product-wishlist').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const action = btn.classList.contains('active') ? 'added to' : 'removed from';
        toast.show(`Product ${action} wishlist`);
      });
    });
    
    // Trigger scroll animations
    this.observeAnimations();
  },
  
  observeAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }
};

// ----------------------------------------
// CATEGORIES FUNCTIONS
// ----------------------------------------
const categories = {
  async load() {
    try {
      state.categories = await api.getCategories();
      this.render();
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  },
  
  render() {
    elements.filterCategories.innerHTML = state.categories.map(cat => `
      <button class="category-btn ${cat.id === state.currentCategory ? 'active' : ''}" data-category="${cat.id}">
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');
    
    elements.filterCategories.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.currentCategory = btn.dataset.category;
        this.render();
        products.load();
      });
    });
  }
};

// ----------------------------------------
// TESTIMONIALS SLIDER
// ----------------------------------------
const testimonials = {
  currentSlide: 0,
  totalSlides: 3,
  
  init() {
    this.createDots();
    this.updateSlider();
    
    elements.testimonialPrev.addEventListener('click', () => this.prev());
    elements.testimonialNext.addEventListener('click', () => this.next());
    
    // Auto-slide
    setInterval(() => this.next(), 5000);
  },
  
  createDots() {
    elements.testimonialDots.innerHTML = Array(this.totalSlides)
      .fill(0)
      .map((_, i) => `<button class="testimonial-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></button>`)
      .join('');
    
    elements.testimonialDots.querySelectorAll('.testimonial-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this.currentSlide = parseInt(dot.dataset.slide);
        this.updateSlider();
      });
    });
  },
  
  updateSlider() {
    elements.testimonialTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    
    elements.testimonialDots.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentSlide);
    });
  },
  
  prev() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.updateSlider();
  },
  
  next() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.updateSlider();
  }
};

// ----------------------------------------
// NAVIGATION FUNCTIONS
// ----------------------------------------
const navigation = {
  init() {
    // Mobile menu toggle
    elements.mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
    elements.mobileNavOverlay.addEventListener('click', () => this.closeMobileMenu());
    
    // Close mobile menu on nav link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });
    
    // Search toggle
    elements.searchToggle.addEventListener('click', () => this.toggleSearch());
    elements.searchClose.addEventListener('click', () => this.closeSearch());
    
    // Search input
    elements.searchInput.addEventListener('input', utils.debounce((e) => {
      state.searchQuery = e.target.value;
      products.load();
    }, 300));
    
    // Scroll behavior
    window.addEventListener('scroll', utils.debounce(() => this.handleScroll(), 10));
    
    // Active nav link on scroll
    this.observeSections();
  },
  
  toggleMobileMenu() {
    elements.mobileMenuToggle.classList.toggle('active');
    elements.nav.classList.toggle('active');
    elements.mobileNavOverlay.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
  },
  
  closeMobileMenu() {
    elements.mobileMenuToggle.classList.remove('active');
    elements.nav.classList.remove('active');
    elements.mobileNavOverlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
  },
  
  toggleSearch() {
    elements.searchBar.classList.toggle('active');
    if (elements.searchBar.classList.contains('active')) {
      elements.searchInput.focus();
    }
  },
  
  closeSearch() {
    elements.searchBar.classList.remove('active');
    elements.searchInput.value = '';
    state.searchQuery = '';
    products.load();
  },
  
  handleScroll() {
    const scrollY = window.scrollY;
    
    // Header shadow
    elements.header.classList.toggle('scrolled', scrollY > 50);
    
    // Back to top button
    elements.backToTop.classList.toggle('visible', scrollY > 500);
  },
  
  observeSections() {
    const sections = document.querySelectorAll('section[id]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3 });
    
    sections.forEach(section => observer.observe(section));
  }
};

// ----------------------------------------
// COUNTER ANIMATION
// ----------------------------------------
const counterAnimation = {
  init() {
    const counters = document.querySelectorAll('[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
  },
  
  animate(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const update = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString() + '+';
      }
    };
    
    update();
  }
};

// ----------------------------------------
// FORMS
// ----------------------------------------
const forms = {
  init() {
    // Newsletter form
    elements.newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;
      
      try {
        const result = await api.submitNewsletter(email);
        toast.show(result.message, 'success');
        elements.newsletterForm.reset();
      } catch (error) {
        toast.show('Failed to subscribe. Please try again.', 'error');
      }
    });
    
    // Contact form
    elements.contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
      };
      
      try {
        const result = await api.submitContact(data);
        toast.show(result.message, 'success');
        elements.contactForm.reset();
      } catch (error) {
        toast.show('Failed to send message. Please try again.', 'error');
      }
    });
  }
};

// ----------------------------------------
// INITIALIZATION
// ----------------------------------------
async function init() {
  // Cart events
  elements.cartToggle.addEventListener('click', () => cart.open());
  elements.cartClose.addEventListener('click', () => cart.close());
  elements.cartOverlay.addEventListener('click', () => cart.close());
  elements.cartShopNow.addEventListener('click', () => {
    cart.close();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
  elements.checkoutBtn.addEventListener('click', () => {
    toast.show('Checkout functionality would be implemented here!', 'warning');
  });
  
  // Sort select
  elements.sortSelect.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    products.load();
  });
  
  // Clear filters
  elements.clearFilters.addEventListener('click', () => {
    state.currentCategory = 'all';
    state.currentSort = '';
    state.searchQuery = '';
    elements.sortSelect.value = '';
    elements.searchInput.value = '';
    categories.render();
    products.load();
  });
  
  // Back to top
  elements.backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Initialize components
  navigation.init();
  forms.init();
  testimonials.init();
  counterAnimation.init();
  
  // Load data
  await categories.load();
  await products.load();
  
  // Initialize cart UI
  cart.updateUI();
  
  // Hide loader
  setTimeout(() => {
    elements.loader.classList.add('hidden');
    document.body.classList.remove('no-scroll');
  }, 1500);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
});
document.addEventListener('DOMContentLoaded', () => {
  categories.load();
  products.load();
});


