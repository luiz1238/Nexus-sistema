import type { Spell } from '@prisma/client';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import DataContainer from '../DataContainer';

export type RitualData = Spell & {
  sanity?: string;
  symbol?: string;
  resistance?: string;
};

type PlayerSpellContainerProps = {
  playerSpells: {
    Spell: RitualData;
  }[];
};

export default function PlayerSpellContainer(props: PlayerSpellContainerProps) {
  const [selectedSpell, setSelectedSpell] = useState<RitualData | null>(null);

  return (
    <>
      <DataContainer title="Rituais" outline xs={12} lg={6}>
        <Table responsive hover className="text-center align-middle mb-0">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Elemento</th>
              <th>Custo</th>
              <th>Dano</th>
            </tr>
          </thead>
          <tbody>
            {props.playerSpells.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  Nenhum ritual aprendido.
                </td>
              </tr>
            ) : (
              props.playerSpells.map((ps) => (
                <tr
                  key={ps.Spell.id}
                  onClick={() => setSelectedSpell(ps.Spell)}
                  style={{ cursor: 'pointer' }}>
                  <td>{ps.Spell.name}</td>
                  <td>{ps.Spell.type}</td>
                  <td>{ps.Spell.cost}</td>
                  <td>{ps.Spell.damage}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </DataContainer>

      {/* Modal de Detalhes do Ritual */}
      {selectedSpell && (
        <Modal
          show={!!selectedSpell}
          onHide={() => setSelectedSpell(null)}
          centered
          className="theme-modal">
          <Modal.Header closeButton>
            <Modal.Title>{selectedSpell.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedSpell.symbol && selectedSpell.symbol !== '-' && (
              <div className="text-center mb-3">
                <img
                  src={selectedSpell.symbol}
                  alt={selectedSpell.name}
                  style={{ maxHeight: '120px', objectFit: 'contain' }}
                />
              </div>
            )}
            <p><strong>Descrição:</strong> {selectedSpell.description}</p>
            <p><strong>Elemento:</strong> {selectedSpell.type}</p>
            <p><strong>Custo:</strong> {selectedSpell.cost}</p>
            {selectedSpell.sanity && selectedSpell.sanity !== '-' && (
              <p><strong>Sanidade:</strong> {selectedSpell.sanity}</p>
            )}
            <p><strong>Dano / Efeito:</strong> {selectedSpell.damage}</p>
            <p><strong>Alvo:</strong> {selectedSpell.target}</p>
            <p><strong>Conjuração:</strong> {selectedSpell.castingTime}</p>
            <p><strong>Alcance:</strong> {selectedSpell.range}</p>
            <p><strong>Duração:</strong> {selectedSpell.duration}</p>
            {selectedSpell.resistance && selectedSpell.resistance !== '-' && (
              <p><strong>Resistência:</strong> {selectedSpell.resistance}</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedSpell(null)}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
