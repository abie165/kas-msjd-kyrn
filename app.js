import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* =========================================================
   KONFIGURASI APLIKASI
   ---------------------------------------------------------
   BENDAHARA_EMAIL hanya dipakai di belakang layar untuk
   login password-only. Jangan pernah menaruh PASSWORD di sini.
   Isi sekali dengan email akun Bendahara Firebase Anda.
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyBbl3eDpRdAvJdJlZyHQFZ-B67ODGkwj-4",
  authDomain: "kas-rt-01-kiyaran.firebaseapp.com",
  projectId: "kas-rt-01-kiyaran",
  storageBucket: "kas-rt-01-kiyaran.firebasestorage.app",
  messagingSenderId: "16157998643",
  appId: "1:16157998643:web:6422143fdc9c29d7c4ed46"
};

const BENDAHARA_EMAIL = "munzifani@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const rupiah = n => new Intl.NumberFormat("id-ID", {style:"currency", currency:"IDR", maximumFractionDigits:0}).format(Number(n)||0);
let transactions = [], editing = false;

function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),3000)}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function formatDate(s){if(!s)return "-";const d=new Date(`${s}T00:00:00`);return d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}
function today(){return new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}

function fillMonths(){for(let i=1;i<=12;i++){const o=document.createElement("option");o.value=String(i).padStart(2,"0");o.textContent=new Date(2000,i-1).toLocaleString("id-ID",{month:"long"});$("month").appendChild(o)}}
function fillYears(){const years=[...new Set(transactions.map(x=>(x.tanggal||"").slice(0,4)).filter(Boolean))].sort((a,b)=>b-a);const current=String(new Date().getFullYear());if(!years.includes(current))years.unshift(current);const sel=$("year");const old=sel.value;sel.innerHTML='<option value="all">Semua tahun</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join("");if(years.includes(old))sel.value=old}
function filtered(){const y=$("year").value,m=$("month").value,t=$("typeFilter").value,s=$("search").value.trim().toLowerCase();return transactions.filter(x=>{const d=x.tanggal||"";return (y==="all"||d.slice(0,4)===y)&&(m==="all"||d.slice(5,7)===m)&&(t==="all"||x.jenis===t)&&`${x.keterangan||""} ${x.jenis||""}`.toLowerCase().includes(s)})}
function totals(data){return data.reduce((a,x)=>{const n=Number(x.nominal)||0;x.jenis==="pemasukan"?a.inc+=n:a.exp+=n;return a},{inc:0,exp:0})}
function render(){
  const data=filtered(), all=totals(transactions), selected=totals(data);
  $("pemasukan").textContent=rupiah(all.inc);$("pengeluaran").textContent=rupiah(all.exp);$("saldo").textContent=rupiah(all.inc-all.exp);$("transactionCount").textContent=transactions.length;
  $("incomeCount").textContent=`${transactions.filter(x=>x.jenis==="pemasukan").length} transaksi`;$("expenseCount").textContent=`${transactions.filter(x=>x.jenis==="pengeluaran").length} transaksi`;
  $("selectedIncome").textContent=rupiah(selected.inc);$("selectedExpense").textContent=rupiah(selected.exp);$("selectedBalance").textContent=rupiah(selected.inc-selected.exp);
  const max=Math.max(selected.inc,selected.exp,1);$("incomeBar").style.width=`${selected.inc/max*100}%`;$("expenseBar").style.width=`${selected.exp/max*100}%`;
  $("filteredCount").textContent=data.length;
  const parts=[];if($("year").value!=="all")parts.push($("year").value);if($("month").value!=="all")parts.push($("month").selectedOptions[0].text);if($("typeFilter").value!=="all")parts.push($("typeFilter").selectedOptions[0].text);if($("search").value.trim())parts.push(`pencarian: ${$("search").value.trim()}`);$("filterSummary").textContent=parts.length?parts.join(" • "):"Semua data";
  $("status").textContent=`Menampilkan ${data.length} dari ${transactions.length} transaksi`;
  $("rows").innerHTML=data.length?data.map(x=>`<tr><td>${formatDate(x.tanggal)}</td><td>${x.jenis==="pemasukan"?"📥 Pemasukan":"📤 Pengeluaran"}</td><td>${escapeHtml(x.keterangan)}</td><td class="amount ${x.jenis==="pemasukan"?"plus":"minus"}">${x.jenis==="pemasukan"?"+":"-"} ${rupiah(x.nominal)}</td><td>${auth.currentUser?`<button class="smallbtn edit" data-edit="${x.id}" title="Edit">✏️</button><button class="smallbtn del" data-del="${x.id}" title="Hapus">🗑️</button>`:"—"}</td></tr>`).join(""):'<tr><td colspan="5" class="empty">Belum ada transaksi yang cocok.</td></tr>';
}
function resetForm(){$("editId").value="";$('tanggal').value=new Date().toISOString().slice(0,10);$("jenis").value="pemasukan";$("nominal").value="";$("keterangan").value="";$("saveBtn").textContent="➕ Simpan Transaksi";editing=false}
function openModal(id){$(id).classList.remove("hidden");setTimeout(()=>$(id).querySelector("input")?.focus(),50)}function closeModal(id){$(id).classList.add("hidden")}

fillMonths();$("todayText").textContent=today();resetForm();
["year","month","typeFilter"].forEach(id=>$(id).addEventListener("change",render));$("search").addEventListener("input",render);
$("printBtn").onclick=()=>window.print();
$("loginBtn").onclick=()=>{if(BENDAHARA_EMAIL.includes("GANTI_DENGAN")){alert("Email Bendahara belum diatur di app.js. Isi BENDAHARA_EMAIL dengan email akun Bendahara Firebase terlebih dahulu.");return}$("loginPassword").value="";openModal("loginModal")};
$("doLoginBtn").onclick=async()=>{const pass=$("loginPassword").value;if(!pass)return toast("Masukkan password.");try{await signInWithEmailAndPassword(auth,BENDAHARA_EMAIL,pass);closeModal("loginModal");toast("Login Bendahara berhasil.")}catch(e){console.error(e);toast("Login gagal. Periksa password.")}};
$("loginPassword").addEventListener("keydown",e=>{if(e.key==="Enter")$("doLoginBtn").click()});
$("logoutBtn").onclick=async()=>{await signOut(auth);toast("Anda sudah logout.")};
$("changePasswordBtn").onclick=()=>{["oldPassword","newPassword","newPassword2"].forEach(id=>$(id).value="");openModal("passwordModal")};
$("savePasswordBtn").onclick=async()=>{const oldP=$("oldPassword").value,newP=$("newPassword").value,newP2=$("newPassword2").value,user=auth.currentUser;if(!user)return; if(!oldP||!newP)return toast("Semua password harus diisi.");if(newP.length<6)return toast("Password baru minimal 6 karakter.");if(newP!==newP2)return toast("Ulangi password baru harus sama.");try{await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,oldP));await updatePassword(user,newP);closeModal("passwordModal");toast("Password berhasil diubah.")}catch(e){console.error(e);toast("Gagal mengubah password. Periksa password lama.")}};
$("rows").onclick=async e=>{const edit=e.target.dataset.edit,del=e.target.dataset.del;if(edit){const x=transactions.find(t=>t.id===edit);if(!x)return;$("editId").value=x.id;$("tanggal").value=x.tanggal||"";$("jenis").value=x.jenis||"pemasukan";$("nominal").value=x.nominal||"";$("keterangan").value=x.keterangan||"";$("saveBtn").textContent="💾 Simpan Perubahan";editing=true;$('adminPanel').scrollIntoView({behavior:"smooth",block:"start"})}if(del&&confirm("Hapus transaksi ini?")){try{await deleteDoc(doc(db,"transaksi",del));toast("Transaksi dihapus.")}catch(err){console.error(err);toast("Gagal menghapus transaksi.")}}};
$("txForm").onsubmit=async e=>{e.preventDefault();if(!auth.currentUser)return toast("Silakan login sebagai Bendahara.");const data={tanggal:$("tanggal").value,jenis:$("jenis").value,nominal:Number($("nominal").value),keterangan:$("keterangan").value.trim(),updatedAt:serverTimestamp()};if(!data.tanggal||!data.nominal||!data.keterangan)return toast("Lengkapi data transaksi.");try{if(editing){await updateDoc(doc(db,"transaksi",$("editId").value),data);toast("Transaksi diperbarui.")}else{await addDoc(collection(db,"transaksi"),{...data,createdAt:serverTimestamp()});toast("Transaksi berhasil ditambahkan.")}resetForm()}catch(err){console.error(err);toast("Gagal menyimpan. Periksa Security Rules Firebase.")}};
$("cancelBtn").onclick=resetForm;
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));

onAuthStateChanged(auth,user=>{$("adminPanel").classList.toggle("hidden",!user);$("loginBtn").classList.toggle("hidden",!!user);$("aksiHead").textContent=user?"Aksi":"Akses";if(user)$("loginStatus").textContent=`Login sebagai ${user.email}`;render()});
const q=query(collection(db,"transaksi"),orderBy("tanggal","desc"));
onSnapshot(q,snap=>{transactions=snap.docs.map(d=>({id:d.id,...d.data()}));fillYears();render()},err=>{$("status").textContent="Database belum tersambung. Periksa Firebase dan Security Rules.";console.error(err)});
