// ===== SUPABASE CONFIG =====
const { createClient } = supabase;
const SUPABASE_URL = "https://uxdihxlqkxgezezibdmv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZGloeGxxa3hnZXplemliZG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDQwOTYsImV4cCI6MjA3MTUyMDA5Nn0.qFlO2ROLHC5mx17LHa093w5Nyp-0W9eFhkvj74PpBLE";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Global variables
let products = [];
let filteredProducts = [];
let todayProductsForSlider = [];
let isAdminLoggedIn = false;
currentSlide = 0;
let selectedImageFile = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
   // Event ini dipicu ketika halaman selesai dimuat
    console.log('🚀 Initializing website...');
    showPage('beranda');     // Tampilkan halaman beranda
    loadProducts();          // Ambil produk dari Supabase
    updateAdminStats();      // Update statistik admin
    console.log('✅ Website initialized successfully!');
});

// ===== HELPER FUNCTIONS =====
function getCurrentDay() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
}

function isProductAvailableToday(product) {
    const today = getCurrentDay();
    return product.sale_days.toLowerCase().includes(today.toLowerCase());
}

function getCategoryName(category) {
    const categoryNames = {'makanan': 'Makanan', 'minuman': 'Minuman', 'kerajinan': 'Kerajinan'};
    return categoryNames[category] || category;
}

// ===== NAVIGATION =====
function showPage(pageName) {
    // Sembunyikan semua page
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Tampilkan page sesuai parameter
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update link navigasi aktif

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    navLinks.forEach(link => {
        if (link.textContent.toLowerCase().includes(getPageTitle(pageName))) {
            link.classList.add('active');
        }
    });
    
    // Tutup menu mobile jika terbuka
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.remove('active');
    
    // Kalau masuk ke admin -> update statistik
    if (pageName === 'admin') updateAdminStats();
}

function toggleNav() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.toggle('active');
}

function getPageTitle(pageName) {
    const titles = {
        'beranda': 'beranda',
        'produk': 'produk', 
        'tentang': 'tentang',
        'kontak': 'kontak',
        'admin': 'admin'
    };
    return titles[pageName] || pageName;
}

// ===== SLIDER =====
// Menyiapkan slider produk (khusus yang tersedia hari ini)
function setupTodayProductSlider() {
    todayProductsForSlider = products.filter(product => isProductAvailableToday(product));
    if (todayProductsForSlider.length === 0) {
        todayProductsForSlider = [...products];
    }
    generateSliderContent();
    startSlider();
}
// Generate isi slider + titik navigasi (dot) berdasarkan produk
function generateSliderContent() {
    const slider = document.getElementById('productSlider');
    const sliderDots = document.getElementById('sliderDots');
    
    if (!slider || !sliderDots) return;
    
    slider.innerHTML = '';
    sliderDots.innerHTML = '';
    
    if (todayProductsForSlider.length === 0) {
        slider.innerHTML = '<div class="slide active"><div class="slide-info"><h3>Belum ada produk tersedia</h3></div></div>';
        return;
    }
    
    todayProductsForSlider.forEach((product, index) => {
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="slide-image">
            <div class="slide-info">
                <h3>${product.name}</h3>
                <div class="product-price">${product.price}</div> 
            </div>
        `;
        slider.appendChild(slide);
        
        const dot = document.createElement('span');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => currentSlide(index + 1);
        sliderDots.appendChild(dot);
    });
}

function startSlider() {
    setInterval(nextSlide, 5000);
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide += direction;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    changeSlide(1);
}

function currentSlide(slideIndex) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlide = slideIndex - 1;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// ===== PRODUCTS =====
// Ambil data produk dari Supabase, simpan ke array, lalu tampilkan
async function loadProducts() {
    try {
        console.log('Loading products from Supabase...');
        const { data, error } = await db.from("products").select("*").order('created_at', { ascending: false });

        if (error) {
            console.error("❌ Failed to load products:", error);
            return;
        }

        console.log('✅ Products loaded:', data.length);
        products = data || [];
        filteredProducts = [...products];
        displayProducts(filteredProducts);
        setupTodayProductSlider();
        
    } catch (err) {
        console.error("❌ Error loading products:", err);
    }
}

// Render produk ke grid di halaman produk
function displayProducts(productList) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    if (productList.length === 0) {
        productGrid.innerHTML = '<p style="text-align: center; color: #a0aec0; grid-column: 1/-1;">Tidak ada produk yang ditemukan.</p>';
        return;
    }
    
    productList.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// Buat kartu produk (HTML) dengan informasi + tombol pesan
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const isAvailable = isProductAvailableToday(product);
    const statusClass = isAvailable ? 'status-available' : 'status-preorder';
    const statusText = isAvailable ? 'Tersedia Hari Ini' : 'Pre-Order';
    const buttonClass = isAvailable ? 'btn-whatsapp' : 'btn-preorder';
    const buttonText = isAvailable ? 'Pesan Sekarang' : 'Pre-Order';
    
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <div class="product-info">
            <span class="product-category">${getCategoryName(product.category)}</span>
            <span class="product-status ${statusClass}">${statusText}</span>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price}</p>
            <div class="product-seller">👨‍🍳 ${product.seller}</div>
            <div class="product-class">🎓 ${product.class}</div>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7); margin: 0.5rem 0;">📅 Dijual: ${product.sale_days}</p>
            <button class="${buttonClass}" onclick="showProductDetail('${product.id}')">
               <i class="fab fa-whatsapp"></i> ${buttonText}
            </button>
        </div>
    `;
    
    return card;
}

// ===== SEARCH AND FILTER =====
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    displayProducts(filteredProducts);
}

function filterProducts() {
    searchProducts();
}


// ===== PRODUCT MODAL =====
// Buka modal detail produk
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    const isAvailable = isProductAvailableToday(product);
    const statusClass = isAvailable ? 'status-available' : 'status-preorder';
    const statusText = isAvailable ? 'Tersedia Hari Ini' : 'Pre-Order';
    const buttonClass = isAvailable ? 'btn-whatsapp' : 'btn-preorder';
    const buttonText = isAvailable ? 'Pesan Sekarang' : 'Pre-Order Sekarang';
    
    const gallery = Array.isArray(product.gallery) ? product.gallery : [product.image];
    const variants = Array.isArray(product.variants) ? product.variants : ['Standard'];
    
    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-gallery">
                <img id="mainImage" src="${gallery[0]}" alt="${product.name}">
                <div class="modal-thumbnails">
                    ${gallery.map((img, index) => 
                        `<img src="${img}" 
                             alt="${product.name}" 
                             class="thumbnail ${index === 0 ? 'active' : ''}" 
                             onclick="changeMainImage('${img}', this)">`
                    ).join('')}
                </div>
            </div>
            <div class="modal-info">
                <h3>${product.name}</h3>
                <span class="product-status ${statusClass}">${statusText}</span>
                <p class="modal-price">${product.price}</p>
                <p><strong>Hari Penjualan:</strong> ${product.sale_days}</p>
                <p class="modal-description">${product.description}</p>
                
                <div class="variant-selector">
                    <label for="variantSelect">Pilih Varian:</label>
                    <select id="variantSelect">
                        ${variants.map(variant => 
                            `<option value="${variant}">${variant}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <button class="${buttonClass}" onclick="processOrder('${product.id}')">
                   <i class="fab fa-whatsapp"></i> ${buttonText}
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Ganti gambar utama di modal saat klik thumbnail
function changeMainImage(imageSrc, thumbnail) {
    document.getElementById('mainImage').src = imageSrc;
    
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

async function processOrder(productId) {
    const product = products.find(p => p.id === productId);
    const selectedVariant = document.getElementById('variantSelect').value;
    const isAvailable = isProductAvailableToday(product);
    
    // Simpan pesanan ke Supabase
    const orderData = {
        product_id: product.id,
        product_name: product.name,
        variant: selectedVariant,
        price: product.price,
        is_preorder: !isAvailable
    };
    
    try {
        const { error } = await db.from('orders').insert([orderData]);
        if (error) {
            console.error('Error saving order:', error);
        } else {
            console.log('Order saved successfully');
        }
    } catch (err) {
        console.error('Error:', err);
    }
    
    // buka WhatsApp dengan pesan
    const orderType = isAvailable ? 'pesanan' : 'pre-order';
    const message = `Halo, saya (nama) ingin ${orderType} ${product.name} varian ${selectedVariant}. ${!isAvailable ? 'Ini adalah pre-order untuk hari penjualan: ' + product.sale_days : ''}`;
    
    const whatsappURL = `https://wa.me/${product.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
    
    closeModal();
    updateAdminStats();
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// ===== CONTACT FORM =====
function submitForm(event) {
    event.preventDefault();
    
    const nama = document.getElementById('nama').value;
    const nohp = document.getElementById('nohp').value;
    const pesan = document.getElementById('pesan').value;
    
    const message = `Halo, saya ${nama} (${nohp}). ${pesan}`;
    const whatsappURL = `https://wa.me/6285872375685?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappURL, '_blank');
    
    document.getElementById('nama').value = '';
    document.getElementById('nohp').value = '';
    document.getElementById('pesan').value = '';
    
    alert('Pesan akan dikirim melalui WhatsApp!');
}

// ===== ADMIN FUNCTIONS =====
// Login admin via Supabase Auth
async function adminLogin(event) {
  event.preventDefault();

  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    // Supabase login
    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      alert("❌ Login gagal: " + error.message);
      console.error("Login error:", error);
      return;
    }

    // cek metadata role
    const user = data.user;
    if (user && user.user_metadata.role === "admin") {
      isAdminLoggedIn = true;
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      loadAdminProductList();
      updateAdminStats();
      console.log("✅ Admin login success:", user.email);
    } else {
      alert("Anda tidak memiliki akses admin.");
      await db.auth.signOut();
    }
  } catch (err) {
    console.error("Unexpected login error:", err);
    alert("Terjadi kesalahan saat login.");
  }
}

async function adminLogout() {
  await db.auth.signOut();
  isAdminLoggedIn = false;
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('adminEmail').value = '';
  document.getElementById('adminPassword').value = '';
}

// ===== IMAGE UPLOAD TO SUPABASE STORAGE =====
function handleImageSelect(event) {
    selectedImageFile = event.target.files[0];
    const previewDiv = document.getElementById('imagePreview');
    
    if (selectedImageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `
                <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                <p>File selected: ${selectedImageFile.name}</p>
            `;
        };
        reader.readAsDataURL(selectedImageFile);
    } else {
        previewDiv.innerHTML = '';
    }
}

async function uploadImageToSupabase(file) {
    if (!file) return null;
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;
        
        console.log('Uploading image to Supabase storage...');
        const { data, error } = await db.storage
            .from('product-images')
            .upload(filePath, file);
            
        if (error) {
            console.error('Upload error:', error);
            throw error;
        }
        
        // Get public URL
        const { data: urlData } = db.storage
            .from('product-images')
            .getPublicUrl(filePath);
            
        console.log('✅ Image uploaded successfully:', urlData.publicUrl);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('❌ Failed to upload image:', error);
        alert('Gagal mengupload gambar: ' + error.message);
        return null;
    }
}

// Simpan produk baru / update produk lama ke Supabase
async function saveProduct(event) {
    event.preventDefault();
    
    const editId = document.getElementById('editProductId').value;
    let imageUrl = document.getElementById('productImage').value;
    
    // upload gambar ke Supabase storage
    if (selectedImageFile) {
        const uploadedUrl = await uploadImageToSupabase(selectedImageFile);
        if (uploadedUrl) {
            imageUrl = uploadedUrl;
        } else {
            alert('Gagal mengupload gambar. Silakan coba lagi.');
            return;
        }
    }
    
    const productData = {
        name: document.getElementById('productName').value,
        price: document.getElementById('productPrice').value,
        category: document.getElementById('productCategory').value,
        seller: document.getElementById('productSeller').value,
        class: document.getElementById('productClass').value,
        description: document.getElementById('productDescription').value,
        sale_days: document.getElementById('productSaleDays').value,
        image: imageUrl,
        gallery: [imageUrl],
        variants: document.getElementById('productVariants').value.split(',').map(v => v.trim()),
        whatsapp: document.getElementById('productWhatsapp').value
    };
    
    try {
        if (editId) {
            // update produk lama ke Supabase
            productData.updated_at = new Date().toISOString();
            const { error } = await db.from('products').update(productData).eq('id', editId);
            if (error) throw error;
            alert('Produk berhasil diupdate!');
        } else {
            // Simpan produk baru
            const { error } = await db.from('products').insert([productData]);
            if (error) throw error;
            alert('Produk berhasil ditambahkan!');
        }
        
        // Reset form dan reload data
        document.getElementById('productForm').reset();
        document.getElementById('editProductId').value = '';
        document.getElementById('saveButtonText').textContent = 'Simpan Produk';
        document.getElementById('imagePreview').innerHTML = '';
        selectedImageFile = null;
        
        // Reload produk
        await loadProducts();
        loadAdminProductList();
        updateAdminStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Gagal menyimpan produk: ' + error.message);
    }
}

// Isi form dengan data produk untuk di-edit
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productSeller').value = product.seller;
    document.getElementById('productClass').value = product.class;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productSaleDays').value = product.sale_days;
    document.getElementById('productImage').value = product.image;
    
    const variants = Array.isArray(product.variants) ? product.variants : [];
    document.getElementById('productVariants').value = variants.join(', ');
    document.getElementById('productWhatsapp').value = product.whatsapp;
    document.getElementById('saveButtonText').textContent = 'Update Produk';
}

// Hapus produk dari Supabase
async function deleteProduct(productId) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        try {
            const { error } = await db.from('products').delete().eq('id', productId);
            if (error) throw error;
            
            alert('Produk berhasil dihapus!');
            await loadProducts();
            loadAdminProductList();
            updateAdminStats();
            
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Gagal menghapus produk: ' + error.message);
        }
    }
}

// Reset form saat batal edit
function cancelEdit() {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('saveButtonText').textContent = 'Simpan Produk';
    document.getElementById('imagePreview').innerHTML = '';
    selectedImageFile = null;
}

// Tampilkan daftar produk untuk admin
function loadAdminProductList() {
    const adminProductList = document.getElementById('adminProductList');
    if (!adminProductList) return;
    
    adminProductList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <div class="product-item-info">
                <h4>${product.name}</h4>
                <p>${product.price} • ${product.seller} (${product.class})</p>
            </div>
            <div class="product-item-actions">
                <button class="btn-secondary" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-logout" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        `;
        adminProductList.appendChild(productItem);
    });
}

// update stats di dashboard admin
async function updateAdminStats() {
    try {
        const { data: orders, error } = await db.from('orders').select('*').order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading orders:', error);
            return;
        }
        
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => 
            new Date(order.created_at).toDateString() === today
        );
        
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('todayOrders').textContent = todayOrders.length;
        
        // Update recent orders
        const recentOrders = orders.slice(0, 5);
        const recentOrdersList = document.getElementById('recentOrdersList');
        
        if (recentOrders.length === 0) {
            recentOrdersList.innerHTML = '<p style="color: #a0aec0;">Belum ada pesanan</p>';
        } else {
            recentOrdersList.innerHTML = recentOrders.map(order => `
                <div class="order-item">
                    <div class="order-product">${order.product_name} - ${order.variant}</div>
                    <div class="order-details">
                        ${order.price} • ${order.is_preorder ? 'Pre-Order' : 'Pesanan'} • 
                        ${new Date(order.created_at).toLocaleString('id-ID')}
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error updating admin stats:', error);
    }
}

// ===== ANIMATION SETUP =====
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".muncul");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add("show");
                }, index * 200);
            } else {
                entry.target.classList.remove("show");
            }
        });
    }, { threshold: 0.2 });

    cards.forEach(card => observer.observe(card));
});