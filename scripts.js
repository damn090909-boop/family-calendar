// --- Global State ---
let currentDate = new Date();
let currentUser = null; // { uuid, name, photo }
let eventsMap = {}; // Key: 'YYYY-MM-DD', Value: Array of events
let usersMap = {}; // Key: UserUUID, Value: { name, photo }

// --- API Configuration ---
// --- API Configuration ---
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbx6nGgLko0sgFlI6mpPPO7V0yg2v0sEYWIwqkdmsipnzn9OUr1EVMfU40NXTV128OvQ/exec';
const API_PASSWORD = '1234';

// Deletion State
let eventToDelete = null; // { dateKey, index }

// --- Image Constants ---
const HEADER_IMAGE_URL = 'https://lh3.googleusercontent.com/d/1opUyQIvMrduHrRKnhokLrRBI3EIf_5AD';
const FAMILY_PHOTO_URL = 'https://lh3.googleusercontent.com/d/1EKMATRuvFV3zdC8oIvqT9fDAwZRoCK75';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    // Event Listeners
    document.getElementById('saveUserBtn').addEventListener('click', handleRegistration);

    // Header Date Picker
    document.getElementById('currentDateDisplay').addEventListener('click', openDatePicker);
    document.getElementById('confirmDateBtn').addEventListener('click', confirmDateSelection);
    document.getElementById('resetDateBtn').addEventListener('click', resetDateSelection);
    document.querySelector('#datePickerModal .close-btn').addEventListener('click', closeDatePicker);

    // File Upload
    document.getElementById('regPhotoFile').addEventListener('change', handleFileSelect);
    document.getElementById('regPhotoAlbum').addEventListener('change', handleFileSelect);

    // Photo buttons
    document.getElementById('cameraBtn').addEventListener('click', () => {
        document.getElementById('regPhotoFile').click();
    });
    document.getElementById('albumBtn').addEventListener('click', () => {
        document.getElementById('regPhotoAlbum').click();
    });

    // Input validation for save button
    document.getElementById('regName').addEventListener('input', updateSaveButton);
    document.getElementById('regPhotoFile').addEventListener('change', updateSaveButton);
    document.getElementById('regPhotoAlbum').addEventListener('change', updateSaveButton);

    // Swipe gesture for month/year navigation
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const calendarGrid = document.getElementById('calendarGrid');

    calendarGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    calendarGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Determine if horizontal or vertical swipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
            // Horizontal swipe - month navigation
            calendarGrid.style.opacity = '0.5';
            calendarGrid.style.transition = 'opacity 0.2s ease';

            setTimeout(() => {
                if (diffX > 0) {
                    // Swipe left - next month
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    // Swipe right - previous month
                    currentDate.setMonth(currentDate.getMonth() - 1);
                }
                renderCalendar();

                setTimeout(() => {
                    calendarGrid.style.opacity = '1';
                }, 50);
            }, 200);

        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > swipeThreshold) {
            // Vertical swipe - year navigation
            calendarGrid.style.opacity = '0.5';
            calendarGrid.style.transition = 'opacity 0.2s ease';

            setTimeout(() => {
                if (diffY > 0) {
                    // Swipe up - next year
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                } else {
                    // Swipe down - previous year
                    currentDate.setFullYear(currentDate.getFullYear() - 1);
                }
                renderCalendar();

                setTimeout(() => {
                    calendarGrid.style.opacity = '1';
                }, 50);
            }, 200);
        }
    }
});

function updateSaveButton() {
    const name = document.getElementById('regName').value.trim();
    const photoBase64 = document.getElementById('regPhotoBase64').value;
    const saveBtn = document.getElementById('saveUserBtn');

    // 이름이 3글자 이상이고 사진이 표시되었을 때 활성화
    const isValidName = name.length >= 3;
    const hasPhoto = photoBase64 && photoBase64.trim() !== '';

    saveBtn.disabled = !(isValidName && hasPhoto);
}

// Additional event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dayModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeDayModal();
    });
    document.querySelector('#dayModal .close-btn').addEventListener('click', closeDayModal);

    // Add Button in Day Modal Header
    document.getElementById('headerAddBtn').addEventListener('click', () => openAddEventForm(selectedDateKey));

    // Event Editor Listeners
    document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
    document.getElementById('closeEditorBtn').addEventListener('click', closeEditor);
    document.getElementById('eventEditorModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeEditor();
    });

    // Confirm Delete Listeners
    document.getElementById('confirmDeleteYes').addEventListener('click', confirmDelete);
    document.getElementById('confirmDeleteNo').addEventListener('click', closeConfirmModal);

    // Alarm Toggle Listener
    document.getElementById('eventAlarmToggle').addEventListener('change', toggleAlarmInput);
});

function toggleAlarmInput() {
    const isChecked = document.getElementById('eventAlarmToggle').checked;
    const input = document.getElementById('eventAlarmInput');

    input.disabled = !isChecked;
    // Optionally style the wrapper opacity
    document.getElementById('alarmWrapper').style.opacity = isChecked ? '1' : '0.5';
}

function initApp() {
    console.log('=== initApp START ===');

    loadUserFromStorage();
    console.log('currentUser after load:', currentUser);

    // 1. Load from Cache (For instant render)
    loadEventsFromStorage();
    loadImagesFromCache(); // Load images instantly

    // Render calendar first (always)
    renderCalendar();

    if (!currentUser) {
        console.log('No user, showing registration modal');
        showRegistrationModal();
    } else {
        console.log('User exists');
        updateUserDisplay();
        loadData(); // Fetch latest data from server (Background update)
    }
}

function loadInitialData() {
    // Legacy support or fallback if needed
    // ... (Keep existing implementation or simplify)
    try {
        const eventsDataElement = document.getElementById('initialEventsData');
        const usersDataElement = document.getElementById('initialUsersData');

        if (eventsDataElement && usersDataElement) {
            const eventsDataText = eventsDataElement.textContent.trim();
            const usersDataText = usersDataElement.textContent.trim();

            if (eventsDataText && eventsDataText !== '[]') {
                const eventsData = JSON.parse(eventsDataText);
                if (Array.isArray(eventsData)) {
                    console.log('Loading', eventsData.length, 'events from template');
                    eventsMap = {};
                    eventsData.forEach(evt => {
                        const dateKey = evt.date; // Use raw string from server (YYYY-MM-DD)
                        if (!eventsMap[dateKey]) eventsMap[dateKey] = [];
                        eventsMap[dateKey].push(evt);
                    });
                    console.log('Events loaded for dates:', Object.keys(eventsMap));
                }
            }

            if (usersDataText && usersDataText !== '{}') {
                usersMap = JSON.parse(usersDataText);
                console.log('Users loaded:', Object.keys(usersMap).length, 'users');
            }
        }
    } catch (e) {
        console.error('Error in loadInitialData:', e);
        // eventsMap = {}; // Don't reset if we loaded from cache
        // usersMap = {};
    }
}

function loadData() {
    console.log('Loading fresh events and users data...');

    // Load events and users together using fetch
    fetch(`${API_BASE_URL}?pw=${API_PASSWORD}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.events && data.users) {
                console.log('Events loaded:', data.events.length);
                console.log('Users loaded:', Object.keys(data.users).length);

                // Load events
                eventsMap = {};
                data.events.forEach(evt => {
                    try {
                        const dateKey = evt.date; // Use raw string from server (YYYY-MM-DD)
                        if (!eventsMap[dateKey]) eventsMap[dateKey] = [];
                        eventsMap[dateKey].push(evt);
                        console.log('Event loaded:', dateKey, evt.title);
                    } catch (e) {
                        console.error('Error processing event:', evt, e);
                    }
                });

                // Load users
                usersMap = { ...data.users }; // 객체 복사
                console.log('Users loaded:', Object.keys(usersMap).length, 'users');

                // Update Cache
                saveEventsToStorage(eventsMap, usersMap);

                // Re-render day events popup first (faster response)
                if (selectedDateKey && !document.getElementById('dayModal').classList.contains('hidden')) {
                    renderDayEvents();
                }

                // Re-render calendar
                renderCalendar();
            } else {
                console.error('Invalid data format:', data);
                // Fallback to empty data
                eventsMap = {};
                usersMap = {};
            }
        })
        .catch(error => {
            console.error('Failed to load data:', error);
            // Fallback to empty data on error
            eventsMap = {};
            usersMap = {};
            renderCalendar();

            // Re-render day events popup if open
            if (selectedDateKey && !document.getElementById('dayModal').classList.contains('hidden')) {
                renderDayEvents();
            }
        });
}

function loadUserFromStorage() {
    try {
        const stored = localStorage.getItem('familyCalendarUser');
        if (stored) {
            currentUser = JSON.parse(stored);
            updateUserDisplay();
        }
    } catch (e) { console.error(e); }
}

function saveUserToStorage(user) {
    localStorage.setItem('familyCalendarUser', JSON.stringify(user));
    currentUser = user;
    updateUserDisplay();
}

function showRegistrationModal() {
    document.getElementById('registrationModal').classList.remove('hidden');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('사진 용량이 너무 큽니다. (5MB 이하)'); return; }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('regPhotoBase64').value = e.target.result;
        document.getElementById('photoPreview').style.backgroundImage = `url(${e.target.result})`;
        document.getElementById('photoPreview').textContent = '사진이 등록되었습니다';
        updateSaveButton(); // 사진 등록 후 버튼 상태 업데이트
    };
    reader.readAsDataURL(file);
}

function handleRegistration() {
    const name = document.getElementById('regName').value.trim();
    const photoBase64 = document.getElementById('regPhotoBase64').value;

    if (!name) {
        alert('사용자 이름을 입력해주세요!');
        document.getElementById('regName').focus();
        return;
    }
    if (!photoBase64) {
        alert('사진을 등록해주세요!');
        return;
    }

    const btn = document.getElementById('saveUserBtn');
    btn.textContent = '저장 중...';
    btn.disabled = true;

    // Register user using fetch
    fetch(`${API_BASE_URL}?pw=${API_PASSWORD}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
            action: 'registerUser',
            name: name,
            photoBase64: photoBase64
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const uuid = data.result;
                const newUser = { uuid, name, photo: photoBase64 };
                saveUserToStorage(newUser);
                document.getElementById('registrationModal').classList.add('hidden');
                btn.textContent = '모험 시작하기';
                btn.disabled = false;

                // Load fresh data after user registration
                loadData();
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        })
        .catch(err => {
            alert('오류: ' + err.message);
            btn.textContent = '모험 시작하기';
            btn.disabled = false;
        });
}

function updateUserDisplay() {
    if (!currentUser) return;
    // Logic removed from header, but function kept to prevent errors if called
}

// --- Caching Logic ---
function saveEventsToStorage(events, users) {
    try {
        localStorage.setItem('familyCalendar_events', JSON.stringify(events));
        localStorage.setItem('familyCalendar_users', JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save to cache:', e);
    }
}

function loadEventsFromStorage() {
    try {
        const cachedEvents = localStorage.getItem('familyCalendar_events');
        const cachedUsers = localStorage.getItem('familyCalendar_users');

        if (cachedEvents) {
            eventsMap = JSON.parse(cachedEvents);
            console.log('Loaded events from cache');
        }
        if (cachedUsers) {
            usersMap = JSON.parse(cachedUsers);
            console.log('Loaded users from cache');
        }
    } catch (e) {
        console.error('Failed to load from cache:', e);
    }
}

function loadImagesFromCache() {
    processImageCache('cached_header_bg', HEADER_IMAGE_URL, '.header-section', true);
    processImageCache('cached_family_photo', FAMILY_PHOTO_URL, '#familyPhotoImg', false);
}

function processImageCache(key, url, selector, isBg) {
    const cached = localStorage.getItem(key);
    const element = document.querySelector(selector);

    if (cached) {
        // Cache Hit: Apply immediately
        console.log('Image loaded from cache:', key);
        applyImage(element, cached, isBg);
    } else {
        // Cache Miss: Fetch and cache
        console.log('Image cache miss, fetching:', key);
        fetchAndCacheImage(key, url, element, isBg);
    }
}

function fetchAndCacheImage(key, url, element, isBg) {
    if (!element) return;

    // Initial load from URL (browser handles duplicate request optimization usually)
    // But to cache as dataURL, we need to fetch as blob
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onloadend = function () {
                const base64data = reader.result;
                localStorage.setItem(key, base64data);
                applyImage(element, base64data, isBg);
                console.log('Image cached:', key);
            }
            reader.readAsDataURL(blob);
        })
        .catch(e => console.error('Failed to cache image:', url, e));
}

function applyImage(element, data, isBg) {
    if (!element) return;
    if (isBg) {
        element.style.backgroundImage = `url(${data})`;
    } else {
        element.src = data;
    }
}

// --- Calendar & formatting ---
function renderCalendar() {
    console.log('=== renderCalendar START ===');
    console.log('currentDate:', currentDate);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    console.log('Rendering year:', year, 'month:', month);

    document.getElementById('currentDateDisplay').innerHTML = `${year}<span class="small-label">year</span><br>${month + 1}<span class="small-label">month</span>`;

    const grid = document.getElementById('calendarGrid');
    console.log('calendarGrid element:', grid);
    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0=Sun

    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day-cell empty';
        grid.appendChild(emptyCell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const dateObj = new Date(year, month, d);
        const dateKey = formatDateKey(dateObj);

        // 오늘 날짜 확인
        const today = new Date();
        const isToday = (year === today.getFullYear() &&
            month === today.getMonth() &&
            d === today.getDate());

        cell.className = 'day-cell' + (isToday ? ' today' : '');

        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';

        // 요일에 따라 클래스 추가
        const dayOfWeek = dateObj.getDay(); // 0=일, 1=월, ..., 6=토
        if (dayOfWeek === 0) { // 일요일
            dayNum.classList.add('sunday');
        } else if (dayOfWeek === 6) { // 토요일
            dayNum.classList.add('saturday');
        }

        dayNum.textContent = d;
        cell.appendChild(dayNum);

        const events = eventsMap[dateKey] || [];
        if (events.length > 0) {
            const list = document.createElement('ul');
            list.className = 'day-preview-list';

            // Max items calculation: Total height 105px.
            // Subtract Header (dayNum) ~15px, Padding ~8px. Available ~82px.
            // Each item ~10px-12px line height.
            // Can fit 4-5 items? Let's try 4 items + Etc.
            const maxItems = 6;
            const displayEvents = events.slice(0, maxItems);

            displayEvents.forEach(evt => {
                const item = document.createElement('li');
                item.className = 'day-preview-item';

                // Strict Truncation: Front 5 chars only
                let title = evt.title || '';
                if (title.length > 5) {
                    title = title.substring(0, 5);
                }

                item.textContent = title;
                item.style.backgroundColor = '#2a2a4a'; // 어두운 배경색
                item.style.color = (evt.color === '#2d3436') ? '#ccc' : (evt.color || '#fff'); // 미드나잇 블랙일 때만 밝은 회색
                list.appendChild(item);
            });

            // 외n개 텍스트 표시하지 않음

            cell.appendChild(list);
        }

        cell.addEventListener('click', () => openDayModal(dateKey));
        grid.appendChild(cell);
    }
}

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- Date Picker ---
function openDatePicker() {
    const modal = document.getElementById('datePickerModal');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');

    yearSelect.innerHTML = '';
    const currentYear = currentDate.getFullYear();
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        const opt = document.createElement('option');
        opt.value = y; opt.textContent = `${y}년`;
        if (y === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    monthSelect.innerHTML = '';
    const currentMonth = currentDate.getMonth();
    for (let m = 0; m < 12; m++) {
        const opt = document.createElement('option');
        opt.value = m; opt.textContent = `${m + 1}월`;
        if (m === currentMonth) opt.selected = true;
        monthSelect.appendChild(opt);
    }
    modal.classList.remove('hidden');
}

function confirmDateSelection() {
    const y = parseInt(document.getElementById('yearSelect').value);
    const m = parseInt(document.getElementById('monthSelect').value);
    currentDate.setFullYear(y);
    currentDate.setMonth(m);
    renderCalendar();
    closeDatePicker();
}

function resetDateSelection() {
    // 1. Reset currentDate to Today
    currentDate = new Date();

    // 2. Update Select Inputs to match Today
    const todayYear = currentDate.getFullYear();
    const todayMonth = currentDate.getMonth();

    document.getElementById('yearSelect').value = todayYear;
    document.getElementById('monthSelect').value = todayMonth;

    // 3. Render and Close
    renderCalendar();
    closeDatePicker();
}
function closeDatePicker() { document.getElementById('datePickerModal').classList.add('hidden'); }

// --- Day Modal & List Logic ---
let selectedDateKey = null;

function openDayModal(dateKey) {
    selectedDateKey = dateKey;
    document.getElementById('dayModalDate').textContent = dateKey;
    document.getElementById('dayModal').classList.remove('hidden');
    renderDayEvents();
}

function closeDayModal() {
    document.getElementById('dayModal').classList.add('hidden');
    selectedDateKey = null;
}

function renderDayEvents() {
    const list = document.getElementById('dayEventList');
    const emptyMsg = document.getElementById('emptyListMsg');
    list.innerHTML = '';

    const events = eventsMap[selectedDateKey] || [];

    if (events.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        events.forEach((evt, index) => {
            const li = document.createElement('li');
            li.className = 'event-item';

            const user = usersMap[evt.userUuid] || { name: '?', photo: '' };
            console.log('Event UUID:', evt.userUuid, 'User found:', user, 'Photo:', user.photo);
            // Convert old drive.google.com/uc URL to lh3 format
            let photoUrl = user.photo;
            if (photoUrl && photoUrl.includes('drive.google.com/uc?id=')) {
                const fileId = photoUrl.split('id=')[1];
                photoUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
            }
            console.log('Final photoUrl:', photoUrl);
            const imgHtml = photoUrl ? `<img src="${photoUrl}" class="event-user-img" style="width:30px;height:30px;border-radius:50%;margin-right:8px;vertical-align:middle;">` : '';

            // Format time to HH:mm only
            let startTimeFormatted = '';
            let endTimeFormatted = '';

            if (evt.startTime) {
                try {
                    let timeStr = String(evt.startTime);

                    // If it's a Date object or ISO string, extract time properly
                    if (timeStr.includes('T') || timeStr.includes('Z')) {
                        // This is likely a Date object converted to string
                        // Extract the time part that was originally stored
                        const dateObj = new Date(evt.startTime);
                        if (!isNaN(dateObj.getTime())) {
                            // Get hours and minutes from the Date object
                            const hours = dateObj.getHours().toString().padStart(2, '0');
                            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                            startTimeFormatted = hours + ':' + minutes;
                        }
                    } else {
                        // Direct time string like "09:00"
                        startTimeFormatted = timeStr;
                    }
                } catch (e) {
                    startTimeFormatted = String(evt.startTime);
                }
            }

            if (evt.endTime) {
                try {
                    let timeStr = String(evt.endTime);

                    if (timeStr.includes('T') || timeStr.includes('Z')) {
                        const dateObj = new Date(evt.endTime);
                        if (!isNaN(dateObj.getTime())) {
                            const hours = dateObj.getHours().toString().padStart(2, '0');
                            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                            endTimeFormatted = hours + ':' + minutes;
                        }
                    } else {
                        endTimeFormatted = timeStr;
                    }
                } catch (e) {
                    endTimeFormatted = String(evt.endTime);
                }
            }

            // Stacked time format: Start <br> End with separator
            const timeHtml = (startTimeFormatted && endTimeFormatted)
                ? `<span style="font-size:14px; margin-right:8px; line-height:1.1; display:inline-block; text-align:right; vertical-align:middle;">
                        <span style="color:#ddd;">${startTimeFormatted}</span><br>
                        <span style="color:#888;">${endTimeFormatted}</span>
                       </span>
                       <span style="display:inline-block; width:2px; height:20px; background-color:${evt.color || '#9b59b6'}; margin-right:8px; vertical-align:middle;"></span>`
                : '';

            li.innerHTML = `
                    <div class="event-info" style="display:flex; align-items:center;">
                        ${imgHtml} 
                        ${timeHtml}
                        <span style="vertical-align:middle; font-size:calc(1em + 1.5px);">${evt.title}</span>
                    </div>
                    <div class="event-actions">
                        <span class="action-icon" onclick="event.stopPropagation(); openEditEventForm(${index})">✏️</span>
                        <span class="action-icon" onclick="event.stopPropagation(); requestDeleteEvent(${index})">❌</span>
                    </div>
                `;

            // Toggle Actions on Click
            li.addEventListener('click', () => {
                // Close others
                document.querySelectorAll('.event-item').forEach(item => {
                    if (item !== li) item.classList.remove('active');
                });
                li.classList.toggle('active');
            });

            list.appendChild(li);
        });
    }
}

// --- Add / Edit Logic ---
const colorPalette = [
    '#9b59b6', '#ff7979', '#2ecc71', '#00cec9', '#0984e3',
    '#b08d55', '#2d3436', '#ff7675', '#fd79a8', '#e17055'
];

function renderColorPicker(selectedColor) {
    const container = document.getElementById('eventColorPicker');
    const hiddenInput = document.getElementById('eventColorInput');
    container.innerHTML = '';

    colorPalette.forEach((color, index) => {
        const circle = document.createElement('div');
        circle.className = 'color-option';
        circle.style.backgroundColor = color;

        if (color === selectedColor || (!selectedColor && index === 0)) {
            circle.classList.add('selected');
            if (!selectedColor) hiddenInput.value = color;
        }
        if (color === selectedColor) hiddenInput.value = color;

        circle.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
            circle.classList.add('selected');
            hiddenInput.value = color;
        });
        container.appendChild(circle);
    });
}

function openAddEventForm(dateKey) {
    document.getElementById('editorTitle').textContent = '일정 등록';
    document.getElementById('editEventId').value = ''; // Clean ID

    // Reset inputs
    document.getElementById('eventTitleInput').value = '';
    document.getElementById('eventStartDate').value = dateKey;
    document.getElementById('eventEndDate').value = dateKey;
    document.getElementById('eventStartTime').value = '09:00';
    document.getElementById('eventEndTime').value = '10:00';
    document.getElementById('eventAlarmInput').value = '10';

    // Reset alarm toggle to false and disable input
    document.getElementById('eventAlarmToggle').checked = false;
    toggleAlarmInput();

    renderColorPicker(colorPalette[0]);
    document.getElementById('eventEditorModal').classList.remove('hidden');
}

function openEditEventForm(index) {
    const evt = eventsMap[selectedDateKey][index];
    if (!evt) return;

    document.getElementById('editorTitle').textContent = '일정 수정';
    document.getElementById('editEventId').value = index; // Use Index as ID for local update

    document.getElementById('eventTitleInput').value = evt.title;
    // Assume single date events for now or parse from evt.date/evt.endDate
    document.getElementById('eventStartDate').value = evt.date;
    document.getElementById('eventEndDate').value = evt.date; // or stored end date
    // Time logic omitted for brevity as backend doesn't store it yet, defaulting
    document.getElementById('eventStartTime').value = '09:00';
    document.getElementById('eventEndTime').value = '10:00';
    document.getElementById('eventAlarmInput').value = '10';

    // Reset alarm toggle to false and disable input
    document.getElementById('eventAlarmToggle').checked = false;
    toggleAlarmInput();

    renderColorPicker(evt.color || colorPalette[0]);
    document.getElementById('eventEditorModal').classList.remove('hidden');
}

function closeEditor() {
    document.getElementById('eventEditorModal').classList.add('hidden');
}

function saveEvent() {
    const editIndex = document.getElementById('editEventId').value;
    const isEdit = editIndex !== '';

    const title = document.getElementById('eventTitleInput').value.trim();
    const startDate = document.getElementById('eventStartDate').value;
    const startTime = document.getElementById('eventStartTime').value;
    const endTime = document.getElementById('eventEndTime').value;
    const color = document.getElementById('eventColorInput').value;

    // 알람 설정 확인
    const alarmEnabled = document.getElementById('eventAlarmToggle').checked;
    const alarm = alarmEnabled ? parseInt(document.getElementById('eventAlarmInput').value) || 10 : 0;

    if (!title) { alert('일정 내용을 입력하세요!'); return; }
    if (!currentUser) { alert('사용자 정보가 없습니다. 다시 로그인해주세요.'); return; }

    const btn = document.getElementById('saveEventBtn');
    btn.disabled = true;
    btn.textContent = '저장 중...';

    // NOTE: Backend 'addEvent' only supports Create. 
    // For Edit, we ideally need 'updateEvent'. 
    // For now, we will Update Local State immediately for responsiveness.
    // And call addEvent (which might duplicate content on server if we don't handle ID).
    // Since we are strictly UI focused per instructions and cannot mod backend:

    if (isEdit) {
        // Update Local Only (Simulation)
        const evt = eventsMap[selectedDateKey][editIndex];
        evt.title = title;
        evt.color = color;
        evt.date = startDate;
        evt.startTime = startTime; // Update local
        evt.endTime = endTime;     // Update local

        // If date changed, move event
        if (startDate !== selectedDateKey) {
            eventsMap[selectedDateKey].splice(editIndex, 1);
            if (!eventsMap[startDate]) eventsMap[startDate] = [];
            eventsMap[startDate].push(evt);
        }

        closeEditor();
        renderDayEvents();
        renderCalendar();
        btn.disabled = false;
        btn.textContent = '일정 추가';

    } else {
        // New Event - Save using fetch
        fetch(`${API_BASE_URL}?pw=${API_PASSWORD}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'addEvent',
                dateString: startDate,
                title: title,
                userUuid: currentUser.uuid,
                startTime: startTime,
                endTime: endTime,
                color: color,
                alarm: alarm
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Event saved successfully, reloading data...');

                    // Generate .ics file if alarm is enabled
                    if (alarm > 0) {
                        generateICS({
                            date: startDate,
                            startTime: startTime,
                            endTime: endTime,
                            title: title,
                            alarm: alarm
                        });
                    }

                    // Reload data from server to get fresh data
                    loadData();

                    closeEditor();
                    renderDayEvents(); // 팝업 즉시 업데이트
                    btn.disabled = false;
                    btn.textContent = '일정 추가';
                } else {
                    throw new Error(data.error || 'Failed to save event');
                }
            })
            .catch(err => {
                alert('일정 저장 오류: ' + err.message);
                btn.disabled = false;
                btn.textContent = '일정 추가';
            });
    }
}

function generateICS(event) {
    // Format date and time for ICS (YYYYMMDDTHHMMSS)
    const dateStr = event.date.replace(/-/g, '');
    const startTimeStr = event.startTime.replace(/:/g, '') + '00';
    const endTimeStr = event.endTime.replace(/:/g, '') + '00';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Family Calendar//EN
BEGIN:VEVENT
DTSTART:${dateStr}T${startTimeStr}
DTEND:${dateStr}T${endTimeStr}
SUMMARY:${event.title}
BEGIN:VALARM
TRIGGER:-PT${event.alarm}M
ACTION:DISPLAY
DESCRIPTION:${event.title}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- Delete Logic ---
function requestDeleteEvent(index) {
    eventToDelete = { dateKey: selectedDateKey, index: index };
    document.getElementById('confirmDeleteModal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirmDeleteModal').classList.add('hidden');
    eventToDelete = null;
}

function confirmDelete() {
    if (!eventToDelete) return;

    // Get event details for server deletion
    const evt = eventsMap[eventToDelete.dateKey][eventToDelete.index];
    if (!evt) return;

    // Server delete using fetch
    fetch(`${API_BASE_URL}?pw=${API_PASSWORD}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
            action: 'deleteEvent',
            eventId: evt.id
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Event deleted from server');
                // Local delete
                eventsMap[eventToDelete.dateKey].splice(eventToDelete.index, 1);

                renderDayEvents();
                renderCalendar();
            } else {
                throw new Error(data.error || 'Delete failed');
            }
            closeConfirmModal();
        })
        .catch(error => {
            console.error('Delete failed:', error);
            alert('일정 삭제에 실패했습니다.');
            closeConfirmModal();
        });
}