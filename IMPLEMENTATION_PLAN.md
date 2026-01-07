# Timebox Scheduling 웹 애플리케이션 구현 계획

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Vue 3 + Vite + TypeScript |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth |
| UI 라이브러리 | shadcn-vue + Tailwind CSS |
| 상태관리 | Pinia |
| 드래그앤드롭 | vuedraggable@next |
| 배포 | Vercel |

---

## 프로젝트 구조

```
src/
├── components/
│   ├── ui/                    # shadcn-vue 컴포넌트
│   ├── auth/
│   │   ├── AuthForm.vue       # 로그인/회원가입 폼
│   │   └── AuthGuard.vue      # 인증 가드
│   ├── todo/
│   │   ├── TodoList.vue       # 드래그 가능한 할일 목록
│   │   ├── TodoItem.vue       # 개별 할일 아이템
│   │   └── TodoForm.vue       # 할일 추가/수정 폼
│   ├── timebox/
│   │   ├── TimeboxSchedule.vue # 타임박스 스케줄 그리드
│   │   ├── TimeboxSlot.vue    # 시간 슬롯 (드롭 존)
│   │   ├── TimeboxItem.vue    # 스케줄된 아이템 (체크박스 포함)
│   │   └── DurationModal.vue  # 소요시간 입력 모달
│   └── layout/
│       ├── AppHeader.vue      # 헤더 (날짜 선택, 로그아웃)
│       └── MainLayout.vue     # 전체 레이아웃
├── composables/
│   ├── useAuth.ts             # 인증 로직
│   ├── useTodos.ts            # 할일 CRUD
│   ├── useTimeboxes.ts        # 타임박스 CRUD
│   └── useRealtime.ts         # 실시간 구독
├── stores/
│   ├── auth.ts                # 인증 상태
│   ├── todos.ts               # 할일 상태
│   ├── timeboxes.ts           # 타임박스 상태
│   └── ui.ts                  # UI 상태 (선택된 날짜, 모달)
├── lib/
│   ├── supabase.ts            # Supabase 클라이언트
│   └── utils.ts               # 유틸리티 함수
├── types/
│   ├── database.types.ts      # Supabase 생성 타입
│   └── index.ts               # 공통 타입
├── views/
│   ├── LoginView.vue          # 로그인 페이지
│   ├── RegisterView.vue       # 회원가입 페이지
│   └── DashboardView.vue      # 메인 대시보드
└── router/
    └── index.ts               # 라우터 설정
```

---

## 데이터베이스 스키마

### todos 테이블
```sql
CREATE TABLE todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### timeboxes 테이블
```sql
CREATE TABLE timeboxes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,  -- 5분 단위로 저장 (예: 09:05, 14:30)
    duration_minutes INTEGER NOT NULL DEFAULT 60,  -- 5분 단위 (최소 5분)
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### UI 설정
- **시간 범위**: 24시간 (00:00 ~ 23:55)
- **슬롯 단위**: 5분
- **표시 방식**: 시간 단위로 그룹화, 5분 슬롯은 드래그 드롭 시 정밀 위치 결정에 사용

### RLS 정책
- 각 테이블에 `auth.uid() = user_id` 조건으로 SELECT, INSERT, UPDATE, DELETE 정책 적용

---

## 구현 순서

### Phase 1: 프로젝트 초기화
1. `pnpm create vite@latest . --template vue-ts`로 프로젝트 생성
2. 의존성 설치:
   - `tailwindcss`, `@tailwindcss/vite`
   - `@supabase/supabase-js`
   - `pinia`, `vue-router`
   - `vuedraggable@next`
   - `@internationalized/date`
3. shadcn-vue 초기화 및 필요 컴포넌트 추가
4. 폴더 구조 생성

### Phase 2: Supabase 설정
1. Supabase 프로젝트 생성 (사용자가 직접)
2. 데이터베이스 테이블 및 RLS 정책 SQL 제공
3. `src/lib/supabase.ts` 클라이언트 설정
4. 환경 변수 설정 (`.env.local`)

### Phase 3: 인증 구현
1. `stores/auth.ts` - 인증 상태 관리
2. `AuthForm.vue` - 이메일/비밀번호 로그인/회원가입
3. `LoginView.vue`, `RegisterView.vue`
4. `router/index.ts` - 인증 가드 설정

### Phase 4: 할일 관리
1. `stores/todos.ts` - 할일 CRUD
2. `TodoForm.vue` - 할일 추가/수정 다이얼로그
3. `TodoItem.vue` - 드래그 가능한 할일 카드
4. `TodoList.vue` - vuedraggable로 드래그 소스 구성

### Phase 5: 타임박스 스케줄
1. `stores/timeboxes.ts` - 타임박스 CRUD
2. `stores/ui.ts` - 선택된 날짜, 모달 상태
3. `TimeboxSchedule.vue` - 시간 슬롯 그리드 (24시간, 5분 단위)
   - 288개 슬롯 → 시간 단위로 그룹화하여 표시
   - 드래그 드롭 시 정확한 시간 위치 계산
4. `TimeboxSlot.vue` - 드롭 존
5. `TimeboxItem.vue` - 스케줄된 아이템 + 체크박스 (5분 단위 높이 반영)
6. `DurationModal.vue` - 드롭 시 소요시간 선택 (5분, 15분, 30분, 1시간 등)

### Phase 6: 드래그 앤 드롭
1. TodoList에서 `vuedraggable` group 설정 (clone 모드)
2. TimeboxSlot에서 드롭 이벤트 처리
3. 드롭 시 DurationModal 표시
4. 확인 시 타임박스 생성

### Phase 7: 실시간 동기화 & 완성
1. `useRealtime.ts` - Supabase 실시간 구독
2. 로딩/에러 상태 처리
3. 반응형 레이아웃 적용
4. 토스트 알림 추가

### Phase 8: Vercel 배포
1. `vercel.json` 설정 (SPA rewrite)
2. Vercel에 환경 변수 설정
3. GitHub 연동 배포

---

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/lib/supabase.ts` | Supabase 클라이언트 초기화 |
| `src/stores/timeboxes.ts` | 타임박스 CRUD 및 상태 관리 |
| `src/components/timebox/TimeboxSchedule.vue` | 메인 스케줄 UI |
| `src/components/timebox/DurationModal.vue` | 드래그 드롭 시 소요시간 입력 |
| `vercel.json` | SPA 라우팅 설정 |

---

## Vercel 배포 설정

### vercel.json
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 환경 변수 (Vercel Dashboard)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 주요 의존성

```json
{
  "dependencies": {
    "vue": "^3.4",
    "vue-router": "^4",
    "pinia": "^2",
    "@supabase/supabase-js": "^2",
    "vuedraggable": "^4.1.0",
    "@internationalized/date": "^3",
    "tailwindcss": "^4",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "lucide-vue-next": "^0.300",
    "radix-vue": "^1"
  }
}
```
