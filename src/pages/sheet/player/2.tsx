import type { GetServerSidePropsContext } from 'next';
import Router from 'next/router';
import { useEffect } from 'react';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import ApplicationHead from '../../../components/ApplicationHead';
import DataContainer from '../../../components/DataContainer';
import ErrorToastContainer from '../../../components/ErrorToastContainer';
import PlayerAnnotationsField from '../../../components/Player/PlayerAnnotationField';
import PlayerExtraInfoField from '../../../components/Player/PlayerExtraInfoField';
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
			<ApplicationHead title='Ficha do Personagem' />
			<PlayerSheet {...props} />
		</>
	);
}

function PlayerSheet(props: PageProps) {
	// BLINDAGEM: Se não achar o jogador, mostra tela amigável e não quebra o site
	if (!props || !props.player) {
		return (
			<Container className='text-center mt-5'>
				<h2 style={{ color: '#8a2be2' }}>Ficha Não Encontrada.</h2>
				<p>Não foi possível carregar os dados deste jogador.</p>
				<Button variant="secondary" onClick={() => Router.push('/')}>Voltar ao Início</Button>
			</Container>
		);
	}

  const [toasts, addToast] = useToast();
  const { on, ready } = useRealtime();

  useEffect(() => {
    const unsub = on('playerDelete', (payload) => {
      if (payload.playerId === props.player.id) {
        api.delete('/player').then(() => Router.push('/'));
      }
    });
    return () => { unsub?.(); };
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
			<Container>
				<Row className='display-5 text-center'>
					<Col>Ficha do Personagem</Col>
				</Row>
				<Row>
					<DataContainer title='Anotações' htmlFor='playerAnnotations' outline>
						{/* Proteção extra caso o jogador não tenha anotações ainda */}
						<PlayerAnnotationsField value={props.player.PlayerNote[0]?.value || ''} />
					</DataContainer>
				</Row>
				<Row>
					<DataContainer title='Detalhes Pessoais' outline>
						{props.player.PlayerExtraInfo.map((extraInfo) => (
							<Row className='mb-4' key={extraInfo.ExtraInfo.id}>
								<Col>
									<FormGroup controlId={`extraInfo${extraInfo.ExtraInfo.id}`}>
										<Row>
											<Col className='h4' style={{ margin: 0, color: '#c4a7e7' }}>
												<FormLabel>{extraInfo.ExtraInfo.name}</FormLabel>
											</Col>
										</Row>
										<Row>
											<Col>
												<PlayerExtraInfoField
													value={extraInfo.value}
													extraInfoId={extraInfo.ExtraInfo.id}
													logError={addToast}
												/>
											</Col>
										</Row>
									</FormGroup>
								</Col>
							</Row>
						))}
					</DataContainer>
				</Row>
			</Container>
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

	// Se for mestre, pega o ID da URL (?playerId=X)
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
			PlayerNote: { select: { value: true } },
			PlayerExtraInfo: { select: { ExtraInfo: true, value: true } },
		},
	});

	if (!player) {
		// Se não for admin e não achar a ficha, destrói a sessão
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
