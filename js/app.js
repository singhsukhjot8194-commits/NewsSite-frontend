/* js/app.js */
// CONFIGURATION: Set this to your Render backend URL when deploying!
const PRODUCTION_BACKEND_URL = 'https://newssite-backend.onrender.com';

const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const localApiOrigin = `${window.location.protocol}//${window.location.hostname}:5000`;
const API_BASE = window.location.protocol === 'file:'
  ? 'http://localhost:5000/api'
  : isLocalFrontend
    ? `${localApiOrigin}/api`
    : `${PRODUCTION_BACKEND_URL}/api`;

const getNewsImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/400x200';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  const baseUrl = isLocalFrontend ? localApiOrigin : PRODUCTION_BACKEND_URL;
  return image.startsWith('/') ? `${baseUrl}${image}` : `${baseUrl}/${image}`;
};

// Product Data
const products = [
  {
    id: 1,
    name: "Blue T-Shirt",
    description: "Premium quality blue cotton t-shirt with The African Diplomat branding. Comfortable, durable, and perfect for everyday wear.",
    image: "products/01_blue_tshirt_HD.png",
    category: "Clothing"
  },
  {
    id: 2,
    name: "White T-Shirt",
    description: "Classic white t-shirt featuring our distinctive logo. Made from 100% organic cotton for superior comfort.",
    image: "products/02_white_tshirt_HD.png",
    category: "Clothing"
  },
  {
    id: 3,
    name: "Navy Varsity Jacket",
    description: "Stylish navy varsity jacket with embroidered logo. Perfect for cooler weather and making a statement.",
    image: "products/03_navy_varisty_jacket_HD.png",
    category: "Clothing"
  },
  {
    id: 4,
    name: "Black Hoodie",
    description: "Cozy black hoodie with front pocket and adjustable hood. Features subtle branding for a professional look.",
    image: "products/04_black_hoodie_HD.png",
    category: "Clothing"
  },
  {
    id: 5,
    name: "Navy Cap",
    description: "Adjustable navy baseball cap with embroidered logo. One size fits all, perfect for sunny days.",
    image: "products/05_navy_cap_HD.png",
    category: "Headwear"
  },
  {
    id: 6,
    name: "Black Backpack",
    description: "Durable black backpack with multiple compartments. Ideal for work, travel, or daily commute.",
    image: "products/06_black_backpack_HD.png",
    category: "Accessories"
  },
  {
    id: 7,
    name: "Black Briefcase",
    description: "Professional black briefcase with laptop compartment. Sleek design for the modern diplomat.",
    image: "products/07_black_briefcase_HD.png",
    category: "Accessories"
  },
  {
    id: 8,
    name: "Blue Mug",
    description: "Ceramic blue mug with logo. Perfect for your morning coffee or tea. Dishwasher and microwave safe.",
    image: "products/08_blue_mug_HD.png",
    category: "Drinkware"
  },
  {
    id: 9,
    name: "White Mug",
    description: "Elegant white ceramic mug featuring our branding. A great addition to your office or home.",
    image: "products/09_white_mug_HD.png",
    category: "Drinkware"
  },
  {
    id: 10,
    name: "Branded Pens Collection",
    description: "Premium collection of three elegant branded pens - blue, black, and blue-gold. Perfect for signing important documents, daily use, or as thoughtful gifts for colleagues and dignitaries.",
    image: "products/10_blue_branded_pen_HD.png",
    images: [
      "products/10_blue_branded_pen_HD.png",
      "products/11_black_branded_pen_HD.png",
      "products/12_blue_gold_branded_pen_HD.png"
    ],
    category: "Stationery"
  },
  {
    id: 11,
    name: "Blue Gold Tie",
    description: "Sophisticated blue and gold patterned tie. Silk blend for a premium feel.",
    image: "products/14_blue_gold_tie_HD.png",
    category: "Accessories"
  }
];

// Utilities
const getUrlParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatRegion = (region) => region
  ? region.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  : '';

// XSS hardening: allow only a safe subset of HTML for user/author-controlled content
const sanitizeHTML = (html) => {
  if (typeof html !== 'string' || !html.trim()) return '';
  const div = document.createElement('div');
  div.textContent = html;
  let safe = div.innerHTML;
  safe = safe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  // Re-allow a minimal safe set of structural tags only (no attributes, no scripts)
  safe = safe
    .replace(/&lt;p&gt;/g, '<p>')
    .replace(/&lt;\/p&gt;/g, '</p>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    .replace(/&lt;b&gt;/g, '<b>')
    .replace(/&lt;\/b&gt;/g, '</b>')
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;i&gt;/g, '<i>')
    .replace(/&lt;\/i&gt;/g, '</i>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;ul&gt;/g, '<ul>')
    .replace(/&lt;\/ul&gt;/g, '</ul>')
    .replace(/&lt;ol&gt;/g, '<ol>')
    .replace(/&lt;\/ol&gt;/g, '</ol>')
    .replace(/&lt;li&gt;/g, '<li>')
    .replace(/&lt;\/li&gt;/g, '</li>')
    .replace(/&lt;h([1-6])&gt;/g, '<h$1>')
    .replace(/&lt;\/h([1-6])&gt;/g, '</h$1>')
    .replace(/&lt;blockquote&gt;/g, '<blockquote>')
    .replace(/&lt;\/blockquote&gt;/g, '</blockquote>');
  return safe;
};

const escapeAttr = (value) => {
  if (typeof value !== 'string') return String(value);
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};


const showLoader = (containerId) => {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="loader" style="display: block;"></div>';
  }
};

const showError = (containerId, message) => {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<p class="error-msg">${message}</p>`;
  }
};

// API Calls
const fetchNews = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/news?${query}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return Array.isArray(data) ? data : data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

const fetchArticle = async (slug) => {
  try {
    const response = await fetch(`${API_BASE}/news/${slug}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
};

const fetchOpportunities = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/opportunities?${query}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to fetch services (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.opportunities || [];
};

const fetchOpportunity = async (slug) => {
  try {
    const response = await fetch(`${API_BASE}/opportunities/${slug}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return null;
  }
};

const registerOpportunity = async (data) => {
  try {
    const response = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

const registerOpportunityWithProof = async (formData) => {
  try {
    const response = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to submit registration');
    return result;
  } catch (error) {
    console.error('Error submitting local registration with proof:', error);
    throw error;
  }
};

const bindPaymentMethodToggles = (form) => {
  if (!form) return;
  const radios = form.querySelectorAll('input[name="paymentMethod"]');
  const orangeBox = form.querySelector('#orange-details');
  const lonestarBox = form.querySelector('#lonestar-details');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (submitBtn && !submitBtn.dataset.originalText) {
    submitBtn.dataset.originalText = submitBtn.textContent;
  }

  const updateView = () => {
    const selected = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'stripe';
    if (orangeBox) orangeBox.style.display = selected === 'orange' ? 'block' : 'none';
    if (lonestarBox) lonestarBox.style.display = selected === 'lonestar' ? 'block' : 'none';

    if (submitBtn) {
      if (selected === 'orange' || selected === 'lonestar') {
        submitBtn.textContent = 'Submit Payment Proof for Verification';
      } else {
        submitBtn.textContent = submitBtn.dataset.originalText || 'Proceed to Payment';
      }
    }
  };

  radios.forEach(radio => {
    radio.addEventListener('change', updateView);
  });

  updateView();
};

const createCheckoutSession = async (data) => {
  const response = await fetch(`${API_BASE}/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Unable to start payment.');
  return result;
};

const formatUsd = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(Number(amount) || 0);

// Render Functions
const createNewsCard = (news) => {
  const categoryLabel = news.region
    ? `${escapeAttr(news.category || 'Africa')} · ${formatRegion(news.region)}`
    : escapeAttr(news.category || 'News');
  return `
    <article class="card">
      <a href="article.html?slug=${escapeAttr(news.slug || news.id)}">
        <img src="${getNewsImageUrl(news.image)}" alt="${escapeAttr(news.title)}" class="card-img">
        <div class="card-content">
          <span class="card-category">${categoryLabel}</span>
          <h3 class="card-title">${escapeAttr(news.title)}</h3>
          <div class="card-meta">
            <span>${formatDate(news.date || news.createdAt || new Date())}</span>
            <span>${escapeAttr(news.author || 'Admin')}</span>
          </div>
        </div>
      </a>
    </article>
  `;
};

const createLatestNewsItem = (news) => `
  <article class="latest-item">
    <a href="article.html?slug=${escapeAttr(news.slug || news.id)}">
      <img src="${getNewsImageUrl(news.image)}" alt="" class="latest-thumb">
      <span class="latest-item-copy">
        <strong>${escapeAttr(news.title)}</strong>
        <small>${formatDate(news.date || news.createdAt || new Date())}</small>
      </span>
    </a>
  </article>
`;

const createOpportunityCard = (opp) => {
  const pricingType = opp.pricingType || (opp.isFree ? 'free' : 'special');
  const fee = pricingType === 'free'
    ? 'Free'
    : `${formatUsd(opp.fees)}${pricingType === 'subscription' ? ' / 3 months' : ' one-time'}`;
  const actionLabel = pricingType === 'subscription'
    ? 'Subscribe'
    : pricingType === 'special'
      ? 'Pay & Register'
      : 'Register';
  const description = sanitizeHTML(opp.shortDesc || opp.fullDetails || '');
  const opportunityId = opp._id || opp.id || opp.slug;

  return `
    <article class="card">
      <img src="${opp.banner || 'https://via.placeholder.com/400x200'}" alt="${escapeAttr(opp.title)}" class="card-img">
      <div class="card-content">
        <div class="opp-badges">
          <span class="badge badge-mode">${escapeAttr(opp.type || 'Opportunity')}</span>
          <span class="badge badge-mode">${escapeAttr(opp.status || 'upcoming')}</span>
          <span class="badge badge-mode">${escapeAttr(opp.mode || 'Online')}</span>
          <span class="badge badge-fee">${fee}</span>
        </div>
        <h3 class="card-title">${escapeAttr(opp.title)}</h3>
        <p style="margin-bottom: 15px; font-size: 14px; color: var(--text-light)">${description}</p>
        <div class="card-meta" style="margin-bottom: 15px;">
          <span>📅 ${formatDate(opp.date || new Date())}</span>
        </div>
        <a href="opportunity-detail.html?slug=${escapeAttr(opportunityId)}" class="btn btn-primary" style="display: block; width: 100%;">${actionLabel}</a>
      </div>
    </article>
  `;
};

// Product Render Function
const createProductCard = (product) => {
  const hasMultipleImages = product.images && product.images.length > 1;
  
  let imageHtml;
  if (hasMultipleImages) {
    imageHtml = `
      <div class="product-gallery" data-product-id="${product.id}">
        ${product.images.map((img, index) => {
          return `
            <div class="gallery-image-wrapper ${index === 0 ? 'active' : ''}">
              <img src="${img}" alt="${product.name}" class="product-img" loading="lazy">
            </div>
          `;
        }).join('')}
        <div class="gallery-nav">
          ${product.images.map((img, index) => {
            const label = ['Blue', 'Black', 'Blue & Gold'][index] || `#${index + 1}`;
            return `<button type="button" class="gallery-dot ${index === 0 ? 'active' : ''}" data-index="${index}" data-full="${img}" aria-label="${label} Pen"><img src="${img}" alt="${label} Pen" class="gallery-thumb"></button>`;
          }).join('')}
        </div>
        <span class="product-category-badge">${product.category}</span>
      </div>
    `;
  } else {
    imageHtml = `
      <div class="product-image-wrapper">
        <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        <span class="product-category-badge">${product.category}</span>
      </div>
    `;
  }
  
  return `
    <article class="product-card">
      ${imageHtml}
      <div class="product-content">
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-action">
          <button class="btn btn-product" data-product-id="${product.id}" data-product-name="${product.name}">Order Now - WhatsApp</button>
        </div>
      </div>
    </article>
  `;
};

// Page Initializers
const initHome = async () => {
  // Breaking News
  const breakingContainer = document.getElementById('breaking-ticker');
  if (breakingContainer) {
    const breakingNews = await fetchNews({ breaking: true, limit: 5 });
    if (breakingNews.length) {
      breakingContainer.innerHTML = breakingNews.map(n => `<div class="ticker-item"><a href="article.html?slug=${n.slug || n.id}">${n.title}</a></div>`).join('');
    } else {
      breakingContainer.innerHTML = '<div class="ticker-item">Welcome to The African Diplomat. Stay tuned for updates!</div>';
    }
  }

  // Featured News
  const featuredContainer = document.getElementById('featured-news');
  if (featuredContainer) {
    showLoader('featured-news');
    const featuredNews = await fetchNews({ featured: true, limit: 4 });
    if (featuredNews.length > 0) {
      const mainFeatured = featuredNews[0];
      const sideFeatured = featuredNews.slice(1, 4);
      
      let html = `<div class="featured-main">${createNewsCard(mainFeatured)}</div>`;
      html += `<div class="featured-side grid-container news-grid" style="grid-template-columns: 1fr;">`;
      html += sideFeatured.map(createNewsCard).join('');
      html += `</div>`;
      featuredContainer.innerHTML = html;
    } else {
      featuredContainer.innerHTML = '<p>No featured news at the moment.</p>';
    }
  }

  // Latest News
  const latestContainer = document.getElementById('latest-news');
  if (latestContainer) {
    showLoader('latest-news');
    const latestNews = await fetchNews({ limit: 6 });
    if (latestNews.length) {
      latestContainer.innerHTML = latestNews.map(createNewsCard).join('');
    } else {
      latestContainer.innerHTML = '<p>No published news yet. Publish an article from the admin panel to show it here.</p>';
    }
    const sidebar = document.getElementById('latest-sidebar');
    if (sidebar) {
      sidebar.innerHTML = latestNews.length
        ? latestNews.slice(0, 5).map(createLatestNewsItem).join('')
        : '<p class="sidebar-empty">No published news yet.</p>';
    }
  }
};

const initArticle = async () => {
  const slug = getUrlParam('slug');
  if (!slug) return (window.location.href = 'index.html');

  const container = document.getElementById('article-container');
  showLoader('article-container');

  const article = await fetchArticle(slug);
  if (!article) {
    showError('article-container', 'Article not found.');
    return;
  }

  document.title = `${article.title} - The African Diplomat`;
  const articleImage = article.image
    ? `<img src="${getNewsImageUrl(article.image)}" alt="${escapeAttr(article.title)}" class="article-image">`
    : article.video
      ? ""
      : '<img src="https://via.placeholder.com/800x400" alt="" class="article-image">';
  const articleVideo = article.video
    ? `<video src="${getNewsImageUrl(article.video)}" class="article-video" controls preload="metadata">Your browser does not support video playback.</video>`
    : "";

  container.innerHTML = `
    <div class="article-header">
      <span class="card-category" style="font-size: 14px;">${escapeAttr(article.category || 'News')}</span>
      <h1 class="article-title">${escapeAttr(article.title)}</h1>
      <div class="article-meta">
        <span>By ${escapeAttr(article.author || 'Admin')}</span>
        <span>•</span>
        <span>${formatDate(article.date || article.createdAt || new Date())}</span>
      </div>
    </div>
    ${articleImage}
    ${articleVideo}
    <div class="article-content">
      ${sanitizeHTML(article.content) || '<p>Content goes here...</p>'}
    </div>
  `;

  // Related News
  const relatedContainer = document.getElementById('related-news');
  if (relatedContainer) {
    const related = await fetchNews({ category: article.category, limit: 3 });
    const filteredRelated = related.filter(n => (n.slug || n.id) !== slug);
    if (filteredRelated.length) {
      relatedContainer.innerHTML = filteredRelated.map(createNewsCard).join('');
    } else {
      relatedContainer.innerHTML = '<p>No related news found.</p>';
    }
  }

  const latestSidebar = document.getElementById('latest-sidebar');
  if (latestSidebar) {
    const latestNews = await fetchNews({ limit: 5 });
    latestSidebar.innerHTML = latestNews.length
      ? latestNews.map(createLatestNewsItem).join('')
      : '<p class="sidebar-empty">No published news yet.</p>';
  }

  setupShareButtons();
};

const initCategory = async () => {
  const category = getUrlParam('cat');
  const region = getUrlParam('region');
  const regionNames = {
    'north-africa': 'North Africa',
    'south-africa': 'South Africa',
    'east-africa': 'East Africa',
    'west-africa': 'West Africa'
  };
  const categoryName = category
    ? category.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    : 'News';
  const pageTitle = regionNames[region] || categoryName;
  const catTitle = document.getElementById('category-title');
  const isProductCategory = category?.toLowerCase() === 'product' || category?.toLowerCase() === 'products';
  if (catTitle) catTitle.textContent = isProductCategory ? pageTitle : /news$/i.test(pageTitle) ? pageTitle : `${pageTitle} News`;
  const breadcrumb = document.getElementById('category-breadcrumb');
  if (breadcrumb) breadcrumb.textContent = pageTitle;
  const regionLinks = document.getElementById('region-links');
  if (regionLinks && category?.toLowerCase() === 'africa') regionLinks.hidden = false;

  const container = document.getElementById('category-news');
  const productsSection = document.getElementById('products-section');
  const productsGrid = document.getElementById('products-grid');
  const productsContact = document.getElementById('products-contact');
  showLoader('category-news');

  // Check if it's the products category
  if (category?.toLowerCase() === 'product' || category?.toLowerCase() === 'products') {
    // Hide news container, show products section
    if (container) container.style.display = 'none';
    if (productsSection) productsSection.hidden = false;
    if (productsGrid) {
      productsGrid.innerHTML = products.map(createProductCard).join('');
      // Add click handlers for product inquiry buttons
      productsGrid.querySelectorAll('.btn-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const productName = e.target.dataset.productName;
          const phone1 = '+231777649986';
          const phone2 = '+17729402871';
          const message = `Hello, I'm interested in purchasing the "${productName}" from The African Diplomat merchandise. Please provide more details and pricing.`;
          const whatsappUrl = `https://wa.me/${phone1}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        });
      });
      // Add gallery dot navigation
      productsGrid.querySelectorAll('.gallery-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          const dotEl = e.currentTarget;
          const index = dotEl.dataset.index;
          const gallery = dotEl.closest('.product-gallery');
          if (!gallery) return;
          const wrappers = gallery.querySelectorAll('.gallery-image-wrapper');
          const dots = gallery.querySelectorAll('.gallery-dot');
          wrappers.forEach(w => w.classList.remove('active'));
          dots.forEach(d => d.classList.remove('active'));
          if (wrappers[index]) wrappers[index].classList.add('active');
          dotEl.classList.add('active');
        });
      });
    }
    // Add contact section
    if (productsContact) {
      productsContact.innerHTML = `
        <div class="products-contact-card">
          <h3><i class="fas fa-phone-alt"></i> Ready to Purchase?</h3>
          <p>These premium merchandise items make perfect gifts or additions to your personal collection. Each product is crafted with quality materials and features our distinctive branding.</p>
          <div class="contact-phones">
            <a href="https://wa.me/231777649986" target="_blank" class="contact-phone">
              <i class="fab fa-whatsapp"></i>
              <span>+231 77 764 9986</span>
            </a>
            <a href="https://wa.me/17729402871" target="_blank" class="contact-phone">
              <i class="fab fa-whatsapp"></i>
              <span>+1 (772) 940-2871</span>
            </a>
          </div>
          <p class="contact-note">Contact us via WhatsApp for pricing, availability, and shipping information!</p>
        </div>
      `;
    }
    const sidebar = document.getElementById('latest-sidebar');
    if (sidebar) {
      const latestNews = await fetchNews({ limit: 5 });
      sidebar.innerHTML = latestNews.length
        ? latestNews.map(createLatestNewsItem).join('')
        : '<p class="sidebar-empty">No published news yet.</p>';
    }
    return;
  }

  const news = await fetchNews({ category, ...(region ? { region } : {}), limit: 1000 });
  if (news.length) {
    container.innerHTML = news.map(createNewsCard).join('');
  } else {
    container.innerHTML = `<p class="empty-category">No published news found in ${pageTitle} yet.</p>`;
  }
  const sidebar = document.getElementById('latest-sidebar');
  if (sidebar) {
    const latestNews = await fetchNews({ limit: 5 });
    sidebar.innerHTML = latestNews.length
      ? latestNews.map(createLatestNewsItem).join('')
      : '<p class="sidebar-empty">No published news yet.</p>';
  }
};

const initSearch = async () => {
  const query = getUrlParam('q');
  const searchTitle = document.getElementById('search-title');
  if (searchTitle && query) searchTitle.textContent = `Search Results for "${query}"`;

  const container = document.getElementById('search-results');
  showLoader('search-results');

  const news = await fetchNews({ search: query });
  if (news.length) {
    container.innerHTML = news.map(createNewsCard).join('');
  } else {
    container.innerHTML = '<p>No results found. Try a different keyword.</p>';
  }
  const sidebar = document.getElementById('latest-sidebar');
  if (sidebar) {
    const latestNews = await fetchNews({ limit: 5 });
    sidebar.innerHTML = latestNews.length
      ? latestNews.map(createLatestNewsItem).join('')
      : '<p class="sidebar-empty">No published news yet.</p>';
  }
};

const initOpportunities = async () => {
  const container = document.getElementById('opportunities-grid');
  const tabs = Array.from(document.querySelectorAll('.filter-tab'));
  const heading = document.querySelector('.opportunities-title');
  const requestedType = getUrlParam('type');
  const initialTab = tabs.find(tab =>
    tab.dataset.type.toLowerCase() === requestedType?.toLowerCase()
  )
    || tabs.find(tab => tab.dataset.type === 'all');
  const initialType = initialTab?.dataset.type || 'all';

  const loadOpportunities = async (type) => {
    const selectedTab = tabs.find(tab => tab.dataset.type === type);
    const title = selectedTab?.textContent.trim() || 'Courses & Workshops';
    if (heading) heading.textContent = title;
    document.title = `${title} - The African Diplomat`;
    showLoader('opportunities-grid');
    try {
      const opportunities = await fetchOpportunities({
        ...(type !== 'all' ? { type } : {}),
        limit: 1000
      });
      container.innerHTML = opportunities.length
        ? opportunities.map(createOpportunityCard).join('')
        : `<p>No published ${title.toLowerCase()} available yet.</p>`;
    } catch (error) {
      console.error('Error loading public services:', error);
      container.innerHTML = '<p class="error-msg">Services could not be loaded. Check that the news site server is running, then refresh.</p>';
    }
  };

  tabs.forEach(tab => tab.classList.toggle('active', tab === initialTab));
  await loadOpportunities(initialType);

  tabs.forEach(tab => {
    tab.addEventListener('click', async (event) => {
      const selectedTab = event.currentTarget;
      const type = selectedTab.dataset.type || 'all';
      tabs.forEach(item => item.classList.toggle('active', item === selectedTab));
      await loadOpportunities(type);
    });
  });
};

const initOpportunityDetail = async () => {
  const slug = getUrlParam('slug');
  if (!slug) return (window.location.href = 'opportunities.html');

  const container = document.getElementById('opportunity-container');
  showLoader('opportunity-container');

  const opp = await fetchOpportunity(slug);
  if (!opp) {
    showError('opportunity-container', 'Opportunity not found.');
    return;
  }

  document.title = `${opp.title} - Opportunities`;

  const pricingType = opp.pricingType || (opp.isFree ? 'free' : 'special');
  const price = pricingType === 'free'
    ? 'Free'
    : `${formatUsd(opp.fees)}${pricingType === 'subscription' ? ' / 3 months' : ' one-time'}`;
  const paymentCancelled = getUrlParam('payment') === 'cancelled';
  container.innerHTML = `
    <img src="${opp.banner || 'https://via.placeholder.com/800x400'}" alt="${escapeAttr(opp.title)}" class="article-image">
    <div class="article-header">
      <div class="opp-badges" style="margin-bottom: 15px;">
        <span class="badge badge-mode">${escapeAttr(opp.mode || 'Online')}</span>
        <span class="badge badge-fee">${price}</span>
      </div>
      ${paymentCancelled ? '<p role="status" style="margin-bottom: 16px;">Payment was cancelled. You can try again whenever you are ready.</p>' : ''}
      <h1 class="article-title">${escapeAttr(opp.title)}</h1>
      <div class="article-meta" style="flex-direction: column; gap: 5px; font-size: 16px;">
        <div><strong>Date:</strong> ${formatDate(opp.date || new Date())}</div>
        <div><strong>Time:</strong> ${escapeAttr(opp.time || 'TBA')}</div>
        <div><strong>Duration:</strong> ${escapeAttr(opp.duration || 'N/A')}</div>
        <div><strong>Location:</strong> ${escapeAttr(opp.location || 'Online')}</div>
      </div>
    </div>
    
    <div class="article-content" style="margin-bottom: 30px;">
      <h3>Description</h3>
      <p>${sanitizeHTML(opp.fullDetails || opp.shortDesc || 'No detailed description available.')}</p>
      
      <h3 style="margin-top: 20px;">Eligibility</h3>
      <p>${escapeAttr(opp.eligibility || 'Open to all')}</p>
    ${opp.curriculum && opp.curriculum.length ? `
      <div class="course-curriculum-overview" style="margin-top: 30px; margin-bottom: 30px; background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h3 style="font-size: 20px; color: var(--primary-color); margin-bottom: 15px;"><i class="fas fa-graduation-cap" style="color: var(--accent-color);"></i> Course Curriculum (${opp.curriculum.length} Modules)</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${opp.curriculum.map((topic, i) => `
            <div style="padding: 12px 16px; background: #f8fafc; border-radius: 6px; border-left: 3px solid var(--accent-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong>Module ${topic.order || (i + 1)}: ${escapeAttr(topic.title || '')}</strong>
                ${topic.summary ? `<p style="font-size: 13px; color: #64748b; margin-top: 4px;">${sanitizeHTML(topic.summary)}</p>` : ''}
              </div>
              <span style="font-size: 12px; color: #64748b; background: #e2e8f0; padding: 3px 8px; border-radius: 10px;"><i class="fas fa-lock"></i> Enrolled Only</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center; margin-top: 25px;">
      <button id="btn-open-register" class="btn btn-primary" style="font-size: 17px; padding: 14px 28px;">${pricingType === 'free' ? 'Register for Free' : pricingType === 'subscription' ? `Subscribe - ${price}` : `Pay ${price} & Register`}</button>
      <a href="classroom.html?id=${encodeURIComponent(opp._id || slug)}" class="btn btn-outline" style="font-size: 16px; padding: 13px 22px; display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-user-graduate"></i> Enrolled? Access Classroom &rarr;</a>
    </div>
  `;

  // Setup modal
  const modal = document.getElementById('register-modal');
  const openBtn = document.getElementById('btn-open-register');
  const closeBtn = document.querySelector('.close-modal');
  const form = document.getElementById('register-form');
  const oppIdInput = document.getElementById('opp-id');
  
  if (oppIdInput) oppIdInput.value = opp.id || slug;

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      const pmContainer = document.getElementById('payment-methods-container');
      if (pmContainer) {
        pmContainer.style.display = pricingType === 'free' ? 'none' : 'block';
      }
      bindPaymentMethodToggles(form);
      modal.classList.add('active');
    });
  }
  
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (form) {
    bindPaymentMethodToggles(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'stripe';

      // Check Mobile Money (Orange or Lonestar)
      if (pricingType !== 'free' && (paymentMethod === 'orange' || paymentMethod === 'lonestar')) {
        const container = paymentMethod === 'orange'
          ? form.querySelector('#orange-details')
          : form.querySelector('#lonestar-details');
        const fileInput = container ? container.querySelector('input[name="paymentProof"]') : null;
        const file = fileInput && fileInput.files && fileInput.files[0];

        if (!file) {
          alert('Please upload a screenshot or receipt of your transaction before submitting.');
          return;
        }

        submitBtn.textContent = 'Uploading Proof & Submitting...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('name', form.elements.name.value);
        formData.append('email', form.elements.email.value);
        formData.append('phone', form.elements.phone.value);
        formData.append('opportunityId', form.elements.opportunityId.value || opp.id || slug);
        formData.append('paymentMethod', paymentMethod);
        formData.append('paymentProof', file);

        const txnRef = container ? container.querySelector('input[name="transactionReference"]')?.value : '';
        if (txnRef) formData.append('transactionReference', txnRef);

        try {
          await registerOpportunityWithProof(formData);
          const methodName = paymentMethod === 'orange' ? 'Orange Money' : 'Lonestar Cell MTN';
          const accInfo = paymentMethod === 'orange'
            ? 'Account Holder: <strong>Myean D Torgean</strong>'
            : 'Number: <strong>+231880601584</strong> (Owner: <strong>Myean D Torgbean</strong>)';

          form.innerHTML = `
            <div style="text-align: center; padding: 25px 15px;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 32px; border: 2px solid #a7f3d0;">
                <i class="fas fa-check-circle"></i>
              </div>
              <h3 style="color: #0f172a; margin-bottom: 12px; font-size: 20px;">Transaction Submitted for Verification</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Thank you, <strong>${form.elements.name.value}</strong>! Your payment screenshot for <strong>${methodName}</strong> has been uploaded successfully.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; text-align: left; font-size: 13px;">
                <p style="margin-bottom: 6px;"><strong>Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Pending Verification</span></p>
                <p style="margin-bottom: 6px;"><strong>Recipient:</strong> ${accInfo}</p>
                <p style="margin-bottom: 0; color: #64748b;">We will review your transaction screenshot and send you a confirmation email / SMS shortly.</p>
              </div>
              <button type="button" class="btn btn-primary" onclick="window.location.reload()" style="width: 100%;">Done</button>
            </div>
          `;
          return;
        } catch (err) {
          alert(err.message || 'Failed to submit payment proof. Please try again.');
          submitBtn.textContent = 'Submit Payment Proof for Verification';
          submitBtn.disabled = false;
          return;
        }
      }

      // Card or Free flow
      submitBtn.textContent = pricingType === 'free' ? 'Submitting...' : 'Redirecting to secure checkout...';
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          if (value.name && value.size > 0) {
            data[key] = value;
          }
        } else if (value !== '') {
          data[key] = value;
        }
      }

      try {
        if (pricingType === 'free') {
          await registerOpportunity(data);
          sessionStorage.setItem(`enrolled_${opp._id || slug}`, data.email);
          form.innerHTML = `
            <div style="text-align: center; padding: 25px 15px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 16px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 30px;">
                <i class="fas fa-check-circle"></i>
              </div>
              <h3 style="color: #0f172a; margin-bottom: 10px;">Free Registration Successful!</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                You now have full free access to this course and its teaching materials.
              </p>
              <div style="display: flex; gap: 10px; justify-content: center;">
                <a href="classroom.html?id=${encodeURIComponent(opp._id || slug)}" class="btn btn-primary" style="background: #0284c7;">
                  <i class="fas fa-graduation-cap"></i> Enter Classroom Now
                </a>
                <button type="button" class="btn btn-outline" onclick="window.location.reload()">Done</button>
              </div>
            </div>
          `;
        } else {
          const session = await createCheckoutSession(data);
          window.location.assign(session.url);
        }
      } catch (err) {
        alert(err.message || 'Failed to register. Please try again.');
        submitBtn.textContent = pricingType === 'free' ? 'Submit Registration' : pricingType === 'subscription' ? 'Continue to Subscription' : 'Continue to Payment';
        submitBtn.disabled = false;
      }
    });
  }
};

const initPaymentSuccess = async () => {
  const message = document.getElementById('payment-status-message');
  const sessionId = getUrlParam('session_id');
  if (!sessionId) {
    message.textContent = 'We could not find the payment session. Contact us if you were charged.';
    return;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/payments/status/${encodeURIComponent(sessionId)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to verify payment.');
      if (result.paymentStatus === 'paid') {
        message.textContent = 'Payment confirmed. Your registration is complete.';
        return;
      }
      if (result.paymentStatus === 'failed') {
        message.textContent = 'Payment was not completed. Please return to the service page to try again.';
        return;
      }
    } catch (error) {
      message.textContent = error.message || 'Unable to verify payment status.';
      return;
    }
    message.textContent = 'Payment received. Confirming your registration...';
    await new Promise(resolve => window.setTimeout(resolve, 1500));
  }
  message.textContent = 'Your payment is processing. Please refresh this page in a moment.';
};

const setupShareButtons = () => {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.title);

  document.querySelectorAll('.share-fb').forEach(btn => 
    btn.addEventListener('click', () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank'))
  );
  
  document.querySelectorAll('.share-tw').forEach(btn => 
    btn.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank'))
  );
  
  document.querySelectorAll('.share-wa').forEach(btn => 
    btn.addEventListener('click', () => window.open(`https://api.whatsapp.com/send?text=${title} ${url}`, '_blank'))
  );
  
  document.querySelectorAll('.share-in').forEach(btn => 
    btn.addEventListener('click', () => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`, '_blank'))
  );
  
  document.querySelectorAll('.share-link').forEach(btn => 
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    })
  );
};

const setupResponsiveNavigation = () => {
  const navbar = document.querySelector('.navbar');
  const navLinks = navbar?.querySelector('.nav-links');
  if (!navbar || !navLinks) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'navbar-toggle';
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'site-navigation');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  navLinks.id = 'site-navigation';
  navbar.insertBefore(toggle, navLinks);

  const setMenuOpen = (isOpen) => {
    navbar.classList.toggle('nav-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu',
    );
  };

  toggle.addEventListener('click', () => {
    setMenuOpen(!navbar.classList.contains('nav-open'));
  });
  navLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
};

// Search handling setup (global)
document.addEventListener('DOMContentLoaded', () => {
  setupResponsiveNavigation();
  const todayDate = document.getElementById('today-date');
  if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchForm.querySelector('input').value;
      if (query.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(query.trim())}`;
      }
    });
  }

  // Routing based on page
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path.endsWith('/')) initHome();
  else if (path.endsWith('article.html')) initArticle();
  else if (path.endsWith('category.html')) initCategory();
  else if (path.endsWith('search.html')) initSearch();
  else if (path.endsWith('opportunities.html')) initOpportunities();
  else if (path.endsWith('opportunity-detail.html')) initOpportunityDetail();
  else if (path.endsWith('payment-success.html')) initPaymentSuccess();
});

// Quick Pay logic for index.html (Subscribe / Support)
document.addEventListener('click', async (e) => {
  const quickPayBtn = e.target.closest('[data-quick-pay]');
  if (!quickPayBtn) return;
  e.preventDefault();
  
  const slug = quickPayBtn.getAttribute('data-quick-pay');
  const modal = document.getElementById('register-modal');
  const form = document.getElementById('register-form');
  const titleEl = document.getElementById('register-modal-title');
  const oppIdInput = document.getElementById('opp-id');
  
  if (!modal || !form) return;
  
  try {
    const res = await fetch(`${API_BASE}/opportunities/${slug}`);
    if (!res.ok) throw new Error('Opportunity not found');
    const opp = await res.json();
    
    titleEl.textContent = opp.title;
    oppIdInput.value = opp._id;
    bindPaymentMethodToggles(form);
    modal.classList.add('active');
  } catch (err) {
    alert('Unable to load payment details. Please try again later.');
    console.error(err);
  }
});

const quickPayForm = document.getElementById('register-form');
if (quickPayForm && document.getElementById('register-modal-title')) {
  bindPaymentMethodToggles(quickPayForm);

  quickPayForm.addEventListener('submit', async (e) => {
    // Only intercept if we are on a page where this wasn't already handled 
    // opportunity-detail.html handles its own form submit.
    if (window.location.pathname.includes('opportunity-detail')) return;
    
    e.preventDefault();
    const submitBtn = quickPayForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const paymentMethod = quickPayForm.querySelector('input[name="paymentMethod"]:checked')?.value || 'stripe';

    // Mobile Money flow (Orange or Lonestar)
    if (paymentMethod === 'orange' || paymentMethod === 'lonestar') {
      const container = paymentMethod === 'orange'
        ? quickPayForm.querySelector('#orange-details')
        : quickPayForm.querySelector('#lonestar-details');
      const fileInput = container ? container.querySelector('input[name="paymentProof"]') : null;
      const file = fileInput && fileInput.files && fileInput.files[0];

      if (!file) {
        alert('Please upload a screenshot or receipt of your transaction before submitting.');
        return;
      }

      submitBtn.textContent = 'Uploading Proof & Submitting...';
      submitBtn.disabled = true;

      const formData = new FormData();
      formData.append('name', quickPayForm.elements.name.value);
      formData.append('email', quickPayForm.elements.email.value);
      formData.append('phone', quickPayForm.elements.phone.value);
      formData.append('opportunityId', quickPayForm.elements.opportunityId.value);
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentProof', file);

      const txnRef = container ? container.querySelector('input[name="transactionReference"]')?.value : '';
      if (txnRef) formData.append('transactionReference', txnRef);

      try {
        await registerOpportunityWithProof(formData);
        const methodName = paymentMethod === 'orange' ? 'Orange Money' : 'Lonestar Cell MTN';
        const accInfo = paymentMethod === 'orange'
          ? 'Account Holder: <strong>Myean D Torgean</strong>'
          : 'Number: <strong>+231880601584</strong> (Owner: <strong>Myean D Torgbean</strong>)';

        quickPayForm.innerHTML = `
          <div style="text-align: center; padding: 25px 15px;">
            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 32px; border: 2px solid #a7f3d0;">
              <i class="fas fa-check-circle"></i>
            </div>
            <h3 style="color: #0f172a; margin-bottom: 12px; font-size: 20px;">Transaction Submitted for Verification</h3>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              Thank you, <strong>${quickPayForm.elements.name.value}</strong>! Your payment screenshot for <strong>${methodName}</strong> has been uploaded successfully.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; text-align: left; font-size: 13px;">
              <p style="margin-bottom: 6px;"><strong>Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Pending Verification</span></p>
              <p style="margin-bottom: 6px;"><strong>Recipient:</strong> ${accInfo}</p>
              <p style="margin-bottom: 0; color: #64748b;">Our administrator will verify your transaction screenshot and send you a confirmation email / SMS shortly.</p>
            </div>
            <button type="button" class="btn btn-primary" onclick="window.location.reload()" style="width: 100%;">Done</button>
          </div>
        `;
        return;
      } catch (err) {
        alert(err.message || 'Failed to submit payment proof. Please try again.');
        submitBtn.textContent = 'Submit Payment Proof for Verification';
        submitBtn.disabled = false;
        return;
      }
    }

    // Card (Stripe) flow
    submitBtn.textContent = 'Redirecting to secure checkout...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(quickPayForm);
      const data = Object.fromEntries(formData.entries());

      const session = await createCheckoutSession(data);
      if (session && session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      alert(error.message || 'Payment initiation failed. Please try again.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  const modal = document.getElementById('register-modal');
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}
