import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import MonoApp from './MonoApp';

// Supabase Auth ile giriş/kayıt ekranları
const F = "-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif";
const C = {
  pri:"#0d47a1",priC:"#d4e5fa",onPri:"#fff",
  surf:"#f5f5f5",surfMin:"#fff",surfLow:"#fafafa",surfHi:"#eee",surfMax:"#f8f8f8",
  on:"#1c1b1f",onVar:"#49454f",out:"#79747e",outVar:"#cac4d0",
  err:"#b3261e",errC:"#ffdad6",ok:"#1b5e20",okC:"#c8e6c9",
  scrim:"rgba(0,0,0,0.4)"
};

function AuthScreen() {
  const [mode, setMode] = useState('splash'); // splash, select, officeLogin, officeRegister, clientLogin
  const [ep, setEp] = useState('');
  const [pw, setPw] = useState('');
  const [ad, setAd] = useState('');
  const [firma, setFirma] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [bh, setBH] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMode('select'), 1500);
    return () => clearTimeout(t);
  }, []);

  const giris = async () => {
    setErr(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: ep, password: pw });
    setLoading(false);
    if (error) setErr('E-posta veya şifre hatalı');
  };

  const kayit = async (rol) => {
    if (!ep.trim() || !pw || pw.length < 6) { setErr('E-posta ve şifre (min 6 karakter) zorunlu'); return; }
    if (rol === 'office' && (!ad.trim() || !firma.trim())) { setErr('Tüm alanları doldurunuz'); return; }
    setErr(''); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: ep,
      password: pw,
      options: { data: { ad: ad.trim() || ep.split('@')[0], rol, ana_firma: firma.trim() } }
    });
    setLoading(false);
    if (error) setErr(error.message);
  };

  // Splash
  if (mode === 'splash') return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#0d47a1 0%,#1565c0 50%,#1976d2 100%)"}}>
      <style>{`
        @keyframes logoIn{0%{transform:scale(0.3) translateY(40px);opacity:0}40%{transform:scale(1.08) translateY(-8px);opacity:1}60%{transform:scale(0.95) translateY(2px)}80%{transform:scale(1.02) translateY(-1px)}100%{transform:scale(1) translateY(0)}}
        @keyframes textIn{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes dotPulse{0%,80%,100%{opacity:0.3}40%{opacity:1}}
      `}</style>
      <div style={{animation:"logoIn 800ms cubic-bezier(0.34,1.56,0.64,1) forwards",display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{width:80,height:80,borderRadius:20,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",marginBottom:20}}>
          <div style={{fontSize:36,fontWeight:800,color:"#fff",fontFamily:F,letterSpacing:-2}}>MC</div>
        </div>
        <div style={{animation:"textIn 500ms ease-out 400ms both",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,color:"#fff",fontFamily:F,letterSpacing:1,marginBottom:4}}>MONO CAPITAL</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:F,letterSpacing:3,fontWeight:500}}>İŞ YÖNETİMİ</div>
        </div>
        <div style={{display:"flex",gap:6,marginTop:24,animation:"textIn 500ms ease-out 700ms both"}}>
          {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,0.8)",animation:`dotPulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
        </div>
      </div>
    </div>
  );

  const inputStyle = (focused) => ({
    width:"100%",padding:"12px 14px",borderRadius:8,border:`1.5px solid ${focused ? C.pri : C.outVar}`,
    background:C.surfMax,color:C.on,fontSize:14,fontFamily:F,outline:"none",marginBottom:12,boxSizing:"border-box"
  });

  const btnStyle = (dis) => ({
    width:"100%",height:44,borderRadius:22,border:"none",background:dis?C.surfHi:C.pri,color:dis?C.out:C.onPri,
    fontSize:14,fontWeight:600,fontFamily:F,cursor:dis?"default":"pointer",opacity:dis?0.5:1
  });

  // Rol seçimi
  if (mode === 'select') return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,background:C.surf}}>
      <div style={{width:64,height:64,borderRadius:16,background:C.priC,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
        <span style={{fontSize:28,fontWeight:800,color:C.pri,fontFamily:F}}>MC</span>
      </div>
      <h1 style={{fontSize:24,fontWeight:700,color:C.on,fontFamily:F,margin:"0 0 6px"}}>Mono Capital</h1>
      <p style={{fontSize:13,color:C.out,fontFamily:F,margin:"0 0 32px"}}>İş Yönetimi Platformu</p>
      <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={()=>setMode('officeLogin')} style={{display:"flex",alignItems:"center",gap:14,padding:16,borderRadius:14,border:`1px solid ${C.outVar}`,background:C.surfMin,cursor:"pointer",fontFamily:F,width:"100%",textAlign:"left"}}>
          <div style={{width:44,height:44,borderRadius:12,background:C.priC,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:18,fontWeight:700,color:C.pri}}>M</span>
          </div>
          <div><div style={{fontSize:15,fontWeight:600,color:C.on}}>Müşavir Girişi</div><div style={{fontSize:12,color:C.out}}>Mali müşavir / muhasebeci</div></div>
        </button>
        <button onClick={()=>setMode('clientLogin')} style={{display:"flex",alignItems:"center",gap:14,padding:16,borderRadius:14,border:`1px solid ${C.outVar}`,background:C.surfMin,cursor:"pointer",fontFamily:F,width:"100%",textAlign:"left"}}>
          <div style={{width:44,height:44,borderRadius:12,background:"#e8f5e9",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:18,fontWeight:700,color:C.ok}}>K</span>
          </div>
          <div><div style={{fontSize:15,fontWeight:600,color:C.on}}>Mükellef Girişi</div><div style={{fontSize:12,color:C.out}}>Firma sahibi / yetkili</div></div>
        </button>
      </div>
    </div>
  );

  // Müşavir giriş/kayıt
  if (mode === 'officeLogin' || mode === 'officeRegister') {
    const isKayit = mode === 'officeRegister';
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:20,background:C.surf}}>
        <button onClick={()=>setMode('select')} style={{position:"absolute",top:16,left:16,background:"none",border:"none",cursor:"pointer",color:C.pri,fontSize:13,fontFamily:F,fontWeight:600}}>← Geri</button>
        <h1 style={{fontSize:22,fontWeight:700,color:C.on,fontFamily:F,margin:"0 0 24px"}}>{isKayit ? "Müşavir Kaydı" : "Müşavir Girişi"}</h1>
        <div style={{width:"100%",maxWidth:320,background:C.surfLow,borderRadius:20,padding:20}}>
          {isKayit && <input placeholder="Ad Soyad" value={ad} onChange={e=>setAd(e.target.value)} style={inputStyle()}/>}
          {isKayit && <input placeholder="Firma Adınız" value={firma} onChange={e=>setFirma(e.target.value)} style={inputStyle()}/>}
          <input placeholder="E-posta" type="email" value={ep} onChange={e=>setEp(e.target.value)} style={inputStyle()}/>
          <input placeholder="Şifre" type="password" value={pw} onChange={e=>setPw(e.target.value)} style={inputStyle()}/>
          {err && <div style={{color:C.err,fontSize:12,fontFamily:F,marginBottom:8}}>{err}</div>}
          <button onClick={isKayit ? ()=>kayit('office') : giris} disabled={loading} style={btnStyle(loading)}>
            {loading ? "Yükleniyor..." : isKayit ? "Kayıt Ol" : "Giriş Yap"}
          </button>
          <div style={{textAlign:"center",marginTop:14}}>
            <button onClick={()=>{setMode(isKayit?'officeLogin':'officeRegister');setErr('');}} style={{background:"none",border:"none",color:C.pri,fontSize:12,fontFamily:F,cursor:"pointer",fontWeight:600}}>
              {isKayit ? "Zaten hesabınız var mı? Giriş" : "Hesabınız yok mu? Kaydolun"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mükellef giriş
  if (mode === 'clientLogin') return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:20,background:C.surf}}>
      <button onClick={()=>setMode('select')} style={{position:"absolute",top:16,left:16,background:"none",border:"none",cursor:"pointer",color:C.pri,fontSize:13,fontFamily:F,fontWeight:600}}>← Geri</button>
      <h1 style={{fontSize:22,fontWeight:700,color:C.on,fontFamily:F,margin:"0 0 24px"}}>Mükellef Girişi</h1>
      <div style={{width:"100%",maxWidth:320,background:C.surfLow,borderRadius:20,padding:20}}>
        <input placeholder="E-posta" type="email" value={ep} onChange={e=>setEp(e.target.value)} style={inputStyle()}/>
        <input placeholder="Şifre" type="password" value={pw} onChange={e=>setPw(e.target.value)} style={inputStyle()}/>
        {err && <div style={{color:C.err,fontSize:12,fontFamily:F,marginBottom:8}}>{err}</div>}
        <button onClick={giris} disabled={loading} style={btnStyle(loading)}>
          {loading ? "Yükleniyor..." : "Giriş Yap"}
        </button>
        <p style={{fontSize:11,color:C.out,textAlign:"center",marginTop:12,fontFamily:F}}>
          Mükellef hesabı müşaviriniz tarafından oluşturulur
        </p>
      </div>
    </div>
  );

  return null;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#0d47a1,#1976d2)"}}>
      <div style={{fontSize:36,fontWeight:800,color:"#fff",fontFamily:F}}>MC</div>
    </div>
  );

  if (!session) return <AuthScreen/>;

  // Giriş yapıldı - mevcut uygulamayı göster
  // MonoApp'a session bilgisini geçir
  return <MonoApp session={session} onLogout={()=>supabase.auth.signOut()}/>;
}
