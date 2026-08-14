import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../utils/database';
import { sessionAPI } from '../../../../../utils/session';
import { broadcast } from '../../../../../utils/broadcast';

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

  const attributeStatusID: number | undefined = parseInt(req.body.id);
  if (!attributeStatusID) {
    res.status(401).send({ message: 'ID do status do atributo está em branco.' });
    return;
  }

  const value: boolean | undefined = req.body.value;

  const attrStatus = await prisma.playerAttributeStatus.update({
    where: {
      player_id_attribute_status_id: {
        player_id: playerId,
        attribute_status_id: attributeStatusID,
      },
    },
    data: { value },
  });

  res.end();

  broadcast('playerAttributeStatusChange', {
    playerId,
    attributeStatusId: attributeStatusID,
    value: attrStatus.value,
  });
}

export default sessionAPI(handler);
