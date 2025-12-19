import cron from 'node-cron';
import fs from 'fs';
import { sessionRepository } from '../repositories/SessionRepository';

export class CleanupService {
  // 7 days in milliseconds
  private static readonly RETENTION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
  // Every day at midnight
  private static readonly CRON_SCHEDULE = '0 0 * * *';

  public static start(): void {
    console.log('Starting automated cleanup service...');
    cron.schedule(this.CRON_SCHEDULE, () => {
      this.runCleanup();
    });

    // Run once on startup to clean old sessions immediately?
    // Maybe better to let the schedule handle it or just log.
    // For now, let's just schedule it.
    console.log(`Cleanup service scheduled: ${this.CRON_SCHEDULE}`);
  }

  public static runCleanup(): void {
    console.log('Running automated session cleanup...');
    try {
      const sessions = sessionRepository.getAll();
      const now = Date.now();
      let deletedCount = 0;

      for (const session of sessions) {
        // Check if session is finished/stopped and older than retention period
        // Using startTime as simple age check
        if (
          ['finished', 'stopped'].includes(session.status) &&
          now - session.startTime > this.RETENTION_PERIOD_MS
        ) {
          try {
            console.log(
              `Deleting expired session: ${session.id} (${new Date(session.startTime).toISOString()})`,
            );

            // Delete file
            if (fs.existsSync(session.outputFilePath)) {
              fs.unlinkSync(session.outputFilePath);
            }

            // Delete DB record
            sessionRepository.delete(session.id);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete session ${session.id}:`, error);
          }
        }
      }

      console.log(`Cleanup completed. Deleted ${deletedCount} sessions.`);
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }
}
