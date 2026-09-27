const sesiUser = localStorage.getItem("userFirstName");
if (sesiUser) {
    window.location.href = "main.html";
}

const tabLogin = document.getElementById("tabLogin");
const tabRegist = document.getElementById("tabRegist");
const wadahFormLogin = document.getElementById("wadahFormLogin");
const wadahFormRegist = document.getElementById("wadahFormRegist");

const formLogin = document.getElementById("formLogin");
const inputUser = document.getElementById("inputUser");
const inputPass = document.getElementById("inputPass");
const tombolMasuk = document.getElementById("tombolMasuk");
const indikatorLoading = document.getElementById("indikatorLoading");
const pesanError = document.getElementById("pesanError");
const pesanSuksesLogin = document.getElementById("pesanSuksesLogin");
const linkKeRegist = document.getElementById("linkKeRegist");

const formRegist = document.getElementById("formRegist");
const inputNamaBaru = document.getElementById("inputNamaBaru");
const inputUserBaru = document.getElementById("inputUserBaru");
const inputPassBaru = document.getElementById("inputPassBaru");
const tombolDaftar = document.getElementById("tombolDaftar");
const pesanErrorRegist = document.getElementById("pesanErrorRegist");
const pesanSuksesRegist = document.getElementById("pesanSuksesRegist");
const linkKeLogin = document.getElementById("linkKeLogin");

function bukaTabLogin() {
    if (tabLogin) tabLogin.classList.add("aktif");
    if (tabRegist) tabRegist.classList.remove("aktif");
    if (wadahFormLogin) wadahFormLogin.classList.remove("tersembunyi");
    if (wadahFormRegist) wadahFormRegist.classList.add("tersembunyi");
    sembunyikanSemuaPesan();
}

function bukaTabRegist() {
    if (tabRegist) tabRegist.classList.add("aktif");
    if (tabLogin) tabLogin.classList.remove("aktif");
    if (wadahFormRegist) wadahFormRegist.classList.remove("tersembunyi");
    if (wadahFormLogin) wadahFormLogin.classList.add("tersembunyi");
    sembunyikanSemuaPesan();
}

if (tabLogin) tabLogin.addEventListener("click", bukaTabLogin);
if (tabRegist) tabRegist.addEventListener("click", bukaTabRegist);
if (linkKeRegist) linkKeRegist.addEventListener("click", function (e) {
    e.preventDefault();
    bukaTabRegist();
});
if (linkKeLogin) linkKeLogin.addEventListener("click", function (e) {
    e.preventDefault();
    bukaTabLogin();
});

function sembunyikanSemuaPesan() {
    if (pesanError) pesanError.classList.add("tersembunyi");
    if (pesanSuksesLogin) pesanSuksesLogin.classList.add("tersembunyi");
    if (pesanErrorRegist) pesanErrorRegist.classList.add("tersembunyi");
    if (pesanSuksesRegist) pesanSuksesRegist.classList.add("tersembunyi");
}

if (formLogin) {
    formLogin.addEventListener("submit", async function (event) {
        event.preventDefault();
        sembunyikanSemuaPesan();

        const username = inputUser.value.trim();
        const password = inputPass.value.trim();

        if (username === "" || password === "") {
            tampilkanError(pesanError, "Harap masukkan username dan password!");
            return;
        }

        if (indikatorLoading) indikatorLoading.classList.remove("tersembunyi");
        if (tombolMasuk) tombolMasuk.disabled = true;

        try {
            const respon = await fetch("https://dummyjson.com/users?limit=0");

            if (!respon.ok) {
                throw new Error("Gagal mengambil data pengguna dari server.");
            }

            const data = await respon.json();
            const listUsers = data.users;

            let userDitemukan = null;
            for (let i = 0; i < listUsers.length; i++) {
                if (listUsers[i].username === username && listUsers[i].password === password) {
                    userDitemukan = listUsers[i];
                    break;
                }
            }

            if (!userDitemukan) {
                const lokalUsers = JSON.parse(localStorage.getItem("anggotaKoperasi")) || [];
                for (let j = 0; j < lokalUsers.length; j++) {
                    if (lokalUsers[j].username === username && lokalUsers[j].password === password) {
                        userDitemukan = {
                            firstName: lokalUsers[j].nama,
                            username: lokalUsers[j].username
                        };
                        break;
                    }
                }
            }

            if (userDitemukan) {
                if (pesanSuksesLogin) {
                    pesanSuksesLogin.textContent = `Selamat datang, ${userDitemukan.firstName}! Mengalihkan...`;
                    pesanSuksesLogin.classList.remove("tersembunyi");
                }

                localStorage.setItem("userFirstName", userDitemukan.firstName);
                localStorage.setItem("username", userDitemukan.username);

                setTimeout(function () {
                    window.location.href = "main.html";
                }, 800);

            } else {
                tampilkanError(pesanError, "Username atau password salah! Silakan coba lagi.");
            }

        } catch (error) {
            console.error("Error Login:", error);
            tampilkanError(pesanError, "Koneksi API bermasalah. Periksa internet Anda lalu coba lagi.");
        } finally {
            if (indikatorLoading) indikatorLoading.classList.add("tersembunyi");
            if (tombolMasuk) tombolMasuk.disabled = false;
        }
    });
}

if (formRegist) {
    formRegist.addEventListener("submit", function (event) {
        event.preventDefault();
        sembunyikanSemuaPesan();

        const nama = inputNamaBaru.value.trim();
        const username = inputUserBaru.value.trim();
        const password = inputPassBaru.value.trim();

        if (nama === "" || username === "" || password === "") {
            tampilkanError(pesanErrorRegist, "Harap lengkapi semua kolom pendaftaran!");
            return;
        }

        let listAnggota = JSON.parse(localStorage.getItem("anggotaKoperasi")) || [];

        const usernameSudahAda = listAnggota.some(function (u) {
            return u.username.toLowerCase() === username.toLowerCase();
        });

        if (usernameSudahAda) {
            tampilkanError(pesanErrorRegist, "Username ini sudah terdaftar. Gunakan username lain!");
            return;
        }

        listAnggota.push({
            nama: nama,
            username: username,
            password: password
        });

        localStorage.setItem("anggotaKoperasi", JSON.stringify(listAnggota));

        if (pesanSuksesRegist) {
            pesanSuksesRegist.textContent = "Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.";
            pesanSuksesRegist.classList.remove("tersembunyi");
        }

        formRegist.reset();

        setTimeout(function () {
            bukaTabLogin();
            if (inputUser) inputUser.value = username;
            if (inputPass) inputPass.focus();
        }, 1200);
    });
}

function tampilkanError(elemenTarget, pesan) {
    if (elemenTarget) {
        elemenTarget.textContent = pesan;
        elemenTarget.classList.remove("tersembunyi");
    } else {
        alert(pesan);
    }
}
