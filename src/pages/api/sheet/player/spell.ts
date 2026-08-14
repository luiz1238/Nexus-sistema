import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/database';
import { sessionAPI } from '../../../../utils/session';
import { broadcast } from '../../../../utils/broadcast';

function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'PUT') return handlePut(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  res.status(404).send({ message: 'Supported methods: PUT | DELETE' });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const player = req.session.player;
  if (!player) {
    res.status(401).end();
    return;
  }

  const playerId = parseInt(req.query.playerId as string);
  if (!playerId) {
    res.status(400).end();
    return;
  }

  const pe = await prisma.playerSpell.findMany({
    where: { player_id: playerId },
    select: { Spell: true },
  });

  const spells = pe.map((eq) => eq.Spell);
  res.send({ spells });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const player = req.session.player;
  if (!player) {
    res.status(401).end();
    return;
  }

  const npcId: number | undefined = req.body.npcId;
  const targetPlayerId: number | undefined = req.body.playerId;

  let playerId = player.id;
  if (player.admin) {
    if (npcId) playerId = npcId;
    else if (targetPlayerId) playerId = targetPlayerId;
    else {
      res.status(401).end();
      return;
    }
  }

  const spellID = req.body.id;
  if (!spellID) {
    res.status(400).send({ message: 'Spell ID is undefined.' });
    return;
  }

  const spell = await prisma.playerSpell.create({
    data: {
      player_id: playerId,
      spell_id: spellID,
    },
    include: { Spell: true },
  });

  res.send({ spell });

  broadcast('playerSpellAdd', {
    playerId,
    spell: spell.Spell,
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const player = req.session.player;
  if (!player) {
    res.status(401).end();
    return;
  }

  const npcId: number | undefined = req.body.npcId;
  const targetPlayerId: number | undefined = req.body.playerId;

  let playerId = player.id;
  if (player.admin) {
    if (npcId) playerId = npcId;
    else if (targetPlayerId) playerId = targetPlayerId;
    else {
      res.status(401).end();
      return;
    }
  }

  const spellID = req.body.id;
  if (!spellID) {
    res.status(400).send({ message: 'Spell ID is undefined.' });
    return;
  }

  await prisma.playerSpell.delete({
    where: { player_id_spell_id: { player_id: playerId, spell_id: spellID } },
  });

  res.end();

  broadcast('playerSpellRemove', { playerId, id: spellID });
}

export default sessionAPI(handler);
