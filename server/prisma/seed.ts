import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ENV } from '../src/config/env';

const prisma = new PrismaClient();

// ====================================================================
// BANCO DE MÍDIAS ULTRA-CONFIÁVEIS (VÍDEOS MP4 & FOTOS EM ALTA RESOLUÇÃO)
// ====================================================================

const VIDEO_BANK = [
  // 1. Esportes, Natureza e Aventura
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  
  // 2. Vídeos Adicionais Públicos e Rápidos
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
];

const PHOTO_BANK = {
  cars: [
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541348263662-e0c86437bf7f?w=1080&auto=format&fit=crop&q=80',
  ],
  gaming: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1612287232230-057d38392fca?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=1080&auto=format&fit=crop&q=80',
  ],
  travel: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1080&auto=format&fit=crop&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1080&auto=format&fit=crop&q=80', // Vôlei
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1080&auto=format&fit=crop&q=80', // Futebol
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&auto=format&fit=crop&q=80', // Gym
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1080&auto=format&fit=crop&q=80', // Surf
    'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=1080&auto=format&fit=crop&q=80', // Skate
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1080&auto=format&fit=crop&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&auto=format&fit=crop&q=80',
  ],
  design: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1080&auto=format&fit=crop&q=80',
  ],
  photography: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1080&auto=format&fit=crop&q=80',
  ],
  music: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1080&auto=format&fit=crop&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&auto=format&fit=crop&q=80',
  ],
  pets: [
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=1080&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1080&auto=format&fit=crop&q=80',
  ],
  avatars: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
  ],
};

const RICH_COMMENTS = [
  'Sensacional demais! 🔥👏',
  'Que filmagem absurda! Qual câmera você usou?',
  'Ficou incrível, parabéns pelo trabalho! ✨',
  'Muito bom ver isso rodando liso na rede local! Velocidade impressionante ⚡',
  'Top demais! Já quero ir nesse lugar 😍',
  'Inspiração pura! 🚀',
  'Coisa mais linda! Merece ir pro Explore 💯',
  'Setup dos sonhos! Onde comprou essa iluminação?',
  'Arrebentou no ângulo! 📸',
  'Essa paisagem é de tirar o fôlego! 🌴',
  'Que qualidade impecável! 👏🙌',
  'Mandou muito bem!',
  'Ficou épico! Parabéns pelo clipe 🎬',
  'O ronco desse motor é música pros ouvidos 🏎️💨',
  'Quero ver a parte 2 desse treino! 🔥',
  'Simplesmente a melhor foto do meu feed hoje!',
  'Que lugar maravilhoso, adicionado na minha lista de viagens ✈️',
  'Perfeição em cada detalhe 💎',
  'Como você editou essa cor? Ficou cinematográfico!',
  'Muito profissional! 🚀✨',
  'Caraca, que manobra perfeita! 🛹🔥',
  'Essa praia é aqui no Brasil? Que paraíso!',
  'Já salvei nos meus favoritos para rever depois 🔖',
];

async function seed() {
  console.log('🚀 Iniciando Super Seed Massivo do NEXUS Social (100+ Perfis, 500+ Posts, Vídeos & Stories)...');

  // Limpa tabelas para garantir estado limpo e consistente
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.story.deleteMany();
  await prisma.highlight.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.post.deleteMany();
  await prisma.followRequest.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash(ENV.ADMIN_PASSWORD, salt);
  const commonPasswordHash = await bcrypt.hash('123456', salt);

  // 1. Administrador Central
  const admin = await prisma.user.create({
    data: {
      username: ENV.ADMIN_USERNAME.toLowerCase(),
      email: ENV.ADMIN_EMAIL.toLowerCase(),
      displayName: ENV.ADMIN_NAME,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      bio: 'Administrador central do servidor NEXUS Social 🖥️✨ Rede local de altíssima performance.',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      website: 'https://github.com/localsocial',
      isVerified: true,
      isPrivate: false,
    },
  });

  console.log(`✅ Admin configurado: @${admin.username}`);

  // 2. Lista de 90+ Perfis Fictícios Vivos
  const profileTemplates = [
    // Viagens e Natureza
    { u: 'wanderlust.maya', n: 'Maya Santoro', b: '🌍 Exploradora do mundo • 42 países • Vivendo de viagens e pores do sol ✈️🌴', cat: 'travel', v: true },
    { u: 'nordic.trails', n: 'Erik Trails', b: '🏔️ Montanhas nevadas, florestas nórdicas e noites sob a aurora boreal ❄️🏕️', cat: 'travel', v: true },
    { u: 'rio.lifestyle', n: 'Carioca Vibe', b: '🏖️ As melhores praias, trilhas e vistas do Rio de Janeiro ☀️🍹', cat: 'travel', v: false },
    { u: 'bali.dreams', n: 'Camila & Rafa', b: '🛵 Viajando pela Ásia com mochilas nas costas e sorrisos no rosto 🌴🌺', cat: 'travel', v: false },
    { u: 'alps.explorer', n: 'Matheus Explorer', b: '⛰️ Escaladas alpinas e paisagens que parecem pinturas 🧗‍♂️', cat: 'travel', v: false },
    { u: 'desert.nomad', n: 'Tarek Nomad', b: '🐪 Dunas douradas, céu estrelado e o silêncio do deserto 🌌', cat: 'travel', v: false },
    { u: 'amazon.wild', n: 'Expedição Amazônia', b: '🦜 Preservação, fauna silvestre e os segredos da maior floresta 🌿', cat: 'travel', v: true },
    { u: 'noronha.vibes', n: 'Noronha Paraíso', b: '🐢 Águas cristalinas e vida marinha inesquecível em Noronha 🌊', cat: 'travel', v: true },
    { u: 'patagonia.trek', n: 'Patagônia Selvagem', b: '🏔️ Geleiras, vento forte e trilhas lendárias no fim do mundo ❄️', cat: 'travel', v: false },
    { u: 'japan.journey', n: 'Kenji no Japão', b: '🌸 Tóquio futurista, templos antigos e a culinária dos sonhos 🇯🇵🍜', cat: 'travel', v: true },

    // Carros, Supercars & Drift
    { u: 'turbo.beast', n: 'Leandro Motors', b: '🏎️ V8, biturbo e curvas perfeitas • Track days & Supercars Brasil 🏁🔥', cat: 'cars', v: true },
    { u: 'drift.culture', n: 'Drift Culture BR', b: '💨 Fumaça, ângulo e pneus queimando na pista • JDM Legends 🇯🇵🏁', cat: 'cars', v: true },
    { u: 'speed.motors', n: 'Thiago Speed', b: '🏎️ Avaliações automotivas, ronco de motor e lançamentos 🚀', cat: 'cars', v: false },
    { u: 'classic.garage', n: 'Garagem Clássica', b: '🚗 Restauração de clássicos dos anos 60, 70 e 80 com paixão ❤️🛠️', cat: 'cars', v: false },
    { u: 'moto.rider', n: 'Bruno Duas Rodas', b: '🏍️ Duas rodas, asfalto livre e o vento no capacete 🛣️⚡', cat: 'cars', v: false },
    { u: 'porsche.club', n: 'Stuttgart Vibe', b: '🐎 Boxer 6 cilindros aspirado e a engenharia alemã definitiva 🇩🇪✨', cat: 'cars', v: true },
    { u: 'jdm.brasil', n: 'Garagem JDM', b: '🔰 Skylines, Supras e RX7s que marcaram época nas ruas e pistas 🏁', cat: 'cars', v: false },
    { u: 'offroad.br', n: '4x4 Extremo', b: '🚙 Lama, pedra e expedições onde o asfalto não chega 🌲⛺', cat: 'cars', v: false },

    // Games, Esports & Streamers
    { u: 'valkyrie.gg', n: 'Luna "Valkyrie" Chen', b: '🎮 Streamer & Pro Player • RPGs, FPS e setups futuristas 👾💜', cat: 'gaming', v: true },
    { u: 'setup.wars', n: 'Setup Wars BR', b: '🖥️ Os setups gamers e home offices mais insanos da rede 🌈💡', cat: 'gaming', v: true },
    { u: 'pixel.forge', n: 'Arthur Pixel', b: '🕹️ Pixel art, gamedev e consoles retrô • Criador de mundos virtuais 👾', cat: 'gaming', v: false },
    { u: 'stream.nina', n: 'Nina Games', b: '🎙️ Lives todos os dias às 19h • Gameplay caótico e muitas risadas 💜', cat: 'gaming', v: false },
    { u: 'retro.player', n: 'Felipe 16-Bit', b: '📼 Colecionador de cartuchos, CRTs e nostalgia pura dos anos 90 🕹️', cat: 'gaming', v: false },
    { u: 'esports.insider', n: 'Arena Esports BR', b: '🏆 Notícias, torneios e bastidores dos maiores campeonatos de games 🎮', cat: 'gaming', v: true },
    { u: 'cyber.samurai', n: 'Kael Neo', b: '⚔️ Imersão em mundos cyberpunk, VR e modding avançado ⚡', cat: 'gaming', v: false },

    // Esportes, Vôlei, Futebol & Fitness
    { u: 'gabriel.volley', n: 'Gabriel Alencar', b: '🏐 Atleta de Vôlei de Praia & Quadra • Determinação e foco 🥇🇧🇷', cat: 'sports', v: true },
    { u: 'felipe.runner', n: 'Felipe Maratonista', b: '🏃‍♂️ Corredor de rua | 42k finisher | Cada km conta uma história 🏅', cat: 'sports', v: false },
    { u: 'bruna.fit', n: 'Bruna Personal', b: '💪 Treinamento funcional, musculação e estilo de vida saudável 🥗✨', cat: 'sports', v: true },
    { u: 'crossfit.flow', n: 'Box Flow', b: '🏋️‍♂️ Superação diária, WODs pesados e comunidade unida 🔥', cat: 'sports', v: false },
    { u: 'surf.lucas', n: 'Lucas Maresias', b: '🏄‍♂️ Sal, sol e boas ondas • Sempre em busca do swell perfeito 🌊🤙', cat: 'sports', v: false },
    { u: 'skate.vibe', n: 'Vitor Santos', b: '🛹 Street skate, manobras urbanas e lifestyle de rua 🏙️', cat: 'sports', v: false },
    { u: 'yoga.clara', n: 'Clara Paz', b: '🧘‍♀️ Respiração, equilíbrio e conexão mente-corpo ✨🌸', cat: 'sports', v: false },
    { u: 'fut.amador', n: 'Pelada de Quarta', b: '⚽ A resenha sagrada de toda semana • Gols e canetas 🏆', cat: 'sports', v: false },
    { u: 'calistenia.br', n: 'Rodrigo Street Workout', b: '🤸‍♂️ Treinos com o peso do corpo e controle absoluto da gravidade ⚡', cat: 'sports', v: false },
    { u: 'mountain.bike', n: 'Trilhas MTB', b: '🚵‍♂️ Single tracks, descidas técnicas e muita poeira na cara 🌲', cat: 'sports', v: false },

    // Fotografia & Cinema
    { u: 'clara.lens', n: 'Clara Meirelles', b: '📸 Fotógrafa de retratos e luz natural • Eternizando olhares ✨📷', cat: 'photography', v: true },
    { u: 'hugo.drone', n: 'Hugo FPV', b: '🛸 Piloto de Drone FPV e Cinematografia Aérea • O mundo visto de cima 🌍🎬', cat: 'photography', v: true },
    { u: 'lumi.frames', n: 'Lumi Studio', b: '🎞️ Fotografia analógica 35mm & 120mm • Grão, textura e nostalgia 📷', cat: 'photography', v: false },
    { u: 'urban.vibes', n: 'Caio Urban', b: '🏙️ Luzes de néon, chuva no asfalto e a arquitetura das grandes cidades 🌆', cat: 'photography', v: false },
    { u: 'macro.world', n: 'Juliana Macro', b: '🔍 O universo invisível a olho nu • Gotas de orvalho e insetos fascinantes 🔬', cat: 'photography', v: false },
    { u: 'cinematic.br', n: 'Cineastas BR', b: '🎥 Bastidores de gravação, lentes anamórficas e color grading 🎬🍿', cat: 'photography', v: false },
    { u: 'astro.lens', n: 'Céu Noturno', b: '🌌 Astrofotografia • Via Láctea, nebulosas e estrelas cadentes ✨🔭', cat: 'photography', v: true },
    { u: 'blackandwhite.br', n: 'Monocromo', b: '🖤 A alma do preto e branco • Luz, sombra e contraste profundo 📸', cat: 'photography', v: false },

    // Design, Arquitetura & 3D
    { u: 'sophia.design', n: 'Sophia Costa', b: '🎨 Lead Product Designer • UI/UX, 3D Art & Design Systems 💡🚀', cat: 'design', v: true },
    { u: 'neon.canvas', n: 'Neon Art Studio', b: '🟣 3D Blender, iluminação volumétrica e estéticas synthwave/cyberpunk 🎨', cat: 'design', v: false },
    { u: 'mateus.arch', n: 'Mateus Arquiteto', b: '🏛️ Arquitetura contemporânea, concreto aparente e luz natural 📐✨', cat: 'design', v: true },
    { u: 'vector.flow', n: 'Ana Ilustra', b: '🖌️ Ilustrações vetoriais, branding e tipografia expressiva 🌈', cat: 'design', v: false },
    { u: 'minimal.spaces', n: 'Design Minimalista', b: '🤍 Menos é mais • Ambientes acolhedores, madeira e simplicidade 🌿', cat: 'design', v: false },
    { u: 'motion.craft', n: 'Danilo Motion', b: '💫 Animações 2D/3D que dão vida a marcas e interfaces 🚀', cat: 'design', v: false },

    // Tech, Programação & IA
    { u: 'marina.tech', n: 'Marina Silva', b: '💻 Engenharia de Software, Cloud e Inteligência Artificial 🚀☕', cat: 'tech', v: true },
    { u: 'carlos.dev', n: 'Carlos Eduardo', b: '🐧 Linux Lover, Rust & TypeScript • Construindo servidores locais rápidos', cat: 'tech', v: false },
    { u: 'frontend.ninja', n: 'Renato Dev', b: '🎨 CSS animations, React e interfaces limpas como cristal 💎', cat: 'tech', v: false },
    { u: 'ai.researcher', n: 'Dra. Beatriz Santos', b: '🤖 Pesquisa em Modelos de Linguagem e Visão Computacional 🧠🔬', cat: 'tech', v: true },
    { u: 'cyber.lucas', n: 'Lucas Pinheiro', b: '⚡ Desenvolvedor Fullstack | Cyberpunk enthusiast & Mechanical Keyboards ⌨️', cat: 'tech', v: false },
    { u: 'devops.guru', n: 'Marcos Kubernetes', b: '🐳 Docker, CI/CD e infraestrutura como código em alta escala 🛠️', cat: 'tech', v: false },
    { u: 'data.science.br', n: 'Ciência de Dados BR', b: '📊 Gráficos, insights, Python e decisões baseadas em dados 📈', cat: 'tech', v: false },

    // Música & Áudio
    { u: 'dj.kairo', n: 'KAIRO (DJ/Produtor)', b: '🎧 Melodic Techno & Synthwave • Beats que movem o universo 🌌🎹', cat: 'music', v: true },
    { u: 'synth.wave', n: 'Retro Synth Brasil', b: '🎹 Teclados analógicos dos anos 80 e batidas com sabor de nostalgia 📼', cat: 'music', v: false },
    { u: 'beat.maker', n: 'DJ Zeca', b: '🥁 Trap, Lo-Fi e Hip-Hop beats produzidos no quarto 🎧📦', cat: 'music', v: false },
    { u: 'acoustic.vibes', n: 'Mariana Voz & Violão', b: '🎸 Covers acústicos, melodias suaves e canções autorais 🎶🌻', cat: 'music', v: false },
    { u: 'studio.mix', n: 'Mix & Master BR', b: '🎛️ Produção musical, compressores analógicos e plugins lendários 🎙️', cat: 'music', v: true },

    // Gastronomia, Cafés & Churrasco
    { u: 'barista.leo', n: 'Leonardo Café', b: '☕ Especialista em cafés especiais, latte art e torras artesanais 🌱🤎', cat: 'food', v: true },
    { u: 'chef.gustavo', n: 'Chef Gustavo Lima', b: '👨‍🍳 Culinária contemporânea com ingredientes brasileiros autênticos 🍲🇧🇷', cat: 'food', v: true },
    { u: 'sweet.bakery', n: 'Doce Encanto', b: '🧁 Confeitaria artesanal, bolos decorados e croissants dourados 🥐🍓', cat: 'food', v: false },
    { u: 'craft.burgers', n: 'Hambúrguer de Respeito', b: '🍔 Blend 100% angus, queijo derretido e pão brioche selado 🤤', cat: 'food', v: false },
    { u: 'artisan.pizza', n: 'Forno & Lenha', b: '🍕 Massa de fermentação lenta 48h e molho de tomate pelati italiano 🍅🇮🇹', cat: 'food', v: false },
    { u: 'bbq.master', n: 'Churrasco Raiz', b: '🥩 Picanha, costela no fogo de chão e fumaça de lenha nobre 🔥🍖', cat: 'food', v: true },

    // Pets, Moda & Lifestyle
    { u: 'isabella.vibe', n: 'Isabella Rocha', b: '✨ Moda consciente, cafés no fim de tarde e bons livros ☕📖', cat: 'design', v: false },
    { u: 'vintage.closet', n: 'Brechó Vintage', b: '👗 Peças únicas garimpadas com amor e história para contar 👘🌿', cat: 'design', v: false },
    { u: 'streetwear.br', n: 'Sneakers & Street', b: '👟 Tênis raros, coleções exclusivas e cultura sneakerhead 🔥', cat: 'cars', v: false },
    { u: 'golden.retriever', n: 'Bidu o Dourado', b: '🐕‍🦺 Brincadeiras, corridas na praia e muito amor canino 🐾💛', cat: 'pets', v: true },
    { u: 'gatos.fofos', n: 'Gatil Felino', b: '🐱 Ronronados, sonecas no sol e travessuras diárias 🐾🧶', cat: 'pets', v: false },
  ];

  const createdUsers: any[] = [];

  for (let i = 0; i < profileTemplates.length; i++) {
    const p = profileTemplates[i];
    const avatar = PHOTO_BANK.avatars[i % PHOTO_BANK.avatars.length];
    const cover = (PHOTO_BANK as any)[p.cat]?.[0] || PHOTO_BANK.travel[0];

    const u = await prisma.user.create({
      data: {
        username: p.u,
        displayName: p.n,
        email: `${p.u}@nexus.local`,
        passwordHash: commonPasswordHash,
        bio: p.b,
        avatarUrl: avatar,
        coverUrl: cover,
        isVerified: p.v,
        isPrivate: false,
        role: 'USER',
      },
    });

    createdUsers.push({ ...u, category: p.cat });
  }

  console.log(`✅ ${createdUsers.length} perfis fictícios completos criados com sucesso!`);

  // 3. Rede Densa de Conexões e Seguidores
  const allUsers = [admin, ...createdUsers];

  for (const userA of allUsers) {
    // Segue 15 a 35 pessoas aleatórias
    const targetCount = Math.floor(Math.random() * 20) + 15;
    for (let k = 0; k < targetCount; k++) {
      const userB = allUsers[Math.floor(Math.random() * allUsers.length)];
      if (userA.id !== userB.id) {
        try {
          await prisma.follow.create({
            data: { followerId: userA.id, followingId: userB.id },
          });
        } catch (e) {}
      }
    }
  }

  console.log('✅ Rede densa de seguidores e relacionamentos configurada.');

  // 4. Criação de Stories Ativos (Fotos & Vídeos MP4)
  const now = new Date();
  const expires24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const storyUsers = createdUsers.slice(0, 30);

  for (let i = 0; i < storyUsers.length; i++) {
    const su = storyUsers[i];
    const isVideoStory = i % 3 === 0;
    const media = isVideoStory
      ? VIDEO_BANK[i % VIDEO_BANK.length]
      : ((PHOTO_BANK as any)[su.category] || PHOTO_BANK.travel)[i % 5];

    await prisma.story.create({
      data: {
        userId: su.id,
        mediaUrl: media,
        mediaType: isVideoStory ? 'VIDEO' : 'IMAGE',
        caption: `Dia incrível por aqui! ✨ @${su.username}`,
        createdAt: now,
        expiresAt: expires24h,
      },
    });
  }

  console.log(`✅ ${storyUsers.length} Stories ativos (com vídeos e fotos) criados.`);

  // 5. Criação de Destaques de Perfil (Highlights)
  const highlightTitles = ['Viagens ✈️', 'Setup 🖥️', 'Treinos 💪', 'Momentos 📸', 'Vibes 🌅', 'Destaques ⭐', 'Carros 🏎️'];
  for (let i = 0; i < createdUsers.slice(0, 25).length; i++) {
    const u = createdUsers[i];
    for (let h = 0; h < 4; h++) {
      const cover = (PHOTO_BANK as any)[u.category]?.[h] || PHOTO_BANK.travel[h % PHOTO_BANK.travel.length];
      await prisma.highlight.create({
        data: {
          userId: u.id,
          title: highlightTitles[h % highlightTitles.length],
          coverUrl: cover,
        },
      });
    }
  }

  console.log('✅ Destaques de perfil (Highlights) configurados para criadores.');

  // 6. Geração de 500+ Publicações Ricas (COM MUITOS VÍDEOS MP4 E FOTOS)
  const CAPTIONS = [
    'Momentos que fazem a vida valer cada segundo 🌅✨ #Vibes #NEXUS #Nature',
    'Nada supera a sensação de ver o projeto rodando liso e rápido! 🚀💻 #Tech #Dev',
    'Acelerando na pista com a adrenalina a mil por hora! Quem mais é apaixonado por motor? 🏎️💨 #TrackDay #Supercars',
    'A luz natural do entardecer tem uma poesia visual mágica 📸✨ #Fotografia #Retrato',
    'Fim de tarde na praia depois de um dia produtivo. Recarregando as baterias 🌊🏖️ #Rio #Maresias',
    'Mais um treino pesado concluído! A consistência sempre vence o desânimo 💪🔥 #Gym #Fitness #Foco',
    'O que acharam desse novo ângulo? Deixe sua opinião nos comentários! 👇',
    'Explorando lugares onde o sinal de celular nem chega. O mundo é gigante 🌎✈️ #Wanderlust',
    'A batida certa no momento exato muda qualquer dia. Nova track no forno! 🎧🎹 #ElectronicMusic',
    'Um café especial passado na hora é o combustível oficial dos criadores ☕🤎 #CoffeeLover',
    'Setup finalizado com iluminação ambiente. Produtividade agora multiplicada por 10 🖥️💡 #GamerSetup',
    'Passei a tarde testando novos voos de drone sobre as nuvens. O resultado ficou surreal 🛸☁️ #FPV',
    'Receita nova testada e 100% aprovada! Quem aceita um pedaço? 🍕🤤 #Foodie #Chef',
    'Street skate na veia! A cidade é a nossa pista 🛹🏙️ #SkateLife',
    'Olha a energia desse lugar! Momentos inesquecíveis ✨🙏',
    'Aquele rolê de fim de tarde que lava a alma 🛣️🏍️',
    'Quando o sol se põe, o céu vira uma pintura 🌇',
    'Treino de vôlei na areia fofa: exaustivo mas recompensador demais! 🏐🇧🇷',
    'Criar interfaces limpas e responsivas é a minha maior paixão 🎨💎',
    'Foco no processo, porque o resultado é consequência direta da dedicação ⚡',
  ];

  const LOCATIONS = [
    'São Paulo, SP',
    'Rio de Janeiro, RJ',
    'Florianópolis, SC',
    'Praia de Maresias, SP',
    'Fernando de Noronha, PE',
    'Parque Ibirapuera, SP',
    'Curitiba, PR',
    'Belo Horizonte, MG',
    'Gramado, RS',
    'Chapada dos Veadeiros, GO',
    'Tóquio, Japão',
    'Interlagos, SP',
    'Praia do Rosa, SC',
    'Salvador, BA',
    'Home Studio & Setup',
  ];

  let totalPostsCreated = 0;
  let videoPostsCreated = 0;

  for (let i = 0; i < createdUsers.length; i++) {
    const author = createdUsers[i];
    const catPhotos = (PHOTO_BANK as any)[author.category] || PHOTO_BANK.travel;
    
    // Cada usuário ganha de 6 a 12 posts!
    const numPosts = Math.floor(Math.random() * 7) + 6;

    for (let p = 0; p < numPosts; p++) {
      // 40% de chance de ser um vídeo MP4!
      const isVideo = p % 2 === 0 || Math.random() < 0.4;
      const mediaUrl = isVideo
        ? VIDEO_BANK[totalPostsCreated % VIDEO_BANK.length]
        : catPhotos[p % catPhotos.length];

      if (isVideo) videoPostsCreated++;

      const caption = CAPTIONS[totalPostsCreated % CAPTIONS.length];
      const location = LOCATIONS[totalPostsCreated % LOCATIONS.length];
      const viewsCount = isVideo
        ? Math.floor(Math.random() * 25000) + 1200
        : Math.floor(Math.random() * 5000) + 150;

      const post = await prisma.post.create({
        data: {
          userId: author.id,
          caption,
          location,
          viewsCount,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 20 * 24 * 60 * 60 * 1000)),
          media: {
            create: [
              {
                url: mediaUrl,
                mediaType: isVideo ? 'VIDEO' : 'IMAGE',
                order: 0,
              },
            ],
          },
        },
      });

      // Cria de 8 a 40 curtidas por post
      const likeCount = Math.floor(Math.random() * 32) + 8;
      for (let l = 0; l < likeCount; l++) {
        const liker = allUsers[Math.floor(Math.random() * allUsers.length)];
        try {
          await prisma.like.create({
            data: { userId: liker.id, postId: post.id },
          });
        } catch (e) {}
      }

      // Cria de 2 a 8 comentários por post
      const commentCount = Math.floor(Math.random() * 6) + 2;
      for (let c = 0; c < commentCount; c++) {
        const commenter = allUsers[Math.floor(Math.random() * allUsers.length)];
        const commentText = RICH_COMMENTS[(totalPostsCreated + c) % RICH_COMMENTS.length];
        try {
          await prisma.comment.create({
            data: {
              userId: commenter.id,
              postId: post.id,
              content: commentText,
            },
          });
        } catch (e) {}
      }

      totalPostsCreated++;
    }
  }

  console.log(`✅ ${totalPostsCreated} publicações criadas (sendo ${videoPostsCreated} VÍDEOS MP4 REAIS e centenas de fotos)!`);

  // 7. Criação de 15 Conversas Pré-Populadas com o Administrador e Criadores
  const chatPartners = createdUsers.slice(0, 15);
  for (const partner of chatPartners) {
    const conv = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [{ userId: admin.id }, { userId: partner.id }],
        },
      },
    });

    // Histórico de mensagens realista
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: partner.id,
        content: `Oi @admin! Que incrível ficou essa rede social funcionando localmente no PC com vídeos fluidos e Stories 🚀✨`,
        createdAt: new Date(Date.now() - 7200000),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: admin.id,
        content: `Fala @${partner.username}! Bem-vindo ao NEXUS Social. O servidor local tá voando baixo com tudo rodando liso ⚡`,
        createdAt: new Date(Date.now() - 3600000),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: partner.id,
        content: `Acabei de postar um vídeo novo lá no feed e nos Clips! Dá uma olhada depois 🔥`,
        createdAt: new Date(Date.now() - 1800000),
      },
    });
  }

  console.log('✅ 15 conversas de chat pré-populadas com mensagens completas.');
  console.log('\n🎉 SUPER SEED MASSIVO CONCLUÍDO COM SUCESSO TOTAL! A rede social está repleta de vídeos, perfis e interações!');
}

seed()
  .catch((e) => {
    console.error('❌ Erro no seed massivo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
