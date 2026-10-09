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
  const baseUrl = isLocalFrontend ? localApiOrigin : PRODUCTION_BACKEND_URL;
  return image.startsWith('/') ? `${baseUrl}${image}` : image;
};

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
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
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
    ? `${news.category || 'Africa'} · ${formatRegion(news.region)}`
    : news.category || 'News';
  return `
    <article class="card">
      <a href="article.html?slug=${news.slug || news.id}">
        <img src="${getNewsImageUrl(news.image)}" alt="${news.title}" class="card-img">
        <div class="card-content">
          <span class="card-category">${categoryLabel}</span>
          <h3 class="card-title">${news.title}</h3>
          <div class="card-meta">
            <span>${formatDate(news.date || news.createdAt || new Date())}</span>
            <span>${news.author || 'Admin'}</span>
          </div>
        </div>
      </a>
    </article>
  `;
};

const createLatestNewsItem = (news) => `
  <article class="latest-item">
    <a href="article.html?slug=${news.slug || news.id}">
      <img src="${getNewsImageUrl(news.image)}" alt="" class="latest-thumb">
      <span class="latest-item-copy">
        <strong>${news.title}</strong>
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
  const description = opp.shortDesc || opp.fullDetails || '';
  const opportunityId = opp._id || opp.id || opp.slug;

  return `
    <article class="card">
      <img src="${opp.banner || 'https://via.placeholder.com/400x200'}" alt="${opp.title}" class="card-img">
      <div class="card-content">
        <div class="opp-badges">
          <span class="badge badge-mode">${opp.type || 'Opportunity'}</span>
          <span class="badge badge-mode">${opp.status || 'upcoming'}</span>
          <span class="badge badge-mode">${opp.mode || 'Online'}</span>
          <span class="badge badge-fee">${fee}</span>
        </div>
        <h3 class="card-title">${opp.title}</h3>
        <p style="margin-bottom: 15px; font-size: 14px; color: var(--text-light)">${description}</p>
        <div class="card-meta" style="margin-bottom: 15px;">
          <span>📅 ${formatDate(opp.date || new Date())}</span>
        </div>
        <a href="opportunity-detail.html?slug=${opportunityId}" class="btn btn-primary" style="display: block; width: 100%;">${actionLabel}</a>
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
    ? `<img src="${getNewsImageUrl(article.image)}" alt="${article.title}" class="article-image">`
    : article.video
      ? ""
      : '<img src="https://via.placeholder.com/800x400" alt="" class="article-image">';
  const articleVideo = article.video
    ? `<video src="${getNewsImageUrl(article.video)}" class="article-video" controls preload="metadata">Your browser does not support video playback.</video>`
    : "";

  container.innerHTML = `
    <div class="article-header">
      <span class="card-category" style="font-size: 14px;">${article.category || 'News'}</span>
      <h1 class="article-title">${article.title}</h1>
      <div class="article-meta">
        <span>By ${article.author || 'Admin'}</span>
        <span>•</span>
        <span>${formatDate(article.date || article.createdAt || new Date())}</span>
      </div>
    </div>
    ${articleImage}
    ${articleVideo}
    <div class="article-content">
      ${article.content || '<p>Content goes here...</p>'}
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
  if (catTitle) catTitle.textContent = `${pageTitle} News`;
  const breadcrumb = document.getElementById('category-breadcrumb');
  if (breadcrumb) breadcrumb.textContent = pageTitle;
  const regionLinks = document.getElementById('region-links');
  if (regionLinks && category?.toLowerCase() === 'africa') regionLinks.hidden = false;

  const container = document.getElementById('category-news');
  showLoader('category-news');

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
    <img src="${opp.banner || 'https://via.placeholder.com/800x400'}" alt="${opp.title}" class="article-image">
    <div class="article-header">
      <div class="opp-badges" style="margin-bottom: 15px;">
        <span class="badge badge-mode">${opp.mode || 'Online'}</span>
        <span class="badge badge-fee">${price}</span>
      </div>
      ${paymentCancelled ? '<p role="status" style="margin-bottom: 16px;">Payment was cancelled. You can try again whenever you are ready.</p>' : ''}
      <h1 class="article-title">${opp.title}</h1>
      <div class="article-meta" style="flex-direction: column; gap: 5px; font-size: 16px;">
        <div><strong>Date:</strong> ${formatDate(opp.date || new Date())}</div>
        <div><strong>Time:</strong> ${opp.time || 'TBA'}</div>
        <div><strong>Duration:</strong> ${opp.duration || 'N/A'}</div>
        <div><strong>Location:</strong> ${opp.location || 'Online'}</div>
      </div>
    </div>
    
    <div class="article-content" style="margin-bottom: 30px;">
      <h3>Description</h3>
      <p>${opp.fullDetails || opp.shortDesc || 'No detailed description available.'}</p>
      
      <h3 style="margin-top: 20px;">Eligibility</h3>
      <p>${opp.eligibility || 'Open to all'}</p>
    </div>

    <button id="btn-open-register" class="btn btn-primary" style="font-size: 18px; padding: 15px 30px;">${pricingType === 'free' ? 'Register for Free' : pricingType === 'subscription' ? `Subscribe - ${price}` : `Pay ${price} & Register`}</button>
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
      modal.classList.add('active');
    });
  }
  
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = pricingType === 'free' ? 'Submitting...' : 'Redirecting to secure checkout...';
      submitBtn.disabled = true;

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (pricingType !== 'free' && (data.paymentMethod === 'lonestar' || data.paymentMethod === 'orange')) {
        alert('Mobile Money integration is coming soon! Please use Card for now.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }


      try {
        if (pricingType === 'free') {
          await registerOpportunity(data);
          form.innerHTML = '<div style="text-align: center; color: green;"><h3>Registration Successful!</h3><p>We will contact you shortly.</p></div>';
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
    modal.classList.add('active');
  } catch (err) {
    alert('Unable to load payment details. Please try again later.');
    console.error(err);
  }
});

const quickPayForm = document.getElementById('register-form');
if (quickPayForm && document.getElementById('register-modal-title')) {
  quickPayForm.addEventListener('submit', async (e) => {
    // Only intercept if we are on a page where this wasn't already handled 
    // opportunity-detail.html handles its own form submit.
    if (window.location.pathname.includes('opportunity-detail')) return;
    
    e.preventDefault();
    const submitBtn = quickPayForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Redirecting to secure checkout...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(quickPayForm);
      const data = Object.fromEntries(formData.entries());

      if (data.paymentMethod === 'lonestar' || data.paymentMethod === 'orange') {
        alert('Mobile Money integration is coming soon! Please use Card for now.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

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
