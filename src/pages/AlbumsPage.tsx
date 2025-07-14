import React, { useState } from 'react';
import { FiPlus, FiFolder, FiLock, FiGlobe } from 'react-icons/fi';

const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">앨범</h1>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FiPlus className="w-5 h-5" />
          <span>새 앨범</span>
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-20">
          <FiFolder className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            아직 앨범이 없습니다
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            첫 번째 앨범을 만들어보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                {album.coverImage ? (
                  <img
                    src={album.coverImage}
                    alt={album.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiFolder className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {album.name}
                  </h3>
                  {album.isPublic ? (
                    <FiGlobe className="w-4 h-4 text-gray-500" />
                  ) : (
                    <FiLock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {album.memories?.length || 0}개의 추억
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlbumsPage;