import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../utils/database';
import { sessionAPI } from '../../../../utils/session';
import { broadcast } from '../../../../utils/broadcast';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(401).end();
    return;
  }

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

  const characteristicID: number | undefined = parseInt(req.body.id);
  if (!characteristicID) {
    res.status(401).send({ message: 'ID da característica está em branco.' });
    return;
  }

  const value: number | undefined = req.body.value;

  const characteristic = await prisma.playerCharacteristic.update({
    where: {
      player_id_characteristic_id: {
        player_id: playerId,
        characteristic_id: characteristicID,
      },
    },
    data: { value },
  });

  res.end();

  broadcast('playerCharacteristicChange', {
    playerId,
    characteristicId: characteristicID,
    value: characteristic.value,
  });
}

export default sessionAPI(handler);
