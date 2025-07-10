// 성장 기록 차트 시스템
let currentPerson = null;
let heightChart = null;
let weightChart = null;
let growthRecords = [];
let people = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await loadPeople();
    await initializeCharts();
    
    // 폼 이벤트 리스너
    document.getElementById('addRecordForm').addEventListener('submit', handleAddRecord);
    
    // 기본값 설정
    document.getElementById('recordDate').valueAsDate = new Date();
});

// 인물 정보 로드
async function loadPeople() {
    try {
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .order('name');
            
        if (error) throw error;
        people = data || [];
    } catch (error) {
        console.error('인물 정보 로드 실패:', error);
    }
}

// 차트 초기화
function initializeCharts() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#e5e7eb' : '#374151';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: gridColor,
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor
                }
            },
            y: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor
                }
            }
        }
    };
    
    // 키 차트
    const heightCtx = document.getElementById('heightChart').getContext('2d');
    heightChart = new Chart(heightCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '키 (cm)',
                data: [],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    title: {
                        display: true,
                        text: '키 (cm)',
                        color: textColor
                    }
                }
            }
        }
    });
    
    // 몸무게 차트
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    weightChart = new Chart(weightCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '몸무게 (kg)',
                data: [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.1,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    title: {
                        display: true,
                        text: '몸무게 (kg)',
                        color: textColor
                    }
                }
            }
        }
    });
}

// 인물 선택
async function selectPerson(personName) {
    currentPerson = personName;
    
    // 버튼 스타일 업데이트
    document.querySelectorAll('.person-btn').forEach(btn => {
        btn.classList.remove('bg-gradient-to-r', 'from-pink-500', 'to-purple-500', 'text-white');
        btn.classList.add('text-gray-700', 'dark:text-gray-300');
    });
    
    const selectedBtn = document.getElementById(`btn-${personName}`);
    selectedBtn.classList.remove('text-gray-700', 'dark:text-gray-300');
    selectedBtn.classList.add('bg-gradient-to-r', 'from-pink-500', 'to-purple-500', 'text-white');
    
    // 기록 로드
    await loadGrowthRecords();
}

// 성장 기록 로드
async function loadGrowthRecords() {
    if (!currentPerson) return;
    
    try {
        // 인물 ID 찾기
        const person = people.find(p => p.name === currentPerson);
        if (!person) {
            console.error('인물을 찾을 수 없습니다:', currentPerson);
            return;
        }
        
        // 성장 기록 조회
        const { data, error } = await supabase
            .from('growth_records')
            .select('*')
            .eq('person_id', person.id)
            .order('record_date', { ascending: true });
            
        if (error) throw error;
        
        growthRecords = data || [];
        updateCharts();
        updateStatistics();
        updateRecordsTable();
        
    } catch (error) {
        console.error('성장 기록 로드 실패:', error);
    }
}

// 차트 업데이트
function updateCharts() {
    const labels = growthRecords.map(record => {
        const date = new Date(record.record_date);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    
    const heights = growthRecords.map(record => record.height_cm);
    const weights = growthRecords.map(record => record.weight_kg);
    
    // 키 차트 업데이트
    heightChart.data.labels = labels;
    heightChart.data.datasets[0].data = heights;
    heightChart.update();
    
    // 몸무게 차트 업데이트
    weightChart.data.labels = labels;
    weightChart.data.datasets[0].data = weights;
    weightChart.update();
}

// 통계 업데이트
function updateStatistics() {
    if (growthRecords.length === 0) {
        document.getElementById('currentStats').innerHTML = '<p class="text-2xl font-bold">기록 없음</p>';
        document.getElementById('growthRate').innerHTML = '<p class="text-2xl font-bold">-</p>';
        document.getElementById('lastUpdate').innerHTML = '<p class="text-2xl font-bold">-</p>';
        return;
    }
    
    // 현재 상태 (최신 기록)
    const latestRecord = growthRecords[growthRecords.length - 1];
    const person = people.find(p => p.name === currentPerson);
    const currentAge = calculateAge(person.birth_date, latestRecord.record_date);
    
    document.getElementById('currentStats').innerHTML = `
        <p class="text-sm opacity-90">${currentAge}</p>
        <p class="text-xl font-bold">키: ${latestRecord.height_cm}cm</p>
        <p class="text-xl font-bold">몸무게: ${latestRecord.weight_kg}kg</p>
    `;
    
    // 최근 성장률 (최근 3개월)
    if (growthRecords.length >= 2) {
        const threeMonthsAgo = new Date(latestRecord.record_date);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const recentRecords = growthRecords.filter(r => 
            new Date(r.record_date) >= threeMonthsAgo
        );
        
        if (recentRecords.length >= 2) {
            const firstRecent = recentRecords[0];
            const lastRecent = recentRecords[recentRecords.length - 1];
            
            const heightGrowth = lastRecent.height_cm - firstRecent.height_cm;
            const weightGrowth = lastRecent.weight_kg - firstRecent.weight_kg;
            
            document.getElementById('growthRate').innerHTML = `
                <p class="text-sm opacity-90">최근 3개월</p>
                <p class="text-lg font-bold">키: +${heightGrowth.toFixed(1)}cm</p>
                <p class="text-lg font-bold">몸무게: +${weightGrowth.toFixed(1)}kg</p>
            `;
        }
    }
    
    // 마지막 기록 날짜
    const lastDate = new Date(latestRecord.record_date);
    const daysSinceUpdate = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    
    document.getElementById('lastUpdate').innerHTML = `
        <p class="text-sm opacity-90">${lastDate.toLocaleDateString()}</p>
        <p class="text-xl font-bold">${daysSinceUpdate}일 전</p>
    `;
}

// 기록 테이블 업데이트
function updateRecordsTable() {
    const tbody = document.getElementById('recordsTableBody');
    tbody.innerHTML = '';
    
    if (growthRecords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">
                    아직 성장 기록이 없습니다.
                </td>
            </tr>
        `;
        return;
    }
    
    const person = people.find(p => p.name === currentPerson);
    
    growthRecords.reverse().forEach(record => {
        const date = new Date(record.record_date);
        const age = calculateAge(person.birth_date, record.record_date);
        
        const row = document.createElement('tr');
        row.className = 'border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors';
        row.innerHTML = `
            <td class="py-3 px-4">${date.toLocaleDateString()}</td>
            <td class="py-3 px-4">${age}</td>
            <td class="py-3 px-4">${record.height_cm} cm</td>
            <td class="py-3 px-4">${record.weight_kg} kg</td>
            <td class="py-3 px-4">${record.notes || '-'}</td>
            <td class="py-3 px-4 text-center">
                <button onclick="deleteRecord('${record.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 나이 계산
function calculateAge(birthDate, targetDate) {
    const birth = new Date(birthDate);
    const target = new Date(targetDate);
    
    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    if (target.getDate() < birth.getDate()) {
        months--;
        if (months < 0) {
            years--;
            months += 12;
        }
    }
    
    if (years === 0) {
        return `${months}개월`;
    } else if (months === 0) {
        return `${years}세`;
    } else {
        return `${years}세 ${months}개월`;
    }
}

// 기록 추가 모달 표시
function showAddRecordModal() {
    document.getElementById('addRecordModal').classList.remove('hidden');
    
    // 현재 선택된 인물 설정
    if (currentPerson) {
        document.getElementById('recordPerson').value = currentPerson;
    }
}

// 기록 추가 모달 숨기기
function hideAddRecordModal() {
    document.getElementById('addRecordModal').classList.add('hidden');
    document.getElementById('addRecordForm').reset();
}

// 기록 추가 처리
async function handleAddRecord(e) {
    e.preventDefault();
    
    const personName = document.getElementById('recordPerson').value;
    const recordDate = document.getElementById('recordDate').value;
    const height = parseFloat(document.getElementById('recordHeight').value);
    const weight = parseFloat(document.getElementById('recordWeight').value);
    const notes = document.getElementById('recordNotes').value;
    
    try {
        // 인물 ID 찾기
        const person = people.find(p => p.name === personName);
        if (!person) {
            alert('인물을 찾을 수 없습니다.');
            return;
        }
        
        // 기록 추가
        const { error } = await supabase
            .from('growth_records')
            .insert({
                person_id: person.id,
                record_date: recordDate,
                height_cm: height,
                weight_kg: weight,
                notes: notes || null
            });
            
        if (error) throw error;
        
        // 성공
        hideAddRecordModal();
        
        // 현재 인물이 추가한 인물과 같으면 데이터 새로고침
        if (currentPerson === personName) {
            await loadGrowthRecords();
        } else {
            // 다른 인물이면 해당 인물 선택
            await selectPerson(personName);
        }
        
    } catch (error) {
        console.error('기록 추가 실패:', error);
        alert('기록 추가에 실패했습니다.');
    }
}

// 기록 삭제
async function deleteRecord(recordId) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await supabase
            .from('growth_records')
            .delete()
            .eq('id', recordId);
            
        if (error) throw error;
        
        // 데이터 새로고침
        await loadGrowthRecords();
        
    } catch (error) {
        console.error('기록 삭제 실패:', error);
        alert('기록 삭제에 실패했습니다.');
    }
}

// 테마 변경 감지 및 차트 업데이트
const observer = new MutationObserver(() => {
    // 차트가 존재하면 재생성
    if (heightChart && weightChart) {
        heightChart.destroy();
        weightChart.destroy();
        initializeCharts();
        updateCharts();
    }
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
});
