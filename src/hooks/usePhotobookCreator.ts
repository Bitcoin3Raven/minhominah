import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Memory } from '../types/memory';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PhotobookSettings {
  template: string;
  startDate: string;
  endDate: string;
  includeTitle: boolean;
  includeStats: boolean;
  includeIndex: boolean;
  includeTimeline: boolean;
  personFilter: string;
}

interface MediaFile {
  id: string;
  file_path: string;
  file_type: string;
}

interface Person {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface ExtendedMemory extends Memory {
  media_files?: MediaFile[];
  memory_people?: { person_id: string; people: Person }[];
  memory_tags?: { tag_id: string; tags: Tag }[];
}

export const usePhotobookCreator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [memories, setMemories] = useState<ExtendedMemory[]>([]);

  // Fetch memories with relations
  const fetchMemories = async (settings: PhotobookSettings) => {
    let query = supabase
      .from('memories')
      .select(`
        *,
        media_files(*),
        memory_people(
          person_id,
          people(*)
        ),
        memory_tags(
          tag_id,
          tags(*)
        )
      `);

    // Date filter
    if (settings.startDate) {
      query = query.gte('memory_date', settings.startDate);
    }
    if (settings.endDate) {
      query = query.lte('memory_date', settings.endDate);
    }

    const { data, error } = await query.order('memory_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching memories:', error);
      return [];
    }

    // Apply person filter
    let filtered = data || [];
    
    switch (settings.personFilter) {
      case 'minho':
        filtered = filtered.filter(m => {
          const people = m.memory_people || [];
          const hasMinHo = people.some((mp: any) => mp.people && mp.people.name === '민호');
          const hasMinA = people.some((mp: any) => mp.people && mp.people.name === '민아');
          return hasMinHo && !hasMinA;
        });
        break;
      case 'mina':
        filtered = filtered.filter(m => {
          const people = m.memory_people || [];
          const hasMinHo = people.some((mp: any) => mp.people && mp.people.name === '민호');
          const hasMinA = people.some((mp: any) => mp.people && mp.people.name === '민아');
          return hasMinA && !hasMinHo;
        });
        break;
      case 'both':
        filtered = filtered.filter(m => {
          const people = m.memory_people || [];
          const hasMinHo = people.some((mp: any) => mp.people && mp.people.name === '민호');
          const hasMinA = people.some((mp: any) => mp.people && mp.people.name === '민아');
          return hasMinHo && hasMinA;
        });
        break;
    }

    return filtered;
  };

  // Get media URL from Supabase storage
  const getMediaUrl = (mediaFile: MediaFile) => {
    if (!mediaFile || !mediaFile.file_path) return '';
    
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(mediaFile.file_path);
    
    return data.publicUrl;
  };

  // Calculate statistics
  const calculateStats = (memories: ExtendedMemory[]) => {
    const stats = {
      totalMemories: memories.length,
      minhoCount: 0,
      minaCount: 0,
      togetherCount: 0,
      tagCounts: {} as { [key: string]: number },
      topTag: null as string | null
    };

    memories.forEach(memory => {
      const people = memory.memory_people || [];
      const hasMinho = people.some(mp => mp.people && mp.people.name === '민호');
      const hasMina = people.some(mp => mp.people && mp.people.name === '민아');
      
      if (hasMinho) stats.minhoCount++;
      if (hasMina) stats.minaCount++;
      if (hasMinho && hasMina) stats.togetherCount++;
      
      if (memory.memory_tags) {
        memory.memory_tags.forEach(mt => {
          if (mt.tags) {
            const tagName = mt.tags.name;
            stats.tagCounts[tagName] = (stats.tagCounts[tagName] || 0) + 1;
          }
        });
      }
    });

    // Find most used tag
    if (Object.keys(stats.tagCounts).length > 0) {
      stats.topTag = Object.entries(stats.tagCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
    }

    return stats;
  };

  // Group memories by month
  const groupByMonth = (memories: ExtendedMemory[]) => {
    const groups: { [key: string]: ExtendedMemory[] } = {};
    
    memories.forEach(memory => {
      const date = new Date(memory.memory_date);
      const monthKey = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(memory);
    });
    
    return groups;
  };

  // Get template styles
  const getTemplateStyles = (template: string) => {
    const styles = {
      classic: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        pageBackground: '#f8f9fa',
        titleColor: '#2d3748',
        subtitleColor: '#718096',
        textColor: '#4a5568',
        accentColor: '#667eea',
        tagBackground: '#e9d8fd',
        tagColor: '#553c9a'
      },
      modern: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        pageBackground: '#ffffff',
        titleColor: '#1a202c',
        subtitleColor: '#e53e3e',
        textColor: '#2d3748',
        accentColor: '#f5576c',
        tagBackground: '#fed7d7',
        tagColor: '#c53030'
      },
      minimal: {
        background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
        pageBackground: '#ffffff',
        titleColor: '#000000',
        subtitleColor: '#666666',
        textColor: '#333333',
        accentColor: '#000000',
        tagBackground: '#f0f0f0',
        tagColor: '#666666'
      }
    };
    
    return styles[template as keyof typeof styles] || styles.classic;
  };

  // Format date in Korean
  const formatDateKorean = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  // Preview PDF
  const previewPDF = useCallback(async (settings: PhotobookSettings) => {
    const fetchedMemories = await fetchMemories(settings);
    setMemories(fetchedMemories);
    
    if (fetchedMemories.length === 0) {
      alert('선택한 기간에 추억이 없습니다.');
      return;
    }

    const template = getTemplateStyles(settings.template);
    const stats = calculateStats(fetchedMemories);
    const monthGroups = groupByMonth(fetchedMemories);
    
    // Render preview in DOM
    const previewContainer = document.getElementById('previewPages');
    if (previewContainer) {
      previewContainer.innerHTML = '';
      
      // Title page
      if (settings.includeTitle) {
        const titlePage = document.createElement('div');
        titlePage.className = 'preview-page';
        titlePage.style.cssText = `
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          aspect-ratio: 210 / 297;
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Noto Sans KR', sans-serif;
        `;
        titlePage.innerHTML = `
          <div class="h-full flex flex-col justify-center items-center text-center p-8" style="background: ${template.background}">
            <h1 class="text-3xl font-bold mb-4 text-white">민호민아 성장앨범</h1>
            <p class="text-lg mb-8 text-white opacity-90">소중한 추억들</p>
            <div class="text-sm text-white opacity-80">
              <p>${settings.startDate} ~ ${settings.endDate}</p>
              <p class="mt-2">총 ${fetchedMemories.length}개의 추억</p>
            </div>
            <div class="mt-8">
              <i class="fas fa-heart text-4xl text-white"></i>
            </div>
          </div>
        `;
        previewContainer.appendChild(titlePage);
      }

      // Stats page
      if (settings.includeStats) {
        const statsPage = document.createElement('div');
        statsPage.className = 'preview-page';
        statsPage.style.cssText = `
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          aspect-ratio: 210 / 297;
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Noto Sans KR', sans-serif;
        `;
        statsPage.innerHTML = `
          <div class="h-full p-8" style="background: ${template.pageBackground}">
            <h2 class="text-2xl font-bold mb-6" style="color: ${template.titleColor}">추억 통계</h2>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span style="color: ${template.textColor}">총 추억 수:</span>
                <span class="font-bold" style="color: ${template.accentColor}">${stats.totalMemories}개</span>
              </div>
              <div class="flex justify-between">
                <span style="color: ${template.textColor}">민호 등장:</span>
                <span class="font-bold" style="color: ${template.accentColor}">${stats.minhoCount}회</span>
              </div>
              <div class="flex justify-between">
                <span style="color: ${template.textColor}">민아 등장:</span>
                <span class="font-bold" style="color: ${template.accentColor}">${stats.minaCount}회</span>
              </div>
              <div class="flex justify-between">
                <span style="color: ${template.textColor}">함께 등장:</span>
                <span class="font-bold" style="color: ${template.accentColor}">${stats.togetherCount}회</span>
              </div>
              ${stats.topTag ? `
              <div class="flex justify-between">
                <span style="color: ${template.textColor}">가장 많은 태그:</span>
                <span class="font-bold" style="color: ${template.accentColor}">${stats.topTag}</span>
              </div>
              ` : ''}
            </div>
          </div>
        `;
        previewContainer.appendChild(statsPage);
      }

      // Memory pages preview (first 4)
      const previewMemories = fetchedMemories.slice(0, 4);
      previewMemories.forEach(memory => {
        const memoryPage = document.createElement('div');
        memoryPage.className = 'preview-page';
        memoryPage.style.cssText = `
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          aspect-ratio: 210 / 297;
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Noto Sans KR', sans-serif;
        `;
        memoryPage.innerHTML = `
          <div class="h-full p-6" style="background: ${template.pageBackground}">
            <div class="mb-4">
              <h3 class="text-xl font-bold" style="color: ${template.titleColor}">${memory.title}</h3>
              <p class="text-sm" style="color: ${template.subtitleColor}">${formatDateKorean(memory.memory_date)}</p>
            </div>
            ${memory.media_files && memory.media_files.length > 0 ? `
              <div class="mb-4">
                <img src="${getMediaUrl(memory.media_files[0])}" alt="${memory.title}" 
                     class="w-full h-48 object-cover rounded-lg">
              </div>
            ` : ''}
            <p class="text-sm leading-relaxed" style="color: ${template.textColor}">${memory.description || ''}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              ${(memory.memory_people || []).map(mp => mp.people ? `
                <span class="px-2 py-1 text-xs rounded-full" 
                      style="background: ${template.tagBackground}; color: ${template.tagColor}">
                  ${mp.people.name}
                </span>
              ` : '').join('')}
              ${(memory.memory_tags || []).map(mt => mt.tags ? `
                <span class="px-2 py-1 text-xs rounded-full" 
                      style="background: ${template.tagBackground}; color: ${template.tagColor}">
                  #${mt.tags.name}
                </span>
              ` : '').join('')}
            </div>
          </div>
        `;
        previewContainer.appendChild(memoryPage);
      });

      // More indicator
      if (fetchedMemories.length > 4) {
        const moreDiv = document.createElement('div');
        moreDiv.className = 'col-span-full text-center py-8 text-gray-500';
        moreDiv.innerHTML = `
          <i class="fas fa-ellipsis-h text-2xl"></i>
          <p class="mt-2">그리고 ${fetchedMemories.length - 4}개의 추억이 더 있습니다</p>
        `;
        previewContainer.appendChild(moreDiv);
      }
    }
  }, []);

  // Generate PDF
  const generatePDF = useCallback(async (settings: PhotobookSettings) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const fetchedMemories = await fetchMemories(settings);
      
      if (fetchedMemories.length === 0) {
        alert('선택한 기간에 추억이 없습니다.');
        setIsGenerating(false);
        return;
      }

      const template = getTemplateStyles(settings.template);
      const stats = calculateStats(fetchedMemories);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let currentPage = 0;
      const totalPages = fetchedMemories.length + 
                        (settings.includeTitle ? 1 : 0) + 
                        (settings.includeStats ? 1 : 0) + 
                        (settings.includeIndex ? 1 : 0);

      const updateProgress = (page: number) => {
        setProgress(Math.round((page / totalPages) * 100));
      };

      // Title page
      if (settings.includeTitle) {
        updateProgress(currentPage++);
        
        // Use simple text for now (Korean font issues)
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 0, 210, 297, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(36);
        pdf.text('MinhoMina Growth Album', 105, 100, { align: 'center' });
        
        pdf.setFontSize(20);
        pdf.text('Precious Memories', 105, 120, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.text(`${settings.startDate} ~ ${settings.endDate}`, 105, 150, { align: 'center' });
        pdf.text(`Total ${fetchedMemories.length} memories`, 105, 160, { align: 'center' });
        
        if (currentPage < totalPages) pdf.addPage();
      }

      // Stats page
      if (settings.includeStats) {
        updateProgress(currentPage++);
        
        pdf.setTextColor(45, 55, 72);
        pdf.setFontSize(24);
        pdf.text('Memory Statistics', 20, 30);
        
        pdf.setFontSize(12);
        pdf.setTextColor(74, 85, 104);
        
        let yPos = 60;
        pdf.text(`Total memories: ${stats.totalMemories}`, 20, yPos);
        yPos += 15;
        pdf.text(`Minho appears: ${stats.minhoCount} times`, 20, yPos);
        yPos += 15;
        pdf.text(`Mina appears: ${stats.minaCount} times`, 20, yPos);
        yPos += 15;
        pdf.text(`Together: ${stats.togetherCount} times`, 20, yPos);
        
        if (currentPage < totalPages) pdf.addPage();
      }

      // Memory pages
      for (let i = 0; i < fetchedMemories.length; i++) {
        updateProgress(currentPage++);
        
        const memory = fetchedMemories[i];
        
        pdf.setTextColor(45, 55, 72);
        pdf.setFontSize(18);
        pdf.text(memory.title, 20, 30);
        
        pdf.setFontSize(12);
        pdf.setTextColor(113, 128, 150);
        pdf.text(new Date(memory.memory_date).toLocaleDateString('en-US'), 20, 40);
        
        let yPos = 50;
        
        // Description
        if (memory.description) {
          pdf.setFontSize(11);
          pdf.setTextColor(74, 85, 104);
          const lines = pdf.splitTextToSize(memory.description, 170);
          pdf.text(lines, 20, yPos);
          yPos += lines.length * 5 + 10;
        }
        
        // Tags
        const peopleNames = (memory.memory_people || [])
          .map(mp => mp.people ? mp.people.name : '')
          .filter(n => n);
        const tagNames = (memory.memory_tags || [])
          .map(mt => mt.tags ? `#${mt.tags.name}` : '')
          .filter(t => t);
        
        if (peopleNames.length > 0 || tagNames.length > 0) {
          pdf.setFontSize(10);
          const tags = [...peopleNames, ...tagNames];
          pdf.text(tags.join(' · '), 20, yPos);
        }
        
        if (currentPage < totalPages) {
          pdf.addPage();
        }
      }

      // Save PDF
      const filename = `민호민아_포토북_${settings.startDate}_${settings.endDate}.pdf`;
      pdf.save(filename);

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        alert('포토북이 생성되었습니다!');
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGenerating(false);
      setProgress(0);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  }, []);

  return {
    previewPDF,
    generatePDF,
    isGenerating,
    progress,
    memories
  };
};
