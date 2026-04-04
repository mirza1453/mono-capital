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
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,${C.surf} 0%,#c5cae9 100%)`}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:80,height:80,borderRadius:20,background:C.pri,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,boxShadow:"0 6px 24px rgba(13,71,161,0.35)"}}>
          <span style={{fontSize:36,fontWeight:800,color:"#fff",fontFamily:F,letterSpacing:-2}}>MC</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:800,color:C.on,fontFamily:F,margin:"0 0 4px"}}>Mono Capital</h1>
        <p style={{fontSize:13,color:C.out,fontFamily:F,margin:0,textAlign:"center",maxWidth:260}}>İş Yönetimi Platformu</p>
      </div>
      <div style={{padding:"0 24px 40px",display:"flex",flexDirection:"column",gap:12,maxWidth:400,width:"100%",margin:"0 auto"}}>
        <button onClick={()=>setMode('officeLogin')} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:16,border:"none",background:C.pri,cursor:"pointer",fontFamily:F,boxShadow:"0 2px 12px rgba(13,71,161,0.3)"}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:15,fontWeight:600,color:"#fff"}}>Müşavir Girişi</div><div style={{fontSize:13,color:"rgba(255,255,255,0.7)",marginTop:2}}>Mali müşavir / muhasebeci</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <button onClick={()=>setMode('clientLogin')} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:16,border:`1px solid ${C.outVar}`,background:C.surfMin,cursor:"pointer",fontFamily:F}}>
          <div style={{width:48,height:48,borderRadius:14,background:C.priC,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.pri} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:15,fontWeight:600,color:C.on}}>Mükellef Girişi</div><div style={{fontSize:13,color:C.out,marginTop:2}}>Firma sahibi / yetkili</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.outVar} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
