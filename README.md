# VIEW BATTLE — 유튜브 조회수 대결 게임 (Next.js)

두 곡의 유튜브 뮤직비디오를 듣고, 실시간 조회수가 더 높은 쪽을 맞히는 게임입니다.

## 시작하기

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속.

## API 키

`.env.local`에 이미 요청하신 키가 들어가 있습니다.

```
YOUTUBE_API_KEY=AIzaSy...
```

- 이 키는 **서버(app/api/views/route.ts)에서만** 사용되고 브라우저로는 절대 전송되지 않습니다.
  (`NEXT_PUBLIC_` 접두사가 없는 환경변수는 서버 전용입니다.)
- `.env.local`은 `.gitignore`에 포함되어 있어 git에는 커밋되지 않습니다. 그래도
  저장소를 공개(public)로 만들 계획이라면, Google Cloud Console에서 이 키에
  **HTTP 리퍼러 제한**을 걸어두는 걸 권장합니다.
- 배포(Vercel 등) 시에는 프로젝트 설정의 Environment Variables에 동일하게
  `YOUTUBE_API_KEY`를 등록해주세요.

## 구조

```
app/
  page.tsx            게임 화면 상태 관리 (start → loading → game → final)
  api/views/route.ts  videos.list 를 서버에서 한 번만 호출 (search.list 미사용)
  layout.tsx           전역 레이아웃, 폰트
  globals.css          디자인 토큰 (Tailwind)
components/
  StartScreen.tsx      라운드 수 키보드 입력, 시작 화면
  GameScreen.tsx        VS 대결 화면, 선택 패널
  SongCard.tsx           썸네일 클릭 재생 카드
  FinalScreen.tsx        최종 결과
lib/
  gameLogic.ts          장르/조회수 유사도 기반 페어 매칭 (순수 함수)
  types.ts               Song, Pair, 그리고 향후 멀티플레이용 Player/RoomState 타입
data/
  songs.csv               큐레이션된 비디오 풀 — 엑셀로 직접 관리
lib/
  songs.ts                 CSV를 읽어 Song[] 로 파싱 (서버 전용, fs 사용)
```

## 곡 목록을 엑셀(CSV)로 관리하기

`data/songs.csv`를 엑셀로 열어 편집하면 됩니다. 컬럼 순서는 다음과 같습니다.

| 가수 | 제목 | 장르 | videoId |
|---|---|---|---|
| PSY | Gangnam Style | kpop,dance,pop | 9bZkp7q19f0 |

- **가수 / 제목**: 화면에 그대로 표시됩니다.
- **장르**: 매칭(비슷한 장르끼리 대결)에 쓰이는 태그입니다. 곡 하나에 태그를 여러 개
  주고 싶으면 쉼표로 구분해서 한 칸에 넣어주세요 (예: `kpop,dance,pop`). 엑셀에서
  셀 안에 쉼표를 입력하고 저장하면 자동으로 큰따옴표(`"kpop,dance,pop"`)로 감싸져
  저장되니 신경 쓰지 않고 그냥 입력하시면 됩니다.
- **videoId**: 실제 유튜브 영상 ID(주소의 `watch?v=` 뒤 11자리 문자열)입니다. 조회수
  조회와 재생에 필요해서 추가한 컬럼이에요.

**주의**: 엑셀에서 "다른 이름으로 저장" 할 때 파일 형식을 반드시
**`CSV UTF-8(쉼표로 분리)`** 로 선택해주세요. 일반 `CSV(쉼표로 분리)`로 저장하면
한글이 깨질 수 있습니다.

행을 추가/삭제하면 다음 게임 시작 시(`/api/songs` 호출 시점) 자동으로 반영됩니다 —
서버를 껐다 켤 필요 없이 `npm run dev` 상태에서 CSV만 저장하고 새로고침하면 됩니다.

`lib/gameLogic.ts`의 `pickPair()`는 UI와 완전히 분리된 순수 함수라서,
나중에 서버(방장 권한)에서 라운드를 생성할 때도 그대로 재사용할 수 있습니다.

## 멀티플레이 로드맵 (향후 작업)

지금은 싱글플레이만 구현되어 있지만, 아래와 같은 구조로 방(room) 대결을
붙일 수 있도록 `lib/types.ts`에 `Player`, `RoomState` 타입을 미리 정의해뒀습니다.

1. **실시간 동기화 수단 선택**
   Next.js API Route(서버리스)는 WebSocket 상시 연결을 유지하기 어렵습니다.
   아래 중 하나를 추천합니다.
   - **Supabase Realtime** — Postgres + 실시간 브로드캐스트를 함께 씀. 방/스코어를
     테이블로 관리하기 편함.
   - **Pusher / Ably** — 별도 DB 없이 방(room) 채널만 필요할 때 가장 빠르게 붙일 수 있음.
   - **자체 WebSocket 서버(Node/Socket.io)** — Vercel 서버리스와 별도로 소켓 전용
     서버(예: Railway, Fly.io)를 하나 더 띄우는 방식. 자유도는 가장 높지만 관리 부담도 큼.

2. **방 생성/참여**
   - 방장이 방을 만들면 6자리 코드(`RoomState.code`) 발급.
   - 참여자는 코드로 입장, `Player { id, nickname, score, isHost }` 로 등록.

3. **라운드 진행 권한**
   - 방장(host) 클라이언트 또는 서버가 `pickPair()`를 호출해 라운드를 생성하고,
     모든 참가자에게 동일한 페어를 브로드캐스트.
   - 각 참가자가 좌/우를 선택하면 서버가 정답 여부를 판정해 `Player.score`를 갱신하고
     전체에게 다시 브로드캐스트.

4. **부정행위 방지**
   - 조회수(`views`)는 반드시 서버에서만 들고 있고, 정답 공개 전에는 클라이언트로
     내려보내지 않아야 합니다(현재 싱글플레이 코드에도 이미 그렇게 되어 있습니다 —
     `answered`가 true가 되기 전까지 조회수는 화면에 숨겨져 있습니다).

지금 구조(순수 함수 + 서버 API Route)를 유지한 채로 위 내용을 붙이면 되므로,
멀티플레이를 시작할 때 게임 로직을 다시 짤 필요는 없습니다.

## 멀티플레이 (방 기능)

`/room` 에서 방을 만들거나 코드로 참가할 수 있습니다.

1. **Upstash Redis 설정** — [upstash.com](https://upstash.com) 무료 가입 후 Redis DB 생성,
   REST URL/TOKEN을 `.env.local`에 넣어야 동작합니다 (`.env.local.example` 참고).
2. **흐름**: `/room`에서 닉네임+라운드 수로 방 생성(또는 코드로 참가) →
   `/room/[code]`에서 대기실(참가자 목록) → 방장이 "게임 시작" →
   전원이 라운드마다 좌/우 선택 → 모두 선택 완료 시 자동 채점+공개 →
   방장이 "다음 라운드" → 마지막 라운드 후 최종 순위 화면.
3. **폴링 방식**: 서버리스 환경(Vercel 등)에서 상시 WebSocket 연결이 어려워서,
   클라이언트가 1.2초마다 `GET /api/rooms/[code]`를 호출하는 방식으로 구현했습니다.
   인원이 많아지거나 더 즉각적인 반응이 필요해지면 Pusher/Ably/Supabase Realtime으로
   교체를 고려하세요 — `lib/rooms.ts`의 저장/조회 함수만 바꾸면 되도록 분리해뒀습니다.
4. **정답 유출 방지**: `lib/rooms.ts`의 `sanitizeRoomForClient()`가 정답 공개 전에는
   조회수(views)와 곡 풀(songPool) 전체를 응답에서 제거합니다. 새 API를 추가할 때도
   이 함수를 꼭 거쳐서 응답하세요.
5. **방장 권한**: `/start`, `/next`는 body의 `playerId`가 `room.hostId`와 같은지
   서버에서 검사합니다. 방장이 아니면 403이 납니다.

## 참고

`data/songs.csv`의 videoId는 예시로 수집한 것이라 정확성이 100% 보장되지 않습니다.
실제 서비스 전에 유튜브에서 직접 확인 후 필요한 만큼 곡을 추가/교체해주세요.
