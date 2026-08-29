import { Request, Response } from 'express';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
}

// Sucessos populares padrão quando o usuário abre o buscador
const POPULAR_SEARCH_TERMS = ['The Weeknd', 'Billie Eilish', 'Matue', 'Coldplay', 'Dua Lipa', 'Bruno Mars', 'Drake', 'Taylor Swift'];

export async function searchMusic(req: Request, res: Response) {
  try {
    const rawQuery = String(req.query.q || '').trim();
    const query = rawQuery || POPULAR_SEARCH_TERMS[Math.floor(Math.random() * POPULAR_SEARCH_TERMS.length)];

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=30`;

    let tracks: MusicTrack[] = [];

    try {
      const itunesRes = await fetch(itunesUrl, {
        headers: { 'User-Agent': 'LocalSocial/1.0' },
      });

      if (itunesRes.ok) {
        const data: any = await itunesRes.json();
        if (data.results && Array.isArray(data.results)) {
          tracks = data.results
            .filter((item: any) => item.previewUrl && item.trackName)
            .map((item: any) => ({
              id: String(item.trackId || Math.random()),
              title: item.trackName,
              artist: item.artistName || 'Artista Desconhecido',
              album: item.collectionName || '',
              coverUrl: item.artworkUrl100
                ? item.artworkUrl100.replace('100x100bb', '600x600bb').replace('100x100', '600x600')
                : '',
              audioUrl: item.previewUrl,
              duration: Math.round((item.trackTimeMillis || 30000) / 1000),
            }));
        }
      }
    } catch (itunesErr) {
      console.warn('⚠️ iTunes API indisponível, tentando Deezer...', itunesErr);
    }

    // Fallback para Deezer se iTunes retornar vazio
    if (tracks.length === 0) {
      try {
        const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=25`;
        const deezerRes = await fetch(deezerUrl);
        if (deezerRes.ok) {
          const data: any = await deezerRes.json();
          if (data.data && Array.isArray(data.data)) {
            tracks = data.data
              .filter((item: any) => item.preview && item.title)
              .map((item: any) => ({
                id: String(item.id),
                title: item.title,
                artist: item.artist?.name || 'Artista Desconhecido',
                album: item.album?.title || '',
                coverUrl: item.album?.cover_big || item.album?.cover_medium || item.album?.cover || '',
                audioUrl: item.preview,
                duration: item.duration || 30,
              }));
          }
        }
      } catch (deezerErr) {
        console.warn('⚠️ Deezer API indisponível:', deezerErr);
      }
    }

    return res.json({
      success: true,
      query,
      count: tracks.length,
      tracks,
    });
  } catch (error: any) {
    console.error('❌ Erro na busca de músicas:', error);
    return res.status(500).json({
      success: false,
      message: 'Falha ao buscar músicas no catálogo.',
      tracks: [],
    });
  }
}
