"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-500 dark:text-gray-400">Gérez votre profil et vos préférences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil Utilisateur</h2>
          
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de connexion</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié pour le moment.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Préférences (Bientôt disponible)</h2>
          <div className="space-y-4 opacity-50 pointer-events-none">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">TVA par défaut (18%)</p>
                <p className="text-xs text-gray-500">Appliquer automatiquement la TVA sur les nouvelles factures</p>
              </div>
            </label>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button disabled className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 opacity-50 cursor-not-allowed">
            <Save className="w-4 h-4" />
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
