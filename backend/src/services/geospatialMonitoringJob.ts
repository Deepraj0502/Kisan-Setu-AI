/**
 * Geospatial Monitoring Job
 * 
 * Scheduled job that runs periodically to:
 * 1. Fetch satellite data for all monitored land parcels
 * 2. Analyze data for anomalies
 * 3. Generate and send proactive alerts
 * 
 * This should be run as:
 * - AWS Lambda with EventBridge (cron: every 6 hours)
 * - Or Node.js cron job in production
 */

import {
  getFarmerLandParcels,
  startEarthObservationJob,
  getEarthObservationJobResults,
  storeSatelliteObservation,
  analyzeAndGenerateAlerts,
  getPendingAlerts,
  markAlertAsSent,
} from "./geospatialService";
import { getFarmerProfile } from "./farmerProfileService";
import { getPool } from "../db/client";

interface MonitoringJobResult {
  parcels_monitored: number;
  observations_created: number;
  alerts_generated: number;
  alerts_sent: number;
  errors: string[];
}

/**
 * Main monitoring job - processes all active land parcels
 */
export async function runGeospatialMonitoringJob(): Promise<MonitoringJobResult> {
  console.log("🛰️ Starting geospatial monitoring job...");

  const result: MonitoringJobResult = {
    parcels_monitored: 0,
    observations_created: 0,
    alerts_generated: 0,
    alerts_sent: 0,
    errors: [],
  };

  try {
    // Get all farmers with monitoring enabled
    const farmers = await getAllFarmersWithMonitoring();
    console.log(`Found ${farmers.length} farmers with monitoring enabled`);

    for (const farmer of farmers) {
      try {
        // Get farmer's land parcels
        const parcels = await getFarmerLandParcels(farmer.id);
        console.log(`Processing ${parcels.length} parcels for farmer ${farmer.phone_number}`);

        for (const parcel of parcels) {
          try {
            result.parcels_monitored++;

            // Check if we already have recent observation (within 5 days)
            const recentObs = await getRecentObservation(parcel.id, 5);
            if (recentObs) {
              console.log(`Skipping parcel ${parcel.id} - recent observation exists`);
              continue;
            }

            // Start Earth Observation Job
            console.log(`Starting EOJ for parcel ${parcel.id}...`);
            const jobArn = await startEarthObservationJob(parcel);

            // Poll for job completion (in production, use async processing)
            const jobResult = await pollJobCompletion(jobArn, 60); // 60 second timeout

            if (jobResult.status === "COMPLETED" && jobResult.ndvi_stats && jobResult.ndwi_stats) {
              // Calculate crop health score (0-100)
              const cropHealthScore = calculateCropHealthScore(
                jobResult.ndvi_stats.mean,
                jobResult.ndwi_stats.mean
              );

              // Store observation
              const observation = await storeSatelliteObservation({
                parcel_id: parcel.id,
                satellite_source: "sentinel-2",
                observation_date: new Date(),
                cloud_cover_percent: 10, // From job metadata
                ndvi_mean: jobResult.ndvi_stats.mean,
                ndvi_std: jobResult.ndvi_stats.std,
                ndvi_min: jobResult.ndvi_stats.min,
                ndvi_max: jobResult.ndvi_stats.max,
                ndwi_mean: jobResult.ndwi_stats.mean,
                ndwi_std: jobResult.ndwi_stats.std,
                crop_health_score: cropHealthScore,
                s3_raster_url: jobResult.s3_output_url,
                sagemaker_job_arn: jobArn,
              });

              result.observations_created++;
              console.log(`✅ Observation created for parcel ${parcel.id}`);

              // Analyze and generate alerts
              const alerts = await analyzeAndGenerateAlerts(parcel, observation);
              result.alerts_generated += alerts.length;

              if (alerts.length > 0) {
                console.log(`⚠️ Generated ${alerts.length} alerts for parcel ${parcel.id}`);
              }
            } else {
              console.log(`⏳ Job ${jobArn} status: ${jobResult.status}`);
            }
          } catch (error) {
            const errorMsg = `Error processing parcel ${parcel.id}: ${error}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        }

        // Send pending alerts to farmer
        const sentCount = await sendPendingAlertsToFarmer(farmer.id, farmer.phone_number);
        result.alerts_sent += sentCount;
      } catch (error) {
        const errorMsg = `Error processing farmer ${farmer.phone_number}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    console.log("✅ Geospatial monitoring job completed");
    console.log(`📊 Results:`, result);
  } catch (error) {
    console.error("❌ Monitoring job failed:", error);
    result.errors.push(`Job failed: ${error}`);
  }

  return result;
}

/**
 * Get all farmers with monitoring enabled
 */
async function getAllFarmersWithMonitoring(): Promise<Array<{ id: string; phone_number: string }>> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT DISTINCT f.id, f.phone_number
    FROM farmer_profiles f
    INNER JOIN land_parcels lp ON lp.farmer_id = f.id
    WHERE lp.monitoring_enabled = true
    ORDER BY f.last_active_at DESC NULLS LAST`
  );

  return result.rows;
}

/**
 * Get recent observation for a parcel
 */
async function getRecentObservation(
  parcel_id: string,
  days: number
): Promise<{ id: string; observation_date: Date } | null> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT id, observation_date
    FROM satellite_observations
    WHERE parcel_id = $1
      AND observation_date >= NOW() - INTERVAL '${days} days'
    ORDER BY observation_date DESC
    LIMIT 1`,
    [parcel_id]
  );

  return result.rows[0] || null;
}

/**
 * Poll for job completion (simplified - in production use async processing)
 */
async function pollJobCompletion(
  jobArn: string,
  timeoutSeconds: number
): Promise<{
  status: string;
  ndvi_stats?: { mean: number; std: number; min: number; max: number };
  ndwi_stats?: { mean: number; std: number };
  s3_output_url?: string;
}> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < timeoutSeconds * 1000) {
    const result = await getEarthObservationJobResults(jobArn);

    if (result.status === "COMPLETED" || result.status === "FAILED") {
      return result;
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return { status: "TIMEOUT" };
}

/**
 * Calculate crop health score from NDVI and NDWI
 */
function calculateCropHealthScore(ndvi: number, ndwi: number): number {
  // NDVI: -1 to 1 (higher is better for vegetation)
  // NDWI: -1 to 1 (higher is better for water content)

  // Normalize NDVI to 0-100 (assuming healthy range is 0.4-0.8)
  const ndviScore = Math.max(0, Math.min(100, ((ndvi - 0.2) / 0.6) * 100));

  // Normalize NDWI to 0-100 (assuming healthy range is 0.2-0.5)
  const ndwiScore = Math.max(0, Math.min(100, ((ndwi - 0.1) / 0.4) * 100));

  // Weighted average (NDVI 70%, NDWI 30%)
  const healthScore = Math.round(ndviScore * 0.7 + ndwiScore * 0.3);

  return healthScore;
}

/**
 * Send pending alerts to farmer via WhatsApp/SMS
 */
async function sendPendingAlertsToFarmer(farmer_id: string, phone_number: string): Promise<number> {
  const alerts = await getPendingAlerts(farmer_id);

  if (alerts.length === 0) {
    return 0;
  }

  console.log(`📤 Sending ${alerts.length} alerts to ${phone_number}`);

  // Get farmer's language preference
  const profile = await getFarmerProfile(phone_number);
  const language = profile?.language || "en";

  let sentCount = 0;

  for (const alert of alerts) {
    try {
      // Get localized content
      const title = alert[`title_${language}` as keyof typeof alert] as string;
      const message = alert[`message_${language}` as keyof typeof alert] as string;
      const recommendations = alert[`recommendations_${language}` as keyof typeof alert] as string[];

      // Format alert message
      const alertMessage = formatAlertMessage(title, message, recommendations);

      // Send via WhatsApp (or SMS fallback)
      const sent = await sendWhatsAppAlert(phone_number, alertMessage);

      if (sent) {
        await markAlertAsSent(alert.id);
        await logAlertDelivery(alert.id, farmer_id, "whatsapp", "sent");
        sentCount++;
        console.log(`✅ Alert ${alert.id} sent to ${phone_number}`);
      } else {
        console.error(`❌ Failed to send alert ${alert.id} to ${phone_number}`);
      }
    } catch (error) {
      console.error(`Error sending alert ${alert.id}:`, error);
    }
  }

  return sentCount;
}

/**
 * Format alert message for WhatsApp
 */
function formatAlertMessage(title: string, message: string, recommendations: string[]): string {
  let formatted = `*${title}*\n\n`;
  formatted += `${message}\n\n`;

  if (recommendations && recommendations.length > 0) {
    formatted += `*सूचना / Recommendations:*\n`;
    recommendations.forEach((rec, idx) => {
      formatted += `${idx + 1}. ${rec}\n`;
    });
  }

  formatted += `\n_Kisan Setu AI - Satellite Monitoring_`;

  return formatted;
}

/**
 * Send WhatsApp alert (placeholder - integrate with Twilio/AWS Pinpoint)
 */
async function sendWhatsAppAlert(phone_number: string, message: string): Promise<boolean> {
  // TODO: Integrate with WhatsApp Business API
  // Options:
  // 1. Twilio WhatsApp API
  // 2. AWS Pinpoint
  // 3. Meta WhatsApp Business Platform

  console.log(`📱 WhatsApp to ${phone_number}:`);
  console.log(message);
  console.log("---");

  // For now, just log (in production, send actual WhatsApp message)
  return true;
}

/**
 * Log alert delivery
 */
async function logAlertDelivery(
  alert_id: string,
  farmer_id: string,
  channel: string,
  status: string
): Promise<void> {
  const pool = getPool();

  await pool.query(
    `INSERT INTO alert_delivery_log (
      alert_id, farmer_id, delivery_channel, delivery_status, sent_at
    ) VALUES ($1, $2, $3, $4, NOW())`,
    [alert_id, farmer_id, channel, status]
  );
}

/**
 * Run monitoring job on schedule (for local testing)
 */
export async function startMonitoringSchedule(intervalHours: number = 6): Promise<void> {
  console.log(`🕐 Starting monitoring schedule (every ${intervalHours} hours)`);

  // Run immediately
  await runGeospatialMonitoringJob();

  // Then run on schedule
  setInterval(
    async () => {
      await runGeospatialMonitoringJob();
    },
    intervalHours * 60 * 60 * 1000
  );
}

// For AWS Lambda deployment
export const handler = async (event: unknown) => {
  console.log("Lambda event:", event);
  const result = await runGeospatialMonitoringJob();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
