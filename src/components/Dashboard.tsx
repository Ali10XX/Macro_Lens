import React from 'react';
import StatCard from './StatCard';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Calories',
      value: '2,485',
      icon: '🔥',
      color: 'orange' as const,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Total Steps',
      value: '8,924',
      icon: '👣',
      color: 'blue' as const,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Active Minutes',
      value: '127',
      icon: '⏱️',
      color: 'green' as const,
      trend: { value: 3, isPositive: false }
    },
    {
      title: 'Workouts',
      value: '4',
      icon: '💪',
      color: 'purple' as const,
      trend: { value: 15, isPositive: true }
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'workout',
      title: 'Morning Cardio',
      time: '2 hours ago',
      icon: '🏃‍♂️',
      details: '35 min • 320 calories'
    },
    {
      id: 2,
      type: 'meal',
      title: 'Healthy Lunch',
      time: '4 hours ago',
      icon: '🥗',
      details: '520 calories • 25g protein'
    },
    {
      id: 3,
      type: 'workout',
      title: 'Weight Training',
      time: '1 day ago',
      icon: '🏋️‍♀️',
      details: '45 min • 180 calories'
    },
    {
      id: 4,
      type: 'meal',
      title: 'Protein Shake',
      time: '1 day ago',
      icon: '🥤',
      details: '280 calories • 30g protein'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, John!</h2>
        <p className="text-blue-100">You're doing great! Here's your fitness overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 transition-colors">
          <div className="text-2xl mb-2">🏃‍♂️</div>
          <div className="font-semibold">Start Workout</div>
        </button>
        <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 transition-colors">
          <div className="text-2xl mb-2">🍎</div>
          <div className="font-semibold">Log Meal</div>
        </button>
        <button className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-4 transition-colors">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">View Progress</div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 