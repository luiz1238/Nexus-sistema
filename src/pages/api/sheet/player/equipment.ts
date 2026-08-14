import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/database';
import { sessionAPI } from '../../../../utils/session';
import { broadcast } from '../../../../utils/broadcast';

function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'PUT') return handlePut(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  res.status(404).send({ message: 'Supported methods: POST | PUT | DELETE' });
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

  const pe = await prisma.playerEquipment.findMany({
    where: { player_id: playerId },
    select: { Equipment: true },
  });

  const equipments = pe.map((eq) => eq.Equipment);
  res.send({ equipments });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
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

  const equipmentID = req.body.id;
  if (!equipmentID) {
    res.status(400).send({ message: 'Equipment ID is undefined.' });
    return;
  }

  const currentAmmo = req.body.currentAmmo;

  const equipment = await prisma.playerEquipment.update({
    where: { player_id_equipment_id: { player_id: playerId, equipment_id: equipmentID } },
    data: { currentAmmo },
  });

  res.end();

  broadcast('playerEquipmentChange', {
    playerId,
    equipmentID,
    currentAmmo: equipment.currentAmmo,
  });
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

  const equipmentID = req.body.id;
  if (!equipmentID) {
    res.status(400).send({ message: 'Equipment ID is undefined.' });
    return;
  }

  const equipment = await prisma.playerEquipment.create({
    data: {
      currentAmmo: 0,
      player_id: playerId,
      equipment_id: equipmentID,
    },
    include: { Equipment: true },
  });

  res.send({ equipment });

  broadcast('playerEquipmentAdd', {
    playerId,
    equipment: equipment.Equipment,
    currentAmmo: equipment.currentAmmo,
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

  const equipmentID = req.body.id;
  if (!equipmentID) {
    res.status(400).send({ message: 'Equipment ID is undefined.' });
    return;
  }

  await prisma.playerEquipment.delete({
    where: { player_id_equipment_id: { player_id: playerId, equipment_id: equipmentID } },
  });

  res.end();

  broadcast('playerEquipmentRemove', { playerId, id: equipmentID });
}

export default sessionAPI(handler);
