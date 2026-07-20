# v3.2 — Group Chat

## Added
- **Prisma models**: `ChatRoom`, `ChatMember`, `ChatMessage`
  - `ChatRoom`: name, courseId (optional), schoolId, createdBy
  - `ChatMember`: roomId, userId (unique pair), joinedAt
  - `ChatMessage`: content, roomId, senderId, createdAt
  - Indexed on roomId+createdAt for message queries
- **Server actions** (`src/actions/chat.actions.ts`):
  - `getChatRooms()` — fetch rooms for current user with members and last message
  - `getChatMessages(roomId)` — fetch messages for a room (membership check)
  - `createChatRoom()` — Zod-validated, auto-joins creator + selected members
  - `sendChatMessage()` — Zod-validated, membership check, revalidates path
  - `getAvailableChatUsers(roomId?)` — same-school users, excludes existing members
  - All actions use `getLocalUser()` for auth
- **UI components**:
  - `chat/page.tsx` — server component with metadata
  - `chat/components/chat-content.tsx` — main client component with room list, message list, input
  - `chat/components/chat-room-list.tsx` — room sidebar with last message preview
  - `chat/components/chat-message-list.tsx` — scrollable message bubbles (own vs others)
  - `chat/components/chat-create-dialog.tsx` — dialog with room name + member multi-select
- **Module registration**: `chat` added to `MODULES` array and `getModulesForRole` for all roles

## Translations
- `uk.json`: `global.modules.chat`, `global.menu.chat`, `private.chat.*`
- `en.json`: same keys in English

## Files Changed
- `prisma/schema.prisma` (ChatRoom, ChatMember, ChatMessage models + User.chatRooms relation)
- `src/actions/chat.actions.ts` (new)
- `src/app/[locale]/(private)/module/chat/` (new module, 5 files)
- `src/lib/constants/modules.ts`
- `src/actions/local-auth.actions.ts` (getModulesForRole)
- `src/messages/uk.json`
- `src/messages/en.json`
