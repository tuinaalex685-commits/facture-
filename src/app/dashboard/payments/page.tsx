"use client";

import { useEffect, useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PaymentModal from "@/components/payments/PaymentModal";

type Payment = {
  id: string;
  amount: number;
  payment_date: string;
  invoices: {
    id: string;
    total: number;
    clients: {
      name: string;
    };
  };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Supabase nested join syntax: invoices!inner(user_id, total, clients(name))
    // We only want payments linked to invoices owned by the user.
    // Since RLS is enabled, we only see our own anyway.
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        payment_date,
        invoices (
          id,
          total,
          clients ( name )
        )
      `)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      setPayments(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiements</h1>
          <p className="text-gray-500 dark:text-gray-400">Suivi des encaissements</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Nouveau Paiement
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Client / Facture</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Montant Encaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                        <CreditCard className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">Aucun paiement trouvé</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2">
                        + Enregistrer un paiement
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white font-medium">
                        {new Date(payment.payment_date).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.payment_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {payment.invoices?.clients?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Facture #{payment.invoices?.id.split('-')[0].toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-green-600 dark:text-green-500">
                        + {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(payment.amount)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchPayments} 
      />
    </div>
  );
}
