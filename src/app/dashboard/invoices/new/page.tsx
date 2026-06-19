"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Client = { id: string; name: string };
type Item = { id: number; description: string; quantity: number; unit_price: number };

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [items, setItems] = useState<Item[]>([{ id: Date.now(), description: "", quantity: 1, unit_price: 0 }]);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
        
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const addItem = () => setItems([...items, { id: Date.now(), description: "", quantity: 1, unit_price: 0 }]);
  
  const removeItem = (id: number) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: keyof Item, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = taxEnabled ? subtotal * 0.18 : 0;
  const total = subtotal + taxAmount;

  const handleSave = async () => {
    if (!selectedClientId) return alert("Veuillez sélectionner un client");
    if (items.some(i => !i.description)) return alert("Veuillez remplir toutes les descriptions");
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Insert Invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([{
          user_id: user.id,
          client_id: selectedClientId,
          total: total,
          tax_enabled: taxEnabled,
          status: "pending"
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // 2. Insert Items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
      if (itemsError) throw itemsError;

      router.push("/dashboard/invoices");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de la facture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/invoices" className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Facture</h1>
          <p className="text-gray-500 dark:text-gray-400">Remplissez les détails pour générer la facture</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations Générales</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Sélectionner un client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-xs text-orange-500 mt-2">Vous n'avez aucun client. Allez dans "Clients" pour en créer un.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lignes de la facture</h2>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Description du service/produit"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  placeholder="Prix unit."
                  value={item.unit_price || ""}
                  onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="w-32 py-2 text-right font-medium text-gray-900 dark:text-white">
                {new Intl.NumberFormat('fr-FR').format(item.quantity * item.unit_price)}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une ligne
        </button>
      </div>

      <div className="flex justify-end">
        <div className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Sous-total</span>
            <span>{new Intl.NumberFormat('fr-FR').format(subtotal)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
              <input 
                type="checkbox" 
                checked={taxEnabled} 
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              TVA (18%)
            </label>
            <span>{new Intl.NumberFormat('fr-FR').format(taxAmount)}</span>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center font-bold text-xl text-gray-900 dark:text-white">
            <span>Total</span>
            <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(total)}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer la facture"}
          </button>
        </div>
      </div>
    </div>
  );
}
