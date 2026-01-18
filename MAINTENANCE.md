# Family Calendar - 유지보수 가이드

## 📋 개요
이 문서는 Family Calendar 웹앱의 두 가지 환경(GAS + GitHub Pages)을 효율적으로 관리하기 위한 가이드입니다.

---

## 🏗️ 시스템 아키텍처

### Headless GAS 구조
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  GitHub Pages   │         │  Google Apps     │         │ Google Sheets   │
│  (Frontend UI)  │────────▶│  Script (API)    │────────▶│  (Database)     │
│  index.html     │  fetch  │  Code.js         │  CRUD   │  Data + Users   │
│  scripts.js     │         │  JSON Response   │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

---

## 🔄 코드 변경 워크플로우

### 1️⃣ Frontend 변경 (UI/UX)

**수정 대상**: `index.html`, `scripts.js`

**절차**:
```bash
# 1. 로컬에서 수정
cd /Users/user/Desktop/Family\ Calendar/github-repo
# 파일 수정...

# 2. Git commit & push
git add index.html scripts.js
git commit -m "feat: 기능 설명"
git push origin main

# 3. GitHub Pages 자동 배포 (1-2분 소요)
# https://damn090909-boop.github.io/family-calendar/ 확인
```

**주의사항**:
- API 엔드포인트 URL 변경 시 `scripts.js`의 `API_BASE_URL` 상수 확인
- CORS 문제 방지: `redirect: 'follow'` 옵션 유지

---

### 2️⃣ Backend 변경 (데이터 로직)

**수정 대상**: `Code.js`

**절차**:
```bash
# 1. 로컬에서 Code.js 수정
cd /Users/user/Desktop/Family\ Calendar

# 2. Clasp으로 GAS에 푸시
clasp push

# 3. 새 배포 버전 생성 (선택사항)
clasp deploy --description "v1.4 - 변경 내용"

# 4. 배포 URL 확인
clasp deployments
```

**API 변경 시 체크리스트**:
- [ ] `doPost`의 `switch-case`에 새 액션 추가
- [ ] 에러 처리 로직 추가
- [ ] Frontend에서 호출하는 `action` 파라미터 일치 확인

---

### 3️⃣ 데이터베이스 스키마 변경

**수정 대상**: Google Sheets

**절차**:
1. **Sheets에서 컬럼 추가/수정**
2. **Code.js 업데이트**:
   - `getEventsAndUsers()` 함수의 컬럼 인덱스 수정
   - `addEvent()` / `updateEvent()` 함수 수정
3. **Frontend 업데이트**:
   - `scripts.js`에서 데이터 파싱 로직 수정
4. **양쪽 배포** (위의 절차 1, 2 참고)

**예시**:
```javascript
// Code.js - 새 컬럼 추가 (예: Location)
events.push({
  // ...
  location: row[10] || ''  // 새 컬럼
});

// scripts.js - Frontend 표시
eventItem.innerHTML = `${event.title} @ ${event.location}`;
```

---

## 🧪 테스트 절차

### 로컬 테스트
```bash
# 정적 서버 실행
python3 -m http.server 8000

# 브라우저에서 테스트
open http://localhost:8000
```

### 운영 환경 테스트
1. **GitHub Pages**: `https://damn090909-boop.github.io/family-calendar/`
2. **iPhone Safari**: PWA 동작 확인
3. **기능 체크리스트**:
   - [ ] 사용자 등록
   - [ ] 일정 추가
   - [ ] 일정 수정
   - [ ] 일정 삭제
   - [ ] iOS 캘린더 연동 (.ics)
   - [ ] 스와이프 제스처

---

## 🔐 보안 관리

### API 인증
- 현재: 쿼리 파라미터 `?pw=1234` (단순 인증)
- **향후 개선**: 환경 변수 또는 OAuth 2.0

### 민감 정보
- `.clasp.json`: GAS 프로젝트 ID (Git에 포함하지 않음)
- API URL: `scripts.js`에 하드코딩 (공개 저장소 주의)

---

## 📦 백업 전략

### 자동 백업
- **Google Sheets**: 버전 기록 자동 저장 (File → Version history)
- **GitHub**: 모든 commit 히스토리 보존

### 수동 백업 (권장)
```bash
# 1. Code.js 백업
cp Code.js "Code.js.backup-$(date +%Y%m%d-%H%M%S)"

# 2. GitHub 전체 클론
git clone https://github.com/damn090909-boop/family-calendar.git backup/
```

---

## 🐛 트러블슈팅

### 문제 1: "Unauthorized" 오류
**원인**: API 인증 실패  
**해결**: `scripts.js`의 `API_BASE_URL`에 `?pw=1234` 포함 확인

### 문제 2: 일정이 표시되지 않음
**원인**: CORS 또는 데이터 파싱 실패  
**해결**: 
1. 브라우저 콘솔에서 에러 확인
2. GAS 로그 확인: `clasp logs`

### 문제 3: iOS 캘린더 연동 실패
**원인**: .ics 파일 형식 오류  
**해결**: `generateICS()` 함수의 날짜 포맷 검증

---

## 📞 긴급 복구

### Frontend 롤백
```bash
git log --oneline  # commit 히스토리 확인
git revert <commit-hash>
git push origin main
```

### Backend 롤백
```bash
# GAS 웹 UI에서 이전 배포 버전 선택
# 또는 로컬 백업 파일 사용
clasp push --force
```

---

## 📚 참고 자료
- [Google Apps Script 문서](https://developers.google.com/apps-script)
- [Clasp CLI](https://github.com/google/clasp)
- [GitHub Pages 가이드](https://pages.github.com/)

---

**Last Updated**: 2026-01-18  
**Maintainer**: Family Calendar Team
