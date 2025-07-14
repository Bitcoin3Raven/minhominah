import { useState } from 'react';
import { FiTrash2, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const TrashPage = () => {
  const { user } = useAuth();
  const [trashedItems, setTrashedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    const allIds = trashedItems.map(item => item.id);
    setSelectedItems(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const restoreSelected = async () => {
    // 복원 로직 구현
    console.log('Restoring items:', Array.from(selectedItems));
  };

  const deleteSelectedPermanently = async () => {
    if (confirm('선택한 항목을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // 영구 삭제 로직 구현
      console.log('Permanently deleting items:', Array.from(selectedItems));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">휴지통</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <FiAlertCircle className="w-4 h-4" />
          <span>휴지통의 항목은 30일 후 자동으로 영구 삭제됩니다.</span>
        </div>
      </div>

      {trashedItems.length > 0 && (
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              모두 선택
            </button>
            <button
              onClick={deselectAll}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              선택 해제
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedItems.size}개 선택됨
            </span>
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={restoreSelected}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>복원</span>
              </button>
              <button
                onClick={deleteSelectedPermanently}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                <span>영구 삭제</span>
              </button>
            </div>
          )}
        </div>
      )}

      {trashedItems.length === 0 ? (
        <div className="text-center py-20">
          <FiTrash2 className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            휴지통이 비어있습니다
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            삭제된 항목이 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trashedItems.map((item) => (
            <div
              key={item.id}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
              </div>
              
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="object-cover w-full h-full opacity-75"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiTrash2 className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  삭제일: {new Date(item.deletedAt).toLocaleDateString('ko-KR')}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {Math.ceil((new Date(item.permanentDeleteAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 후 영구 삭제
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashPage;