import { useState, useEffect } from 'react';
import { FiCamera, FiUsers, FiCalendar, FiHeart, FiTag, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Statistics {
  totalMemories: number;
  totalPhotos: number;
  totalVideos: number;
  totalMembers: number;
  mostActiveMonth: string;
  monthlyData: { month: string; count: number }[];
  personData: { person: string; count: number }[];
  tagData: { tag: string; count: number }[];
}

const StatisticsPage = () => {
  const [stats, setStats] = useState<Statistics>({
    totalMemories: 0,
    totalPhotos: 0,
    totalVideos: 0,
    totalMembers: 2, // 민호, 민아
    mostActiveMonth: '아직 없음',
    monthlyData: [],
    personData: [],
    tagData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // 전체 추억 수
      const { count: memoriesCount } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });

      // 전체 미디어 파일 수
      const { data: mediaFiles } = await supabase
        .from('media_files')
        .select('type');

      const totalPhotos = mediaFiles?.filter(m => m.type === 'image').length || 0;
      const totalVideos = mediaFiles?.filter(m => m.type === 'video').length || 0;

      // 월별 통계
      const { data: memories } = await supabase
        .from('memories')
        .select('memory_date, person_tags, tags');

      // 월별 데이터 처리
      const monthlyMap = new Map<string, number>();
      memories?.forEach(memory => {
        const date = new Date(memory.memory_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
      });

      const monthlyData = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12) // 최근 12개월
        .map(([month, count]) => ({ month, count }));

      // 가장 활발한 달
      const mostActive = monthlyData.reduce((max, curr) => 
        curr.count > max.count ? curr : max, 
        { month: '', count: 0 }
      );

      // 인물별 통계
      const personMap = new Map<string, number>();
      memories?.forEach(memory => {
        memory.person_tags?.forEach((person: string) => {
          personMap.set(person, (personMap.get(person) || 0) + 1);
        });
      });

      const personData = Array.from(personMap.entries())
        .map(([person, count]) => ({ person, count }))
        .sort((a, b) => b.count - a.count);

      // 태그별 통계
      const tagMap = new Map<string, number>();
      memories?.forEach(memory => {
        memory.tags?.forEach((tag: string) => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      });

      const tagData = Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // 상위 20개

      setStats({
        totalMemories: memoriesCount || 0,
        totalPhotos,
        totalVideos,
        totalMembers: 2,
        mostActiveMonth: mostActive.month ? 
          new Date(mostActive.month + '-01').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : 
          '아직 없음',
        monthlyData,
        personData,
        tagData
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      }
    }
  };

  // 월별 차트 데이터
  const monthlyChartData = {
    labels: stats.monthlyData.map(d => {
      const date = new Date(d.month + '-01');
      return date.toLocaleDateString('ko-KR', { month: 'short' });
    }),
    datasets: [{
      label: '추억 수',
      data: stats.monthlyData.map(d => d.count),
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.3
    }]
  };

  // 인물별 차트 데이터
  const personChartData = {
    labels: stats.personData.map(d => d.person),
    datasets: [{
      data: stats.personData.map(d => d.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)'
      ],
      borderWidth: 1
    }]
  };

  const StatCard = ({ icon: Icon, title, value, color, delay = 0 }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${color} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 배경 그라데이션 */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-300"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)
            `
          }}
        />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        </div>
      </div>

      <div className="space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          통계 대시보드
        </motion.h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FiHeart}
            title="전체 추억"
            value={stats.totalMemories}
            color="bg-gradient-to-r from-pink-500 to-rose-500"
            delay={0.1}
          />
          <StatCard
            icon={FiCamera}
            title="사진"
            value={stats.totalPhotos}
            color="bg-gradient-to-r from-blue-500 to-cyan-500"
            delay={0.2}
          />
          <StatCard
            icon={FiTrendingUp}
            title="동영상"
            value={stats.totalVideos}
            color="bg-gradient-to-r from-green-500 to-emerald-500"
            delay={0.3}
          />
          <StatCard
            icon={FiCalendar}
            title="가장 활발한 달"
            value={stats.mostActiveMonth}
            color="bg-gradient-to-r from-purple-500 to-indigo-500"
            delay={0.4}
          />
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              월별 추억 통계
            </h2>
            {stats.monthlyData.length > 0 ? (
              <div className="h-64">
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                아직 데이터가 없습니다
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              인물별 통계
            </h2>
            {stats.personData.length > 0 ? (
              <div className="h-64">
                <Doughnut data={personChartData} options={{ ...chartOptions, maintainAspectRatio: true }} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                아직 데이터가 없습니다
              </div>
            )}
          </motion.div>
        </div>

        {/* 태그 클라우드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FiTag className="mr-2" />
            태그 클라우드
          </h2>
          {stats.tagData.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.tagData.map((tag, index) => {
                const size = Math.max(0.8, Math.min(2, tag.count / 10));
                return (
                  <motion.span
                    key={tag.tag}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                    className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-700 dark:text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-200 cursor-pointer"
                    style={{ fontSize: `${size}rem` }}
                  >
                    {tag.tag} ({tag.count})
                  </motion.span>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
              아직 태그가 없습니다
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StatisticsPage;