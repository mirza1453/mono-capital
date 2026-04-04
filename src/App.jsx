import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import MonoApp from './MonoApp';

const F = "'Inter','Segoe UI','Roboto',-apple-system,sans-serif";
const C = {
  pri:"#0d47a1",priC:"#d1e4ff",onPri:"#fff",onPriC:"#001d36",
  surf:"#f7f9ff",surfMin:"#fff",surfLow:"#eff2fa",surfHi:"#e0e3ec",surfMax:"#d9dce5",
  on:"#1a1c20",onVar:"#44474f",out:"#74777f",outVar:"#c4c6d0",
  err:"#b3261e",errC:"#ffdad6",ok:"#1b5e20",okC:"#c8e6c9",
  scrim:"rgba(0,0,0,0.4)"
};
const W = {maxWidth:480,margin:"0 auto"};

/* ═ Material TextField ═ */
function TF({label,value,onChange,type="text",focused,onFocus,onBlur}) {
  const has = value && value.length > 0;
  return <div style={{position:"relative",marginBottom:14}}>
    <label style={{position:"absolute",left:14,zIndex:1,top:(focused||has)?5:14,fontSize:(focused||has)?10:14,color:focused?C.pri:C.onVar,transition:"all 150ms",fontFamily:F,pointerEvents:"none"}}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}
      style={{width:"100%",boxSizing:"border-box",padding:"18px 14px 6px",borderRadius:"4px 4px 0 0",border:"none",borderBottom:`2px solid ${focused?C.pri:C.out}`,background:C.surfMax,color:C.on,fontSize:14,fontFamily:F,outline:"none"}}/>
  </div>;
}

/* ═ Back Arrow SVG ═ */
const BackArrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.pri} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;

function AuthScreen() {
  const [mode, setMode] = useState('splash');
  const [ep, setEp] = useState('');
  const [pw, setPw] = useState('');
  const [ad, setAd] = useState('');
  const [firma, setFirma] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [foc, setFoc] = useState('');

  useEffect(() => { const t = setTimeout(() => setMode('select'), 1500); return () => clearTimeout(t); }, []);

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
      email: ep, password: pw,
      options: { data: { ad: ad.trim() || ep.split('@')[0], rol, ana_firma: firma.trim() } }
    });
    setLoading(false);
    if (error) setErr(error.message);
  };

  const btnStyle = (dis) => ({
    width:"100%",height:44,borderRadius:22,border:"none",background:dis?C.surfHi:C.pri,color:dis?C.out:C.onPri,
    fontSize:14,fontWeight:600,fontFamily:F,cursor:dis?"default":"pointer",opacity:dis?0.5:1
  });

  /* ═ Header with back button ═ */
  const Header = ({title}) => (
    <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${C.outVar}`,display:"flex",alignItems:"center",gap:10}}>
      <button onClick={()=>{setMode('select');setErr('');setEp('');setPw('');setAd('');setFirma('');}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}><BackArrow/></button>
      <div style={{fontSize:15,fontWeight:700,color:C.on,fontFamily:F}}>{title}</div>
    </div>
  );

  // ═ Splash
  if (mode === 'splash') return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#0d47a1 0%,#1565c0 50%,#1976d2 100%)",...W}}>
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

  // ═ Rol Seçimi
  if (mode === 'select') return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:`linear-gradient(160deg,${C.surf} 0%,#c5cae9 100%)`,...W}}>
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

  // ═ Müşavir Giriş / Kayıt
  if (mode === 'officeLogin' || mode === 'officeRegister') {
    const isKayit = mode === 'officeRegister';
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.surf,...W}}>
        <Header title={isKayit ? "Müşavir Kaydı" : "Müşavir Girişi"}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:20}}>
          <div style={{width:"100%",maxWidth:320}}>
            {isKayit && <TF label="Ad Soyad" value={ad} onChange={setAd} focused={foc==="a"} onFocus={()=>setFoc("a")} onBlur={()=>setFoc("")}/>}
            {isKayit && <TF label="Firma Adınız" value={firma} onChange={setFirma} focused={foc==="f"} onFocus={()=>setFoc("f")} onBlur={()=>setFoc("")}/>}
            <TF label="E-posta" value={ep} onChange={setEp} type="email" focused={foc==="e"} onFocus={()=>setFoc("e")} onBlur={()=>setFoc("")}/>
            <TF label="Şifre" value={pw} onChange={setPw} type="password" focused={foc==="p"} onFocus={()=>setFoc("p")} onBlur={()=>setFoc("")}/>
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
      </div>
    );
  }

  // ═ Mükellef Giriş
  if (mode === 'clientLogin') return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.surf,...W}}>
      <Header title="Mükellef Girişi"/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:20}}>
        <div style={{width:"100%",maxWidth:320}}>
          <TF label="E-posta" value={ep} onChange={setEp} type="email" focused={foc==="e"} onFocus={()=>setFoc("e")} onBlur={()=>setFoc("")}/>
          <TF label="Şifre" value={pw} onChange={setPw} type="password" focused={foc==="p"} onFocus={()=>setFoc("p")} onBlur={()=>setFoc("")}/>
          {err && <div style={{color:C.err,fontSize:12,fontFamily:F,marginBottom:8}}>{err}</div>}
          <button onClick={giris} disabled={loading} style={btnStyle(loading)}>
            {loading ? "Yükleniyor..." : "Giriş Yap"}
          </button>
          <p style={{fontSize:11,color:C.out,textAlign:"center",marginTop:12,fontFamily:F}}>
            Mükellef hesabı müşaviriniz tarafından oluşturulur
          </p>
        </div>
      </div>
    </div>
  );

  return null;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(180deg,#0d47a1,#1976d2)",...W}}>
      <div style={{fontSize:36,fontWeight:800,color:"#fff",fontFamily:F}}>MC</div>
    </div>
  );

  if (!session) return <AuthScreen/>;
  return <MonoApp session={session} onLogout={()=>supabase.auth.signOut()}/>;
}
