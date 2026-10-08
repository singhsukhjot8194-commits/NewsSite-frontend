// js/admin.js
// CONFIGURATION: Set this to your Render backend URL when deploying!
const PRODUCTION_BACKEND_URL = 'https://newssite-backend.onrender.com';

const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const localApiOrigin = `${window.location.protocol}//${window.location.hostname}:5000`;
const API_URL = window.location.protocol === "file:"
  ? "http://localhost:5000/api"
  : isLocalFrontend
    ? `${localApiOrigin}/api`
    : `${PRODUCTION_BACKEND_URL}/api`;

// Auth Guard
function checkAuth() {
  const token = localStorage.getItem("adminToken");
  const isLoginPage = window.location.pathname.includes("login.html");

  if (!token && !isLoginPage) {
    window.location.href = "login.html";
  } else if (token && isLoginPage) {
    window.location.href = "dashboard.html";
  }
  return token;
}

function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "login.html";
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  };
}

// Toast Notifications
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Common Modal Logic
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("active");
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("active");
}

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.target.closest(".modal").classList.remove("active");
  });
});

// Generic Fetch Wrapper
async function fetchAPI(endpoint, options = {}) {
  try {
    const headers = { ...getAuthHeaders() };
    if (!(options.body instanceof FormData) && options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (response.status === 401) {
      logout();
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "API Error");
      return data;
    } else if (!response.ok) {
      throw new Error("API Error");
    }

    return response; // Blob etc.
  } catch (error) {
    showToast(error.message, "error");
    throw error;
  }
}

// Initialize active sidebar link and generic events
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  const currentPath = window.location.pathname.split("/").pop();
  const sidebar = document.querySelector(".sidebar");
  const sidebarHeader = sidebar?.querySelector(".sidebar-header");
  const sidebarNav = sidebar?.querySelector(".sidebar-nav");
  if (sidebar && sidebarHeader && sidebarNav) {
    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "sidebar-toggle";
    menuButton.setAttribute("aria-label", "Open admin navigation");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", "admin-navigation");
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    sidebarNav.id = "admin-navigation";
    sidebarHeader.appendChild(menuButton);

    menuButton.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close admin navigation" : "Open admin navigation",
      );
    });
    sidebarNav.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      sidebar.classList.remove("menu-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open admin navigation");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      sidebar.classList.remove("menu-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open admin navigation");
    });
  }

  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn)
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });

  // Page specific initialization
  if (currentPath === "login.html") initLogin();
  if (currentPath === "dashboard.html") initDashboard();
  if (currentPath === "news.html") initNews();
  if (currentPath === "opportunities.html") initOpportunities();
  if (currentPath === "registrations.html") initRegistrations();
});

// ---- Page Specific Logic ----

// Login
function initLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("adminToken", data.token);
      window.location.href = "dashboard.html";
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

// Dashboard
async function initDashboard() {
  try {
    const data = await fetchAPI("/dashboard");
    if (!data) return;
    const stats = data.stats || data;

    document.getElementById("totalNews").textContent = stats.totalNews || 0;
    document.getElementById("publishedNews").textContent =
      stats.publishedNews || 0;
    document.getElementById("draftNews").textContent = stats.draftNews || 0;

    document.getElementById("totalOpportunities").textContent =
      stats.totalOpportunities || 0;
    document.getElementById("totalEvents").textContent = stats.totalEvents || 0;
    document.getElementById("upcomingOpportunities").textContent =
      stats.upcomingOpportunities || 0;
    document.getElementById("totalRegistrations").textContent =
      stats.totalRegistrations || 0;
  } catch (e) {
    console.error(e);
  }
}

// News
let currentEditingId = null;

function syncNewsRegionField() {
  const form = document.getElementById("newsForm");
  const regionGroup = document.getElementById("newsRegionGroup");
  if (!form || !regionGroup) return;
  const isAfrica = form.elements.category.value === "Africa";
  regionGroup.hidden = !isAfrica;
  form.elements.region.required = isAfrica;
  if (!isAfrica) form.elements.region.value = "";
}

async function initNews() {
  const form = document.getElementById("newsForm");
  const newsImageInput = form.querySelector('input[name="image"]');
  const newsVideoInput = form.querySelector('input[name="video"]');
  const imageEditor = document.getElementById("newsImageEditor");
  const imageToCrop = document.getElementById("newsImageToCrop");
  const imageRatio = document.getElementById("newsImageRatio");
  const cropPreview = document.getElementById("newsImageCropPreview");
  const currentImagePanel = document.getElementById("currentNewsImage");
  const currentImage = document.getElementById("currentNewsImagePreview");
  const currentVideoPanel = document.getElementById("currentNewsVideo");
  const currentVideo = document.getElementById("currentNewsVideoPreview");
  let imageCropper = null;
  let imageObjectUrl = null;

  const clearImageEditor = (clearFile = false) => {
    if (imageCropper) {
      imageCropper.destroy();
      imageCropper = null;
    }
    if (imageObjectUrl) {
      URL.revokeObjectURL(imageObjectUrl);
      imageObjectUrl = null;
    }
    imageToCrop.removeAttribute("src");
    currentImage.removeAttribute("src");
    cropPreview.innerHTML = "";
    cropPreview.style.aspectRatio = "16 / 9";
    imageEditor.hidden = true;
    currentImagePanel.hidden = true;
    imageRatio.value = "16:9";
    if (clearFile) {
      newsImageInput.value = "";
      newsVideoInput.value = "";
      currentVideo.pause();
      currentVideo.removeAttribute("src");
      currentVideo.load();
      currentVideoPanel.hidden = true;
    }
  };

  const getSelectedAspectRatio = () => {
    if (imageRatio.value === "free") return NaN;
    const [width, height] = imageRatio.value.split(":").map(Number);
    return width / height;
  };

  newsImageInput.addEventListener("change", () => {
    const file = newsImageInput.files[0];
    if (!file) {
      clearImageEditor();
      return;
    }
    if (!window.Cropper) {
      showToast(
        "The image crop tool could not load. Check your connection and try again.",
        "error",
      );
      clearImageEditor(true);
      return;
    }

    clearImageEditor();
    imageEditor.hidden = false;
    imageObjectUrl = URL.createObjectURL(file);
    const selectedImageUrl = imageObjectUrl;
    imageToCrop.onload = () => {
      if (imageToCrop.src !== selectedImageUrl) return;
      imageCropper = new Cropper(imageToCrop, {
        aspectRatio: getSelectedAspectRatio(),
        autoCropArea: 0.9,
        background: false,
        preview: "#newsImageCropPreview",
        responsive: true,
        viewMode: 1,
      });
    };
    imageToCrop.onerror = () => {
      showToast("This image could not be opened.", "error");
      clearImageEditor(true);
    };
    imageToCrop.src = selectedImageUrl;
  });

  imageRatio.addEventListener("change", () => {
    if (!imageCropper) return;
    imageCropper.setAspectRatio(getSelectedAspectRatio());
    cropPreview.style.aspectRatio =
      imageRatio.value === "free"
        ? "16 / 9"
        : imageRatio.value.replace(":", " / ");
  });

  document.getElementById("zoomImageOut").addEventListener("click", () => {
    if (imageCropper) imageCropper.zoom(-0.1);
  });
  document.getElementById("zoomImageIn").addEventListener("click", () => {
    if (imageCropper) imageCropper.zoom(0.1);
  });
  document.getElementById("resetImageCrop").addEventListener("click", () => {
    if (imageCropper) imageCropper.reset();
  });
  document.querySelectorAll("#newsModal .close-modal").forEach((button) => {
    button.addEventListener("click", () => clearImageEditor(true));
  });

  await loadNews();
  form.elements.category.addEventListener("change", syncNewsRegionField);
  syncNewsRegionField();

  document.getElementById("addNewsBtn").addEventListener("click", () => {
    currentEditingId = null;
    clearImageEditor(true);
    form.reset();
    form.status.value = "published";
    syncNewsRegionField();
    document.getElementById("modalTitle").textContent = "Add News";
    openModal("newsModal");
  });

  document.getElementById("newsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append(
      "isBreaking",
      document.getElementById("isBreaking").checked,
    );
    formData.append(
      "isFeatured",
      document.getElementById("isFeatured").checked,
    );

    const imageFile = newsImageInput.files[0];
    if (imageFile) {
      if (!imageCropper) {
        showToast(
          "Wait for the image crop preview to finish loading.",
          "error",
        );
        return;
      }
      const mimeType = ["image/png", "image/webp"].includes(imageFile.type)
        ? imageFile.type
        : "image/jpeg";
      const extension =
        mimeType === "image/png"
          ? "png"
          : mimeType === "image/webp"
            ? "webp"
            : "jpg";
      const croppedBlob = await new Promise((resolve) => {
        imageCropper
          .getCroppedCanvas({ imageSmoothingQuality: "high" })
          .toBlob(resolve, mimeType, 0.92);
      });
      if (!croppedBlob) {
        showToast(
          "The image could not be cropped. Please try another image.",
          "error",
        );
        return;
      }
      formData.set("image", croppedBlob, `news-image.${extension}`);
    }

    try {
      let savedNews;
      if (currentEditingId) {
        savedNews = await fetchAPI(`/news/${currentEditingId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        savedNews = await fetchAPI("/news", { method: "POST", body: formData });
      }
      if (!savedNews) return;
      showToast(
        savedNews.status === "draft"
          ? "News saved as draft. Publish it to show it on the main page."
          : currentEditingId
            ? "News updated and published successfully"
            : "News added and published successfully",
      );
      clearImageEditor(true);
      closeModal("newsModal");
      await loadNews();
    } catch (e) {}
  });
}

async function loadNews() {
  const tbody = document.getElementById("newsTableBody");
  if (!tbody) return;

  try {
    const data = await fetchAPI("/news/admin?limit=1000");
    if (!data) return;
    tbody.innerHTML = "";
    const newsItems = Array.isArray(data) ? data : data.news || [];
    newsItems.forEach((item) => {
      const tr = document.createElement("tr");
      const title = document.createElement("td");
      title.textContent = item.title;
      tr.appendChild(title);

      const category = document.createElement("td");
      category.textContent = item.category;
      tr.appendChild(category);

      const region = document.createElement("td");
      region.textContent = item.region
        ? item.region.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
        : "—";
      tr.appendChild(region);

      const statusCell = document.createElement("td");
      const statusBadge = document.createElement("span");
      statusBadge.className = `badge ${item.status}`;
      statusBadge.textContent = item.status;
      statusCell.appendChild(statusBadge);
      tr.appendChild(statusCell);

      const date = document.createElement("td");
      date.textContent = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString()
        : "";
      tr.appendChild(date);

      const actions = document.createElement("td");
      actions.className = "action-btns";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-sm btn-primary";
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.setAttribute("aria-label", "Edit news");
      editButton.addEventListener("click", () => window.editNews(item));
      actions.appendChild(editButton);

      const publishButton = document.createElement("button");
      publishButton.type = "button";
      publishButton.className = `btn btn-sm ${item.status === "published" ? "btn-outline" : "btn-primary"}`;
      publishButton.textContent =
        item.status === "published" ? "Unpublish" : "Publish";
      publishButton.setAttribute(
        "aria-label",
        item.status === "published" ? "Unpublish news" : "Publish news",
      );
      publishButton.addEventListener("click", () =>
        window.toggleNewsStatus(item._id, item.status),
      );
      actions.appendChild(publishButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-sm btn-danger";
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.setAttribute("aria-label", "Delete news");
      deleteButton.addEventListener("click", () => window.deleteNews(item._id));
      actions.appendChild(deleteButton);

      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
  } catch (e) {}
}

window.editNews = function (item) {
  currentEditingId = item._id;
  document.getElementById("modalTitle").textContent = "Edit News";
  const form = document.getElementById("newsForm");
  form.reset();
  form.title.value = item.title;
  form.category.value = item.category;
  syncNewsRegionField();
  form.elements.region.value = item.region || "";
  form.content.value = item.content;
  form.tags.value = item.tags ? item.tags.join(", ") : "";
  form.status.value = item.status;
  form.seoTitle.value = item.seoTitle || "";
  form.seoDesc.value = item.seoDesc || "";
  form.isBreaking.checked = item.isBreaking;
  form.isFeatured.checked = item.isFeatured;
  const currentImagePanel = document.getElementById("currentNewsImage");
  const currentImage = document.getElementById("currentNewsImagePreview");
  const currentVideoPanel = document.getElementById("currentNewsVideo");
  const currentVideo = document.getElementById("currentNewsVideoPreview");
  if (item.image) {
    currentImage.src = new URL(item.image, `${API_URL}/`).href;
    currentImagePanel.hidden = false;
  } else {
    currentImage.removeAttribute("src");
    currentImagePanel.hidden = true;
  }
  if (item.video) {
    currentVideo.src = new URL(item.video, `${API_URL}/`).href;
    currentVideo.load();
    currentVideoPanel.hidden = false;
  } else {
    currentVideo.pause();
    currentVideo.removeAttribute("src");
    currentVideo.load();
    currentVideoPanel.hidden = true;
  }
  openModal("newsModal");
};

window.toggleNewsStatus = async function (id, currentStatus) {
  const nextStatus = currentStatus === "published" ? "draft" : "published";
  const formData = new FormData();
  formData.append("status", nextStatus);

  try {
    const updatedNews = await fetchAPI(`/news/${id}`, {
      method: "PUT",
      body: formData,
    });
    if (!updatedNews) return;
    showToast(
      nextStatus === "published"
        ? "News published. Refresh the main page to see it."
        : "News moved to drafts and hidden from the main page.",
    );
    await loadNews();
  } catch (e) {}
};

window.deleteNews = async function (id) {
  if (confirm("Are you sure you want to delete this news?")) {
    try {
      await fetchAPI(`/news/${id}`, { method: "DELETE" });
      showToast("News deleted");
      loadNews();
    } catch (e) {}
  }
};

// Opportunities
async function initOpportunities() {
  const form = document.getElementById("oppForm");
  const pricingTypeInput = document.getElementById("pricingType");
  const priceInput = document.getElementById("servicePrice");
  const priceGroup = document.getElementById("servicePriceGroup");
  const priceLabel = document.getElementById("servicePriceLabel");
  const syncPriceInput = () => {
    const isFree = pricingTypeInput.value === "free";
    priceGroup.hidden = isFree;
    priceInput.disabled = isFree;
    priceInput.required = !isFree;
    priceLabel.textContent = pricingTypeInput.value === "subscription"
      ? "Subscription price (USD per 3 months)"
      : "Special price (USD, one-time)";
    if (isFree) priceInput.value = "0";
    else if (priceInput.value === "0") priceInput.value = "";
  };
  pricingTypeInput.addEventListener("change", syncPriceInput);

  await loadOpportunities();

  document.getElementById("addOppBtn").addEventListener("click", () => {
    currentEditingId = null;
    form.reset();
    pricingTypeInput.value = "free";
    document.getElementById("oppIsPublished").checked = true;
    syncPriceInput();
    document.getElementById("modalTitle").textContent = "Add Opportunity";
    openModal("oppModal");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (pricingTypeInput.value !== "free" && Number(priceInput.value) < 0.5) {
      showToast("Paid service prices must be between USD 0.50 and USD 999,999.99.", "error");
      priceInput.focus();
      return;
    }
    const formData = new FormData(e.target);
    formData.append(
      "isFeatured",
      document.getElementById("isFeatured").checked,
    );
    formData.append("isFree", pricingTypeInput.value === "free");
    formData.append(
      "isPublished",
      document.getElementById("oppIsPublished").checked,
    );

    try {
      if (currentEditingId) {
        await fetchAPI(`/opportunities/${currentEditingId}`, {
          method: "PUT",
          body: formData,
        });
        showToast("Opportunity updated successfully");
      } else {
        await fetchAPI("/opportunities", { method: "POST", body: formData });
        showToast("Opportunity added successfully");
      }
      closeModal("oppModal");
      loadOpportunities();
    } catch (e) {}
  });
}

async function loadOpportunities() {
  const tbody = document.getElementById("oppTableBody");
  if (!tbody) return;

  try {
    const data = await fetchAPI("/opportunities/admin?limit=1000");
    if (!data) return;
    tbody.innerHTML = "";
    const opportunities = Array.isArray(data)
      ? data
      : data.opportunities || [];
    opportunities.forEach((item) => {
      const tr = document.createElement("tr");
      const pricingType = item.pricingType || (item.isFree ? "free" : "special");
      const price = pricingType === "free"
        ? "Free"
        : new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(Number(item.fees))
            + (pricingType === "subscription" ? " / 3 months" : " (one-time)");
      tr.innerHTML = `
                <td>${item.title}</td>
                <td>${item.type}</td>
                <td>${price}</td>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td><span class="badge ${item.status}">${item.status}</span></td>
            `;
      const visibilityCell = document.createElement("td");
      const visibilityButton = document.createElement("button");
      visibilityButton.type = "button";
      visibilityButton.className = `btn btn-sm ${item.isPublished ? "btn-outline" : "btn-primary"}`;
      visibilityButton.textContent = item.isPublished ? "Published" : "Unpublished";
      visibilityButton.setAttribute(
        "aria-label",
        item.isPublished ? `Unpublish ${item.title}` : `Publish ${item.title}`,
      );
      visibilityButton.addEventListener("click", () =>
        window.toggleOpportunityPublication(item._id, item.isPublished),
      );
      visibilityCell.appendChild(visibilityButton);
      tr.appendChild(visibilityCell);

      const actionsCell = document.createElement("td");
      actionsCell.className = "action-btns";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-sm btn-primary";
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.setAttribute("aria-label", `Edit ${item.title}`);
      editButton.addEventListener("click", () => window.editOpp(item));
      actionsCell.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-sm btn-danger";
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.setAttribute("aria-label", `Delete ${item.title}`);
      deleteButton.addEventListener("click", () => window.deleteOpp(item._id));
      actionsCell.appendChild(deleteButton);
      tr.appendChild(actionsCell);
      tbody.appendChild(tr);
    });
  } catch (e) {}
}

window.editOpp = function (item) {
  currentEditingId = item._id;
  document.getElementById("modalTitle").textContent = "Edit Opportunity";
  const form = document.getElementById("oppForm");
  // populate fields...
  Object.keys(item).forEach((key) => {
    if (
      form[key] &&
      form[key].type !== "file" &&
      form[key].type !== "checkbox"
    ) {
      if (key === "date" || key === "deadline") {
        form[key].value = item[key] ? item[key].split("T")[0] : "";
      } else {
        form[key].value = item[key];
      }
    }
  });
  form.isFeatured.checked = item.isFeatured;
  document.getElementById("pricingType").value = item.pricingType
    || (item.isFree ? "free" : "special");
  document.getElementById("oppIsPublished").checked = Boolean(item.isPublished);
  document.getElementById("servicePrice").value = item.fees ?? "";
  document.getElementById("pricingType").dispatchEvent(new Event("change"));
  openModal("oppModal");
};

window.toggleOpportunityPublication = async function (id, isPublished) {
  const nextIsPublished = !isPublished;
  try {
    const updatedOpportunity = await fetchAPI(`/opportunities/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isPublished: nextIsPublished }),
    });
    if (!updatedOpportunity) return;
    showToast(
      nextIsPublished
        ? "Service published on the website."
        : "Service unpublished and hidden from the website.",
    );
    await loadOpportunities();
  } catch (error) {
    // fetchAPI displays the server error in a toast.
  }
};

window.deleteOpp = async function (id) {
  if (confirm("Are you sure you want to delete this opportunity?")) {
    try {
      await fetchAPI(`/opportunities/${id}`, { method: "DELETE" });
      showToast("Opportunity deleted");
      loadOpportunities();
    } catch (e) {}
  }
};

// Registrations
let currentEditingRegistrationId = null;

async function initRegistrations() {
  const searchInput = document.getElementById("searchInput");
  const opportunityFilter = document.getElementById("opportunityFilter");
  const statusFilter = document.getElementById("statusFilter");
  await Promise.all([
    loadRegistrationOpportunities(),
    loadRegistrations(),
  ]);

  const registrationForm = document.getElementById("registrationForm");
  const opportunitySelect = document.getElementById("registrationOpportunity");
  document
    .getElementById("addRegistrationBtn")
    .addEventListener("click", () => {
      const hasOpportunities = Array.from(opportunitySelect.options).some(
      (option) => option.value,
      );
      if (!hasOpportunities) {
      showToast("Add an opportunity or event before creating a registration.", "error");
      return;
      }
      currentEditingRegistrationId = null;
      registrationForm.reset();
      document.getElementById("registrationModalTitle").textContent = "Add Registration";
      document.getElementById("saveRegistrationBtn").textContent = "Add Registration";
      openModal("registrationModal");
    });

  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registrationForm);
    const registration = Object.fromEntries(formData.entries());

    try {
      const savedRegistration = await fetchAPI(
        currentEditingRegistrationId
          ? `/registrations/${currentEditingRegistrationId}`
          : "/registrations/admin",
        {
          method: currentEditingRegistrationId ? "PUT" : "POST",
          body: JSON.stringify(registration),
        },
      );
      if (!savedRegistration) return;
      showToast(
        currentEditingRegistrationId
          ? "Registration updated successfully"
          : "Registration added successfully",
      );
      closeModal("registrationModal");
      registrationForm.reset();
      currentEditingRegistrationId = null;
      await loadRegistrations();
    } catch (error) {
      // fetchAPI shows the server error in a toast.
    }
  });

  document.getElementById("exportExcelBtn").addEventListener("click", () =>
    exportRegistrations("xlsx"),
  );
  document.getElementById("exportCsvBtn").addEventListener("click", () =>
    exportRegistrations("csv"),
  );

  searchInput.addEventListener("input", () => {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(
      () => loadRegistrations(),
      500,
    );
  });
  opportunityFilter.addEventListener("change", () => loadRegistrations());
  statusFilter.addEventListener("change", () => loadRegistrations());
}

async function loadRegistrationOpportunities() {
  const opportunityFilter = document.getElementById("opportunityFilter");
  if (!opportunityFilter) return;

  try {
    const data = await fetchAPI("/opportunities?limit=1000");
    if (!data) return;
    const opportunities = Array.isArray(data)
      ? data
      : data.opportunities || [];
    const registrationSelect = document.getElementById("registrationOpportunity");
    registrationSelect.replaceChildren(
      new Option("Select an opportunity or event", ""),
    );
    opportunities.forEach((opportunity) => {
      const label = `${opportunity.title} (${opportunity.type})`;
      opportunityFilter.add(
        new Option(label, opportunity._id),
      );
      registrationSelect.add(new Option(label, opportunity._id));
    });
  } catch (error) {
    // fetchAPI displays request errors in a toast.
  }
}

async function exportRegistrations(format) {
  const params = getRegistrationFilters();
  params.set("format", format);

  try {
    const response = await fetchAPI(`/registrations/export?${params}`);
    if (!response) return;
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `registrations.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (error) {
    // fetchAPI displays request errors in a toast.
  }
}

function getRegistrationFilters() {
  const params = new URLSearchParams({ limit: "1000" });
  const search = document.getElementById("searchInput").value.trim();
  const opportunityId = document.getElementById("opportunityFilter").value;
  const status = document.getElementById("statusFilter").value;
  if (search) params.set("search", search);
  if (opportunityId) params.set("opportunityId", opportunityId);
  if (status) params.set("status", status);
  return params;
}

async function loadRegistrations() {
  const tbody = document.getElementById("regTableBody");
  if (!tbody) return;

  try {
    const data = await fetchAPI(`/registrations?${getRegistrationFilters()}`);
    if (!data) return;
    tbody.innerHTML = "";
    const registrations = data.registrations || data;

    registrations.forEach((item) => {
      const tr = document.createElement("tr");
      const date = item.registeredAt || item.createdAt;
      for (let index = 0; index < 8; index += 1) tr.insertCell();
      tr.cells[0].textContent = item.name;
      tr.cells[1].textContent = item.email;
      tr.cells[2].textContent = item.phone;
      tr.cells[3].textContent = item.opportunity
        ? `${item.opportunity.title} (${item.opportunity.type})`
        : "N/A";
      tr.cells[4].textContent = date
        ? new Date(date).toLocaleDateString()
        : "";

      const statusSelect = document.createElement("select");
      statusSelect.className = "form-control";
      statusSelect.style.width = "auto";
      statusSelect.style.padding = "0.25rem";
      statusSelect.setAttribute("aria-label", `Status for ${item.name}`);
      ["pending", "confirmed", "cancelled"].forEach((status) => {
        statusSelect.add(new Option(
          status.charAt(0).toUpperCase() + status.slice(1),
          status,
          false,
          item.status === status,
        ));
      });
      statusSelect.addEventListener("change", () =>
        window.updateRegStatus(item._id, statusSelect.value),
      );
      tr.cells[5].appendChild(statusSelect);
      tr.cells[6].textContent = item.paymentStatus === "paid"
        ? `Paid (${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(item.amountPaid || 0))})`
        : item.paymentStatus === "pending"
          ? "Payment pending"
          : item.paymentStatus === "failed"
            ? "Payment failed"
            : "Not required";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "btn btn-sm btn-primary";
      editButton.innerHTML = '<i class="fas fa-edit"></i>';
      editButton.setAttribute("aria-label", `Edit registration for ${item.name}`);
      editButton.addEventListener("click", () => editRegistration(item));
      tr.cells[7].appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-sm btn-danger";
      deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
      deleteButton.setAttribute("aria-label", `Delete registration for ${item.name}`);
      deleteButton.addEventListener("click", () =>
        window.deleteRegistration(item._id, item.name),
      );
      tr.cells[7].appendChild(deleteButton);
      tbody.appendChild(tr);
    });
    if (!registrations.length) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = "No registrations found.";
    }
  } catch (e) {}
}

window.updateRegStatus = async function (id, status) {
  try {
    const updatedRegistration = await fetchAPI(`/registrations/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (!updatedRegistration) return;
    showToast("Status updated");
    await loadRegistrations();
  } catch (e) {
    await loadRegistrations();
  }
};

function editRegistration(registration) {
  const form = document.getElementById("registrationForm");
  currentEditingRegistrationId = registration._id;
  form.elements.name.value = registration.name || "";
  form.elements.email.value = registration.email || "";
  form.elements.phone.value = registration.phone || "";
  form.elements.opportunityId.value = registration.opportunity?._id || "";
  form.elements.status.value = registration.status || "pending";
  document.getElementById("registrationModalTitle").textContent = "Edit Registration";
  document.getElementById("saveRegistrationBtn").textContent = "Save Changes";
  openModal("registrationModal");
}

window.deleteRegistration = async function (id, name) {
  if (!window.confirm(`Delete the registration for ${name}? This cannot be undone.`)) {
    return;
  }

  try {
    const result = await fetchAPI(`/registrations/${id}`, { method: "DELETE" });
    if (!result) return;
    showToast("Registration deleted");
    await loadRegistrations();
  } catch (error) {
    // fetchAPI displays request errors in a toast.
  }
};
