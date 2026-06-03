import { useState, useEffect } from 'react';

export function PHDateTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatPHDate = () => {
    return currentTime.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPHTime = () => {
    return currentTime.toLocaleTimeString('en-PH', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="text-sm">
      <div className="text-muted-foreground">{formatPHDate()}</div>
      <div className="font-medium text-foreground">{formatPHTime()} PHT</div>
    </div>
  );
}
