"use client";

import { useEffect, useState } from "react";
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ClientModal from "@/components/clients/ClientModal";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | undefined>(undefined);

  const fetchClients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery]);

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (!error) {
        fetchClients();
      } else {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const openAddModal = () => {
    setClientToEdit(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-500 dark:text-gray-400">Gérez votre base de données clients</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Nouveau Client
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Nom / Entreprise</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Téléphone</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date d'ajout</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">Aucun client trouvé</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-4">
                        {searchQuery ? "Essayez une autre recherche." : "Commencez par ajouter votre premier client."}
                      </p>
                      {!searchQuery && (
                        <button onClick={openAddModal} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                          + Ajouter un client
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500 dark:text-gray-400">{client.phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(client.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(client)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchClients}
        clientToEdit={clientToEdit}
      />
    </div>
  );
}
