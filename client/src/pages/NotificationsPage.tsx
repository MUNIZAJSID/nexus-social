import React from 'react';
import { NotificationList } from '../components/notifications/NotificationList';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="w-full">
      <NotificationList />
    </div>
  );
};
