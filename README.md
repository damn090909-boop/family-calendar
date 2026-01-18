# Family Pixel Calendar

## 📱 프로젝트 소개
**Family Pixel Calendar**는 레트로 픽셀 감성의 가족 일정 관리 웹 애플리케이션입니다.

### ✨ 주요 기능
- 🗓️ **월간 캘린더 뷰**: 직관적인 픽셀 아트 스타일 UI
- ✏️ **일정 CRUD**: 일정 생성, 조회, 수정, 삭제 완벽 지원
- 👨‍👩‍👧‍👦 **다중 사용자**: 가족 구성원별 일정 관리
- 📸 **사진 업로드**: 사용자 프로필 사진 등록
- 🔔 **알람 설정**: iOS 캘린더 연동 (.ics 파일)
- 📱 **모바일 최적화**: 스와이프 제스처 지원
- 🎨 **10가지 컬러**: 일정별 색상 구분

### 🏗️ 기술 스택
- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Backend**: Google Apps Script (Headless API)
- **Database**: Google Sheets
- **Storage**: Google Drive (이미지)
- **Hosting**: GitHub Pages
- **Font**: NeoDunggeunmo (픽셀 폰트), Press Start 2P

## 🚀 배포 URL
- **Live Demo**: `https://damn090909-boop.github.io/family-calendar/`
- **GAS API**: `https://script.google.com/.../exec`

## 📂 프로젝트 구조
```
Family Calendar/
├── github-repo/          # GitHub Pages 배포 파일
│   ├── index.html        # 메인 웹앱 (SEO 최적화)
│   └── scripts.js        # 프론트엔드 로직
├── Code.js               # Google Apps Script API
├── appsscript.json       # GAS 설정
├── .clasp.json           # Clasp 연동 설정
└── To Do.txt             # 개발 체크리스트
```

## 🔧 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/damn090909-boop/family-calendar.git
cd family-calendar
```

### 2. 로컬 서버 실행
```bash
# Python 3
python3 -m http.server 8000

# 또는 Node.js
npx http-server -p 8000
```

### 3. 브라우저에서 확인
```
http://localhost:8000
```

## ⚙️ GAS 백엔드 설정

### API 엔드포인트
- **GET**: 일정 및 사용자 데이터 조회
- **POST**: 일정 생성/수정/삭제, 사용자 등록

### 인증
- 쿼리 파라미터 `pw=1234` 필수

### Clasp으로 GAS 배포
```bash
# Clasp 설치 (최초 1회)
npm install -g @google/clasp

# 로그인
clasp login

# 코드 푸시
clasp push

# 배포
clasp deploy
```

## 📊 데이터 구조

### Google Sheets
#### Data 시트 (일정)
| Title | StartDate | StartTime | EndDate | EndTime | Color | Alarm | Author | CreatedDate | CreatedTime |
|-------|-----------|-----------|---------|---------|-------|-------|--------|-------------|-------------|

#### Users 시트 (사용자)
| UUID | Name | PhotoURL |
|------|------|----------|

## 🎨 UI/UX 특징
- **Dark Purple Theme** (#2d2b45)
- **Pixel Art Borders**: 3D 돌출 효과
- **Swipe Gestures**: 
  - 좌우 스와이프: 월 변경
  - 상하 스와이프: 연도 변경
- **Responsive**: 모바일 우선 디자인

## 🧪 테스트 완료 항목
- ✅ iPhone Safari 호환성 테스트
- ✅ CORS 문제 해결 (redirect: follow)
- ✅ LocalStorage 사용자 정보 저장
- ✅ 일정 CRUD 전체 기능
- ✅ iOS 캘린더 연동 (.ics)

## 📝 향후 개선 사항
- [ ] 커스텀 도메인 설정
- [ ] 빌드 프로세스 추가 (압축/최적화)
- [ ] 환경별 설정 분리 (개발/운영)
- [ ] 성능 최적화 (로딩 속도)
- [ ] API 키 보안 강화

## 👥 기여자
- Family Calendar Team

## 📄 라이선스
Private Project

---

**Made with ❤️ using Retro Pixel Aesthetics**
