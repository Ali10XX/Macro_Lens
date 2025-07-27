import React, { useState } from 'react';

const Progress: React.FC = () => {
  const [activeChart, setActiveChart] = useState('weight');

  const chartData = {
    weight: [
      { date: '2024-01-01', value: 180 },
      { date: '2024-01-15', value: 178 },
      { date: '2024-02-01', value: 176 },
      { date: '2024-02-15', value: 175 },
      { date: '2024-03-01', value: 174 },
    ],
    calories: [
      { date: '2024-01-01', value: 2200 },
      { date: '2024-01-15', value: 2400 },
      { date: '2024-02-01', value: 2300 },
      { date: '2024-02-15', value: 2500 },
      { date: '2024-03-01', value: 2485 },
    ],
    steps: [
      { date: '2024-01-01', value: 6500 },
      { date: '2024-01-15', value: 7200 },
      { date: '2024-02-01', value: 8100 },
      { date: '2024-02-15', value: 8500 },
      { date: '2024-03-01', value: 8924 },
    ]
  };

  const goals = [
    {
      id: 1,
      title: 'Lose 10 lbs',
      current: 6,
      target: 10,
      unit: 'lbs',
      progress: 60,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Daily Steps',
      current: 8924,
      target: 10000,
      unit: 'steps',
      progress: 89,
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Workout Streak',
      current: 14,
      target: 30,
      unit: 'days',
      progress: 47,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Protein Goal',
      current: 117,
      target: 150,
      unit: 'g',
      progress: 78,
      color: 'bg-orange-500'
    }
  ];

  const achievements = [
    {
      id: 1,
      title: 'First Workout',
      description: 'Completed your first workout',
      date: '2024-01-15',
      icon: '🏆',
      unlocked: true
    },
    {
      id: 2,
      title: 'Week Warrior',
      description: 'Worked out 7 days in a row',
      date: '2024-02-01',
      icon: '⭐',
      unlocked: true
    },
    {
      id: 3,
      title: 'Calorie Counter',
      description: 'Logged meals for 30 days',
      date: null,
      icon: '🔥',
      unlocked: false
    },
    {
      id: 4,
      title: 'Step Master',
      description: 'Reached 10,000 steps in a day',
      date: null,
      icon: '👣',
      unlocked: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
        <p className="text-gray-600">Monitor your fitness journey and achievements</p>
      </div>

      {/* Goal Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{goal.title}</h3>
              <span className="text-sm text-gray-500">{goal.progress}%</span>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{goal.current} {goal.unit}</span>
                <span>{goal.target} {goal.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${goal.color}`}
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {goal.target - goal.current} {goal.unit} to go
            </p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            <div className="flex space-x-2">
              {['weight', 'calories', 'steps'].map((chart) => (
                <button
                  key={chart}
                  onClick={() => setActiveChart(chart)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeChart === chart
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {chart.charAt(0).toUpperCase() + chart.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="p-6">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900 mb-2">
                {activeChart.charAt(0).toUpperCase() + activeChart.slice(1)} Chart
              </h4>
              <p className="text-gray-600 text-sm">
                Chart will display {activeChart} data over time
              </p>
              <div className="mt-4 flex justify-center space-x-8">
                {chartData[activeChart as keyof typeof chartData].map((point, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium text-gray-900">{point.value}</div>
                    <div className="text-xs text-gray-500">{point.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlocked 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${
                      achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                    {achievement.date && (
                      <p className="text-xs text-green-600 mt-1">
                        Unlocked on {achievement.date}
                      </p>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">5</div>
            <div className="text-sm text-gray-600">Workouts Completed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">12,450</div>
            <div className="text-sm text-gray-600">Average Daily Steps</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">2,380</div>
            <div className="text-sm text-gray-600">Average Daily Calories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress; 