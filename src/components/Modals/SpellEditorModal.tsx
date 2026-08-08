import type { Spell } from '@prisma/client';
import { useEffect, useState, ChangeEvent } from 'react';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import FormGroup from 'react-bootstrap/FormGroup';
import FormCheck from 'react-bootstrap/FormCheck';
import FormLabel from 'react-bootstrap/FormLabel';
import Button from 'react-bootstrap/Button';
import SheetModal from './SheetModal';

export type RitualData = Spell & {
  sanity?: string;
  symbol?: string;
  resistance?: string;
};

const initialState: RitualData = {
  id: 0,
  name: '',
  description: '',
  castingTime: '',
  cost: '',
  damage: '',
  duration: '',
  range: '',
  target: '',
  type: '',
  slots: 0,
  visible: true,
  sanity: '',
  symbol: '',
  resistance: '',
};

export default function SpellEditorModal(props: EditorModalProps<RitualData>) {
  const [spell, setSpell] = useState<RitualData>(initialState);

  // Executado sempre que a janela abre ou a operação/item muda
  useEffect(() => {
    if (!props.show) return;
    if (props.operation === 'edit' && props.data) {
      setSpell({ ...props.data });
    } else {
      setSpell(initialState);
    }
  }, [props.show, props.data, props.operation]);

  function hide() {
    setSpell(initialState);
    props.onHide();
  }

  // Função para carregar arquivo de imagem do computador para o Símbolo
  function onSymbolFileChange(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSpell((sp) => ({ ...sp, symbol: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <SheetModal
      animation={false}
      title={props.operation === 'create' ? 'Criar Ritual' : 'Editar Ritual'}
      show={props.show}
      onHide={hide}
      applyButton={{
        name: props.operation === 'create' ? 'Criar' : 'Editar',
        onApply: () => {
          props.onSubmit(spell);
          hide();
        },
        disabled: props.disabled,
      }}
      scrollable>
      <Container fluid>
        <FormGroup controlId='createSpellName' className='mb-3'>
          <FormLabel>Nome do Ritual</FormLabel>
          <FormControl
            autoFocus
            className='theme-element'
            value={spell.name}
            onChange={(ev) => setSpell((sp) => ({ ...sp, name: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellDescription' className='mb-3'>
          <FormLabel>Descrição</FormLabel>
          <FormControl
            as='textarea'
            className='theme-element'
            value={spell.description}
            onChange={(ev) => setSpell((sp) => ({ ...sp, description: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellCost' className='mb-3'>
          <FormLabel>Custo</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.cost}
            onChange={(ev) => setSpell((sp) => ({ ...sp, cost: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellSanity' className='mb-3'>
          <FormLabel>Sanidade</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.sanity || ''}
            onChange={(ev) => setSpell((sp) => ({ ...sp, sanity: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellType' className='mb-3'>
          <FormLabel>Elemento</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.type}
            onChange={(ev) => setSpell((sp) => ({ ...sp, type: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellDamage' className='mb-3'>
          <FormLabel>Dano / Efeito</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.damage}
            onChange={(ev) => setSpell((sp) => ({ ...sp, damage: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellTarget' className='mb-3'>
          <FormLabel>Alvo</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.target}
            onChange={(ev) => setSpell((sp) => ({ ...sp, target: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellCastingTime' className='mb-3'>
          <FormLabel>Conjuração</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.castingTime}
            onChange={(ev) => setSpell((sp) => ({ ...sp, castingTime: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellRange' className='mb-3'>
          <FormLabel>Alcance</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.range}
            onChange={(ev) => setSpell((sp) => ({ ...sp, range: ev.target.value }))}
          />
        </FormGroup>

        <FormGroup controlId='createSpellDuration' className='mb-3'>
          <FormLabel>Duração</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.duration}
            onChange={(ev) => setSpell((sp) => ({ ...sp, duration: ev.target.value }))}
          />
        </FormGroup>

        {/* NOVO CAMPO: RESISTÊNCIA */}
        <FormGroup controlId='createSpellResistance' className='mb-3'>
          <FormLabel>Resistência</FormLabel>
          <FormControl
            className='theme-element'
            value={spell.resistance || ''}
            onChange={(ev) => setSpell((sp) => ({ ...sp, resistance: ev.target.value }))}
          />
        </FormGroup>

        {/* Upload do Arquivo de Imagem do Símbolo no Computador */}
        <FormGroup controlId='createSpellSymbol' className='mb-3'>
          <FormLabel>Símbolo (Enviar Imagem do Computador)</FormLabel>
          <FormControl
            type='file'
            accept='image/*'
            className='theme-element'
            onChange={onSymbolFileChange}
          />
          {spell.symbol && spell.symbol !== '-' && (
            <div className='mt-2 text-center'>
              <img
                src={spell.symbol}
                alt='Símbolo selecionado'
                style={{ maxHeight: '7rem', objectFit: 'contain' }}
              />
              <br />
              <Button
                size='sm'
                variant='outline-danger'
                className='mt-1'
                onClick={() => setSpell((sp) => ({ ...sp, symbol: '' }))}
              >
                Remover Símbolo
              </Button>
            </div>
          )}
        </FormGroup>

        <FormCheck
          inline
          checked={spell.visible}
          onChange={(ev) => setSpell((sp) => ({ ...sp, visible: ev.target.checked }))}
          id='createSpellVisible'
          label='Visível?'
        />
      </Container>
    </SheetModal>
  );
}
