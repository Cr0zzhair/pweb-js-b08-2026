/* ─── Auto-detect and hide video if file.mp4 not found ─────── */
const bgVideo = document.getElementById("bg-video");
if (bgVideo) {
  bgVideo.addEventListener("error", () => {
    document.body.classList.add("no-video");
  });
  bgVideo.addEventListener("loadeddata", () => {
    document.body.classList.remove("no-video");
  });
}

/* ─── Auth guard ──────────────────────────────────────────── */
let user = localStorage.getItem("userFirstName");
if (!user) {
  // For dev convenience: auto-set a user so page doesn't break
  user = "Tamu";
  localStorage.setItem("userFirstName", user);
}
document.getElementById("namaPengguna").textContent = user;

document.getElementById("tombolLogout").onclick = () => {
  if (confirm("Keluar dari Koperasi Kota?")) {
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("username");
    window.location.href = "landing.html";
  }
};

/* ─── State ─────────────────────────────────────────────────── */
let semua = [], disaring = [], limit = 12, idModal = null;

const wadah      = document.getElementById("wadahProduk");
const btnLoad    = document.getElementById("tombolMuatLebih");
const modalD     = document.getElementById("modalDetail");
const modalK     = document.getElementById("modalKeranjang");
const inputCari  = document.getElementById("inputCari");
const katSelect  = document.getElementById("pilihKategori");
const sortSelect = document.getElementById("pilihUrutan");

/* ─── Load products ─────────────────────────────────────────── */
async function muatProduk() {
  const load = document.getElementById("loadingProduk");
  const err  = document.getElementById("pesanErrorProduk");
  load.classList.remove("tersembunyi");
  err.classList.add("tersembunyi");

  try {
    const res  = await fetch("https://dummyjson.com/products?limit=100");
    const data = await res.json();
    semua = data.products;
    load.classList.add("tersembunyi");

    // Populate category select
    [...new Set(semua.map(p => p.category))].forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c[0].toUpperCase() + c.slice(1).replace(/-/g, " ");
      katSelect.appendChild(opt);
    });

    filterSort();
  } catch {
    load.classList.add("tersembunyi");
    err.classList.remove("tersembunyi");
    err.innerHTML = `Gagal memuat produk. <button onclick="muatProduk()">Coba lagi</button>`;
  }
}

/* ─── Debounce ──────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return () => { clearTimeout(t); t = setTimeout(fn, ms); };
}

/* ─── Filter + sort + render ─────────────────────────────────── */
inputCari.oninput = debounce(() => { limit = 12; filterSort(); }, 320);
document.getElementById("tombolCari").onclick = () => { limit = 12; filterSort(); };

katSelect.onchange = () => {
  limit = 12;
  filterSort();
  syncPills(katSelect.value);
};

sortSelect.onchange = filterSort;

// Quick pills
document.querySelectorAll(".quick-tag-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    const cat = pill.dataset.cat;
    syncPills(cat);

    // Sync select
    let found = [...katSelect.options].some(o => o.value === cat);
    if (!found && cat !== "semua") {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat[0].toUpperCase() + cat.slice(1).replace(/-/g, " ");
      katSelect.appendChild(opt);
    }
    katSelect.value = cat;
    limit = 12;
    filterSort();
  });
});

function syncPills(cat) {
  document.querySelectorAll(".quick-tag-pill").forEach(p => {
    p.classList.toggle("active", p.dataset.cat === cat);
  });
}

function filterSort() {
  const q = inputCari.value.toLowerCase().trim();
  const k = katSelect.value;
  const s = sortSelect.value;

  disaring = semua.filter(p =>
    (p.title.toLowerCase().includes(q) ||
     p.category.toLowerCase().includes(q) ||
     (p.description && p.description.toLowerCase().includes(q))) &&
    (k === "semua" || p.category === k)
  );

  if (s === "harga-rendah")  disaring.sort((a, b) => a.price - b.price);
  else if (s === "harga-tinggi") disaring.sort((a, b) => b.price - a.price);
  else if (s === "rating-tinggi") disaring.sort((a, b) => b.rating - a.rating);

  const showing = Math.min(limit, disaring.length);
  document.getElementById("infoJumlahProduk").textContent =
    `${showing} dari ${disaring.length} produk`;

  renderKartu();
}

/* ─── Render product cards ──────────────────────────────────── */
function renderKartu() {
  wadah.innerHTML = "";

  if (!disaring.length) {
    wadah.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:56px 0;color:var(--text-dim);font-size:14px;">Produk tidak ditemukan.</p>`;
    btnLoad.classList.add("tersembunyi");
    return;
  }

  disaring.slice(0, limit).forEach(p => {
    const card = document.createElement("div");
    card.className = "kartu-produk";
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="wadah-gambar-produk">
        <img src="${p.thumbnail}" alt="${p.title}" loading="lazy">
        <span class="badge-diskon">−${Math.round(p.discountPercentage)}%</span>
      </div>
      <div class="info-produk">
        <span class="kategori-label">${p.category}</span>
        <h4 class="nama-produk">${p.title}</h4>
        <div class="rating-produk">⭐ ${p.rating} <span>(${p.stock} stok)</span></div>
        <div class="harga-produk">$${p.price.toFixed(2)}</div>
        <button type="button" class="tombol-tambah-keranjang" data-id="${p.id}">
          + Keranjang
        </button>
      </div>`;
    wadah.appendChild(card);
  });

  btnLoad.classList.toggle("tersembunyi", limit >= disaring.length);
  btnLoad.textContent = `Muat ${Math.min(12, disaring.length - limit)} lagi`;
}

btnLoad.onclick = () => { limit += 12; renderKartu(); };

/* ─── Card click delegation ─────────────────────────────────── */
wadah.onclick = (e) => {
  const btn = e.target.closest(".tombol-tambah-keranjang");
  if (btn) { e.stopPropagation(); return tambahKeranjang(Number(btn.dataset.id)); }
  const kartu = e.target.closest(".kartu-produk");
  if (kartu) bukaDetail(Number(kartu.dataset.id));
};

/* ─── Detail modal ──────────────────────────────────────────── */
function bukaDetail(id) {
  const p = semua.find(x => x.id === id);
  if (!p) return;
  idModal = p.id;

  document.getElementById("modalGambar").src = p.thumbnail;
  document.getElementById("modalKategori").textContent = p.category;
  document.getElementById("modalNama").textContent = p.title;
  document.getElementById("modalBrand").textContent = p.brand || "—";
  document.getElementById("modalRating").textContent = p.rating;
  document.getElementById("modalStok").textContent = `${p.stock} unit`;
  document.getElementById("modalDiskon").textContent = `−${Math.round(p.discountPercentage)}%`;
  document.getElementById("modalHarga").textContent = `$${p.price.toFixed(2)}`;
  document.getElementById("modalDeskripsi").textContent = p.description;

  modalD.classList.remove("tersembunyi");
}

document.getElementById("tutupModalDetail").onclick = () => modalD.classList.add("tersembunyi");
document.getElementById("modalTombolTambah").onclick = () => idModal && tambahKeranjang(idModal);
modalD.onclick = (e) => { if (e.target === modalD) modalD.classList.add("tersembunyi"); };

/* ─── Cart ──────────────────────────────────────────────────── */
const getCart = () => JSON.parse(localStorage.getItem("keranjangKoperasi")) || [];
const setCart = (k) => { localStorage.setItem("keranjangKoperasi", JSON.stringify(k)); updateBadge(); };

function tambahKeranjang(id) {
  const p = semua.find(x => x.id === id);
  if (!p) return;
  const k = getCart();
  const ada = k.find(x => x.id === id);
  if (ada) ada.jumlah++;
  else k.push({ id: p.id, title: p.title, price: p.price, thumbnail: p.thumbnail, jumlah: 1 });
  setCart(k);

  // Badge micro-animation
  const badge = document.getElementById("badgeKeranjang");
  badge.style.transform = "scale(1.4)";
  setTimeout(() => badge.style.transform = "", 250);
}

function updateBadge() {
  const total = getCart().reduce((s, i) => s + i.jumlah, 0);
  document.getElementById("badgeKeranjang").textContent = total;
}

document.getElementById("tombolKeranjang").onclick = () => {
  renderCart();
  modalK.classList.remove("tersembunyi");
};
document.getElementById("tutupModalKeranjang").onclick = () => modalK.classList.add("tersembunyi");
modalK.onclick = (e) => { if (e.target === modalK) modalK.classList.add("tersembunyi"); };

function renderCart() {
  const list = document.getElementById("daftarItemKeranjang");
  const k = getCart();
  list.innerHTML = "";

  if (!k.length) {
    list.innerHTML = `<p style="text-align:center;padding:36px 0;color:var(--text-dim);font-size:14px;">Keranjang masih kosong.</p>`;
    document.getElementById("totalHargaKeranjang").textContent = "$0.00";
    return;
  }

  let total = 0;
  k.forEach(item => {
    const sub = item.price * item.jumlah;
    total += sub;

    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);gap:12px;";
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <img src="${item.thumbnail}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid rgba(125,232,240,0.2);">
        <div style="min-width:0;">
          <div style="font-size:14px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">$${item.price.toFixed(2)} × ${item.jumlah} = <span style="color:var(--accent-lime);">$${sub.toFixed(2)}</span></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
        <button onclick="ubahQty(${item.id},-1)">−</button>
        <span style="font-size:14px;font-weight:600;min-width:16px;text-align:center;">${item.jumlah}</span>
        <button onclick="ubahQty(${item.id},1)">+</button>
        <button onclick="hapusCart(${item.id})" style="color:var(--accent-magenta);border-color:rgba(240,107,206,0.25);">×</button>
      </div>`;
    list.appendChild(row);
  });

  document.getElementById("totalHargaKeranjang").textContent = `$${total.toFixed(2)}`;
}

window.ubahQty = (id, delta) => {
  let k = getCart();
  const item = k.find(x => x.id === id);
  if (!item) return;
  item.jumlah += delta;
  if (item.jumlah <= 0) k = k.filter(x => x.id !== id);
  setCart(k);
  renderCart();
};

window.hapusCart = (id) => {
  setCart(getCart().filter(x => x.id !== id));
  renderCart();
};

document.getElementById("tombolKosongkanKeranjang").onclick = () => {
  if (confirm("Kosongkan semua item di keranjang?")) {
    localStorage.removeItem("keranjangKoperasi");
    updateBadge();
    renderCart();
  }
};




// buat display banner
    // --- SISTEM ROTASI BANNER ---
const bannerLynae = document.querySelector('.lynae-banner');
const bannerChisa = document.querySelector('.chisa-banner');

if (bannerLynae && bannerChisa) {
  let isLynaeActive = true;

  setInterval(() => {
    if (isLynaeActive) {
      bannerLynae.classList.remove('aktif');
      bannerChisa.classList.add('aktif');
    } else {
      bannerChisa.classList.remove('aktif');
      bannerLynae.classList.add('aktif');
    }
    isLynaeActive = !isLynaeActive;
  }, 10000); // 6000 milidetik = 6 detik
}


// --- ACCORDION FILTER MOBILE ---
const btnToggleFilter = document.getElementById('btnToggleFilter');
const areaWadahKontrol = document.getElementById('areaWadahKontrol');

if (btnToggleFilter && areaWadahKontrol) {
  btnToggleFilter.addEventListener('click', () => {
    areaWadahKontrol.classList.toggle('terbuka');
    const panah = btnToggleFilter.querySelector('.panah-indikator');
    if (panah) {
      panah.textContent = areaWadahKontrol.classList.contains('terbuka') ? '▲' : '▼';
    }
  });
}

/* ─── Init ──────────────────────────────────────────────────── */
updateBadge();
muatProduk();
