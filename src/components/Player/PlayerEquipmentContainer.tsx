import React, { useState } from 'react';
import EquipmentEditorModal from '../Modals/EquipmentEditorModal';
import DiceRollModal from '../Modals/DiceRollModal';

export default function PlayerEquipmentContainer({
  playerEquipment = [],
  playerId,
  onUpdate,
}: {
  playerEquipment: any[];
  playerId: number;
  onUpdate?: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [diceModalData, setDiceModalData] = useState<{
    isOpen: boolean;
    title: string;
    formula: string;
  }>({
    isOpen: false,
    title: '',
    formula: '',
  });

  // Função para deletar arma/equipamento
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja apagar este equipamento?')) return;
    try {
      const res = await fetch(`/api/player/${playerId}/equipment/${id}`, {
        method: 'DELETE',
      });
      if (res.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erro ao deletar equipamento:', error);
    }
  };

  // Função para abrir rolagem de ataque/dano
  const handleOpenDiceModal = (name: string, damage: string) => {
    if (!damage || damage === '-') return;
    setDiceModalData({
      isOpen: true,
      title: `Ataque / Dano - ${name}`,
      formula: damage,
    });
  };

  // Função para atualizar munição
  const handleAmmoChange = async (id: number, currentAmmo: number) => {
    try {
      await fetch(`/api/player/${playerId}/equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ammo: currentAmmo }),
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar munição:', error);
    }
  };

  return (
    <div className="w-full bg-black/40 border border-purple-900/40 rounded-lg p-4 text-white">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b border-purple-800/40 pb-3 mb-4">
        <h2 className="text-xl font-bold tracking-wider text-purple-300 uppercase">
          Combate
        </h2>
        <button
          onClick={() => {
            setSelectedEquipment(null);
            setIsModalOpen(true);
          }}
          className="bg-purple-700 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded transition shadow-md text-sm"
        >
          + CRIAR EQUIPAMENTO CUSTOMIZADO
        </button>
      </div>

      {/* Tabela de Equipamentos / Armas (Estilo Foto 2) */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-purple-950/60 border-b border-purple-800/60 text-xs uppercase tracking-wider text-purple-200">
              <th className="py-3 px-2">Ações</th>
              <th className="py-3 px-2">Nome</th>
              <th className="py-3 px-2">Tipo</th>
              <th className="py-3 px-2">Dano</th>
              <th className="py-3 px-2">Alcance</th>
              <th className="py-3 px-2">Ataques</th>
              <th className="py-3 px-2">Mun. Atual</th>
              <th className="py-3 px-2">Mun. Máxima</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-900/30 text-sm">
            {playerEquipment && playerEquipment.length > 0 ? (
              playerEquipment.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-purple-900/20 transition-colors">
                    {/* Botões de Ação (Apagar / Editar) */}
                    <td className="py-3 px-2 flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Apagar equipamento"
                        className="bg-red-800/80 hover:bg-red-700 text-white p-1.5 rounded transition"
                      >
                        🗑️
                      </button>
                    </td>

                    {/* Nome (Clicável para editar) */}
                    <td className="py-3 px-2 font-bold text-purple-300">
                      <button
                        onClick={() => {
                          setSelectedEquipment(item);
                          setIsModalOpen(true);
                        }}
                        className="hover:underline hover:text-purple-200 uppercase"
                      >
                        {item.name || 'Sem Nome'}
                      </button>
                    </td>

                    {/* Tipo */}
                    <td className="py-3 px-2 text-gray-300 uppercase">
                      {item.type || '-'}
                    </td>

                    {/* Dano */}
                    <td className="py-3 px-2 font-semibold text-purple-200">
                      {item.damage || '-'}
                    </td>

                    {/* Alcance */}
                    <td className="py-3 px-2 text-gray-300">
                      {item.range || '-'}
                    </td>

                    {/* Botão de Rolagem de Dado (Ataques) */}
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleOpenDiceModal(item.name, item.damage)}
                        className="bg-purple-900/60 hover:bg-purple-800 text-white p-2 rounded-full inline-flex items-center justify-center transition shadow"
                        title="Rolar Dano / Ataque"
                      >
                        🎲
                      </button>
                    </td>

                    {/* Munição Atual (Input interativo) */}
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min={0}
                        defaultValue={item.currentAmmo ?? 0}
                        onBlur={(e) =>
                          handleAmmoChange(item.id, parseInt(e.target.value) || 0)
                        }
                        className="w-16 bg-black/60 border border-purple-700 rounded text-center text-white py-1 text-xs focus:outline-none focus:border-purple-400"
                      />
                    </td>

                    {/* Munição Máxima */}
                    <td className="py-3 px-2 text-gray-300">
                      {item.ammo ?? '-'}
                    </td>
                  </tr>

                  {/* Linha extra para exibir o Defeito (caso preenchido) */}
                  {item.defeito && item.defeito.trim() !== '' && (
                    <tr className="bg-purple-950/20 text-xs text-purple-300/80">
                      <td colSpan={8} className="py-1.5 px-4 text-left italic border-b border-purple-900/20">
                        <span className="font-semibold text-purple-400">Defeito:</span> {item.defeito}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400 italic">
                  Nenhum equipamento ou arma cadastrada no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <EquipmentEditorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEquipment(null);
          }}
          playerId={playerId}
          equipment={selectedEquipment}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedEquipment(null);
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Modal de Rolagem de Dado */}
      {diceModalData.isOpen && (
        <DiceRollModal
          isOpen={diceModalData.isOpen}
          onClose={() =>
            setDiceModalData({ isOpen: false, title: '', formula: '' })
          }
          title={diceModalData.title}
          formula={diceModalData.formula}
        />
      )}
    </div>
  );
}
