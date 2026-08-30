import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Iniciando migração do SQLite (prisma/localsocial.db) para o Supabase PostgreSQL...');
  
  const sqliteDbPath = path.resolve(__dirname, '../../prisma/localsocial.db');
  const sqlite = new DatabaseSync(sqliteDbPath);

  // 1. Users
  const users = sqlite.prepare('SELECT * FROM User').all() as any[];
  console.log(`👤 Migrando ${users.length} usuários...`);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        displayName: u.displayName,
        bio: u.bio || '',
        avatarUrl: u.avatarUrl || null,
        coverUrl: u.coverUrl || null,
        website: u.website || null,
        isPrivate: Boolean(u.isPrivate),
        isVerified: Boolean(u.isVerified),
        role: u.role || 'USER',
        isBlocked: Boolean(u.isBlocked),
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
      update: {},
    });
  }

  // 2. Posts
  const posts = sqlite.prepare('SELECT * FROM Post').all() as any[];
  console.log(`📝 Migrando ${posts.length} posts...`);
  for (const p of posts) {
    await prisma.post.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        userId: p.userId,
        caption: p.caption || '',
        location: p.location || null,
        musicTitle: p.musicTitle || null,
        musicArtist: p.musicArtist || null,
        musicCoverUrl: p.musicCoverUrl || null,
        musicAudioUrl: p.musicAudioUrl || null,
        musicStartTime: p.musicStartTime || 0,
        viewsCount: p.viewsCount || 0,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
      },
      update: {},
    });
  }

  // 3. PostMedia
  const mediaList = sqlite.prepare('SELECT * FROM PostMedia').all() as any[];
  console.log(`🖼️ Migrando ${mediaList.length} mídias de posts...`);
  for (const m of mediaList) {
    await prisma.postMedia.upsert({
      where: { id: m.id },
      create: {
        id: m.id,
        postId: m.postId,
        url: m.url,
        mediaType: m.mediaType || 'IMAGE',
        order: m.order || 0,
        width: m.width || null,
        height: m.height || null,
      },
      update: {},
    });
  }

  // 4. Likes
  const likes = sqlite.prepare('SELECT * FROM Like').all() as any[];
  console.log(`❤️ Migrando ${likes.length} curtidas...`);
  for (const l of likes) {
    await prisma.like.upsert({
      where: { userId_postId: { userId: l.userId, postId: l.postId } },
      create: {
        id: l.id,
        userId: l.userId,
        postId: l.postId,
        createdAt: new Date(l.createdAt),
      },
      update: {},
    });
  }

  // 5. Comments
  const comments = sqlite.prepare('SELECT * FROM Comment').all() as any[];
  console.log(`💬 Migrando ${comments.length} comentários...`);
  for (const c of comments) {
    await prisma.comment.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        userId: c.userId,
        postId: c.postId,
        parentId: c.parentId || null,
        content: c.content,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
      update: {},
    });
  }

  // 6. Follows
  const follows = sqlite.prepare('SELECT * FROM Follow').all() as any[];
  console.log(`🤝 Migrando ${follows.length} conexões de seguidores...`);
  for (const f of follows) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: f.followerId, followingId: f.followingId } },
      create: {
        id: f.id,
        followerId: f.followerId,
        followingId: f.followingId,
        createdAt: new Date(f.createdAt),
      },
      update: {},
    });
  }

  // 7. Stories
  try {
    const stories = sqlite.prepare('SELECT * FROM Story').all() as any[];
    console.log(`✨ Migrando ${stories.length} stories...`);
    for (const s of stories) {
      await prisma.story.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          userId: s.userId,
          mediaUrl: s.mediaUrl,
          mediaType: s.mediaType || 'IMAGE',
          caption: s.caption || null,
          duration: s.duration || 10,
          musicTitle: s.musicTitle || null,
          musicArtist: s.musicArtist || null,
          musicCoverUrl: s.musicCoverUrl || null,
          musicAudioUrl: s.musicAudioUrl || null,
          musicStartTime: s.musicStartTime || 0,
          musicDuration: s.musicDuration || 30,
          expiresAt: new Date(s.expiresAt),
          createdAt: new Date(s.createdAt),
        },
        update: {},
      });
    }
  } catch (e) {}

  // 8. Highlights
  try {
    const highlights = sqlite.prepare('SELECT * FROM Highlight').all() as any[];
    console.log(`🌟 Migrando ${highlights.length} destaques...`);
    for (const h of highlights) {
      await prisma.highlight.upsert({
        where: { id: h.id },
        create: {
          id: h.id,
          userId: h.userId,
          title: h.title,
          coverUrl: h.coverUrl || null,
          createdAt: new Date(h.createdAt),
          updatedAt: new Date(h.updatedAt),
        },
        update: {},
      });
    }

    const highlightItems = sqlite.prepare('SELECT * FROM HighlightItem').all() as any[];
    for (const hi of highlightItems) {
      await prisma.highlightItem.upsert({
        where: { id: hi.id },
        create: {
          id: hi.id,
          highlightId: hi.highlightId,
          mediaUrl: hi.mediaUrl,
          mediaType: hi.mediaType || 'IMAGE',
          caption: hi.caption || null,
          duration: hi.duration || 10,
          musicTitle: hi.musicTitle || null,
          musicArtist: hi.musicArtist || null,
          musicCoverUrl: hi.musicCoverUrl || null,
          musicAudioUrl: hi.musicAudioUrl || null,
          musicStartTime: hi.musicStartTime || 0,
          order: hi.order || 0,
          createdAt: new Date(hi.createdAt),
        },
        update: {},
      });
    }
  } catch (e) {}

  console.log('✅ MIGRAÇÃO PARA O SUPABASE POSTGRESQL CONCLUÍDA COM SUCESSO!');
}

migrate()
  .catch((e) => {
    console.error('❌ Erro na migração:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
