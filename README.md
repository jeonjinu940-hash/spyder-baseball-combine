# SPYDER BASEBALL COMBINE — 공식 웹사이트

고교 엘리트 야구 선수의 스프린트 측정 기록과 참가 학교 정보를 제공하는 반응형 웹사이트입니다.
요구사항 원문: [SPYDER_BASEBALL_COMBINE_PRD_v3.md](SPYDER_BASEBALL_COMBINE_PRD_v3.md)

- 스택: Vite + React + React Router (정적 사이트)
- 배포: Render Static Site — `main` 브랜치에 push하면 자동 재배포 (`render.yaml`)

## 로컬 실행

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 확인
```

UI 확인용 가상 데이터는 주소 뒤에 `?demo=1`을 붙이면 **DEMO** 배너와 함께 표시되고, `?demo=0`으로 해제합니다.
DEMO 데이터는 `src/data/demo-players.json`에 분리되어 있으며 실제 기록과 섞이지 않습니다.

## 기록 업데이트 (엑셀 → 웹사이트)

1. 템플릿 다운로드: `public/templates/combine_template.xlsx` (배포 사이트의 `/templates/combine_template.xlsx`)
   - `columns` 시트: 컬럼 설명 / `schools` 시트: 학교 ID 목록
2. 기록 입력 후 저장 → `imports/` 폴더에 복사 (이 폴더는 git에 올라가지 않음)
3. 미리보기·검증
   ```bash
   npm run import -- imports/기록.xlsx
   ```
   필수 컬럼, 숫자 형식, 음수·0, 중복 `player_id`, 미등록 `school_id`, 학교명 불일치, 날짜, 공개 상태를 검증합니다.
   **오류가 하나라도 있으면 전체 반영을 중단하고 기존 데이터는 그대로 유지**합니다.
4. 결과(신규·변경·삭제 건수, 미리보기)를 확인한 뒤 반영
   ```bash
   npm run import -- imports/기록.xlsx --confirm
   ```
   `src/data/players.json`이 갱신되고 `updatedAt`(마지막 업데이트 시각)과 `src/data/import-history.json`(업로드 이력)이 기록됩니다.
   `publish_status = 비공개` 행은 공개 데이터에 저장되지 않습니다.
5. GitHub에 반영 → Render 자동 배포(수 분 소요)
   ```bash
   git add -A
   git commit -m "기록 업데이트"
   git push
   ```

### 엑셀 컬럼 (PRD 5장)

| Column | Required | 설명 |
|---|---|---|
| player_id | Yes | 고유 식별자 |
| player_name | Yes | 공개 표시 선수명 |
| school_id | Yes | 학교 ID (`src/data/schools.json`) |
| school_name | Yes | 학교명 (school_id와 일치해야 함) |
| region | Yes | 지역 |
| position | Recommended | 포지션 |
| uniform_number | Optional | 배번 (공개 승인된 경우만) |
| sprint_55m | Yes, 빈칸 허용 | 55M 직선 스프린트 기록 (종목별 1인 1회 측정) |
| baserun_55m | Yes, 빈칸 허용 | 55M 베이스러닝 기록 (종목별 1인 1회 측정) |
| measured_at | Recommended | 측정 일자 YYYY-MM-DD |
| publish_status | Recommended | 공개 / 비공개 (빈칸 = 공개) |
| photo_id | Optional | 사진 연결 ID |

미측정 기록은 **빈칸**으로 입력합니다 (0은 오류). 화면에는 `—`로 표시됩니다.

## 현장 갤러리 사진 추가

1. `현장 갤러리/` 아래에 **`월.일 학교명`** 형식으로 폴더를 만들고 사진을 넣습니다. 예: `현장 갤러리/10.28 전주고/`
   - 학교명은 `src/data/schools.json`의 학교명(예: 전주고)과 같아야 합니다.
   - 대표(표지) 사진을 지정하려면 파일 이름을 `cover…` 또는 `대표…`로 시작하게 바꿉니다. 없으면 파일명 순 첫 사진이 표지가 됩니다.
2. `npm run gallery` 실행 → 사진을 바른 방향으로 회전, 메타데이터(위치·기기 정보) 제거, 웹 크기로 줄여 `public/gallery/`에 저장하고 `src/data/gallery.json`을 갱신합니다.
3. 사이트에는 학교 1곳 = 1칸으로 표시되고, 커서를 올리면 `2026.10.28.` / `전주고등학교` 두 줄이 나타납니다.
4. `git add -A && git commit -m "갤러리 추가" && git push`

원본 폴더(`현장 갤러리/`)는 저장소에 올라가지 않습니다. 공개 동의·권한이 확인된 사진만 넣어 주세요.

## 그 밖의 데이터

| 파일 | 내용 |
|---|---|
| `src/data/schools.json` | 2026 시범 운영 참가 학교 20개 (지도·목록·지역 집계의 단일 출처) |
| `src/data/gallery.json` | 갤러리 사진 목록. 이미지는 `public/gallery/`에 저장. 공개 동의 확인된 사진만 추가 |
| `src/data/korea-map.json` | 시·도 SVG 경로 (`npm run build:map`으로 재생성) |
| `src/config.js` | 기록 단위·소수점, 공식 순위 사용 여부 |

## 미확정 정책 (PRD 13장)

다음 항목이 확정되기 전까지 사이트는 종목별 측정 기록(1인 1회)만 표시하고 **순위는 표시하지 않습니다.**
기록 공개 범위, 대표 기록 기준, 순위·동률 처리, 기록 단위/소수점, 학교 좌표 사용 여부, 사진 공개 승인 절차.

## 향후 확장: 관리자 CMS

현재는 정적 사이트 + 엑셀 변환 스크립트 방식입니다. 웹 관리자 화면(로그인·업로드·승인·이력)이 필요해지면
API 서버 + 관계형 DB(예: Render Web Service + PostgreSQL)를 추가하고, `scripts/import-excel.mjs`의 검증 로직을 서버로 옮겨 재사용합니다.
