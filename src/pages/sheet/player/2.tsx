import type { GetServerSidePropsContext } from 'next';
import Router from 'next/router';
import { useEffect } from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import ApplicationHead from '../../../components/ApplicationHead';
import ErrorToastContainer from '../../../components/ErrorToastContainer';
import PlayerAnnotationField from '../../../components/Player/PlayerAnnotationField';
import PlayerExtraInfoField from '../../../components/Player/PlayerExtraInfoField';
import { ErrorLogger, Realtime } from '../../../contexts';
import useRealtime from '../../../hooks/useRealtime';
import useToast from '../../../hooks/useToast';
import type { InferSSRProps } from '../../../utils';
import api from '../../../utils/api';
import prisma from '../../../utils/database';
import { sessionSSR } from '../../../utils/session';

type PageProps = InferSSRProps<typeof getSSP>;

export default function Page(props: PageProps) {
	return (
		<>
			<ApplicationHead title='Ficha do Personagem - Página 2' />
			<PlayerSheet {...props} />
		</>
	);
}

function PlayerSheet(props: PageProps) {
	if (!props || !props.player) {
		return (
			<Container className='text-center mt-5'>
				<h2 style={{ color: '#8a2be2' }}>Ficha Não Encontrada.</h2>
				<p>Houve um erro de sincronização com o banco de dados.</p>
				<Button variant="secondary" onClick={() => Router.push('/')}>Voltar ao Início</Button>
			</Container>
		);
	}

  const [toasts, addToast] = useToast();
  const { on, ready } = useRealtime();

  useEffect(() => {
    // INTERCEPTADOR: Captura o ID da URL quando o Mestre acessa a página 2 do jogador
    const queryParams = new URLSearchParams(window.location.search);
    const urlPlayerId = queryParams.get('playerId');
    let reqInterceptor: number | null = null;

    if (urlPlayerId) {
      reqInterceptor = api.interceptors.request.use((config) => {
        if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
          config.data = config.data || {};
          // Injeta o ID do jogador alvo para autorizar as edições
          config.data.npcId = parseInt(urlPlayerId);
          config.data.playerId = parseInt(urlPlayerId);
        } else if (config.method?.toLowerCase() === 'get') {
          config.params = config.params || {};
          config.params.npcId = parseInt(urlPlayerId);
          config.params.playerId = parseInt(urlPlayerId);
          config.params.playerID = parseInt(urlPlayerId);
        }
        return config;
      });
    }

    const unsub = on('playerDelete', (payload) => {
      if (payload.playerId === props.player.id) {
        api.delete('/player').then(() => Router.push('/'));
      }
    });

    return () => { 
      unsub?.(); 
      if (reqInterceptor !== null) {
        api.interceptors.request.eject(reqInterceptor);
      }
    };
  }, [on, props.player.id]);

  if (!ready)
		return (
			<Container className='text-center'>
				<Row className='align-items-center' style={{ height: '90vh' }}>
					<Col>
						<Spinner animation='border' style={{ color: '#8a2be2' }} />
					</Col>
				</Row>
			</Container>
		);

	return (
		<>
			<ErrorLogger.Provider value={addToast}>
        <Realtime.Provider value={null}>
					<Container>
						<Row className='display-5 text-center mb-3'>
							<Col>Anotações e Detalhes</Col>
						</Row>
						<Row className='mb-3'>
							<Col xs={12} md={6} className='mb-3 mb-md-0'>
								<PlayerExtraInfoField
									extraInfo={props.player.PlayerExtraInfo}
								/>
							</Col>
							<Col xs={12} md={6}>
								<PlayerAnnotationField
									// AQUI FOI AJUSTADO PARA LER DA TABELA CORRETA
									value={props.player.PlayerNote?.[0]?.value || ''}
								/>
							</Col>
						</Row>
					</Container>
        </Realtime.Provider>
			</ErrorLogger.Provider>
			<ErrorToastContainer toasts={toasts} />
		</>
	);
}

async function getSSP(ctx: GetServerSidePropsContext) {
	const playerSession = ctx.req.session.player;

	if (!playerSession) {
		return { redirect: { destination: '/', permanent: false } };
	}

	let targetId = playerSession.id;

	if (playerSession.admin && ctx.query.playerId) {
		const parsedId = parseInt(ctx.query.playerId as string);
		if (!isNaN(parsedId)) {
			targetId = parsedId;
		}
	}

	const player = await prisma.player.findUnique({
		where: { id: targetId },
		select: {
			id: true,
			// AQUI FOI AJUSTADA A BUSCA NO BANCO DE DADOS
			PlayerNote: { select: { value: true } },
			PlayerExtraInfo: {
				select: {
					value: true,
					ExtraInfo: true,
				},
			},
		},
	});

	if (!player) {
		if (!playerSession.admin) {
			ctx.req.session.destroy();
		}
		return {
			redirect: {
				destination: '/',
				permanent: false,
			},
		};
	}

	return {
		props: {
			player,
		},
	};
}

export const getServerSideProps = sessionSSR(getSSP);
