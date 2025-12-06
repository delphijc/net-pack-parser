import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Database, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SessionSelector: React.FC = () => {
  const { sessions, activeSessionId, setActiveSession } = useSessionStore();

  const handleValueChange = (value: string) => {
    if (value === 'new_session') {
      setActiveSession(null);
    } else {
      setActiveSession(value);
    }
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={activeSessionId || 'new_session'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[280px] h-9 bg-secondary/50 border-white/10 text-xs">
          <Database size={14} className="mr-2 text-primary" />
          <SelectValue placeholder="Select Session" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="new_session"
            className="font-medium text-emerald-500"
          >
            <div className="flex items-center">
              <Plus size={14} className="mr-2" />
              New Analysis Session
            </div>
          </SelectItem>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              <div className="flex flex-col">
                <span className="font-medium">{session.name}</span>
                <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                  <Clock size={10} className="mr-1" />
                  {formatDistanceToNow(session.timestamp)} ago •{' '}
                  {session.packetCount} pkts
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SessionSelector;
