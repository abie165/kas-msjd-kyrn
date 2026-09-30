import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/*
  1) Buat project Firebase.
  2) Daftarkan Web App.
  3) Salin konfigurasi Firebase ke object di bawah.
  Jangan menaruh password bendahara di file ini.
*/
const firebaseConfig = {
  apiKey: "AIzaSyBbl3eDpRdAvJdJlZyHQFZ-B67ODGkwj-4",
  authDomain: "kas-rt-01-kiyaran.firebaseapp.com",
  projectId: "kas-rt-01-kiyaran",
  storageBucket: "kas-rt-01-kiyaran.firebasestorage.app",
  messagingSenderId: "16157998643",
  appId: "1:16157998643:web:6422143fdc9c29d7c4ed46"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);
const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
let transactions=[], editing=false;

function fillMonths(){
  for(let i=1;i<=12;i++){let o=document.createElement("option");o.value=String(i).padStart(2,"0");o.textContent=new Date(2000,i-1).toLocaleString("id-ID",{month:"long"});$("month").appendChild(o)}
}
function render(){
  const m=$("month").value, s=$("search").value.toLowerCase();
  let data=transactions.filter(x=>(m==="all" || (x.tanggal||"").slice(5,7)===m) && `${x.keterangan} ${x.jenis}`.toLowerCase().includes(s));
  let inc=transactions.filter(x=>x.jenis==="pemasukan").reduce((a,x)=>a+Number(x.nominal||0),0);
  let exp=transactions.filter(x=>x.jenis==="pengeluaran").reduce((a,x)=>a+Number(x.nominal||0),0);
  $("pemasukan").textContent=rupiah(inc);$("pengeluaran").textContent=rupiah(exp);$("saldo").textContent=rupiah(inc-exp);
  $("rows").innerHTML=data.length?data.map(x=>`<tr><td>${x.tanggal||"-"}</td><td>${x.jenis==="pemasukan"?"📥 Pemasukan":"📤 Pengeluaran"}</td><td>${escapeHtml(x.keterangan||"")}</td><td class="amount ${x.jenis==="pemasukan"?"plus":"minus"}">${x.jenis==="pemasukan"?"+":"-"} ${rupiah(x.nominal)}</td><td>${auth.currentUser?`<button class="smallbtn edit" data-edit="${x.id}">✏️</button><button class="smallbtn del" data-del="${x.id}">🗑️</button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="5" class="empty">Belum ada transaksi yang cocok.</td></tr>`;
  $("status").textContent=`Menampilkan ${data.length} transaksi`;
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function resetForm(){$("editId").value="";$("tanggal").value=new Date().toISOString().slice(0,10);$("jenis").value="pemasukan";$("nominal").value="";$("keterangan").value="";$("saveBtn").textContent="➕ Simpan Transaksi";editing=false}
fillMonths();resetForm();$("month").addEventListener("change",render);$("search").addEventListener("input",render);

$("loginBtn").onclick=async()=>{let email=prompt("Email bendahara:");if(!email)return;let pass=prompt("Password:");if(!pass)return;try{await signInWithEmailAndPassword(auth,email,pass)}catch(e){alert("Login gagal. Periksa email dan password.")}};
$("logoutBtn").onclick=()=>signOut(auth);
onAuthStateChanged(auth,user=>{$("adminPanel").classList.toggle("hidden",!user);$("loginBtn").classList.toggle("hidden",!!user);$("aksiHead").textContent=user?"Aksi":"Akses";render()});

const q=query(collection(db,"transaksi"),orderBy("tanggal","desc"));
onSnapshot(q,snap=>{transactions=snap.docs.map(d=>({id:d.id,...d.data()}));render()},err=>{$("status").textContent="Database belum tersambung. Periksa konfigurasi Firebase.";console.error(err)});

$("txForm").onsubmit=async e=>{
 e.preventDefault(); if(!auth.currentUser)return alert("Silakan login sebagai bendahara.");
 const data={tanggal:$("tanggal").value,jenis:$("jenis").value,nominal:Number($("nominal").value),keterangan:$("keterangan").value.trim(),updatedAt:serverTimestamp()};
 try{
  if(editing) await updateDoc(doc(db,"transaksi",$("editId").value),data);
  else await addDoc(collection(db,"transaksi"),{...data,createdAt:serverTimestamp()});
  resetForm();
 }catch(err){alert("Gagal menyimpan. Periksa Firebase Security Rules.");}
};
$("cancelBtn").onclick=resetForm;
$("rows").onclick=async e=>{
 const edit=e.target.dataset.edit, del=e.target.dataset.del;
 if(edit){let x=transactions.find(t=>t.id===edit);$("editId").value=x.id;$("tanggal").value=x.tanggal;$("jenis").value=x.jenis;$("nominal").value=x.nominal;$("keterangan").value=x.keterangan;$("saveBtn").textContent="💾 Simpan Perubahan";editing=true;scrollTo({top:document.body.scrollHeight,behavior:"smooth"})}
 if(del && confirm("Hapus transaksi ini?")){try{await deleteDoc(doc(db,"transaksi",del))}catch(err){alert("Gagal menghapus.")}}
};
