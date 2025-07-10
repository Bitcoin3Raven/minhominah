// backup-system.js - 백업 및 복원 시스템
import { supabase } from './supabase-client.js';

class BackupSystem {
    constructor() {
        this.initialize();
    }

    async initialize() {
        if (!await this.checkAuth()) return;
        
        this.setupEventListeners();
        this.loadBackupHistory();
        this.loadAutoBackupSettings();
    }

    async checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        this.currentUser = user;
        return true;
    }

    setupEventListeners() {
        // 백업 버튼들
        document.getElementById('fullBackupBtn').addEventListener('click', () => this.createFullBackup());
        document.getElementById('memoriesBackupBtn').addEventListener('click', () => this.createMemoriesBackup());
        document.getElementById('settingsBackupBtn').addEventListener('click', () => this.createSettingsBackup());
        
        // 복원 기능
        const restoreFile = document.getElementById('restoreFile');
        restoreFile.addEventListener('change', (e) => this.handleRestoreFile(e));
        
        // 드래그 앤 드롭
        const dropZone = restoreFile.parentElement;
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-gray-100', 'dark:bg-gray-700');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-gray-100', 'dark:bg-gray-700');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-gray-100', 'dark:bg-gray-700');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                restoreFile.files = files;
                this.handleRestoreFile({ target: { files } });
            }
        });
        
        // 복원 버튼
        document.getElementById('restoreBtn').addEventListener('click', () => this.restoreBackup());
        
        // 자동 백업 설정
        const autoBackupEnabled = document.getElementById('autoBackupEnabled');
        autoBackupEnabled.addEventListener('change', (e) => {
            document.getElementById('autoBackupOptions').classList.toggle('hidden', !e.target.checked);
        });
        
        document.getElementById('saveAutoBackupBtn').addEventListener('click', () => this.saveAutoBackupSettings());
    }

    async createFullBackup() {
        try {
            this.showLoading('전체 백업을 생성하고 있습니다...');
            
            // 모든 데이터 수집
            const backupData = {
                version: '1.0',
                createdAt: new Date().toISOString(),
                user: this.currentUser.email,
                data: {}
            };

            // 추억 데이터
            const { data: memories } = await supabase
                .from('memories')
                .select(`
                    *,
                    memory_people(people(*)),
                    memory_tags(tags(*)),
                    media_files(*)
                `)
                .order('created_at', { ascending: false });
            backupData.data.memories = memories;

            // 사람 데이터
            const { data: people } = await supabase
                .from('people')
                .select('*');
            backupData.data.people = people;

            // 태그 데이터
            const { data: tags } = await supabase
                .from('tags')
                .select('*');
            backupData.data.tags = tags;

            // 가족 그룹 데이터
            const { data: familyGroups } = await supabase
                .from('family_groups')
                .select(`
                    *,
                    family_members(*)
                `);
            backupData.data.familyGroups = familyGroups;

            // 성장 기록 데이터
            const { data: growthRecords } = await supabase
                .from('growth_records')
                .select('*');
            backupData.data.growthRecords = growthRecords;

            // 댓글 데이터
            const { data: comments } = await supabase
                .from('comments')
                .select('*');
            backupData.data.comments = comments;

            // ZIP 파일 생성
            const zip = new JSZip();
            
            // JSON 데이터 추가
            zip.file('backup-data.json', JSON.stringify(backupData, null, 2));
            
            // 미디어 파일 추가 (선택적)
            if (confirm('미디어 파일도 백업에 포함하시겠습니까? (용량이 클 수 있습니다)')) {
                await this.addMediaFilesToZip(zip, memories);
            }

            // ZIP 다운로드
            const content = await zip.generateAsync({ type: 'blob' });
            this.downloadFile(content, `minhominah-backup-${new Date().toISOString().slice(0, 10)}.zip`);
            
            // 백업 기록 저장
            await this.saveBackupRecord('full', content.size);
            
            this.hideLoading();
            this.showSuccess('전체 백업이 완료되었습니다!');
            
        } catch (error) {
            console.error('백업 오류:', error);
            this.hideLoading();
            this.showError('백업 중 오류가 발생했습니다.');
        }
    }

    async createMemoriesBackup() {
        try {
            this.showLoading('추억 백업을 생성하고 있습니다...');
            
            const backupData = {
                version: '1.0',
                type: 'memories',
                createdAt: new Date().toISOString(),
                user: this.currentUser.email,
                data: {}
            };

            // 추억 데이터만 백업
            const { data: memories } = await supabase
                .from('memories')
                .select(`
                    *,
                    memory_people(people(*)),
                    memory_tags(tags(*)),
                    media_files(*)
                `)
                .order('created_at', { ascending: false });
            
            backupData.data.memories = memories;

            // JSON 다운로드
            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            this.downloadFile(blob, `minhominah-memories-${new Date().toISOString().slice(0, 10)}.json`);
            
            // 백업 기록 저장
            await this.saveBackupRecord('memories', blob.size);
            
            this.hideLoading();
            this.showSuccess('추억 백업이 완료되었습니다!');
            
        } catch (error) {
            console.error('백업 오류:', error);
            this.hideLoading();
            this.showError('백업 중 오류가 발생했습니다.');
        }
    }

    async createSettingsBackup() {
        try {
            this.showLoading('설정 백업을 생성하고 있습니다...');
            
            const backupData = {
                version: '1.0',
                type: 'settings',
                createdAt: new Date().toISOString(),
                user: this.currentUser.email,
                data: {}
            };

            // 설정 관련 데이터만 백업
            const { data: people } = await supabase
                .from('people')
                .select('*');
            backupData.data.people = people;

            const { data: tags } = await supabase
                .from('tags')
                .select('*');
            backupData.data.tags = tags;

            const { data: familyGroups } = await supabase
                .from('family_groups')
                .select(`
                    *,
                    family_members(*)
                `);
            backupData.data.familyGroups = familyGroups;

            // JSON 다운로드
            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            this.downloadFile(blob, `minhominah-settings-${new Date().toISOString().slice(0, 10)}.json`);
            
            // 백업 기록 저장
            await this.saveBackupRecord('settings', blob.size);
            
            this.hideLoading();
            this.showSuccess('설정 백업이 완료되었습니다!');
            
        } catch (error) {
            console.error('백업 오류:', error);
            this.hideLoading();
            this.showError('백업 중 오류가 발생했습니다.');
        }
    }

    async addMediaFilesToZip(zip, memories) {
        const mediaFolder = zip.folder('media');
        
        for (const memory of memories) {
            if (memory.media_files && memory.media_files.length > 0) {
                for (const media of memory.media_files) {
                    try {
                        // Storage에서 파일 다운로드
                        const { data, error } = await supabase.storage
                            .from('media')
                            .download(media.file_path);
                        
                        if (!error && data) {
                            const fileName = media.file_path.split('/').pop();
                            mediaFolder.file(fileName, data);
                        }
                    } catch (err) {
                        console.error(`미디어 파일 다운로드 실패: ${media.file_path}`, err);
                    }
                }
            }
        }
    }

    async handleRestoreFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const restoreBtn = document.getElementById('restoreBtn');
        restoreBtn.disabled = false;
        
        this.restoreFile = file;
        this.showInfo(`선택된 파일: ${file.name} (${this.formatFileSize(file.size)})`);
    }

    async restoreBackup() {
        if (!this.restoreFile) return;

        if (!confirm('백업을 복원하면 현재 데이터가 덮어씌워질 수 있습니다. 계속하시겠습니까?')) {
            return;
        }

        try {
            this.showLoading('백업을 복원하고 있습니다...');
            
            let backupData;
            
            // ZIP 파일인 경우
            if (this.restoreFile.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(this.restoreFile);
                const jsonFile = zip.file('backup-data.json');
                if (!jsonFile) {
                    throw new Error('백업 파일이 손상되었습니다.');
                }
                const jsonStr = await jsonFile.async('string');
                backupData = JSON.parse(jsonStr);
            } 
            // JSON 파일인 경우
            else {
                const text = await this.restoreFile.text();
                backupData = JSON.parse(text);
            }

            // 버전 확인
            if (backupData.version !== '1.0') {
                throw new Error('지원하지 않는 백업 버전입니다.');
            }

            // 데이터 복원
            await this.restoreData(backupData);
            
            this.hideLoading();
            this.showSuccess('백업이 성공적으로 복원되었습니다!');
            
            // 3초 후 페이지 새로고침
            setTimeout(() => {
                window.location.reload();
            }, 3000);
            
        } catch (error) {
            console.error('복원 오류:', error);
            this.hideLoading();
            this.showError('백업 복원 중 오류가 발생했습니다.');
        }
    }

    async restoreData(backupData) {
        const data = backupData.data;
        
        // 백업 타입에 따라 복원
        if (backupData.type === 'settings') {
            // 설정만 복원
            if (data.people) await this.restoreTable('people', data.people);
            if (data.tags) await this.restoreTable('tags', data.tags);
            if (data.familyGroups) await this.restoreFamilyGroups(data.familyGroups);
        } 
        else if (backupData.type === 'memories') {
            // 추억만 복원
            if (data.memories) await this.restoreMemories(data.memories);
        }
        else {
            // 전체 복원
            if (data.people) await this.restoreTable('people', data.people);
            if (data.tags) await this.restoreTable('tags', data.tags);
            if (data.familyGroups) await this.restoreFamilyGroups(data.familyGroups);
            if (data.memories) await this.restoreMemories(data.memories);
            if (data.growthRecords) await this.restoreTable('growth_records', data.growthRecords);
            if (data.comments) await this.restoreTable('comments', data.comments);
        }
    }

    async restoreTable(tableName, data) {
        // 기존 데이터 삭제 (옵션)
        if (confirm(`${tableName} 테이블의 기존 데이터를 삭제하고 복원하시겠습니까?`)) {
            await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        
        // 새 데이터 삽입
        const { error } = await supabase.from(tableName).insert(data);
        if (error) {
            console.error(`${tableName} 복원 오류:`, error);
            throw error;
        }
    }

    async restoreMemories(memories) {
        for (const memory of memories) {
            // 메모리 본체 복원
            const { id, memory_people, memory_tags, media_files, ...memoryData } = memory;
            
            const { error: memoryError } = await supabase
                .from('memories')
                .insert(memoryData);
            
            if (memoryError) {
                console.error('추억 복원 오류:', memoryError);
                continue;
            }
            
            // 관계 데이터 복원
            if (memory_people && memory_people.length > 0) {
                const peopleRelations = memory_people.map(mp => ({
                    memory_id: id,
                    person_id: mp.person_id
                }));
                await supabase.from('memory_people').insert(peopleRelations);
            }
            
            if (memory_tags && memory_tags.length > 0) {
                const tagRelations = memory_tags.map(mt => ({
                    memory_id: id,
                    tag_id: mt.tag_id
                }));
                await supabase.from('memory_tags').insert(tagRelations);
            }
            
            if (media_files && media_files.length > 0) {
                await supabase.from('media_files').insert(media_files);
            }
        }
    }

    async restoreFamilyGroups(familyGroups) {
        for (const group of familyGroups) {
            const { family_members, ...groupData } = group;
            
            // 그룹 복원
            const { error: groupError } = await supabase
                .from('family_groups')
                .insert(groupData);
            
            if (!groupError && family_members && family_members.length > 0) {
                // 멤버 복원
                await supabase.from('family_members').insert(family_members);
            }
        }
    }

    async saveBackupRecord(type, size) {
        const record = {
            type,
            size,
            createdAt: new Date().toISOString(),
            user: this.currentUser.email
        };
        
        // 로컬 스토리지에 백업 기록 저장
        const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        history.unshift(record);
        
        // 최대 20개까지만 보관
        if (history.length > 20) {
            history.pop();
        }
        
        localStorage.setItem('backupHistory', JSON.stringify(history));
        this.loadBackupHistory();
    }

    loadBackupHistory() {
        const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        const historyContainer = document.getElementById('backupHistory');
        
        if (history.length === 0) {
            historyContainer.innerHTML = `
                <p class="text-gray-500 dark:text-gray-400 text-center py-8">
                    아직 백업 기록이 없습니다.
                </p>
            `;
            return;
        }
        
        historyContainer.innerHTML = history.map(record => `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <p class="font-semibold text-gray-800 dark:text-white">
                        ${this.getBackupTypeName(record.type)} 백업
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        ${new Date(record.createdAt).toLocaleString('ko-KR')} • ${this.formatFileSize(record.size)}
                    </p>
                </div>
                <i class="fas fa-check-circle text-green-500 text-xl"></i>
            </div>
        `).join('');
    }

    async loadAutoBackupSettings() {
        const settings = JSON.parse(localStorage.getItem('autoBackupSettings') || '{}');
        
        document.getElementById('autoBackupEnabled').checked = settings.enabled || false;
        document.getElementById('backupFrequency').value = settings.frequency || 'weekly';
        document.getElementById('backupTime').value = settings.time || '02:00';
        document.getElementById('maxBackups').value = settings.maxBackups || 5;
        
        if (settings.enabled) {
            document.getElementById('autoBackupOptions').classList.remove('hidden');
        }
    }

    async saveAutoBackupSettings() {
        const settings = {
            enabled: document.getElementById('autoBackupEnabled').checked,
            frequency: document.getElementById('backupFrequency').value,
            time: document.getElementById('backupTime').value,
            maxBackups: parseInt(document.getElementById('maxBackups').value)
        };
        
        localStorage.setItem('autoBackupSettings', JSON.stringify(settings));
        
        // 서비스 워커에 스케줄 등록
        if (settings.enabled && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    type: 'SCHEDULE_BACKUP',
                    settings
                });
            });
        }
        
        this.showSuccess('자동 백업 설정이 저장되었습니다!');
    }

    // 유틸리티 함수들
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getBackupTypeName(type) {
        const names = {
            'full': '전체',
            'memories': '추억',
            'settings': '설정'
        };
        return names[type] || type;
    }

    showLoading(message) {
        // 로딩 표시 구현
        const loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-gray-800 dark:text-white">${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.remove();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('animate-fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    new BackupSystem();
});