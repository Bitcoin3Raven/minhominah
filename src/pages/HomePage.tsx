import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-16"
      >
        <h1 className="text-5xl font-bold mb-6">
          민호와 민아의 성장 앨범
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          소중한 순간들을 기록하고 공유하는 우리 가족의 디지털 보물상자
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/memories"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            추억 둘러보기
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
          >
            추억 추가하기
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card rounded-lg p-6 shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">민호</h2>
          <p className="text-muted-foreground">
            우리 집의 든든한 첫째, 민호의 성장 이야기
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-lg p-6 shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">민아</h2>
          <p className="text-muted-foreground">
            사랑스러운 막내, 민아의 귀여운 일상
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
