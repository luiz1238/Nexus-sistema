import React, { useState, useEffect } from 'react';

interface EquipmentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  equipment?: any | null;
  onSuccess: () => void;
}

export default function EquipmentEditorModal({
  isOpen,
  onClose,
  playerId,
  equipment = null,
  onSuccess,
}: EquipmentEditorModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [damage, setDamage] = useState('');
  const [range, setRange] = useState('');
  const [attacks, setAttacks] = useState('');
  const [ammo, setAmmo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (equipment) {
      setName(equipment.name || '');
      setType(equipment.type || '');
      setDamage(equipment.damage || '');
      setRange(equipment.range || '');
      setAttacks(equipment.attacks || '');
      setAmmo(
        equipment.ammo !== null && equipment.ammo !== undefined
          ? String(equipment.ammo)
          : ''
      );
    } else {
      setName('');
      setType('');
      setDamage('');
      setRange('');
      setAttacks('');
      setAmmo('');
    }
    setError('');
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      type,
      damage,
      range,
      attacks,
      ammo: ammo && ammo.trim() !== '' ? parseInt(ammo, 10) : null,
    };

    try {
      const url = equipment
        ? `/api/player/${playerId}/equipment/${equipment.id}`
        : `/api/player/${playerId}/equipment`;
      const method = equipment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao salvar o equipamento.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o equipamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-lg border border-purple-800 bg-purple-950/90 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-purple-800/60 pb-3">
          <h3 className="text-lg font-bold uppercase tracking-wider text-purple-300">
            {equipment ? 'Editar Equipamento' : 'Criar Equipamento'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-900/60 border border-red-700 p-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold uppercase text-purple-300 mb-1">
              Nome do Equipamento
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-purple-700 bg-black/60 p-2 text-white focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-300 mb-1">
                Tipo
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded border border-purple-700 bg-black/60 p-2 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-300 mb-1">
                Dano
              </label>
              <input
                type="text"
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                className="w-full rounded border border-purple-700 bg-black/60 p-2 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-300 mb-1">
                Alcance
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full rounded border border-purple-700 bg-black/60 p-2 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-300 mb-1">
                Ataques (Dado)
              </label>
              <input
                type="text"
                value={attacks}
                onChange={(e) => setAttacks(e.target.value)}
                className="w-full rounded border border-purple-700 bg-black/60 p-2 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-purple-300 mb-1">
                Munição Máxima
              </label>
              <input
                type="number"
                min={0}
                value={ammo}
                onChange={(e) => setAmmo(e.target.value)}
                className="w-full rounded border border-purple-700 bg-black/60 p-2 text-white focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-600 transition disabled:opacity-50"
            >
              {loading ? 'Salvar...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
