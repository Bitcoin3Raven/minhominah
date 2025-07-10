# 민호민아닷컴 신규 기능 구현 가이드 (2025.07)

## 📋 개요
민호민아닷컴에 추가될 핵심 기능에 대한 상세 구현 가이드입니다.

1. **👨‍👩‍👧‍👦 가족 계정 시스템** - 권한 관리 및 다중 사용자 지원 ✅
2. **📚 PDF 내보내기** - 추억을 포토북으로 제작 ✅
3. **👶 나이별 필터링** - 성장 단계별 추억 보기 ✅
4. **🤖 AI 자동 태깅** - 사진 속 인물, 객체, 장면 자동 인식 🔄

## 1. 👨‍👩‍👧‍👦 가족 계정 시스템 (Family Account System)

### 목표
- 가족 구성원별 계정 생성 및 권한 차등 부여
- 부모/가족/관람객 역할에 따른 기능 제한
- 가족 초대 기능으로 쉬운 계정 연결

### 기술 구현

#### 1.1 데이터베이스 스키마 확장

```sql
-- 가족 그룹 테이블
CREATE TABLE family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  invitation_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 가족 구성원 테이블
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'family',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 초대 테이블
CREATE TABLE family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('parent', 'family', 'viewer')) DEFAULT 'family',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- 가족 구성원만 가족 정보 조회 가능
CREATE POLICY "가족 구성원 조회" ON family_members
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM family_members WHERE family_id = family_members.family_id
    )
  );

-- 부모만 가족 구성원 추가/삭제 가능
CREATE POLICY "부모 권한 관리" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'parent'
    )
  );
```

#### 1.2 UI 구현

```html
<!-- family-settings.html -->
<div id="familySettings" class="container mx-auto p-6">
  <!-- 가족 정보 섹션 -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4">우리 가족 정보</h2>
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-gray-600 dark:text-gray-400">가족 이름:</span>
        <span class="font-semibold" id="familyName">행복한 가족</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-gray-600 dark:text-gray-400">초대 코드:</span>
        <div class="flex items-center space-x-2">
          <code class="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded" id="inviteCode">FAM-XXXX</code>
          <button onclick="copyInviteCode()" class="text-blue-500 hover:text-blue-700">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 가족 구성원 목록 -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
    <h3 class="text-xl font-bold mb-4">가족 구성원</h3>
    <div class="space-y-3" id="familyMembersList">
      <!-- 동적으로 생성될 구성원 목록 -->
    </div>
  </div>

  <!-- 초대하기 섹션 -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <h3 class="text-xl font-bold mb-4">가족 초대하기</h3>
    <form id="inviteForm" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">이메일 주소</label>
        <input type="email" id="inviteEmail" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required>
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">역할</label>
        <select id="inviteRole" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
          <option value="family">가족</option>
          <option value="viewer">관람객</option>
          <option value="parent">부모</option>
        </select>
      </div>
      <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
        초대 메일 보내기
      </button>
    </form>
  </div>
</div>
```

#### 1.3 JavaScript 구현

```javascript
// family-system.js
class FamilySystem {
  constructor() {
    this.currentFamily = null;
    this.currentRole = null;
    this.init();
  }

  async init() {
    await this.checkFamilyMembership();
    this.setupEventListeners();
  }

  async checkFamilyMembership() {
    const { data: membership } = await supabase
      .from('family_members')
      .select(`
        *,
        family_groups(*)
      `)
      .eq('user_id', currentUser.id)
      .single();

    if (membership) {
      this.currentFamily = membership.family_groups;
      this.currentRole = membership.role;
      this.displayFamilyInfo();
    } else {
      this.showCreateFamilyPrompt();
    }
  }

  async createFamily(familyName) {
    const inviteCode = this.generateInviteCode();
    
    const { data: family, error } = await supabase
      .from('family_groups')
      .insert({
        name: familyName,
        created_by: currentUser.id,
        invitation_code: inviteCode
      })
      .select()
      .single();

    if (!error) {
      // 생성자를 부모로 추가
      await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: currentUser.id,
          role: 'parent'
        });

      this.currentFamily = family;
      this.currentRole = 'parent';
      this.displayFamilyInfo();
    }
  }

  async inviteFamilyMember(email, role) {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

    const { data, error } = await supabase
      .from('family_invitations')
      .insert({
        family_id: this.currentFamily.id,
        email: email,
        role: role,
        invited_by: currentUser.id,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (!error) {
      // 이메일 전송 (Supabase Edge Function 사용)
      await this.sendInvitationEmail(email, token);
      this.showSuccessMessage('초대 메일이 발송되었습니다.');
    }
  }

  async acceptInvitation(token) {
    const { data: invitation } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitation && new Date(invitation.expires_at) > new Date()) {
      // 가족 구성원으로 추가
      await supabase
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: currentUser.id,
          role: invitation.role
        });

      // 초대 상태 업데이트
      await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      window.location.href = '/family-settings.html';
    }
  }

  generateInviteCode() {
    return 'FAM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  displayFamilyInfo() {
    document.getElementById('familyName').textContent = this.currentFamily.name;
    document.getElementById('inviteCode').textContent = this.currentFamily.invitation_code;
    this.loadFamilyMembers();
  }

  async loadFamilyMembers() {
    const { data: members } = await supabase
      .from('family_members')
      .select(`
        *,
        profiles(*)
      `)
      .eq('family_id', this.currentFamily.id);

    const membersList = document.getElementById('familyMembersList');
    membersList.innerHTML = members.map(member => `
      <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center space-x-3">
          <img src="${member.profiles.avatar_url || '/assets/default-avatar.png'}" 
               class="w-10 h-10 rounded-full">
          <div>
            <p class="font-semibold">${member.profiles.full_name}</p>
            <p class="text-sm text-gray-500">${this.getRoleLabel(member.role)}</p>
          </div>
        </div>
        ${this.currentRole === 'parent' && member.user_id !== currentUser.id ? `
          <button onclick="familySystem.removeMember('${member.id}')" 
                  class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  getRoleLabel(role) {
    const labels = {
      'parent': '부모',
      'family': '가족',
      'viewer': '관람객'
    };
    return labels[role] || role;
  }
}

// 초기화
const familySystem = new FamilySystem();
```

## 2. 📚 PDF 내보내기 - 포토북 생성 (PDF Export - Photobook)

### 목표
- 선택한 추억들을 아름다운 PDF 포토북으로 제작
- 다양한 템플릿과 레이아웃 옵션 제공
- 고품질 인쇄용 PDF 생성

### 기술 구현

#### 2.1 필요 라이브러리

```html
<!-- jsPDF와 html2canvas 라이브러리 추가 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

#### 2.2 포토북 생성 UI

```html
<!-- photobook-creator.html -->
<div id="photobookCreator" class="container mx-auto p-6">
  <!-- 포토북 설정 -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6">포토북 만들기</h2>
    
    <!-- 템플릿 선택 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3">템플릿 선택</h3>
      <div class="grid grid-cols-3 gap-4">
        <label class="cursor-pointer">
          <input type="radio" name="template" value="classic" class="hidden peer" checked>
          <div class="border-2 border-gray-300 peer-checked:border-blue-500 rounded-lg p-4 transition">
            <img src="/assets/templates/classic.jpg" class="w-full h-32 object-cover rounded mb-2">
            <p class="text-center font-medium">클래식</p>
          </div>
        </label>
        <label class="cursor-pointer">
          <input type="radio" name="template" value="modern" class="hidden peer">
          <div class="border-2 border-gray-300 peer-checked:border-blue-500 rounded-lg p-4 transition">
            <img src="/assets/templates/modern.jpg" class="w-full h-32 object-cover rounded mb-2">
            <p class="text-center font-medium">모던</p>
          </div>
        </label>
        <label class="cursor-pointer">
          <input type="radio" name="template" value="minimal" class="hidden peer">
          <div class="border-2 border-gray-300 peer-checked:border-blue-500 rounded-lg p-4 transition">
            <img src="/assets/templates/minimal.jpg" class="w-full h-32 object-cover rounded mb-2">
            <p class="text-center font-medium">미니멀</p>
          </div>
        </label>
      </div>
    </div>

    <!-- 기간 선택 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3">포함할 기간</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">시작일</label>
          <input type="date" id="photobookStartDate" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">종료일</label>
          <input type="date" id="photobookEndDate" class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700">
        </div>
      </div>
    </div>

    <!-- 옵션 설정 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3">옵션</h3>
      <div class="space-y-3">
        <label class="flex items-center">
          <input type="checkbox" id="includeTitle" checked class="mr-3">
          <span>제목 페이지 포함</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="includeStats" checked class="mr-3">
          <span>통계 페이지 포함</span>
        </label>
        <label class="flex items-center">
          <input type="checkbox" id="includeTimeline" class="mr-3">
          <span>타임라인 포함</span>
        </label>
      </div>
    </div>

    <!-- 생성 버튼 -->
    <button onclick="photobookCreator.generatePDF()" 
            class="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
      포토북 생성하기
    </button>
  </div>

  <!-- 미리보기 영역 -->
  <div id="pdfPreview" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hidden">
    <h3 class="text-xl font-bold mb-4">포토북 미리보기</h3>
    <div id="previewPages" class="space-y-4">
      <!-- 동적으로 생성될 페이지 미리보기 -->
    </div>
  </div>
</div>
```

#### 2.3 JavaScript 구현

```javascript
// photobook-creator.js
class PhotobookCreator {
  constructor() {
    this.memories = [];
    this.template = 'classic';
    this.options = {
      includeTitle: true,
      includeStats: true,
      includeTimeline: false
    };
  }

  async loadMemories(startDate, endDate) {
    let query = supabase
      .from('memories')
      .select(`
        *,
        media_files(*),
        memory_people(people(*))
      `)
      .order('memory_date', { ascending: true });

    if (startDate) {
      query = query.gte('memory_date', startDate);
    }
    if (endDate) {
      query = query.lte('memory_date', endDate);
    }

    const { data } = await query;
    this.memories = data || [];
    return this.memories;
  }

  async generatePDF() {
    const startDate = document.getElementById('photobookStartDate').value;
    const endDate = document.getElementById('photobookEndDate').value;
    
    // 추억 로드
    await this.loadMemories(startDate, endDate);
    
    if (this.memories.length === 0) {
      alert('선택한 기간에 추억이 없습니다.');
      return;
    }

    // PDF 생성
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 템플릿에 따른 스타일 설정
    const styles = this.getTemplateStyles();

    // 1. 표지 페이지
    if (this.options.includeTitle) {
      await this.addTitlePage(pdf, styles);
    }

    // 2. 통계 페이지
    if (this.options.includeStats) {
      await this.addStatsPage(pdf, styles);
    }

    // 3. 추억 페이지들
    for (let i = 0; i < this.memories.length; i++) {
      if (i > 0 || this.options.includeTitle || this.options.includeStats) {
        pdf.addPage();
      }
      await this.addMemoryPage(pdf, this.memories[i], styles);
    }

    // 4. 타임라인 페이지
    if (this.options.includeTimeline) {
      pdf.addPage();
      await this.addTimelinePage(pdf, styles);
    }

    // PDF 저장
    const fileName = `민호민아_포토북_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  async addTitlePage(pdf, styles) {
    // 배경색
    pdf.setFillColor(...styles.primaryColor);
    pdf.rect(0, 0, 210, 297, 'F');

    // 제목
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(48);
    pdf.text('민호와 민아의', 105, 100, { align: 'center' });
    pdf.text('성장 앨범', 105, 120, { align: 'center' });

    // 날짜 범위
    pdf.setFontSize(16);
    const startDate = document.getElementById('photobookStartDate').value;
    const endDate = document.getElementById('photobookEndDate').value;
    if (startDate && endDate) {
      pdf.text(`${startDate} ~ ${endDate}`, 105, 150, { align: 'center' });
    }

    // 가족 이름
    if (familySystem?.currentFamily) {
      pdf.setFontSize(20);
      pdf.text(familySystem.currentFamily.name, 105, 180, { align: 'center' });
    }
  }

  async addMemoryPage(pdf, memory, styles) {
    // 제목
    pdf.setTextColor(...styles.textColor);
    pdf.setFontSize(24);
    pdf.text(memory.title, 20, 30);

    // 날짜와 장소
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(memory.memory_date, 20, 40);
    if (memory.location) {
      pdf.text(memory.location, 20, 46);
    }

    // 설명
    if (memory.description) {
      pdf.setTextColor(...styles.textColor);
      pdf.setFontSize(14);
      const lines = pdf.splitTextToSize(memory.description, 170);
      pdf.text(lines, 20, 60);
    }

    // 이미지
    if (memory.media_files && memory.media_files.length > 0) {
      const imageY = memory.description ? 80 : 60;
      const image = memory.media_files[0];
      
      try {
        const imgUrl = supabase.storage
          .from('memories')
          .getPublicUrl(image.file_path).data.publicUrl;
        
        // 이미지를 base64로 변환
        const imgData = await this.getBase64FromUrl(imgUrl);
        
        // 이미지 추가 (최대 크기 제한)
        pdf.addImage(imgData, 'JPEG', 20, imageY, 170, 120);
      } catch (error) {
        console.error('이미지 로드 실패:', error);
      }
    }

    // 인물 태그
    if (memory.memory_people && memory.memory_people.length > 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(...styles.accentColor);
      const people = memory.memory_people.map(mp => mp.people.name).join(', ');
      pdf.text(`함께한 사람: ${people}`, 20, 280);
    }
  }

  async addStatsPage(pdf, styles) {
    pdf.setTextColor(...styles.textColor);
    pdf.setFontSize(28);
    pdf.text('우리 가족의 추억 통계', 105, 30, { align: 'center' });

    // 통계 계산
    const stats = this.calculateStats();

    // 통계 표시
    pdf.setFontSize(16);
    let y = 60;
    
    pdf.text(`총 추억 수: ${stats.totalMemories}개`, 30, y);
    y += 20;
    
    pdf.text(`민호의 추억: ${stats.minhoMemories}개`, 30, y);
    y += 20;
    
    pdf.text(`민아의 추억: ${stats.minaMemories}개`, 30, y);
    y += 20;
    
    pdf.text(`함께한 추억: ${stats.togetherMemories}개`, 30, y);
    y += 40;

    // 월별 차트 (간단한 막대 그래프)
    pdf.setFontSize(18);
    pdf.text('월별 추억 분포', 30, y);
    y += 20;

    this.drawSimpleBarChart(pdf, stats.monthlyData, 30, y, 150, 80);
  }

  drawSimpleBarChart(pdf, data, x, y, width, height) {
    const maxValue = Math.max(...Object.values(data));
    const barWidth = width / Object.keys(data).length;

    Object.entries(data).forEach(([month, count], index) => {
      const barHeight = (count / maxValue) * height;
      const barX = x + (index * barWidth);
      const barY = y + height - barHeight;

      // 막대
      pdf.setFillColor(255, 182, 193); // 분홍색
      pdf.rect(barX + 5, barY, barWidth - 10, barHeight, 'F');

      // 레이블
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(month, barX + barWidth/2, y + height + 10, { align: 'center' });
      pdf.text(count.toString(), barX + barWidth/2, barY - 5, { align: 'center' });
    });
  }

  calculateStats() {
    const stats = {
      totalMemories: this.memories.length,
      minhoMemories: 0,
      minaMemories: 0,
      togetherMemories: 0,
      monthlyData: {}
    };

    this.memories.forEach(memory => {
      // 인물별 카운트
      const people = memory.memory_people?.map(mp => mp.people.name) || [];
      if (people.includes('민호') && people.includes('민아')) {
        stats.togetherMemories++;
      } else if (people.includes('민호')) {
        stats.minhoMemories++;
      } else if (people.includes('민아')) {
        stats.minaMemories++;
      }

      // 월별 카운트
      const month = new Date(memory.memory_date).toLocaleDateString('ko-KR', { month: 'short' });
      stats.monthlyData[month] = (stats.monthlyData[month] || 0) + 1;
    });

    return stats;
  }

  getTemplateStyles() {
    const templates = {
      classic: {
        primaryColor: [33, 150, 243], // 파란색
        accentColor: [255, 182, 193], // 분홍색
        textColor: [33, 33, 33] // 진한 회색
      },
      modern: {
        primaryColor: [76, 175, 80], // 초록색
        accentColor: [255, 152, 0], // 주황색
        textColor: [0, 0, 0] // 검은색
      },
      minimal: {
        primaryColor: [158, 158, 158], // 회색
        accentColor: [33, 33, 33], // 진한 회색
        textColor: [33, 33, 33] // 진한 회색
      }
    };

    return templates[this.template] || templates.classic;
  }

  async getBase64FromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// 초기화
const photobookCreator = new PhotobookCreator();
```

## 3. 🤖 AI 자동 태깅 - 사진 분석 (AI Auto-tagging)

### 목표
- 업로드된 사진을 AI가 자동으로 분석하여 태그 생성
- 인물 인식, 객체 감지, 장면 분류
- 검색 및 필터링 성능 향상

### 기술 구현

#### 3.1 AI 서비스 통합

여러 옵션 중 선택:
1. **Google Cloud Vision API** (추천)
2. **AWS Rekognition**
3. **Microsoft Azure Computer Vision**
4. **Clarifai API**

이 예제에서는 Google Cloud Vision API를 사용합니다.

#### 3.2 Supabase Edge Function 설정

```typescript
// supabase/functions/analyze-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import vision from '@google-cloud/vision'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, memoryId } = await req.json()
    
    // Google Vision API 클라이언트 초기화
    const client = new vision.ImageAnnotatorClient({
      keyFilename: './google-credentials.json'
    })

    // 이미지 분석 요청
    const [result] = await client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 10 },
        { type: 'FACE_DETECTION', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
        { type: 'LANDMARK_DETECTION', maxResults: 5 },
        { type: 'TEXT_DETECTION' }
      ]
    })

    // 분석 결과 처리
    const tags = []
    
    // 레이블 감지 (일반 태그)
    if (result.labelAnnotations) {
      result.labelAnnotations.forEach(label => {
        if (label.score > 0.7) {
          tags.push({
            type: 'label',
            name: translateLabel(label.description),
            confidence: label.score
          })
        }
      })
    }

    // 얼굴 감지 (인물 수)
    if (result.faceAnnotations) {
      const faceCount = result.faceAnnotations.length
      if (faceCount > 0) {
        tags.push({
          type: 'face_count',
          name: `${faceCount}명`,
          confidence: 1
        })

        // 감정 분석
        result.faceAnnotations.forEach((face, index) => {
          if (face.joyLikelihood === 'VERY_LIKELY' || face.joyLikelihood === 'LIKELY') {
            tags.push({
              type: 'emotion',
              name: '행복한 순간',
              confidence: 0.9
            })
          }
        })
      }
    }

    // 객체 감지
    if (result.localizedObjectAnnotations) {
      result.localizedObjectAnnotations.forEach(object => {
        if (object.score > 0.7) {
          tags.push({
            type: 'object',
            name: translateObject(object.name),
            confidence: object.score
          })
        }
      })
    }

    // 장소 감지
    if (result.landmarkAnnotations) {
      result.landmarkAnnotations.forEach(landmark => {
        tags.push({
          type: 'landmark',
          name: landmark.description,
          confidence: landmark.score
        })
      })
    }

    // Supabase에 태그 저장
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 기존 AI 태그 삭제
    await supabase
      .from('memory_tags')
      .delete()
      .eq('memory_id', memoryId)
      .eq('is_ai_generated', true)

    // 새 태그 추가
    for (const tag of tags) {
      // 태그가 없으면 생성
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tag.name)
        .single()

      let tagId = existingTag?.id

      if (!tagId) {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            name: tag.name,
            color: getTagColor(tag.type),
            is_ai_generated: true
          })
          .select('id')
          .single()
        
        tagId = newTag.id
      }

      // 추억에 태그 연결
      await supabase
        .from('memory_tags')
        .insert({
          memory_id: memoryId,
          tag_id: tagId,
          confidence: tag.confidence,
          is_ai_generated: true
        })
    }

    return new Response(
      JSON.stringify({ success: true, tags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// 한글 번역 함수
function translateLabel(label) {
  const translations = {
    'child': '어린이',
    'baby': '아기',
    'toddler': '유아',
    'smile': '미소',
    'outdoor': '야외',
    'indoor': '실내',
    'playground': '놀이터',
    'birthday': '생일',
    'family': '가족',
    'toy': '장난감',
    'food': '음식',
    'nature': '자연',
    'beach': '해변',
    'park': '공원',
    'home': '집',
    'school': '학교'
  }
  return translations[label.toLowerCase()] || label
}

function translateObject(object) {
  const translations = {
    'person': '사람',
    'toy': '장난감',
    'book': '책',
    'ball': '공',
    'bicycle': '자전거',
    'car': '자동차',
    'dog': '강아지',
    'cat': '고양이'
  }
  return translations[object.toLowerCase()] || object
}

function getTagColor(type) {
  const colors = {
    'label': '#3B82F6', // 파란색
    'face_count': '#EF4444', // 빨간색
    'emotion': '#F59E0B', // 주황색
    'object': '#10B981', // 초록색
    'landmark': '#8B5CF6' // 보라색
  }
  return colors[type] || '#6B7280'
}
```

#### 3.3 프론트엔드 통합

```javascript
// ai-tagging.js
class AITagging {
  constructor() {
    this.isProcessing = false;
  }

  async analyzeImage(memoryId, imageUrl) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.showProcessingUI(memoryId);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ memoryId, imageUrl })
      });

      const result = await response.json();
      
      if (result.success) {
        this.displayTags(memoryId, result.tags);
        this.showSuccessMessage('AI 태그 생성 완료!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
      this.showErrorMessage('AI 분석 중 오류가 발생했습니다.');
    } finally {
      this.isProcessing = false;
      this.hideProcessingUI(memoryId);
    }
  }

  async batchAnalyze() {
    const { data: memories } = await supabase
      .from('memories')
      .select(`
        id,
        media_files(file_path)
      `)
      .is('ai_analyzed', false)
      .limit(10);

    for (const memory of memories) {
      if (memory.media_files && memory.media_files.length > 0) {
        const imageUrl = supabase.storage
          .from('memories')
          .getPublicUrl(memory.media_files[0].file_path).data.publicUrl;
        
        await this.analyzeImage(memory.id, imageUrl);
        
        // 분석 완료 표시
        await supabase
          .from('memories')
          .update({ ai_analyzed: true })
          .eq('id', memory.id);
        
        // API 제한을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  showProcessingUI(memoryId) {
    const memoryCard = document.querySelector(`[data-memory-id="${memoryId}"]`);
    if (memoryCard) {
      const overlay = document.createElement('div');
      overlay.className = 'ai-processing-overlay';
      overlay.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
          <div class="loader"></div>
          <p class="text-white mt-4">AI가 사진을 분석중입니다...</p>
        </div>
      `;
      memoryCard.appendChild(overlay);
    }
  }

  hideProcessingUI(memoryId) {
    const memoryCard = document.querySelector(`[data-memory-id="${memoryId}"]`);
    const overlay = memoryCard?.querySelector('.ai-processing-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  displayTags(memoryId, tags) {
    const memoryCard = document.querySelector(`[data-memory-id="${memoryId}"]`);
    const tagContainer = memoryCard?.querySelector('.tag-container');
    
    if (tagContainer) {
      const aiTags = tags.map(tag => `
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <i class="fas fa-robot mr-1"></i>
          ${tag.name}
        </span>
      `).join('');
      
      tagContainer.innerHTML += aiTags;
    }
  }

  // UI에 AI 태그 토글 버튼 추가
  addAIToggleButton() {
    const filterSection = document.querySelector('.filter-section');
    const aiToggle = document.createElement('div');
    aiToggle.className = 'flex items-center space-x-2 mt-4';
    aiToggle.innerHTML = `
      <input type="checkbox" id="showAITags" checked class="rounded">
      <label for="showAITags" class="text-sm font-medium">
        AI 자동 태그 표시
      </label>
      <button onclick="aiTagging.batchAnalyze()" 
              class="ml-auto text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">
        모든 사진 AI 분석
      </button>
    `;
    filterSection.appendChild(aiToggle);
  }
}

// 초기화
const aiTagging = new AITagging();

// 이미지 업로드 시 자동 분석
document.addEventListener('memoryCreated', async (event) => {
  const { memoryId, imageUrl } = event.detail;
  if (imageUrl) {
    await aiTagging.analyzeImage(memoryId, imageUrl);
  }
});
```

#### 3.4 CSS 스타일 추가

```css
/* AI 태깅 관련 스타일 */
.ai-processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 0.75rem;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #8B5CF6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* AI 태그 스타일 */
.tag-container .fa-robot {
  font-size: 0.7rem;
}

/* AI 태그 필터 */
.ai-tag-filter {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  color: white;
  border: none;
}

.ai-tag-filter:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
```

## 구현 일정

### Phase 1: 가족 계정 시스템 (1주)
- [ ] Supabase 테이블 및 RLS 설정
- [ ] 가족 생성/초대 UI 구현
- [ ] 권한 관리 로직 구현
- [ ] 테스트 및 디버깅

### Phase 2: PDF 내보내기 (1주)
- [ ] jsPDF 라이브러리 통합
- [ ] 포토북 템플릿 디자인
- [ ] PDF 생성 로직 구현
- [ ] 다양한 레이아웃 옵션 추가

### Phase 3: AI 자동 태깅 (2주)
- [ ] Google Cloud Vision API 설정
- [ ] Supabase Edge Function 구현
- [ ] 프론트엔드 통합
- [ ] 배치 처리 및 최적화

## 기술적 고려사항

1. **성능 최적화**
   - 이미지 리사이징 후 AI 분석
   - 배치 처리로 API 호출 최소화
   - 결과 캐싱

2. **비용 관리**
   - AI API 사용량 모니터링
   - 월별 한도 설정
   - 무료 티어 활용

3. **사용자 경험**
   - 비동기 처리로 UI 블로킹 방지
   - 진행 상황 표시
   - 오류 처리 및 재시도

## 마무리

이 세 가지 기능을 통해 민호민아닷컴은 단순한 사진 저장소를 넘어 가족의 추억을 더욱 특별하게 만드는 플랫폼으로 진화할 것입니다.
