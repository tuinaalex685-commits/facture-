"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Banknote, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type DashboardStats = {
  totalClients: number;
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalInvoices: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalUnpaid: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);

      // Fetch totals
      const [
        { count: clientsCount },
        { count: invoicesCount, data: invoicesData },
        { data: paymentsData }
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("invoices").select("total").eq("user_id", user.id),
        supabase.from("payments").select("amount, invoices!inner(user_id)").eq("invoices.user_id", user.id)
      ]);

      const totalBilled = (invoicesData || []).reduce((acc, curr) => acc + curr.total, 0);
      const totalPaid = (paymentsData || []).reduce((acc, curr) => acc + curr.amount, 0);
      const totalUnpaid = totalBilled - totalPaid;

      setStats({
        totalClients: clientsCount || 0,
        totalInvoices: invoicesCount || 0,
        totalBilled,
        totalPaid,
        totalUnpaid: totalUnpaid > 0 ? totalUnpaid : 0,
      });

      // Fetch recent invoices
      const { data: recent } = await supabase
        .from("invoices")
        .select(`id, total, status, created_at, clients(name)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent) setRecentInvoices(recent);
      
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bienvenue, voici un résumé de votre activité.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Chiffre d'Affaires */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Facturé</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.totalBilled)}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Card 2: Encaissé */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Encaissé</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">{formatCurrency(stats.totalPaid)}</h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
              <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Card 3: Impayé */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reste à percevoir</p>
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">{formatCurrency(stats.totalUnpaid)}</h3>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Card 4: Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Clients Actifs</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalClients}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Factures récentes</h3>
            <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">Voir tout</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>Aucune facture pour le moment</p>
              </div>
            ) : (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-500' : inv.status === 'partially_paid' ? 'bg-orange-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{inv.clients?.name}</p>
                      <p className="text-xs text-gray-500">#{inv.id.split('-')[0].toUpperCase()} • {new Date(inv.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(inv.total)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
