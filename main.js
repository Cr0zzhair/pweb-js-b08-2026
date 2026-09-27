const user = localStorage.getItem("userFirstName");
if (!user) window.location.href = "landing.html";

document.getElementById("namaPengguna").textContent = user;
document.getElementById("tombolLogout").onclick = () => {
    if (confirm("Keluar dari Koperasi Kota?")) {
        localStorage.removeItem("userFirstName");
        localStorage.removeItem("username");
        window.location.href = "landing.html";
    }
};

let semua = [], disaring = [], limit = 8, idModal = null;
const wadah = document.getElementById("wadahProduk");
const btnLoad = document.getElementById("tombolMuatLebih");
const modalD = document.getElementById("modalDetail");
const modalK = document.getElementById("modalKeranjang");
const inputCari = document.getElementById("inputCari");
const katSelect = document.getElementById("pilihKategori");
const sortSelect = document.getElementById("pilihUrutan");

async function muatProduk() {
    const load = document.getElementById("loadingProduk");
    const err = document.getElementById("pesanErrorProduk");
    load.classList.remove("tersembunyi");
    err.classList.add("tersembunyi");

    try {
        const res = await fetch("https://dummyjson.com/products?limit=100");
        const data = await res.json();
        semua = data.products;
        load.classList.add("tersembunyi");

        [...new Set(semua.map(p => p.category))].forEach(c => {
            katSelect.innerHTML += `<option value="${c}">${c[0].toUpperCase() + c.slice(1)}</option>`;
        });
        filterSort();
    } catch {
        load.classList.add("tersembunyi");
        err.classList.remove("tersembunyi");
        err.innerHTML = `⚠️ Gagal memuat produk. <button onclick="muatProduk()">Coba Lagi</button>`;
    }
}

function debounce(fn, ms) {
    let t;
    return () => { clearTimeout(t); t = setTimeout(fn, ms); };
}

inputCari.oninput = debounce(() => { limit = 8; filterSort(); }, 350);
document.getElementById("tombolCari").onclick = () => { limit = 8; filterSort(); };
katSelect.onchange = () => { limit = 8; filterSort(); };
sortSelect.onchange = filterSort;

function filterSort() {
    const q = inputCari.value.toLowerCase().trim();
    const k = katSelect.value;
    const s = sortSelect.value;

    disaring = semua.filter(p => 
        (p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
        (k === "semua" || p.category === k)
    );

    if (s === "harga-rendah") disaring.sort((a, b) => a.price - b.price);
    else if (s === "harga-tinggi") disaring.sort((a, b) => b.price - a.price);
    else if (s === "rating-tinggi") disaring.sort((a, b) => b.rating - a.rating);

    document.getElementById("infoJumlahProduk").textContent = `Menampilkan ${Math.min(limit, disaring.length)} dari ${disaring.length} produk`;
    renderKartu();
}

function renderKartu() {
    wadah.innerHTML = "";
    if (!disaring.length) {
        wadah.innerHTML = "<p style='grid-column:1/-1;text-align:center;padding:30px;'>Produk tidak ditemukan.</p>";
        btnLoad.classList.add("tersembunyi");
        return;
    }

    disaring.slice(0, limit).forEach(p => {
        wadah.innerHTML += `
            <div class="kartu-produk" data-id="${p.id}">
                <div class="wadah-gambar-produk">
                    <img src="${p.thumbnail}" alt="${p.title}">
                    <span class="badge-diskon">-${Math.round(p.discountPercentage)}%</span>
                </div>
                <div class="info-produk">
                    <span class="kategori-label">${p.category}</span>
                    <h4 class="nama-produk">${p.title}</h4>
                    <div class="rating-produk">⭐ ${p.rating}</div>
                    <div class="harga-produk">$${p.price.toFixed(2)}</div>
                    <button type="button" class="tombol-tambah-keranjang" data-id="${p.id}">+ Tambah ke Keranjang</button>
                </div>
            </div>`;
    });

    btnLoad.classList.toggle("tersembunyi", limit >= disaring.length);
    btnLoad.textContent = `Muat Lebih Banyak (${disaring.length - limit} lagi)`;
}

btnLoad.onclick = () => { limit += 8; renderKartu(); };

wadah.onclick = (e) => {
    const btn = e.target.closest(".tombol-tambah-keranjang");
    if (btn) return tambahKeranjang(Number(btn.dataset.id));
    const kartu = e.target.closest(".kartu-produk");
    if (kartu) bukaDetail(Number(kartu.dataset.id));
};

function bukaDetail(id) {
    const p = semua.find(x => x.id === id);
    if (!p) return;
    idModal = p.id;
    document.getElementById("modalGambar").src = p.thumbnail;
    document.getElementById("modalKategori").textContent = p.category;
    document.getElementById("modalNama").textContent = p.title;
    document.getElementById("modalBrand").textContent = p.brand || "Koperasi Kota";
    document.getElementById("modalRating").textContent = p.rating;
    document.getElementById("modalStok").textContent = p.stock + " unit";
    document.getElementById("modalDiskon").textContent = `-${Math.round(p.discountPercentage)}%`;
    document.getElementById("modalHarga").textContent = `$${p.price.toFixed(2)}`;
    document.getElementById("modalDeskripsi").textContent = p.description;
    modalD.classList.remove("tersembunyi");
}

document.getElementById("tutupModalDetail").onclick = () => modalD.classList.add("tersembunyi");
document.getElementById("modalTombolTambah").onclick = () => idModal && tambahKeranjang(idModal);
modalD.onclick = (e) => { if (e.target === modalD) modalD.classList.add("tersembunyi"); };

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
    alert(`"${p.title}" ditambahkan ke keranjang!`);
}

function updateBadge() {
    const total = getCart().reduce((sum, item) => sum + item.jumlah, 0);
    document.getElementById("badgeKeranjang").textContent = total;
}

document.getElementById("tombolKeranjang").onclick = () => { renderCart(); modalK.classList.remove("tersembunyi"); };
document.getElementById("tutupModalKeranjang").onclick = () => modalK.classList.add("tersembunyi");
modalK.onclick = (e) => { if (e.target === modalK) modalK.classList.add("tersembunyi"); };

function renderCart() {
    const list = document.getElementById("daftarItemKeranjang");
    const k = getCart();
    list.innerHTML = "";

    if (!k.length) {
        list.innerHTML = "<p style='text-align:center;padding:20px;color:#888;'>Keranjang belanja masih kosong.</p>";
        document.getElementById("totalHargaKeranjang").textContent = "$0.00";
        return;
    }

    let total = 0;
    k.forEach(item => {
        const sub = item.price * item.jumlah;
        total += sub;
        list.innerHTML += `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${item.thumbnail}" style="width:45px;height:45px;object-fit:cover;border-radius:4px;">
                    <div>
                        <div style="font-weight:600;">${item.title}</div>
                        <div style="font-size:0.85rem;color:#666;">$${item.price.toFixed(2)} x ${item.jumlah} = $${sub.toFixed(2)}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button onclick="ubahQty(${item.id}, -1)">-</button>
                    <span>${item.jumlah}</span>
                    <button onclick="ubahQty(${item.id}, 1)">+</button>
                    <button onclick="hapusCart(${item.id})" style="color:red;">&times;</button>
                </div>
            </div>`;
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
    if (confirm("Kosongkan keranjang?")) {
        localStorage.removeItem("keranjangKoperasi");
        updateBadge();
        renderCart();
    }
};

updateBadge();
muatProduk();
