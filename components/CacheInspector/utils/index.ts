export const formatTimeLeft = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getStatusColor = (timeLeft: number): string => {
  if (timeLeft > 300) return 'bg-green-100 text-green-800'; // > 5 min
  if (timeLeft > 120) return 'bg-yellow-100 text-yellow-800'; // 2-5 min
  return 'bg-red-100 text-red-800'; // < 2 min
};