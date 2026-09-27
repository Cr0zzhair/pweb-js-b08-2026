const namaUserAktif = localStorage.getItem("userFirstName");
if (!namaUserAktif) {
    window.location.href = "landing.html";
}

const namaPengguna = document.getElementById("namaPengguna");
const tombolLogout = document.getElementById("tombolLogout");
const tombolKeranjang = document.getElementById("tombolKeranjang");
const badgeKeranjang = document.getElementById("badgeKeranjang");

const inputCari = document.getElementById("inputCari");
const tombolCari = document.getElementById("tombolCari");
const pilihKategori = document.getElementById("pilihKategori");
const pilihUrutan = document.getElementById("pilihUrutan");

const infoJumlahProduk = document.getElementById("infoJumlahProduk");
const loadingProduk = document.getElementById("loadingProduk");
const pesanErrorProduk = document.getElementById("pesanErrorProduk");
const wadahProduk = document.getElementById("wadahProduk");
const tombolMuatLebih = document.getElementById("tombolMuatLebih");

const modalDetail = document.getElementById("modalDetail");
const tutupModalDetail = document.getElementById("tutupModalDetail");
const modalGambar = document.getElementById("modalGambar");
const modalKategori = document.getElementById("modalKategori");
const modalNama = document.getElementById("modalNama");
const modalBrand = document.getElementById("modalBrand");
const modalRating = document.getElementById("modalRating");
const modalStok = document.getElementById("modalStok");
const modalDiskon = document.getElementById("modalDiskon");
const modalHarga = document.getElementById("modalHarga");
const modalDeskripsi = document.getElementById("modalDeskripsi");
const modalTombolTambah = document.getElementById("modalTombolTambah");

const modalKeranjang = document.getElementById("modalKeranjang");
const tutupModalKeranjang = document.getElementById("tutupModalKeranjang");
const daftarItemKeranjang = document.getElementById("daftarItemKeranjang");
const totalHargaKeranjang = document.getElementById("totalHargaKeranjang");
const tombolKosongkanKeranjang = document.getElementById("tombolKosongkanKeranjang");

if (namaPengguna) {
    namaPengguna.textContent = namaUserAktif;
}

if (tombolLogout) {
    tombolLogout.addEventListener("click", function () {
        const yakin = confirm("Apakah Anda yakin ingin keluar dari akun Koperasi Kota?");
        if (yakin) {
            localStorage.removeItem("userFirstName");
            localStorage.removeItem("username");
            window.location.href = "landing.html";
        }
    });
}

let listSemuaProduk = [];
let listProdukDisaring = [];
let batasTampil = 8;
const batchPerKlik = 8;
let idProdukAktifDiModal = null;

async function ambilDataProdukAPI() {
    if (loadingProduk) loadingProduk.classList.remove("tersembunyi");
    if (pesanErrorProduk) pesanErrorProduk.classList.add("tersembunyi");
    if (wadahProduk) wadahProduk.innerHTML = "";
    if (tombolMuatLebih) tombolMuatLebih.classList.add("tersembunyi");

    try {
        const respon = await fetch("https://dummyjson.com/products?limit=100");

        if (!respon.ok) {
            throw new Error("Gagal mengambil data dari server (Status: " + respon.status + ")");
        }

        const data = await respon.json();
        listSemuaProduk = data.products;

        if (loadingProduk) loadingProduk.classList.add("tersembunyi");

        isiDropdownKategori(listSemuaProduk);
        terapkanFilterDanSort();

    } catch (error) {
        console.error("Fetch Error:", error);
        if (loadingProduk) loadingProduk.classList.add("tersembunyi");
        if (pesanErrorProduk) {
            pesanErrorProduk.classList.remove("tersembunyi");
            pesanErrorProduk.innerHTML = `
                <p>⚠️ <strong>Gagal memuat produk.</strong> ${error.message}</p>
                <button type="button" id="btnCobaLagiFetch" style="margin-top:8px; padding:6px 12px; cursor:pointer;">
                    🔄 Muat Ulang
                </button>
            `;
            const btnRetry = document.getElementById("btnCobaLagiFetch");
            if (btnRetry) btnRetry.addEventListener("click", ambilDataProdukAPI);
        }
    }
}

function isiDropdownKategori(produkArray) {
    if (!pilihKategori) return;

    const kategoriUnik = [];
    produkArray.forEach(function (p) {
        if (!kategoriUnik.includes(p.category)) {
            kategoriUnik.push(p.category);
        }
    });

    kategoriUnik.forEach(function (kat) {
        const opsi = document.createElement("option");
        opsi.value = kat;
        opsi.textContent = kat.charAt(0).toUpperCase() + kat.slice(1);
        pilihKategori.appendChild(opsi);
    });
}

function buatDebounce(fungsiUtama, jedaWaktu) {
    let timer = null;
    return function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
            fungsiUtama();
        }, jedaWaktu);
    };
}

const cariDebounced = buatDebounce(function () {
    batasTampil = batchPerKlik;
    terapkanFilterDanSort();
}, 350);

if (inputCari) {
    inputCari.addEventListener("input", cariDebounced);
}
if (tombolCari) {
    tombolCari.addEventListener("click", function () {
        batasTampil = batchPerKlik;
        terapkanFilterDanSort();
    });
}

if (pilihKategori) {
    pilihKategori.addEventListener("change", function () {
        batasTampil = batchPerKlik;
        terapkanFilterDanSort();
    });
}

if (pilihUrutan) {
    pilihUrutan.addEventListener("change", function () {
        terapkanFilterDanSort();
    });
}

function terapkanFilterDanSort() {
    const keyword = inputCari ? inputCari.value.toLowerCase().trim() : "";
    const katPilihan = pilihKategori ? pilihKategori.value : "semua";
    const sortPilihan = pilihUrutan ? pilihUrutan.value : "bawaan";

    let hasil = listSemuaProduk.filter(function (produk) {
        const cocokNama = produk.title.toLowerCase().includes(keyword);
        const cocokKategoriTeks = produk.category.toLowerCase().includes(keyword);
        const cocokPencarian = cocokNama || cocokKategoriTeks;

        const cocokDropdown = (katPilihan === "semua" || produk.category === katPilihan);

        return cocokPencarian && cocokDropdown;
    });

    if (sortPilihan === "harga-rendah") {
        hasil.sort(function (a, b) { return a.price - b.price; });
    } else if (sortPilihan === "harga-tinggi") {
        hasil.sort(function (a, b) { return b.price - a.price; });
    } else if (sortPilihan === "rating-tinggi") {
        hasil.sort(function (a, b) { return b.rating - a.rating; });
    }

    listProdukDisaring = hasil;

    if (infoJumlahProduk) {
        infoJumlahProduk.textContent = `Menampilkan ${Math.min(batasTampil, hasil.length)} dari ${hasil.length} produk`;
    }

    renderDaftarProduk();
}

function renderDaftarProduk() {
    if (!wadahProduk) return;
    wadahProduk.innerHTML = "";

    if (listProdukDisaring.length === 0) {
        wadahProduk.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding:30px; color:#888;'>Tidak ada produk yang sesuai dengan pencarian Anda.</p>";
        if (tombolMuatLebih) tombolMuatLebih.classList.add("tersembunyi");
        return;
    }

    const produkTampil = listProdukDisaring.slice(0, batasTampil);

    produkTampil.forEach(function (produk) {
        const kartu = document.createElement("div");
        kartu.className = "kartu-produk";
        kartu.dataset.id = produk.id;

        kartu.innerHTML = `
            <div class="wadah-gambar-produk">
                <img src="${produk.thumbnail}" alt="${produk.title}">
                <span class="badge-diskon">-${Math.round(produk.discountPercentage)}%</span>
            </div>
            <div class="info-produk">
                <span class="kategori-label">${produk.category}</span>
                <h4 class="nama-produk" title="${produk.title}">${produk.title}</h4>
                <div class="rating-produk">⭐ ${produk.rating}</div>
                <div class="harga-produk">$${produk.price.toFixed(2)}</div>
                <button type="button" class="tombol-tambah-keranjang" data-id="${produk.id}">
                    + Tambah ke Keranjang
                </button>
            </div>
        `;

        wadahProduk.appendChild(kartu);
    });

    if (tombolMuatLebih) {
        if (batasTampil < listProdukDisaring.length) {
            tombolMuatLebih.classList.remove("tersembunyi");
            tombolMuatLebih.textContent = `Muat Lebih Banyak (${listProdukDisaring.length - batasTampil} lagi)`;
        } else {
            tombolMuatLebih.classList.add("tersembunyi");
        }
    }
}

if (tombolMuatLebih) {
    tombolMuatLebih.addEventListener("click", function () {
        batasTampil += batchPerKlik;
        renderDaftarProduk();
    });
}

if (wadahProduk) {
    wadahProduk.addEventListener("click", function (event) {
        const tombolTambah = event.target.closest(".tombol-tambah-keranjang");
        if (tombolTambah) {
            const id = Number(tombolTambah.dataset.id);
            tambahKeKeranjang(id);
            return;
        }

        const kartu = event.target.closest(".kartu-produk");
        if (kartu) {
            const id = Number(kartu.dataset.id);
            tampilkanModalDetail(id);
        }
    });
}

function tampilkanModalDetail(idProduk) {
    const produk = listSemuaProduk.find(function (p) {
        return p.id === idProduk;
    });

    if (!produk || !modalDetail) return;

    idProdukAktifDiModal = produk.id;
    if (modalGambar) modalGambar.src = produk.thumbnail;
    if (modalKategori) modalKategori.textContent = produk.category;
    if (modalNama) modalNama.textContent = produk.title;
    if (modalBrand) modalBrand.textContent = produk.brand || "Koperasi Kota";
    if (modalRating) modalRating.textContent = produk.rating;
    if (modalStok) modalStok.textContent = produk.stock + " unit";
    if (modalDiskon) modalDiskon.textContent = "-" + Math.round(produk.discountPercentage) + "%";
    if (modalHarga) modalHarga.textContent = "$" + produk.price.toFixed(2);
    if (modalDeskripsi) modalDeskripsi.textContent = produk.description;

    modalDetail.classList.remove("tersembunyi");
}

if (tutupModalDetail) {
    tutupModalDetail.addEventListener("click", function () {
        if (modalDetail) modalDetail.classList.add("tersembunyi");
    });
}

if (modalTombolTambah) {
    modalTombolTambah.addEventListener("click", function () {
        if (idProdukAktifDiModal) {
            tambahKeKeranjang(idProdukAktifDiModal);
        }
    });
}

if (modalDetail) {
    modalDetail.addEventListener("click", function (e) {
        if (e.target === modalDetail) {
            modalDetail.classList.add("tersembunyi");
        }
    });
}

function ambilKeranjangStorage() {
    const data = localStorage.getItem("keranjangKoperasi");
    return data ? JSON.parse(data) : [];
}

function simpanKeranjangStorage(keranjang) {
    localStorage.setItem("keranjangKoperasi", JSON.stringify(keranjang));
    perbaruiBadgeNavbar();
}

function tambahKeKeranjang(idProduk) {
    const produk = listSemuaProduk.find(function (p) {
        return p.id === idProduk;
    });
    if (!produk) return;

    let keranjang = ambilKeranjangStorage();
    const indexAda = keranjang.findIndex(function (item) {
        return item.id === idProduk;
    });

    if (indexAda > -1) {
        keranjang[indexAda].jumlah += 1;
    } else {
        keranjang.push({
            id: produk.id,
            title: produk.title,
            price: produk.price,
            thumbnail: produk.thumbnail,
            jumlah: 1
        });
    }

    simpanKeranjangStorage(keranjang);
    alert(`"${produk.title}" berhasil ditambahkan ke keranjang!`);
}

function perbaruiBadgeNavbar() {
    const keranjang = ambilKeranjangStorage();
    let totalBarang = 0;
    keranjang.forEach(function (item) {
        totalBarang += item.jumlah;
    });

    if (badgeKeranjang) {
        badgeKeranjang.textContent = totalBarang;
    }
}

if (tombolKeranjang) {
    tombolKeranjang.addEventListener("click", function () {
        renderModalKeranjang();
        if (modalKeranjang) modalKeranjang.classList.remove("tersembunyi");
    });
}

if (tutupModalKeranjang) {
    tutupModalKeranjang.addEventListener("click", function () {
        if (modalKeranjang) modalKeranjang.classList.add("tersembunyi");
    });
}

if (modalKeranjang) {
    modalKeranjang.addEventListener("click", function (e) {
        if (e.target === modalKeranjang) {
            modalKeranjang.classList.add("tersembunyi");
        }
    });
}

function renderModalKeranjang() {
    if (!daftarItemKeranjang) return;

    const keranjang = ambilKeranjangStorage();
    daftarItemKeranjang.innerHTML = "";

    if (keranjang.length === 0) {
        daftarItemKeranjang.innerHTML = "<p style='text-align:center; padding:20px; color:#888;'>Keranjang belanja masih kosong.</p>";
        if (totalHargaKeranjang) totalHargaKeranjang.textContent = "$0.00";
        return;
    }

    let grandTotal = 0;

    keranjang.forEach(function (item) {
        const subtotal = item.price * item.jumlah;
        grandTotal += subtotal;

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.padding = "10px 0";
        row.style.borderBottom = "1px solid #eee";

        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${item.thumbnail}" alt="${item.title}" style="width:45px; height:45px; object-fit:cover; border-radius:4px;">
                <div>
                    <div style="font-weight:600; font-size:0.95rem;">${item.title}</div>
                    <div style="font-size:0.85rem; color:#666;">$${item.price.toFixed(2)} x ${item.jumlah} = $${subtotal.toFixed(2)}</div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" onclick="ubahJumlahItem(${item.id}, -1)" style="padding:2px 8px; cursor:pointer;">-</button>
                <span>${item.jumlah}</span>
                <button type="button" onclick="ubahJumlahItem(${item.id}, 1)" style="padding:2px 8px; cursor:pointer;">+</button>
                <button type="button" onclick="hapusItem(${item.id})" style="padding:2px 8px; color:red; cursor:pointer;" title="Hapus">&times;</button>
            </div>
        `;

        daftarItemKeranjang.appendChild(row);
    });

    if (totalHargaKeranjang) {
        totalHargaKeranjang.textContent = "$" + grandTotal.toFixed(2);
    }
}

window.ubahJumlahItem = function (idProduk, delta) {
    let keranjang = ambilKeranjangStorage();
    const item = keranjang.find(function (i) { return i.id === idProduk; });
    if (!item) return;

    item.jumlah += delta;
    if (item.jumlah <= 0) {
        keranjang = keranjang.filter(function (i) { return i.id !== idProduk; });
    }

    simpanKeranjangStorage(keranjang);
    renderModalKeranjang();
};

window.hapusItem = function (idProduk) {
    let keranjang = ambilKeranjangStorage();
    keranjang = keranjang.filter(function (i) { return i.id !== idProduk; });
    simpanKeranjangStorage(keranjang);
    renderModalKeranjang();
};

if (tombolKosongkanKeranjang) {
    tombolKosongkanKeranjang.addEventListener("click", function () {
        const keranjang = ambilKeranjangStorage();
        if (keranjang.length === 0) return;

        if (confirm("Kosongkan semua isi keranjang belanja?")) {
            localStorage.removeItem("keranjangKoperasi");
            perbaruiBadgeNavbar();
            renderModalKeranjang();
        }
    });
}

perbaruiBadgeNavbar();
ambilDataProdukAPI();
