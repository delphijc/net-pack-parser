import { toast } from '@/components/ui/use-toast';
import type { ThreatAlert } from '@/types/threat';

// Type for the object returned by toast()
interface ToastController {
    id: string;
    update: (props: any) => void;
    dismiss: () => void;
}

interface ActiveAlert {
    controller: ToastController;
    count: number;
    startTime: number;
    baseMessage: string;
}

class AlertManagerService {
    private activeAlerts: Map<string, ActiveAlert> = new Map();
    private readonly GROUP_WINDOW_MS = 5000; // Group alerts within 5 seconds

    public trigger(threat: ThreatAlert) {
        // Only alert for High or Critical
        if (threat.severity !== 'high' && threat.severity !== 'critical') {
            return;
        }

        const key = threat.type;
        const now = Date.now();
        const existing = this.activeAlerts.get(key);

        if (existing && (now - existing.startTime < this.GROUP_WINDOW_MS)) {
            // Update existing
            existing.count++;
            existing.controller.update({
                description: `${existing.count} attempts detected. Last: ${new Date().toLocaleTimeString()}`,
                // Keep variant in sync or escalate?
                variant: threat.severity === 'critical' ? 'destructive' : 'default',
            });
        } else {
            // New Alert
            const controller = toast({
                title: `${threat.severity.toUpperCase()} Threat: ${threat.type}`,
                description: threat.description,
                variant: threat.severity === 'critical' ? 'destructive' : 'default',
                duration: 5000,
            });

            this.activeAlerts.set(key, {
                controller,
                count: 1,
                startTime: now,
                baseMessage: threat.type
            });

            // Optional Sound
            if (threat.severity === 'critical') {
                this.playSound();
            }
        }
    }

    private playSound() {
        // Simple beep using AudioContext or just verify this later
        try {
            // Minimal beep
            // const audio = new Audio('/alert.mp3'); audio.play();
            // Since we don't have file, skipping logic or using placeholder.
            // console.log("BEEP");
        } catch (e) {
            // ignore
        }
    }
}

export const alertManager = new AlertManagerService();
