if (localStorage.getItem("userFirstName")) window.location.href = "MainPage.html";

const tabLogin = document.getElementById("tabLogin");
const tabRegist = document.getElementById("tabRegist");
const formLogin = document.getElementById("formLogin");
const formRegist = document.getElementById("formRegist");
const wadahLogin = document.getElementById("wadahFormLogin");
const wadahRegist = document.getElementById("wadahFormRegist");
const pesanErr = document.getElementById("pesanError");
const pesanSukses = document.getElementById("pesanSuksesLogin");
const loading = document.getElementById("indikatorLoading");
const btnMasuk = document.getElementById("tombolMasuk");

function gantiTab(keLogin) {
    tabLogin.classList.toggle("aktif", keLogin);
    tabRegist.classList.toggle("aktif", !keLogin);
    wadahLogin.classList.toggle("tersembunyi", !keLogin);
    wadahRegist.classList.toggle("tersembunyi", keLogin);
    document.querySelectorAll(".pesan-notif").forEach(el => el.classList.add("tersembunyi"));
}

tabLogin.onclick = () => gantiTab(true);
tabRegist.onclick = () => gantiTab(false);
document.getElementById("linkKeRegist").onclick = (e) => { e.preventDefault(); gantiTab(false); };
document.getElementById("linkKeLogin").onclick = (e) => { e.preventDefault(); gantiTab(true); };

formLogin.onsubmit = async (e) => {
    e.preventDefault();
    pesanErr.classList.add("tersembunyi");
    const u = document.getElementById("inputUser").value.trim();
    const p = document.getElementById("inputPass").value.trim();
    if (!u || !p) return tampilPesan(pesanErr, "Harap masukkan username dan password!");

    loading.classList.remove("tersembunyi");
    btnMasuk.disabled = true;

    try {
        const res = await fetch("https://dummyjson.com/users?limit=0");
        const data = await res.json();
        const lokal = JSON.parse(localStorage.getItem("anggotaKoperasi")) || [];
        const user = data.users.find(x => x.username === u && x.password === p) ||
                     lokal.find(x => x.username === u && x.password === p);

        if (user) {
            tampilPesan(pesanSukses, `Selamat datang, ${user.firstName || user.nama}!`);
            localStorage.setItem("userFirstName", user.firstName || user.nama);
            localStorage.setItem("username", user.username);
            setTimeout(() => window.location.href = "MainPage.html", 600);
        } else {
            tampilPesan(pesanErr, "Username atau password salah!");
        }
    } catch {
        tampilPesan(pesanErr, "Koneksi API bermasalah. Periksa internet Anda.");
    } finally {
        loading.classList.add("tersembunyi");
        btnMasuk.disabled = false;
    }
};

formRegist.onsubmit = (e) => {
    e.preventDefault();
    const nama = document.getElementById("inputNamaBaru").value.trim();
    const u = document.getElementById("inputUserBaru").value.trim();
    const p = document.getElementById("inputPassBaru").value.trim();
    const err = document.getElementById("pesanErrorRegist");
    const suk = document.getElementById("pesanSuksesRegist");

    if (!nama || !u || !p) return tampilPesan(err, "Harap lengkapi semua kolom!");

    let list = JSON.parse(localStorage.getItem("anggotaKoperasi")) || [];
    if (list.some(x => x.username.toLowerCase() === u.toLowerCase())) {
        return tampilPesan(err, "Username sudah digunakan!");
    }

    list.push({ nama, username: u, password: p });
    localStorage.setItem("anggotaKoperasi", JSON.stringify(list));
    tampilPesan(suk, "Pendaftaran berhasil! Silakan masuk.");
    formRegist.reset();
    setTimeout(() => { gantiTab(true); document.getElementById("inputUser").value = u; }, 1000);
};

function tampilPesan(el, msg) {
    el.textContent = msg;
    el.classList.remove("tersembunyi");
}
