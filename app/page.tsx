"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Search, ShoppingCart, ClipboardList, User, Package, ChevronRight, X, ArrowLeft, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    Telegram: any;
  }
}

export default function Home() {
  const [initData, setInitData] = useState<string | null>(null);
  const [cryptoToken, setCryptoToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const validateAuth = useAction(api.auth.validateAndAuth);
  const products = useQuery(api.products.list, { search: debouncedSearch });
  const cart = useQuery(api.carts.getByUser, { telegramId: 0 }); // Placeholder ID
  const addToCartMutation = useMutation(api.carts.addToCart);
  const removeFromCartMutation = useMutation(api.carts.removeFromCart);
  
  // Logistics
  const [address, setAddress] = useState("");
  const calculateFeeAction = useAction(api.logistics.calculateDeliveryFee);
  const [deliveryData, setDeliveryData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      setInitData(tg.initData);
    }
  }, []);

  useEffect(() => {
    if (initData && !cryptoToken) {
      const performAuth = async () => {
        try {
          const res = await validateAuth({ initData });
          setCryptoToken(res.cryptoToken);
          localStorage.setItem("cryptoToken", res.cryptoToken);
        } catch (err) {
          console.error("Auth failed", err);
        }
      };
      performAuth();
    }
  }, [initData, validateAuth, cryptoToken]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(handler);
  }, [search]);

  const handleAddToCart = async (product: any) => {
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0;
    await addToCartMutation({ telegramId: tgId, productId: product._id, quantity: 1 });
    setSelectedProduct(null);
  };

  const handleCalculateLogistics = async () => {
    const res = await calculateFeeAction({ address, providerName: "LALAMOVE" });
    setDeliveryData(res);
  };

  if (!cryptoToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sub-heading bg-white">
        <div className="w-12 h-12 border-4 border-accent border-t-black rounded-full animate-spin mb-4"></div>
        <p className="text-xs tracking-widest">ESTABLISHING SECURE CONNECTION...</p>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
        <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-2xl font-primary-heading mb-2">ORDER SECURED</h1>
        <p className="text-xs font-sub-heading text-text-secondary mb-8">
          YOUR TRANSACTION {orderComplete} HAS BEEN ANCHORED TO OUR LEDGER.
        </p>
        <button 
          onClick={() => setOrderComplete(null)}
          className="w-full bg-black text-white p-4 font-primary-heading text-sm rounded-lg"
        >
          RETURN TO CATALOG
        </button>
      </div>
    );
  }

  return (
    <div className="layout-container bg-white">
      {/* HEADER */}
      <header className="header flex items-center justify-between px-4">
        <h1 className="text-lg font-primary-heading">MINIMALIST</h1>
        <div className="flex-1 mx-4 relative">
          <input 
            type="text" 
            placeholder="SEARCH CATALOG..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 px-10 rounded-full bg-secondary border border-accent text-[10px] font-sub-heading outline-none"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary border border-accent flex items-center justify-center overflow-hidden">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
      </header>

      {/* CONTENT */}
      <main className="content">
        {activeTab === "home" && (
          <div className="product-grid">
            {products?.map((product) => (
              <div 
                key={product._id} 
                className="product-tile cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="image-container">
                  <img src={product.image} alt={product.name} className="product-image" />
                  {product.status !== "NONE" && (
                    <span className={`status-chip status-${product.status.toLowerCase().replace(' ', '-')}`}>
                      {product.status}
                    </span>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name font-primary-heading uppercase">{product.name}</h3>
                  <p className="sub-name text-[8px] uppercase">{product.subName}</p>
                  <p className="price text-[10px] mt-1">${product.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "orders" && (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <ClipboardList className="w-12 h-12 mb-4" />
             <p className="text-[10px] font-primary-heading">NO ACTIVE ORDERS FOUND</p>
           </div>
        )}
      </main>

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col p-6 slide-up">
           <button onClick={() => setSelectedProduct(null)} className="mb-6"><ArrowLeft /></button>
           <img src={selectedProduct.image} className="w-full aspect-square object-cover rounded-xl mb-6" />
           <div className="flex justify-between items-start mb-2">
             <h2 className="text-2xl font-primary-heading">{selectedProduct.name}</h2>
             <span className="text-xl font-bold">${selectedProduct.price.toFixed(2)}</span>
           </div>
           <p className="text-[10px] font-sub-heading text-text-secondary uppercase mb-4">{selectedProduct.subName}</p>
           <p className="text-xs font-body leading-relaxed mb-auto">{selectedProduct.description}</p>
           <button 
             onClick={() => handleAddToCart(selectedProduct)}
             className="w-full bg-black text-white p-4 font-primary-heading text-sm rounded-xl mt-6"
           >
             ADD TO ALLOCATION
           </button>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <button onClick={() => setActiveTab("home")} className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
          <Package className="w-5 h-5 mb-1" />
          <span>CATALOG</span>
        </button>
        <button onClick={() => setActiveTab("cart")} className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}>
          <ShoppingCart className="w-5 h-5 mb-1" />
          <span>CART</span>
        </button>
        <button onClick={() => setActiveTab("orders")} className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
          <ClipboardList className="w-5 h-5 mb-1" />
          <span>ORDERS</span>
        </button>
        <button onClick={() => setActiveTab("profile")} className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}>
          <User className="w-5 h-5 mb-1" />
          <span>PROFILE</span>
        </button>
      </nav>
    </div>
  );
}
