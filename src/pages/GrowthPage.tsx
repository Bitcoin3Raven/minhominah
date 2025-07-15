import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FiTarget, FiCalendar, FiTrendingUp, FiPlus, FiTrash2, FiUser, FiActivity } from 'react-icons/fi';
import { useLegacyStyles } from '../hooks/useLegacyStyles';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Person {
  id: string;
  name: string;
  birth_date: string | null;
  avatar_url: string | null;
}

interface GrowthRecord {
  id: string;
  person_id: string;
  record_date: string;
  height_cm: number;
  weight_kg: number;
  notes: string | null;
  created_at: string;
}

const GrowthPage = () => {
  const { user } = useAuth();
  const legacyStyles = useLegacyStyles();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    person_id: '',
    record_date: new Date().toISOString().split('T')[0],
    height_cm: '',
    weight_kg: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  // 인물 목록 가져오기
  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Person[];
    },
  });

  // 성장 기록 가져오기
  const { data: growthRecords = [] } = useQuery({
    queryKey: ['growth-records', selectedPerson],
    queryFn: async () => {
      if (!selectedPerson) return [];
      
      const { data, error } = await supabase
        .from('growth_records')
        .select('*')
        .eq('person_id', selectedPerson)
        .order('record_date', { ascending: true });
      
      if (error) throw error;
      return data as GrowthRecord[];
    },
    enabled: !!selectedPerson,
  });

  // 첫 번째 인물 자동 선택
  useEffect(() => {
    if (people.length > 0 && !selectedPerson) {
      setSelectedPerson(people[0].id);
    }
  }, [people, selectedPerson]);

  // 기록 추가
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('growth_records')
        .insert({
          person_id: data.person_id,
          record_date: data.record_date,
          height_cm: parseFloat(data.height_cm),
          weight_kg: parseFloat(data.weight_kg),
          notes: data.notes || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-records'] });
      setShowAddModal(false);
      setFormData({
        person_id: '',
        record_date: new Date().toISOString().split('T')[0],
        height_cm: '',
        weight_kg: '',
        notes: ''
      });
      alert('성장 기록이 추가되었습니다!');
    },
  });

  // 기록 삭제
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('growth_records')
        .delete()
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-records'] });
      alert('기록이 삭제되었습니다.');
    },
  });

  // 나이 계산
  const calculateAge = (birthDate: string | null, targetDate: string) => {
    if (!birthDate) return '나이 정보 없음';
    
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
  };

  // 차트 데이터
  const chartData = {
    labels: growthRecords.map(record => {
      const date = new Date(record.record_date);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: '키 (cm)',
        data: growthRecords.map(record => record.height_cm),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: '몸무게 (kg)',
        data: growthRecords.map(record => record.weight_kg),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '키 (cm)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: '몸무게 (kg)'
        }
      },
    },
  };

  // 통계 계산
  const getStatistics = () => {
    if (growthRecords.length === 0) {
      return {
        current: { height: '-', weight: '-', age: '-' },
        growthRate: { height: '-', weight: '-' },
        lastUpdate: '-'
      };
    }

    const currentPerson = people.find(p => p.id === selectedPerson);
    const latestRecord = growthRecords[growthRecords.length - 1];
    const currentAge = calculateAge(currentPerson?.birth_date || null, latestRecord.record_date);

    // 최근 3개월 성장률
    let heightGrowth = '-';
    let weightGrowth = '-';
    
    if (growthRecords.length >= 2) {
      const threeMonthsAgo = new Date(latestRecord.record_date);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const recentRecords = growthRecords.filter(r => 
        new Date(r.record_date) >= threeMonthsAgo
      );
      
      if (recentRecords.length >= 2) {
        const firstRecent = recentRecords[0];
        const lastRecent = recentRecords[recentRecords.length - 1];
        
        heightGrowth = `+${(lastRecent.height_cm - firstRecent.height_cm).toFixed(1)}cm`;
        weightGrowth = `+${(lastRecent.weight_kg - firstRecent.weight_kg).toFixed(1)}kg`;
      }
    }

    // 마지막 기록 날짜
    const lastDate = new Date(latestRecord.record_date);
    const daysSinceUpdate = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      current: {
        height: `${latestRecord.height_cm}cm`,
        weight: `${latestRecord.weight_kg}kg`,
        age: currentAge
      },
      growthRate: {
        height: heightGrowth,
        weight: weightGrowth
      },
      lastUpdate: `${daysSinceUpdate}일 전`
    };
  };

  const stats = getStatistics();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden py-12 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-blue-400/20"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold text-center bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            성장 기록
          </h1>
          <p className="text-center text-lg text-gray-600 mt-4">
            민호와 민아의 성장 과정을 그래프로 확인해보세요
          </p>
        </div>
      </section>

      {/* 인물 선택 */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-full bg-white shadow-lg p-1">
          {people.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelectedPerson(person.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                selectedPerson === person.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiUser className="inline-block mr-2" />
              {person.name}
            </button>
          ))}
        </div>
      </div>

      {/* 기록 추가 버튼 */}
      {user && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              setFormData({ ...formData, person_id: selectedPerson || '' });
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <FiPlus className="inline-block mr-2" />
            기록 추가
          </button>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
        >
          <h4 className="text-lg font-semibold mb-2">현재 상태</h4>
          <p className="text-sm opacity-90">{stats.current.age}</p>
          <p className="text-xl font-bold">키: {stats.current.height}</p>
          <p className="text-xl font-bold">몸무게: {stats.current.weight}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
        >
          <h4 className="text-lg font-semibold mb-2">최근 성장률</h4>
          <p className="text-sm opacity-90">최근 3개월</p>
          <p className="text-lg font-bold">키: {stats.growthRate.height}</p>
          <p className="text-lg font-bold">몸무게: {stats.growthRate.weight}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white"
        >
          <h4 className="text-lg font-semibold mb-2">마지막 기록</h4>
          <p className="text-2xl font-bold">{stats.lastUpdate}</p>
        </motion.div>
      </div>

      {/* 차트 */}
      {growthRecords.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${legacyStyles.card} mb-8`}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <FiTrendingUp className="inline-block mr-2 text-blue-500" />
            성장 차트
          </h3>
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div>
      )}

      {/* 기록 테이블 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={legacyStyles.card}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <FiCalendar className="inline-block mr-2 text-purple-500" />
          성장 기록 내역
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-gray-700">날짜</th>
                <th className="text-left py-3 px-4 text-gray-700">나이</th>
                <th className="text-left py-3 px-4 text-gray-700">키 (cm)</th>
                <th className="text-left py-3 px-4 text-gray-700">몸무게 (kg)</th>
                <th className="text-left py-3 px-4 text-gray-700">메모</th>
                {user && <th className="text-center py-3 px-4 text-gray-700">작업</th>}
              </tr>
            </thead>
            <tbody>
              {growthRecords.length === 0 ? (
                <tr>
                  <td colSpan={user ? 6 : 5} className="text-center py-8 text-gray-500">
                    아직 성장 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                [...growthRecords].reverse().map((record) => {
                  const person = people.find(p => p.id === record.person_id);
                  const age = calculateAge(person?.birth_date || null, record.record_date);
                  const date = new Date(record.record_date);
                  
                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">{date.toLocaleDateString()}</td>
                      <td className="py-3 px-4">{age}</td>
                      <td className="py-3 px-4">{record.height_cm} cm</td>
                      <td className="py-3 px-4">{record.weight_kg} kg</td>
                      <td className="py-3 px-4">{record.notes || '-'}</td>
                      {user && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('이 기록을 삭제하시겠습니까?')) {
                                deleteMutation.mutate(record.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 기록 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">성장 기록 추가</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">인물</label>
                <select
                  value={formData.person_id}
                  onChange={(e) => setFormData({ ...formData, person_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">선택하세요</option>
                  {people.map(person => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={formData.record_date}
                  onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">키 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">몸무게 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">메모 (선택)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {addMutation.isPending ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all duration-200"
                >
                  취소
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GrowthPage;