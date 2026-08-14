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

  const currencyID: number | undefined = parseInt(req.body.id);
  if (!currencyID) {
    res.status(401).send({ message: 'ID da moeda está em branco.' });
    return;
  }

  const value: string | undefined = req.body.value;

  const currency = await prisma.playerCurrency.update({
    where: {
      player_id_currency_id: {
        player_id: playerId,
        currency_id: currencyID,
      },
    },
    data: { value },
  });

  res.end();

  broadcast('playerCurrencyChange', {
    playerId,
    currencyId: currencyID,
    value: currency.value,
  });
}

export default sessionAPI(handler);
