import React from 'react';
import { Recommendation } from '@/types';
import { BookOpen, Lightbulb, Zap } from 'lucide-react';

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  loading?: boolean;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  loading = false,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'resource':
        return <BookOpen size={20} className="text-primary" />;
      case 'strategy':
        return <Lightbulb size={20} className="text-accent" />;
      case 'exercise':
        return <Zap size={20} className="text-danger" />;
      default:
        return <BookOpen size={20} className="text-primary" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-secondary mb-4">Personalized Recommendations</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading recommendations...</div>
      ) : !recommendations.length ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recommendations yet. Start chatting with Busla!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.slice(0, 5).map((rec) => (
            <div key={rec.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-1">{getIcon(rec.recommendation_type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-secondary">{rec.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs bg-primary bg-opacity-20 text-primary px-2 py-1 rounded">
                    {rec.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">{rec.topic}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
