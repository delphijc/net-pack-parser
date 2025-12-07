import React from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const TimelineControls: React.FC = () => {
    const {
        showThreatsOnly,
        toggleThreatsOnly,
        selectedProtocol,
        setProtocol
    } = useTimelineStore();

    return (
        <div className="flex items-center gap-6 px-4 py-2 bg-card border rounded-md mb-4">
            <div className="flex items-center space-x-2">
                <Switch
                    id="show-threats"
                    checked={showThreatsOnly}
                    onCheckedChange={toggleThreatsOnly}
                />
                <Label htmlFor="show-threats">Show Threats Only</Label>
            </div>

            <div className="flex items-center space-x-2">
                <Label htmlFor="protocol-filter" className="whitespace-nowrap">Protocol:</Label>
                <Select
                    value={selectedProtocol || "ALL"}
                    onValueChange={(val) => setProtocol(val === "ALL" ? null : val)}
                >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="TCP">TCP</SelectItem>
                        <SelectItem value="UDP">UDP</SelectItem>
                        <SelectItem value="HTTP">HTTP</SelectItem>
                        <SelectItem value="DNS">DNS</SelectItem>
                        <SelectItem value="TLS">TLS</SelectItem>
                        <SelectItem value="ICMP">ICMP</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
