// src/pages/api/portrait/highlight.ts
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

  if (!playerId) {
    res.status(400).end();
    return;
  }

  // Dispara o evento de brilho no portrait para todos os clientes escutando o realtime
  broadcast('portraitHighlight', { playerId, color: color || '#ddaf0f' });

  res.status(200).end();
}

export default sessionAPI(handler);
