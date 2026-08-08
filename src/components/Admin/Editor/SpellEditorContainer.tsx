import type { Spell } from '@prisma/client';
import type { AxiosRequestConfig } from 'axios';
import { useContext, useState } from 'react';
import { ErrorLogger } from '../../../contexts';
import api from '../../../utils/api';
import DataContainer from '../../DataContainer';
import SpellEditorModal, { RitualData } from '../../Modals/SpellEditorModal';
import EditorContainer from './EditorContainer';

type SpellEditorContainerProps = {
  spells: Spell[];
  title?: string;
};

export default function SpellEditorContainer(props: SpellEditorContainerProps) {
  const [loading, setLoading] = useState(false);
  const [spellModal, setSpellModal] = useState<EditorModalData<RitualData>>({
    show: false,
    operation: 'create',
  });
  const [spell, setSpell] = useState<Spell[]>(props.spells);
  const logError = useContext(ErrorLogger);

  function onModalSubmit(sp: RitualData) {
    if (
      !sp.name ||
      !sp.description ||
      !sp.castingTime ||
      !sp.cost ||
      !sp.damage ||
      !sp.duration ||
      !sp.range ||
      !sp.target
    )
      return alert(
        'Nenhum campo pode ser vazio. Para definir um campo vazio, utilize "-"'
      );

    setLoading(true);

    // Garante que todos os campos opcionais/novos tenham "-" como fallback ao enviar para a API
    const dataToSend = {
      ...sp,
      type: sp.type || '-',
      sanity: sp.sanity || '-',
      resistance: sp.resistance || '-',
      symbol: sp.symbol || '-',
    };

    const config: AxiosRequestConfig =
      spellModal.operation === 'create'
        ? {
            method: 'PUT',
            data: { ...dataToSend, id: undefined },
          }
        : {
            method: 'POST',
            data: dataToSend,
          };

    api('/sheet/spell', config)
      .then((res) => {
        if (spellModal.operation === 'create') {
          setSpell([...spell, { ...dataToSend, id: res.data.id }]);
          return;
        }
        spell[spell.findIndex((_sp) => _sp.id === sp.id)] = dataToSend;
        setSpell([...spell]);
      })
      .catch(logError)
      .finally(() => setLoading(false));
  }

  function deleteSpell(id: number) {
    if (!confirm('Tem certeza de que deseja apagar esse item?')) return;
    setLoading(true);
    api
      .delete('/sheet/spell', { data: { id } })
      .then(() => {
        spell.splice(
          spell.findIndex((eq) => eq.id === id),
          1
        );
        setSpell([...spell]);
      })
      .catch(logError)
      .finally(() => setLoading(false));
  }

  return (
    <>
      <DataContainer
        xs={12}
        lg={6}
        outline
        title={props.title || 'Rituais'}
        addButton={{
          onAdd: () => setSpellModal({ operation: 'create', show: true }),
          disabled: loading,
        }}>
        <EditorContainer
          data={spell}
          onEdit={(id) =>
            setSpellModal({
              operation: 'edit',
              show: true,
              data: spell.find((sp) => sp.id === id),
            })
          }
          onDelete={(id) => deleteSpell(id)}
          disabled={loading}
        />
      </DataContainer>
      <SpellEditorModal
        {...spellModal}
        onHide={() => setSpellModal({ operation: 'create', show: false })}
        onSubmit={onModalSubmit}
        disabled={loading}
      />
    </>
  );
}
