"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Invoice = {
  id: string;
  total: number;
  status: "pending" | "partially_paid" | "paid";
  created_at: string;
  clients: {
    name: string;
  };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        total,
        status,
        created_at,
        clients ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInvoices(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">Payée</span>;
      case "partially_paid":
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium">Partielle</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-full text-xs font-medium">En attente</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Factures</h1>
          <p className="text-gray-500 dark:text-gray-400">Gérez vos factures et suivez les paiements</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Facture
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Client</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Montant</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">Aucune facture trouvée</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-4">
                        Commencez par créer votre première facture.
                      </p>
                      <Link href="/dashboard/invoices/new" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        + Créer une facture
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{invoice.clients?.name}</div>
                      <div className="text-xs text-gray-400">#{invoice.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(invoice.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors inline-flex">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
