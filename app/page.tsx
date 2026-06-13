"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Image from "next/image";

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

  const validateAuth = useAction(api.auth.validateAndAuth);
  const products = useQuery(api.products.list, { search: debouncedSearch });

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

  if (!cryptoToken) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sub-heading">
        <p>AUTHENTICATING SECURE SESSION...</p>
      </div>
    );
  }

  return (
    <div className="layout-container">
      <header className="header">
        <h1 style={{ fontSize: '1.2rem' }}>MINIMALIST</h1>
        <div style={{ flex: 1, margin: '0 12px' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              border: '1px solid var(--accent)',
              fontSize: '0.8rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ width: 24, height: 24, backgroundColor: 'var(--accent)', borderRadius: '50%' }}></div>
      </header>

      <main className="content">
        <div className="product-grid">
          {products?.map((product) => (
            <div key={product._id} className="product-tile">
              <div className="image-container">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="product-image"
                />
                {product.status !== "NONE" && (
                  <span className={`status-chip status-${product.status.toLowerCase().replace(' ', '-')}`}>
                    {product.status}
                  </span>
                )}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="sub-name" style={{ fontSize: '0.65rem' }}>{product.subName}</p>
                <p className="price">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <nav className="bottom-nav">
        <a href="#" className="nav-item active">
          <span className="nav-icon">⌂</span>
          <span>HOME</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon">🛒</span>
          <span>CART</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon">📋</span>
          <span>ORDERS</span>
        </a>
        <a href="#" className="nav-item">
          <span className="nav-icon">👤</span>
          <span>PROFILE</span>
        </a>
      </nav>
    </div>
  );
}
