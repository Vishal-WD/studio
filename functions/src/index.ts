
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * A scheduled Cloud Function that runs every 24 hours to delete past events.
 */
export const autoDeletePastEvents = functions.pubsub
  // Schedule to run every 24 hours. You can customize this cron schedule.
  // See https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules
  .schedule("every 24 hours")
  .onRun(async (context) => {
    functions.logger.info("Starting past events cleanup task.");

    // Get the current date in 'YYYY-MM-DD' format, matching how it's stored.
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    // Create a query to find all events where the date is before today.
    const pastEventsQuery = db.collection("events").where("date", "<", todayStr);

    try {
      const snapshot = await pastEventsQuery.get();

      // A batch can perform up to 500 operations.
      if (snapshot.empty) {
        functions.logger.info("No past events found to delete.");
        return null;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        functions.logger.info(`Deleting event: ${doc.id}`);
        batch.delete(doc.ref);
      });

      // Commit the batch deletion.
      await batch.commit();

      functions.logger.info(`Successfully deleted ${snapshot.size} past events.`);
      return null;
    } catch (error) {
      functions.logger.error("Error deleting past events:", error);
      return null;
    }
  });
