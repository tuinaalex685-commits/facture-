"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchInvoices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("invoices")
        .select(`id, total, status, clients(name)`)
        .eq("user_id", user.id)
        .neq("status", "paid")
        .order("created_at", { ascending: false });

      if (data) setInvoices(data);
    };

    fetchInvoices();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !amount) return;
    
    setLoading(true);
    setError(null);

    try {
      const numAmount = Number(amount);
      const invoice = invoices.find(i => i.id === selectedInvoiceId);
      
      // Insert Payment
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([{ invoice_id: selectedInvoiceId, amount: numAmount }]);

      if (paymentError) throw paymentError;

      // Calculate total paid so far
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("invoice_id", selectedInvoiceId);

      const totalPaid = (allPayments || []).reduce((acc, curr) => acc + curr.amount, 0);

      // Determine new status
      let newStatus = "pending";
      if (totalPaid >= invoice.total) {
        newStatus = "paid";
      } else if (totalPaid > 0) {
        newStatus = "partially_paid";
      }

      // Update Invoice status
      await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", selectedInvoiceId);

      onSuccess();
      onClose();
      setSelectedInvoiceId("");
      setAmount("");
    } catch (err: any) {
      setError("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enregistrer un paiement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facture</label>
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner une facture...</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.clients?.name} - {inv.total} XOF
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant encaissé</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 50000"
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 py-2.5 rounded-lg">Annuler</button>
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2.5 rounded-lg flex justify-center items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Valider"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
