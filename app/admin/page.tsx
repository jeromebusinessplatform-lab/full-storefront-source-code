"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function AdminPage() {
  const [accessCode, setAccessCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  // Auth Gate
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sub-heading p-6">
        <h1 className="text-xl mb-6 font-primary-heading">ADMIN ACCESS REQUIRED</h1>
        <form onSubmit={handleAuth} className="w-full max-w-xs">
          <input
            type="password"
            placeholder="ENTER ACCESS CODE"
            className="w-full p-3 border border-accent bg-secondary rounded outline-none mb-4"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />
          <button className="w-full bg-black text-white p-3 rounded font-primary-heading">
            AUTHORIZE NODE
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <header className="header flex items-center justify-between px-6">
        <h1 className="text-lg">OPERATIONS CONSOLE</h1>
        <button 
          onClick={() => {
            localStorage.removeItem("adminCode");
            setIsAuthorized(false);
          }}
          className="text-xs text-red-500 font-sub-heading"
        >
          LOGOUT
        </button>
      </header>

      <div className="content mt-16 pb-20 px-4">
        {/* Tabs */}
        <div className="flex border-b border-accent mb-6 overflow-x-auto no-scrollbar">
          {["orders", "payments", "logistics", "products"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-primary-heading text-sm uppercase ${
                activeTab === tab ? "border-b-2 border-black" : "text-text-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "orders" && <OrderManagement adminCode={accessCode} />}
        {activeTab === "payments" && <PaymentSettings adminCode={accessCode} />}
        {activeTab === "logistics" && <LogisticsSettings adminCode={accessCode} />}
        {activeTab === "products" && <ProductManagement adminCode={accessCode} />}
      </div>

      {/* Admin Bottom Nav */}
      <nav className="bottom-nav">
         <span className="font-primary-heading text-xs text-text-secondary">SYSTEM STATUS: OPERATIONAL</span>
      </nav>
    </div>
  );
}

function OrderManagement({ adminCode }: { adminCode: string }) {
  const orders = useQuery(api.orders.listAll, { adminCode });
  const updateStatus = useMutation(api.orders.updateStatus);

  const handleStatusChange = async (orderId: any, newStatus: string) => {
    try {
      await updateStatus({ orderId, status: newStatus, adminCode });
    } catch (err) {
      alert("FAILED TO UPDATE STATUS");
    }
  };

  return (
    <div className="space-y-4">
      {orders?.map((order) => (
        <div key={order._id} className="p-4 border border-accent rounded-lg bg-secondary">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-primary-heading text-sm">ORDER: {order.internalId}</p>
              <p className="text-xs text-text-secondary font-sub-heading">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
              order.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {order.status}
            </span>
          </div>

          <div className="text-xs font-body space-y-1 mb-3">
            {order.items.map((item, idx) => (
              <p key={idx}>{item.name} x{item.quantity} - ${item.price.toFixed(2)}</p>
            ))}
            <p className="font-bold pt-1 border-t border-accent/50">TOTAL: ${order.total.toFixed(2)}</p>
          </div>

          <div className="flex gap-2">
            <select 
              className="flex-1 text-xs p-2 border border-accent rounded bg-white outline-none"
              value={order.status}
              onChange={(e) => handleStatusChange(order._id, e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            {order.proofOfPaymentUrl && (
              <a 
                href={order.proofOfPaymentUrl} 
                target="_blank" 
                className="bg-black text-white text-[10px] px-3 py-2 rounded flex items-center justify-center"
              >
                VIEW PROOF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentSettings({ adminCode }: { adminCode: string }) {
  const paymentMethods = useQuery(api.settings.getByKey, { key: "paymentMethods" });
  const setSetting = useMutation(api.settings.setByKey);

  const handleUpdate = async (newMethods: any) => {
    await setSetting({ key: "paymentMethods", value: newMethods, adminCode });
  };

  return (
    <div className="space-y-4">
      <h2 className="font-primary-heading text-sm">GATEWAY CONFIGURATION</h2>
      {paymentMethods?.map((method: any, idx: number) => (
        <div key={idx} className="p-4 border border-accent rounded-lg">
          <p className="font-bold text-xs">{method.label} ({method.type})</p>
          <p className="text-xs text-text-secondary">{method.details}</p>
        </div>
      ))}
      <button className="w-full border-2 border-dashed border-accent p-4 text-xs font-sub-heading text-text-secondary rounded-lg">
        + ADD NEW PAYMENT METHOD
      </button>
    </div>
  );
}

function LogisticsSettings({ adminCode }: { adminCode: string }) {
  const providers = useQuery(api.settings.getByKey, { key: "deliveryProviders" });
  
  return (
    <div className="space-y-4">
      <h2 className="font-primary-heading text-sm">DELIVERY PROVIDERS</h2>
      {providers?.map((p: any, idx: number) => (
        <div key={idx} className="p-4 border border-accent rounded-lg bg-secondary">
          <p className="font-bold text-xs">{p.name}</p>
          <div className="flex justify-between text-xs mt-1">
            <span>BASE: ${p.baseRate}</span>
            <span>PER KM: ${p.perKmRate}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductManagement({ adminCode }: { adminCode: string }) {
  const products = useQuery(api.products.list, {});
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {products?.map((product) => (
          <div key={product._id} className="p-2 border border-accent rounded bg-white">
            <img src={product.image} className="w-full aspect-square object-cover rounded mb-2" />
            <p className="font-primary-heading text-[10px] truncate">{product.name}</p>
            <p className="text-[10px] font-bold">${product.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
