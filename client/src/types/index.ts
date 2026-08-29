export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  website?: string | null;
  isPrivate: boolean;
  isVerified?: boolean;
  role: 'USER' | 'ADMIN';
  isBlocked?: boolean;
  createdAt: string;
  highlights?: Highlight[];
  counts?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
  hasRequestedFollow?: boolean;
  isSelf?: boolean;
  canViewContent?: boolean;
}

export interface PostMedia {
  id: string;
  postId: string;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  order: number;
  width?: number;
  height?: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  audioUrl: string;
  duration?: number;
}

export interface Post {
  id: string;
  caption?: string | null;
  location?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicCoverUrl?: string | null;
  musicAudioUrl?: string | null;
  musicStartTime?: number | null;
  viewsCount?: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isPrivate?: boolean;
    isVerified?: boolean;
  };
  media: PostMedia[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface StoryViewer {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  viewedAt: string;
  hasLiked?: boolean;
}

export interface StoryStickerAnswer {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  answer: string;
  createdAt: string;
}

export interface StorySticker {
  id: string;
  type: 'POLL' | 'QUESTION';
  question: string;
  options: string[];
  posX?: number | null;
  posY?: number | null;
  totalVotes?: number;
  voteCounts?: number[];
  userVote?: number | null;
  userAnswer?: string | null;
  answers?: StoryStickerAnswer[];
}

export interface Story {
  id: string;
  userId?: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string | null;
  duration?: number;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicCoverUrl?: string | null;
  musicAudioUrl?: string | null;
  musicStartTime?: number | null;
  musicDuration?: number | null;
  stickers?: StorySticker[];
  createdAt: string;
  expiresAt: string;
  viewsCount?: number;
  likesCount?: number;
  isLiked?: boolean;
  isViewed?: boolean;
  isOwner?: boolean;
}

export interface StoryGroup {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
  stories: Story[];
  hasUnseen?: boolean;
}

export interface HighlightItem {
  id: string;
  highlightId: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption?: string | null;
  duration?: number;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicCoverUrl?: string | null;
  musicAudioUrl?: string | null;
  musicStartTime?: number | null;
  order?: number;
  createdAt: string;
}

export interface Highlight {
  id: string;
  userId: string;
  title: string;
  coverUrl?: string | null;
  createdAt: string;
  items?: HighlightItem[];
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
}

export interface Clip {
  id: string;
  caption?: string | null;
  location?: string | null;
  viewsCount: number;
  createdAt: string;
  videoUrl: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
  replies?: Comment[];
}

export interface ConversationMember {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'STORY_REPLY';
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string | null;
  updatedAt: string;
  otherMembers: ConversationMember[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  type:
    | 'FOLLOW'
    | 'FOLLOW_REQUEST'
    | 'FOLLOW_ACCEPT'
    | 'LIKE_POST'
    | 'COMMENT_POST'
    | 'REPLY_COMMENT'
    | 'NEW_POST'
    | 'NEW_STORY'
    | 'NEW_MESSAGE';
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
}

export interface FollowRequest {
  id: string;
  requesterId: string;
  targetId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  requester: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    isVerified?: boolean;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalMessages: number;
  totalComments: number;
  totalLikes: number;
  storage: {
    bytes: number;
    mb: string;
    gb: string;
  };
}
