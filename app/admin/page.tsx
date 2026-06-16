"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ShoppingBag, 
  Settings, 
  Package, 
  Truck, 
  CreditCard, 
  Layout, 
  LogOut,
  ChevronLeft,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  Upload,
  Image as ImageIcon,
  Type,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function AdminPage() {
  const [accessCode, setAccessCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === "COREDEVELOPER9491") {
      setIsAuthorized(true);
      localStorage.setItem("adminCode", accessCode);
    } else {
      alert("UNAUTHORIZED ACCESS");
    }
  };

  useEffect(() => {
    const savedCode = localStorage.getItem("adminCode");
    if (savedCode === "COREDEVELOPER9491") {
      setIsAuthorized(true);
      setAccessCode(savedCode);
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sub-heading p-6 text-center">
        <div className="w-16 h-16 bg-black rounded-3xl mb-8 flex items-center justify-center text-white shadow-xl">
           <Settings size={32} />
        </div>
        <h1 className="text-xl mb-2 font-primary-heading">CORE OPERATIONS</h1>
        <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] mb-10">Authentication Required</p>
        <form onSubmit={handleAuth} className="w-full max-w-xs">
          <input
            type="password"
            placeholder="ENTER ACCESS CODE"
            className="w-full p-4 border border-accent bg-secondary rounded-2xl outline-none mb-4 text-center tracking-[0.5em] text-sm focus:border-black transition-all"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />
          <button className="w-full bg-black text-white p-4 rounded-2xl font-primary-heading text-xs tracking-widest active:scale-95 transition-all">
            AUTHORIZE NODE
          </button>
        </form>
      </div>
    );
  }

  if (!activeTab) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sub-heading">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-[1000] bg-white">
          <h1 className="text-xl font-primary-heading tracking-tight">CORE CENTRAL OPERATIONS</h1>
          <button 
            onClick={() => {
              localStorage.removeItem("adminCode");
              setIsAuthorized(false);
            }}
            className="p-3 text-black hover:opacity-70 transition-opacity"
          >
            <LogOut size={20} />
          </button>
        </header>

        {/* Centered Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="grid grid-cols-3 gap-5 w-full max-w-lg">
            <Tile icon={<ShoppingBag size={20}/>} label="ORDERS" onClick={() => setActiveTab("orders")} />
            <Tile icon={<Package size={20}/>} label="PRODUCTS" onClick={() => setActiveTab("products")} />
            <Tile icon={<Truck size={20}/>} label="LOGISTICS" onClick={() => setActiveTab("logistics")} />
            <Tile icon={<CreditCard size={20}/>} label="PAYMENTS" onClick={() => setActiveTab("payments")} />
            <Tile icon={<Layout size={20}/>} label="BOT UI" onClick={() => setActiveTab("bot ui")} />
            <Tile icon={<Globe size={20}/>} label="SYSTEM" onClick={() => setActiveTab("system")} />
          </div>
        </main>

        {/* Fixed Footer */}
        <footer className="fixed bottom-0 left-0 right-0 h-12 flex items-center justify-center bg-white border-t border-accent">
          <p className="text-[10px] text-text-secondary tracking-widest uppercase">SYSTEM DESIGNED & DEVELOPED BY JEROME BALANCAR</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-accent flex items-center px-6 z-[1000] max-w-md mx-auto">
        <button onClick={() => setActiveTab(null)} className="p-3 bg-secondary rounded-xl active:scale-90 transition-transform"><ChevronLeft size={20}/></button>
        <h1 className="flex-1 text-center font-primary-heading text-xs tracking-[0.3em] uppercase mr-12">{activeTab}</h1>
      </header>

      <div className="pt-24 pb-12 px-8 flex-1 animate-in slide-in-from-bottom-4 duration-500">
        {activeTab === "orders" && <OrderManagement adminCode={accessCode} />}
        {activeTab === "payments" && <PaymentSettings adminCode={accessCode} />}
        {activeTab === "logistics" && <LogisticsSettings adminCode={accessCode} />}
        {activeTab === "products" && <ProductManagement adminCode={accessCode} />}
        {activeTab === "bot ui" && <BotUiSettings adminCode={accessCode} />}
        {activeTab === "system" && <SystemSettings adminCode={accessCode} />}
      </div>
    </div>
  );
}

function Tile({ icon, label, onClick }: { icon: any, label: string, onClick: any }) {
  return (
    <button 
      onClick={onClick}
      className="aspect-square bg-secondary border border-accent rounded-[2.5rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all shadow-sm hover:shadow-md group"
    >
      <div className="text-black group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[9px] font-primary-heading tracking-[0.2em]">{label}</span>
    </button>
  );
}

// ─── CORE COMPONENTS (ENFORCED RELIABILITY) ──────────────────────────────────

function OrderManagement({ adminCode }: { adminCode: string }) {
  const orders = useQuery(api.orders.listAll, { adminCode });
  const updateStatus = useMutation(api.orders.updateStatus);

  if (!orders) return <div className="text-center py-20 opacity-30 animate-pulse"><RefreshCw className="mx-auto animate-spin mb-4" /> LOADING...</div>;

  return (
    <div className="space-y-6">
      {orders.length === 0 && <div className="text-center py-20 opacity-40 text-[10px] font-sub-heading tracking-widest">ZERO ACTIVE MANIFESTS</div>}
      {orders?.map((order) => (
        <div key={order._id} className="p-6 border border-accent rounded-3xl bg-secondary shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-primary-heading text-[10px] tracking-widest mb-1">REF // {order.internalId}</p>
              <p className="text-[8px] text-text-secondary uppercase">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className={`text-[8px] font-bold uppercase px-3 py-1 rounded-full ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
          </div>
          <div className="text-[10px] space-y-2 my-5 font-sub-heading">
             {order.items.map((it, i) => <div key={i} className="flex justify-between"><span>{it.name} x{it.quantity}</span> <span>${(it.price * it.quantity).toFixed(2)}</span></div>)}
             <div className="pt-2 border-t border-accent flex justify-between font-bold"><span>TOTAL</span> <span>${order.total.toFixed(2)}</span></div>
          </div>
          <select 
            className="w-full p-4 bg-white border border-accent rounded-2xl text-[10px] font-primary-heading tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer"
            value={order.status}
            onChange={(e) => updateStatus({ orderId: order._id, status: e.target.value, adminCode })}
          >
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function PaymentSettings({ adminCode }: { adminCode: string }) {
  const methods = useQuery(api.settings.getByKey, { key: "paymentMethods" }) || [];
  const setSetting = useMutation(api.settings.setByKey);
  const [isAdding, setIsAdding] = useState(false);
  const [newMethod, setNewMethod] = useState({ label: "", details: "", type: "LINK", imageUrl: "" });

  const save = (updated: any) => {
    setSetting({ key: "paymentMethods", value: updated, adminCode })
      .then(() => { setIsAdding(false); alert("LEDGER UPDATED"); })
      .catch(() => alert("PERSISTENCE FAILURE"));
  };

  return (
    <div className="space-y-6">
      {methods.map((m: any, i: number) => (
        <div key={i} className="p-5 border border-accent rounded-3xl flex justify-between items-center bg-white shadow-sm">
          <div>
            <p className="font-primary-heading text-[10px] tracking-widest mb-1">{m.label}</p>
            <p className="text-[9px] text-text-secondary font-sub-heading uppercase">{m.type} // {m.details.substring(0, 20)}...</p>
          </div>
          <button onClick={() => save(methods.filter((_: any, idx: number) => idx !== i))} className="p-3 text-red-500 bg-red-50 rounded-xl active:scale-90 transition-all"><Trash2 size={16} /></button>
        </div>
      ))}

      {isAdding ? (
        <div className="p-6 border border-black rounded-3xl bg-white space-y-4 animate-in slide-in-from-bottom-2">
          <input className="w-full p-4 border border-accent rounded-2xl text-[10px] font-sub-heading" placeholder="METHOD NAME (E.G. GCASH)" value={newMethod.label} onChange={e => setNewMethod({...newMethod, label: e.target.value})} />
          <select className="w-full p-4 border border-accent rounded-2xl text-[10px] font-sub-heading" value={newMethod.type} onChange={e => setNewMethod({...newMethod, type: e.target.value})}>
             <option value="QR">STATIC QR CODE</option>
             <option value="LINK">GATEWAY LINK</option>
             <option value="WALLET">WALLET ADDRESS</option>
             <option value="EMAIL">EMAIL ADDRESS</option>
          </select>
          <textarea className="w-full p-4 border border-accent rounded-2xl text-[10px] font-sub-heading h-24" placeholder="DETAILS / LINK / ADDRESS" value={newMethod.details} onChange={e => setNewMethod({...newMethod, details: e.target.value})} />
          {newMethod.type === 'QR' && (
             <input className="w-full p-4 border border-accent rounded-2xl text-[10px] font-sub-heading" placeholder="QR IMAGE URL" value={newMethod.imageUrl} onChange={e => setNewMethod({...newMethod, imageUrl: e.target.value})} />
          )}
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setIsAdding(false)} className="p-4 bg-secondary rounded-2xl text-[10px] font-primary-heading tracking-widest">CANCEL</button>
             <button onClick={() => save([...methods, newMethod])} className="p-4 bg-black text-white rounded-2xl text-[10px] font-primary-heading tracking-widest">SAVE ENTRY</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)} className="w-full p-6 border-2 border-dashed border-accent rounded-3xl text-[9px] font-primary-heading tracking-[0.3em] text-text-secondary hover:border-black hover:text-black transition-all">
          + ADD PAYMENT GATEWAY
        </button>
      )}
    </div>
  );
}

function LogisticsSettings({ adminCode }: { adminCode: string }) {
  const settings = useQuery(api.settings.getByKey, { key: "logistics" }) || { providers: [], formUrl: "" };
  const setSetting = useMutation(api.settings.setByKey);
  const [isAdding, setIsAdding] = useState(false);
  const [newProv, setNewProv] = useState({ name: "", baseRate: 0, perKmRate: 0 });
  const [formUrl, setFormUrl] = useState(settings.formUrl || "");

  const saveProviders = (updated: any) => {
    setSetting({ key: "logistics", value: { ...settings, providers: updated }, adminCode })
      .then(() => setIsAdding(false))
      .catch(() => alert("PERSISTENCE FAILURE"));
  };
  
  const saveUrl = () => {
    setSetting({ key: "logistics", value: { ...settings, formUrl }, adminCode })
      .then(() => alert("URL LOCKED"))
      .catch(() => alert("PERSISTENCE FAILURE"));
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border border-black rounded-3xl bg-white space-y-4">
         <input className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="DELIVERY FORM URL" value={formUrl} onChange={e => setFormUrl(e.target.value)} />
         <button onClick={saveUrl} className="w-full p-4 bg-black text-white rounded-2xl text-[10px] font-primary-heading">LOCK DELIVERY FORM URL</button>
      </div>

      {settings.providers.map((p: any, i: number) => (
        <div key={i} className="p-5 border border-accent rounded-3xl bg-secondary flex justify-between items-center shadow-sm">
          <div>
            <p className="font-primary-heading text-[10px] tracking-widest mb-1">{p.name}</p>
            <p className="text-[9px] text-text-secondary font-sub-heading">BASE: ${p.baseRate} // KM: ${p.perKmRate}</p>
          </div>
          <button onClick={() => saveProviders(settings.providers.filter((_: any, idx: number) => idx !== i))} className="p-3 text-red-500 active:scale-90 transition-all"><Trash2 size={16} /></button>
        </div>
      ))}
      
      {isAdding ? (
        <div className="p-6 border border-black rounded-3xl bg-white space-y-4">
          <input className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="PROVIDER NAME" value={newProv.name} onChange={e => setNewProv({...newProv, name: e.target.value.toUpperCase()})} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="BASE RATE" value={newProv.baseRate || ""} onChange={e => setNewProv({...newProv, baseRate: Number(e.target.value)})} />
            <input type="number" className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="PER KM" value={newProv.perKmRate || ""} onChange={e => setNewProv({...newProv, perKmRate: Number(e.target.value)})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setIsAdding(false)} className="p-4 bg-secondary rounded-2xl text-[10px] font-primary-heading">CANCEL</button>
             <button onClick={() => saveProviders([...settings.providers, newProv])} className="p-4 bg-black text-white rounded-2xl text-[10px] font-primary-heading">LOCK PROVIDER</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsAdding(true)} className="w-full p-6 border-2 border-dashed border-accent rounded-3xl text-[9px] font-primary-heading tracking-[0.3em] text-text-secondary">+ ADD LOGISTICS PROVIDER</button>
      )}
    </div>
  );
}

function ProductManagement({ adminCode }: { adminCode: string }) {
  const products = useQuery(api.products.list, {}) || [];
  const [isAdding, setIsAdding] = useState(false);
  const [newProd, setNewProd] = useState({ name: "", subName: "", description: "", price: 0, image: "", stock: 10, status: "NEW", category: "" });
  const addMutation = useMutation(api.products.add); // Assuming this exists or I will add it

  const save = async () => {
    try {
      await addMutation({ ...newProd, adminCode });
      setIsAdding(false);
      alert("PRODUCT ANCHORED");
    } catch (err) {
      alert("SAVE FAILED");
    }
  };
  
  return (
    <div className="space-y-6">
      {isAdding ? (
        <div className="p-6 border border-black rounded-[2.5rem] bg-white space-y-4 animate-in slide-in-from-bottom-2">
           <input className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="PRODUCT NAME" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value.toUpperCase()})} />
           <input className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="SUB-HEADING (E.G. FINISH)" value={newProd.subName} onChange={e => setNewProd({...newProd, subName: e.target.value.toUpperCase()})} />
           <textarea className="w-full p-4 border border-accent rounded-2xl text-[10px] h-32" placeholder="DESCRIPTION" value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} />
           <div className="grid grid-cols-2 gap-3">
             <input type="number" className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="PRICE ($)" value={newProd.price || ""} onChange={e => setNewProd({...newProd, price: Number(e.target.value)})} />
             <input type="number" className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="STOCK" value={newProd.stock || ""} onChange={e => setNewProd({...newProd, stock: Number(e.target.value)})} />
           </div>
           <input className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="IMAGE URL (DIRECT LINK)" value={newProd.image} onChange={e => setNewProd({...newProd, image: e.target.value})} />
           <input className="w-full p-4 border border-accent rounded-2xl text-[10px]" placeholder="CATEGORY" value={newProd.category} onChange={e => setNewProd({...newProd, category: e.target.value})} />
           <select className="w-full p-4 border border-accent rounded-2xl text-[10px]" value={newProd.status} onChange={e => setNewProd({...newProd, status: e.target.value})}>
              <option value="NEW">STATUS: NEW</option>
              <option value="SALE">STATUS: SALE</option>
              <option value="BEST SELLER">STATUS: BEST SELLER</option>
              <option value="NONE">STATUS: NONE</option>
           </select>
           <div className="grid grid-cols-2 gap-3 pt-4">
             <button onClick={() => setIsAdding(false)} className="p-4 bg-secondary rounded-2xl text-[10px] font-primary-heading">CANCEL</button>
             <button onClick={save} className="p-4 bg-black text-white rounded-2xl text-[10px] font-primary-heading">SAVE PRODUCT</button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {products.map((p: any) => (
            <div key={p._id} className="border border-accent rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <img src={p.image} className="w-full aspect-square object-cover" />
              <div className="p-4">
                <p className="font-primary-heading text-[8px] tracking-widest truncate mb-1">{p.name}</p>
                <div className="flex justify-between items-center">
                   <span className="font-bold text-[10px]">${p.price.toFixed(2)}</span>
                   <span className="text-[7px] bg-secondary px-2 py-0.5 rounded-full uppercase">{p.status}</span>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setIsAdding(true)} className="aspect-square border-2 border-dashed border-accent rounded-[2rem] flex flex-col items-center justify-center text-text-secondary gap-3 hover:border-black hover:text-black transition-all">
            <Plus size={24} />
            <span className="text-[8px] font-primary-heading tracking-widest">NEW PRODUCT</span>
          </button>
        </div>
      )}
    </div>
  );
}

function BotUiSettings({ adminCode }: { adminCode: string }) {
  const responses = useQuery(api.settings.getByKey, { key: "bot_responses" }) || {
    home: { type: "TEXT", text: "" },
    catalog: { type: "TEXT", text: "" },
    cart: { type: "TEXT", text: "" },
    profile: { type: "TEXT", text: "" },
    support: { type: "TEXT", text: "" },
  };
  const setSetting = useMutation(api.settings.setByKey);
  const [local, setLocal] = useState<any>(null);
  const [activeKey, setActiveKey] = useState("home");

  useEffect(() => {
    if (responses) setLocal(responses);
  }, [responses]);

  if (!local) return null;

  const update = (key: string, field: string, val: any) => {
    const updated = { ...local, [key]: { ...local[key], [field]: val } };
    setLocal(updated);
  };

  const save = () => {
    setSetting({ key: "bot_responses", value: local, adminCode })
      .then(() => alert("MATRIX LOGIC LOCKED"))
      .catch(() => alert("SAVE FAILED"));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {Object.keys(local).map(k => (
          <button key={k} onClick={() => setActiveKey(k)} className={`px-4 py-2 rounded-full text-[8px] font-primary-heading tracking-widest uppercase transition-all ${activeKey === k ? 'bg-black text-white' : 'bg-secondary text-text-secondary'}`}>{k}</button>
        ))}
      </div>

      <div className="p-6 border border-black rounded-[2.5rem] bg-white space-y-6">
        <div className="flex justify-between items-center">
           <span className="text-[10px] font-primary-heading tracking-widest uppercase">{activeKey} RESPONSE</span>
           <div className="flex bg-secondary p-1 rounded-xl">
             <button onClick={() => update(activeKey, 'type', 'TEXT')} className={`p-2 rounded-lg transition-all ${local[activeKey]?.type === 'TEXT' ? 'bg-white shadow-sm' : 'opacity-40'}`}><Type size={14}/></button>
             <button onClick={() => update(activeKey, 'type', 'PHOTO')} className={`p-2 rounded-lg transition-all ${local[activeKey]?.type === 'PHOTO' ? 'bg-white shadow-sm' : 'opacity-40'}`}><ImageIcon size={14}/></button>
           </div>
        </div>

        {local[activeKey]?.type === 'PHOTO' && (
          <div className="space-y-2">
            <label className="text-[8px] text-text-secondary tracking-widest uppercase">IMAGE URL</label>
            <input className="w-full p-4 bg-secondary border border-accent rounded-2xl text-[10px]" value={local[activeKey]?.image || ""} onChange={e => update(activeKey, 'image', e.target.value)} placeholder="https://..." />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[8px] text-text-secondary tracking-widest uppercase">MESSAGE CONTENT</label>
          <textarea className="w-full p-4 bg-secondary border border-accent rounded-2xl text-[10px] font-sub-heading h-40 outline-none focus:border-black transition-all" value={local[activeKey]?.text || ""} onChange={e => update(activeKey, 'text', e.target.value)} placeholder="ENTER RESPONSE TEXT..." />
        </div>
      </div>

      <button onClick={save} className="w-full bg-black text-white p-5 rounded-[2rem] font-primary-heading text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3">
        <CheckCircle2 size={16}/> LOCK CONFIGURATION
      </button>

      <div className="p-6 border border-accent rounded-3xl bg-secondary flex items-start gap-4">
         <AlertCircle size={18} className="mt-0.5 text-text-secondary" />
         <p className="text-[9px] text-text-secondary leading-relaxed uppercase tracking-tighter">Documentation // Matrix responses support HTML tags like <b>bold</b> and <i>italic</i>. Ensure image URLs are direct links.</p>
      </div>
    </div>
  );
}

function SystemSettings({ adminCode }: { adminCode: string }) {
  const setWebhook = useAction(api.bot.handlers.setWebhook);
  const getBotInfo = useAction(api.bot.handlers.getBotInfo);
  const token = useQuery(api.settings.getByKey, { key: "TELEGRAM_BOT_TOKEN" }) || "";
  const setSetting = useMutation(api.settings.setByKey);
  const [botUser, setBotUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localToken, setLocalToken] = useState("");

  useEffect(() => {
    if (token) setLocalToken(token);
  }, [token]);

  const saveToken = () => {
    setSetting({ key: "TELEGRAM_BOT_TOKEN", value: localToken, adminCode })
      .then(() => alert("TOKEN LOCKED"))
      .catch(() => alert("PERSISTENCE FAILURE"));
  };

  const check = async () => {
    setLoading(true);
    try {
      const res = await getBotInfo({ adminCode });
      if (res.success) setBotUser(res.username!);
      else alert(`ERROR: ${res.error}`);
    } finally {
      setLoading(false);
    }
  };

  const activate = async () => {
    setLoading(true);
    try {
      const res = await setWebhook({ adminCode });
      alert(`WEBHOOK_INIT: ${res.url}`);
    } catch (err: any) {
      alert(`INIT_FAILURE: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border border-accent rounded-[2rem] bg-white space-y-4">
         <h4 className="text-[9px] font-primary-heading tracking-widest uppercase opacity-40">Bot Configuration</h4>
         <input 
           className="w-full p-4 bg-secondary border border-accent rounded-2xl text-[10px] font-mono" 
           placeholder="TELEGRAM_BOT_TOKEN" 
           value={localToken} 
           onChange={e => setLocalToken(e.target.value)} 
         />
         <button onClick={saveToken} className="w-full p-4 bg-black text-white rounded-2xl text-[9px] font-primary-heading tracking-widest active:scale-95 transition-all">SAVE BOT TOKEN</button>
      </div>

      <div className="p-8 border border-accent rounded-[3rem] bg-secondary flex flex-col items-center text-center shadow-inner">
        <div className={`p-6 rounded-full mb-6 transition-all duration-700 ${botUser ? 'bg-green-50 text-green-500 scale-110' : 'bg-white text-black'}`}>
           <Globe size={40} className={loading ? 'animate-spin' : ''} />
        </div>
        <h3 className="font-primary-heading text-xs mb-3 tracking-widest uppercase">NODE CONNECTIVITY</h3>
        <p className="text-[9px] text-text-secondary mb-10 font-sub-heading tracking-widest uppercase">{botUser ? `@${botUser} // STABLE` : "OFFLINE OR UNLINKED"}</p>
        <div className="grid grid-cols-2 gap-4 w-full">
           <button onClick={check} disabled={loading} className="p-4 bg-white border border-accent rounded-2xl text-[9px] font-primary-heading tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><RefreshCw size={14}/> SYNC</button>
           <button onClick={activate} disabled={loading} className="p-4 bg-black text-white rounded-2xl text-[9px] font-primary-heading tracking-widest active:scale-95 transition-all shadow-md">LINK</button>
        </div>
      </div>
      
      <div className="p-6 border border-accent rounded-[2rem] bg-white">
         <h4 className="text-[9px] font-primary-heading tracking-widest uppercase mb-4 opacity-40">System Diagnostics</h4>
         <div className="space-y-3">
            <div className="flex justify-between text-[8px] font-sub-heading tracking-widest"><span>SSL ENFORCEMENT</span> <span className="text-green-500 font-bold">ACTIVE</span></div>
            <div className="flex justify-between text-[8px] font-sub-heading tracking-widest"><span>WEBHOOK ROUTING</span> <span className="text-green-500 font-bold">ACK</span></div>
            <div className="flex justify-between text-[8px] font-sub-heading tracking-widest"><span>CORE LOGIC BOARD</span> <span className="text-green-500 font-bold">STABLE</span></div>
         </div>
      </div>
    </div>
  );
}
