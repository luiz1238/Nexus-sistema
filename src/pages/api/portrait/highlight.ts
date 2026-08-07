import type { NextApiRequest, NextApiResponse } from 'next';
import { broadcast } from '../../../utils/broadcast';
import { sessionAPI } from '../../../utils/session';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(404).end();
    return;
  }

  const player = req.session.player;
  if (!player || !player.admin) {
    res.status(401).end();
    return;
  }

  const { playerId, color } = req.body;

  broadcast('portraitHighlight', {
    playerId: playerId ?? null,
    color: color || '#ddaf0f',
  });

  res.status(200).end();
}

export default sessionAPI(handler);
