/**
 * Geospatial Service
 * 
 * Integrates with AWS SageMaker Geospatial to monitor farmer land parcels
 * using satellite imagery and generate proactive alerts for:
 * - Moisture stress
 * - Crop health decline
 * - Pest outbreaks
 * - Drought risk
 * - Flood risk
 */

import {
  SageMakerGeospatialClient,
  StartEarthObservationJobCommand,
  GetEarthObservationJobCommand,
  ExportEarthObservationJobCommand,
  SearchRasterDataCollectionCommand,
} from "@aws-sdk/client-sagemaker-geospatial";
import { getPool } from "../db/client";
import type { LanguageCode } from "../types/rag";

const client = new SageMakerGeospatialClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

// ============================================
// Types
// ============================================

export interface LandParcel {
  id: string;
  farmer_id: string;
  parcel_name?: string;
  boundary: GeoJSON.Polygon;
  centroid: GeoJSON.Point;
  area_hectares: number;
  current_crop?: string;
  planting_date?: Date;
  monitoring_enabled: boolean;
  alert_threshold_ndvi: number;
  alert_threshold_ndwi: number;
}

export interface SatelliteObservation {
  id: string;
  parcel_id: string;
  satellite_source: "sentinel-2" | "landsat-8" | "modis";
  observation_date: Date;
  cloud_cover_percent: number;
  ndvi_mean: number;
  ndvi_std: number;
  ndwi_mean: number;
  soil_moisture_percent?: number;
  crop_health_score: number;
  s3_raster_url?: string;
  sagemaker_job_arn?: string;
}

export interface GeospatialAlert {
  title_english: string | Record<string, unknown> | Record<LanguageCode, string> | Record<LanguageCode, string[]>;
  message_english: string | Record<string, unknown> | Record<LanguageCode, string> | Record<LanguageCode, string[]>;
  recommendations_english: string | Record<string, unknown> | Record<LanguageCode, string> | Record<LanguageCode, string[]>;
  created_at: any;
  id: string;
  parcel_id: string;
  farmer_id: string;
  alert_type: "moisture_stress" | "pest_outbreak" | "crop_health" | "drought_risk" | "flood_risk";
  severity: "low" | "medium" | "high" | "critical";
  title: Record<LanguageCode, string>;
  message: Record<LanguageCode, string>;
  recommendations: Record<LanguageCode, string[]>;
  trigger_data: Record<string, unknown>;
  status: "pending" | "sent" | "acknowledged" | "resolved";
}

// ============================================
// Land Parcel Management
// ============================================

/**
 * Register a land parcel for monitoring
 */
export async function registerLandParcel(data: {
  farmer_id: string;
  parcel_name?: string;
  boundary: GeoJSON.Polygon;
  area_hectares: number;
  current_crop?: string;
  planting_date?: Date;
}): Promise<LandParcel> {
  const pool = getPool();

  // Calculate centroid from boundary
  const result = await pool.query(
    `INSERT INTO land_parcels (
      farmer_id, parcel_name, boundary, centroid, area_hectares,
      current_crop, planting_date, monitoring_enabled
    ) VALUES (
      $1, $2, ST_GeomFromGeoJSON($3), 
      ST_Centroid(ST_GeomFromGeoJSON($3)), $4, $5, $6, true
    ) RETURNING 
      id, farmer_id, parcel_name,
      ST_AsGeoJSON(boundary)::json as boundary,
      ST_AsGeoJSON(centroid)::json as centroid,
      area_hectares, current_crop, planting_date,
      monitoring_enabled, alert_threshold_ndvi, alert_threshold_ndwi`,
    [
      data.farmer_id,
      data.parcel_name,
      JSON.stringify(data.boundary),
      data.area_hectares,
      data.current_crop,
      data.planting_date,
    ]
  );

  return result.rows[0];
}

/**
 * Get all land parcels for a farmer
 */
export async function getFarmerLandParcels(farmer_id: string): Promise<LandParcel[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT 
      id, farmer_id, parcel_name,
      ST_AsGeoJSON(boundary)::json as boundary,
      ST_AsGeoJSON(centroid)::json as centroid,
      area_hectares, current_crop, planting_date,
      monitoring_enabled, alert_threshold_ndvi, alert_threshold_ndwi
    FROM land_parcels
    WHERE farmer_id = $1 AND monitoring_enabled = true
    ORDER BY created_at DESC`,
    [farmer_id]
  );

  return result.rows;
}

// ============================================
// Satellite Data Processing
// ============================================

/**
 * Start Earth Observation Job for a land parcel
 * Uses Sentinel-2 data to calculate NDVI and NDWI
 */
export async function startEarthObservationJob(parcel: LandParcel): Promise<string> {
  const today = new Date();
  const startDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

  const command = new StartEarthObservationJobCommand({
    Name: `kisan-setu-${parcel.id}-${today.toISOString().split("T")[0]}`,
    InputConfig: {
      RasterDataCollectionQuery: {
        RasterDataCollectionArn: "arn:aws:sagemaker-geospatial:ap-south-1:378778860802:raster-data-collection/public/sentinel-2-l2a-cogs",
        TimeRangeFilter: {
          StartTime: startDate.toISOString(),
          EndTime: today.toISOString(),
        },
        AreaOfInterest: {
          AreaOfInterestGeometry: {
            PolygonGeometry: {
              Coordinates: parcel.boundary.coordinates,
            },
          },
        },
        PropertyFilters: {
          Properties: [
            {
              Property: {
                EoCloudCover: {
                  LowerBound: 0,
                  UpperBound: 20, // Max 20% cloud cover
                },
              },
            },
          ],
          LogicalOperator: "AND",
        },
      },
    },
    JobConfig: {
      BandMathConfig: {
        CustomIndices: {
          Operations: [
            {
              Name: "NDVI",
              Equation: "(B08 - B04) / (B08 + B04)", // Sentinel-2 bands
              OutputType: "FLOAT32",
            },
            {
              Name: "NDWI",
              Equation: "(B03 - B08) / (B03 + B08)", // Water index
              OutputType: "FLOAT32",
            },
          ],
        },
      },
    },
    ExecutionRoleArn: process.env.SAGEMAKER_EXECUTION_ROLE_ARN!,
  });

  const response = await client.send(command);
  return response.Arn!;
}

/**
 * Get Earth Observation Job results
 */
export async function getEarthObservationJobResults(jobArn: string): Promise<{
  status: string;
  ndvi_stats?: { mean: number; std: number; min: number; max: number };
  ndwi_stats?: { mean: number; std: number };
  s3_output_url?: string;
}> {
  const command = new GetEarthObservationJobCommand({
    Arn: jobArn,
  });

  const response = await client.send(command);

  if (response.Status === "COMPLETED") {
    // Parse output statistics from job metadata
    const outputConfig = response.OutputBands || [];
    const ndviStats = outputConfig.find((b) => b.Name === "NDVI")?.Statistics;
    const ndwiStats = outputConfig.find((b) => b.Name === "NDWI")?.Statistics;

    return {
      status: response.Status,
      ndvi_stats: ndviStats
        ? {
            mean: ndviStats.Mean || 0,
            std: ndviStats.StandardDeviation || 0,
            min: ndviStats.Minimum || 0,
            max: ndviStats.Maximum || 0,
          }
        : undefined,
      ndwi_stats: ndwiStats
        ? {
            mean: ndwiStats.Mean || 0,
            std: ndwiStats.StandardDeviation || 0,
          }
        : undefined,
      s3_output_url: response.OutputLocation,
    };
  }

  return {
    status: response.Status || "UNKNOWN",
  };
}

/**
 * Store satellite observation in database
 */
export async function storeSatelliteObservation(data: {
  parcel_id: string;
  satellite_source: string;
  observation_date: Date;
  cloud_cover_percent: number;
  ndvi_mean: number;
  ndvi_std: number;
  ndvi_min: number;
  ndvi_max: number;
  ndwi_mean: number;
  ndwi_std: number;
  crop_health_score: number;
  s3_raster_url?: string;
  sagemaker_job_arn?: string;
}): Promise<SatelliteObservation> {
  const pool = getPool();

  const result = await pool.query(
    `INSERT INTO satellite_observations (
      parcel_id, satellite_source, observation_date, cloud_cover_percent,
      ndvi_mean, ndvi_std, ndvi_min, ndvi_max,
      ndwi_mean, ndwi_std, crop_health_score,
      s3_raster_url, sagemaker_job_arn
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      data.parcel_id,
      data.satellite_source,
      data.observation_date,
      data.cloud_cover_percent,
      data.ndvi_mean,
      data.ndvi_std,
      data.ndvi_min,
      data.ndvi_max,
      data.ndwi_mean,
      data.ndwi_std,
      data.crop_health_score,
      data.s3_raster_url,
      data.sagemaker_job_arn,
    ]
  );

  return result.rows[0];
}

// ============================================
// Alert Generation
// ============================================

/**
 * Analyze observation and generate alerts if thresholds exceeded
 */
export async function analyzeAndGenerateAlerts(
  parcel: LandParcel,
  observation: SatelliteObservation
): Promise<GeospatialAlert[]> {
  const alerts: GeospatialAlert[] = [];

  // 1. Check for moisture stress
  if (observation.ndwi_mean < parcel.alert_threshold_ndwi) {
    const severity = observation.ndwi_mean < 0.1 ? "critical" : observation.ndwi_mean < 0.15 ? "high" : "medium";

    alerts.push(
      await createGeospatialAlert({
        parcel_id: parcel.id,
        farmer_id: parcel.farmer_id,
        alert_type: "moisture_stress",
        severity,
        observation_id: observation.id,
        trigger_data: {
          ndwi_mean: observation.ndwi_mean,
          threshold: parcel.alert_threshold_ndwi,
        },
      })
    );
  }

  // 2. Check for crop health decline
  if (observation.ndvi_mean < parcel.alert_threshold_ndvi) {
    const severity = observation.ndvi_mean < 0.3 ? "critical" : observation.ndvi_mean < 0.35 ? "high" : "medium";

    alerts.push(
      await createGeospatialAlert({
        parcel_id: parcel.id,
        farmer_id: parcel.farmer_id,
        alert_type: "crop_health",
        severity,
        observation_id: observation.id,
        trigger_data: {
          ndvi_mean: observation.ndvi_mean,
          threshold: parcel.alert_threshold_ndvi,
          crop_health_score: observation.crop_health_score,
        },
      })
    );
  }

  // 3. Check for regional pest outbreaks
  const nearbyOutbreaks = await checkNearbyPestOutbreaks(parcel);
  if (nearbyOutbreaks.length > 0) {
    for (const outbreak of nearbyOutbreaks) {
      alerts.push(
        await createGeospatialAlert({
          parcel_id: parcel.id,
          farmer_id: parcel.farmer_id,
          alert_type: "pest_outbreak",
          severity: outbreak.severity as "low" | "medium" | "high" | "critical",
          observation_id: observation.id,
          trigger_data: {
            pest_name: outbreak.pest_name_english,
            distance_km: outbreak.distance_km,
            affected_crops: outbreak.affected_crops,
          },
        })
      );
    }
  }

  return alerts;
}

/**
 * Create a geospatial alert
 */
async function createGeospatialAlert(data: {
  parcel_id: string;
  farmer_id: string;
  alert_type: string;
  severity: string;
  observation_id: string;
  trigger_data: Record<string, unknown>;
}): Promise<GeospatialAlert> {
  const pool = getPool();

  // Generate multilingual alert content
  const alertContent = generateAlertContent(data.alert_type, data.severity, data.trigger_data);

  const result = await pool.query(
    `INSERT INTO geospatial_alerts (
      parcel_id, farmer_id, alert_type, severity,
      title_english, title_marathi, title_hindi,
      message_english, message_marathi, message_hindi,
      recommendations_english, recommendations_marathi, recommendations_hindi,
      trigger_data, observation_id, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
    RETURNING *`,
    [
      data.parcel_id,
      data.farmer_id,
      data.alert_type,
      data.severity,
      alertContent.title.en,
      alertContent.title.mr,
      alertContent.title.hi,
      alertContent.message.en,
      alertContent.message.mr,
      alertContent.message.hi,
      alertContent.recommendations.en,
      alertContent.recommendations.mr,
      alertContent.recommendations.hi,
      JSON.stringify(data.trigger_data),
      data.observation_id,
    ]
  );

  return result.rows[0];
}

/**
 * Generate alert content in multiple languages
 */
function generateAlertContent(
  alertType: string,
  severity: string,
  triggerData: Record<string, unknown>
): {
  title: Record<LanguageCode, string>;
  message: Record<LanguageCode, string>;
  recommendations: Record<LanguageCode, string[]>;
} {
  const severityEmoji = {
    low: "ℹ️",
    medium: "⚠️",
    high: "🚨",
    critical: "🔴",
  }[severity] || "⚠️";

  switch (alertType) {
    case "moisture_stress":
      return {
        title: {
          en: `${severityEmoji} Water Shortage Detected`,
          mr: `${severityEmoji} पाण्याची कमतरता आढळली`,
          hi: `${severityEmoji} पानी की कमी पाई गई`,
        },
        message: {
          en: `Satellite data shows low soil moisture (NDWI: ${(triggerData.ndwi_mean as number).toFixed(2)}). Your crops may be experiencing water stress.`,
          mr: `उपग्रह डेटा कमी मातीची ओलावा दर्शवितो (NDWI: ${(triggerData.ndwi_mean as number).toFixed(2)}). तुमच्या पिकांना पाण्याची कमतरता जाणवत असू शकते.`,
          hi: `उपग्रह डेटा कम मिट्टी की नमी दिखाता है (NDWI: ${(triggerData.ndwi_mean as number).toFixed(2)}). आपकी फसलों को पानी की कमी हो सकती है.`,
        },
        recommendations: {
          en: [
            "Irrigate your field within 24-48 hours",
            "Check drip irrigation system if installed",
            "Apply mulch to conserve soil moisture",
            "Monitor weather forecast for rain",
          ],
          mr: [
            "24-48 तासांत तुमच्या शेताला पाणी द्या",
            "ड्रिप सिंचन प्रणाली तपासा (जर असेल तर)",
            "मातीची ओलावा टिकवण्यासाठी पालापाचोळा घाला",
            "पावसाचा हवामान अंदाज तपासा",
          ],
          hi: [
            "24-48 घंटों में अपने खेत को पानी दें",
            "ड्रिप सिंचाई प्रणाली जांचें (यदि स्थापित है)",
            "मिट्टी की नमी बचाने के लिए मल्च लगाएं",
            "बारिश के मौसम पूर्वानुमान की निगरानी करें",
          ],
        },
      };

    case "crop_health":
      return {
        title: {
          en: `${severityEmoji} Crop Health Declining`,
          mr: `${severityEmoji} पिकाचे आरोग्य कमी होत आहे`,
          hi: `${severityEmoji} फसल का स्वास्थ्य घट रहा है`,
        },
        message: {
          en: `Vegetation index (NDVI: ${(triggerData.ndvi_mean as number).toFixed(2)}) shows declining crop health. Health score: ${triggerData.crop_health_score}/100.`,
          mr: `वनस्पती निर्देशांक (NDVI: ${(triggerData.ndvi_mean as number).toFixed(2)}) पिकाचे आरोग्य कमी होत असल्याचे दर्शवितो. आरोग्य स्कोअर: ${triggerData.crop_health_score}/100.`,
          hi: `वनस्पति सूचकांक (NDVI: ${(triggerData.ndvi_mean as number).toFixed(2)}) फसल के स्वास्थ्य में गिरावट दिखाता है. स्वास्थ्य स्कोर: ${triggerData.crop_health_score}/100.`,
        },
        recommendations: {
          en: [
            "Inspect your field for pests or diseases",
            "Check soil nutrient levels",
            "Consider foliar spray if nutrient deficiency",
            "Contact agriculture officer for field visit",
          ],
          mr: [
            "कीड किंवा रोगांसाठी तुमच्या शेताची तपासणी करा",
            "मातीतील पोषक तत्वांची पातळी तपासा",
            "पोषक तत्वांची कमतरता असल्यास पर्णीय फवारणी करा",
            "शेत भेटीसाठी कृषी अधिकाऱ्यांशी संपर्क साधा",
          ],
          hi: [
            "कीटों या बीमारियों के लिए अपने खेत का निरीक्षण करें",
            "मिट्टी के पोषक तत्वों के स्तर की जांच करें",
            "पोषक तत्वों की कमी होने पर पर्णीय स्प्रे पर विचार करें",
            "खेत के दौरे के लिए कृषि अधिकारी से संपर्क करें",
          ],
        },
      };

    case "pest_outbreak":
      return {
        title: {
          en: `${severityEmoji} Pest Outbreak Alert`,
          mr: `${severityEmoji} कीड प्रादुर्भाव सूचना`,
          hi: `${severityEmoji} कीट प्रकोप चेतावनी`,
        },
        message: {
          en: `${triggerData.pest_name} detected ${(triggerData.distance_km as number).toFixed(1)} km from your farm. Affected crops: ${(triggerData.affected_crops as string[]).join(", ")}.`,
          mr: `तुमच्या शेतापासून ${(triggerData.distance_km as number).toFixed(1)} किमी अंतरावर ${triggerData.pest_name} आढळले. प्रभावित पिके: ${(triggerData.affected_crops as string[]).join(", ")}.`,
          hi: `आपके खेत से ${(triggerData.distance_km as number).toFixed(1)} किमी दूर ${triggerData.pest_name} पाया गया. प्रभावित फसलें: ${(triggerData.affected_crops as string[]).join(", ")}.`,
        },
        recommendations: {
          en: [
            "Inspect your crops immediately",
            "Set up pheromone traps",
            "Apply recommended pesticide if infestation found",
            "Monitor daily for next 2 weeks",
          ],
          mr: [
            "तुमच्या पिकांची ताबडतोब तपासणी करा",
            "फेरोमोन सापळे लावा",
            "संसर्ग आढळल्यास शिफारस केलेले कीटकनाशक वापरा",
            "पुढील 2 आठवडे दररोज निरीक्षण करा",
          ],
          hi: [
            "अपनी फसलों का तुरंत निरीक्षण करें",
            "फेरोमोन ट्रैप लगाएं",
            "संक्रमण मिलने पर अनुशंसित कीटनाशक लगाएं",
            "अगले 2 सप्ताह तक रोजाना निगरानी करें",
          ],
        },
      };

    default:
      return {
        title: {
          en: `${severityEmoji} Alert`,
          mr: `${severityEmoji} सूचना`,
          hi: `${severityEmoji} चेतावनी`,
        },
        message: {
          en: "Satellite monitoring detected an issue with your land.",
          mr: "उपग्रह निरीक्षणाने तुमच्या जमिनीत समस्या आढळली.",
          hi: "उपग्रह निगरानी ने आपकी जमीन में समस्या का पता लगाया.",
        },
        recommendations: {
          en: ["Contact agriculture officer for guidance"],
          mr: ["मार्गदर्शनासाठी कृषी अधिकाऱ्यांशी संपर्क साधा"],
          hi: ["मार्गदर्शन के लिए कृषि अधिकारी से संपर्क करें"],
        },
      };
  }
}

/**
 * Check for nearby pest outbreaks
 */
async function checkNearbyPestOutbreaks(parcel: LandParcel): Promise<
  Array<{
    pest_name_english: string;
    severity: string;
    distance_km: number;
    affected_crops: string[];
  }>
> {
  const pool = getPool();

  // Find active pest outbreaks within 50km
  const result = await pool.query(
    `SELECT 
      pest_name_english, severity, affected_crops,
      ST_Distance(
        affected_area::geography,
        ST_GeomFromGeoJSON($1)::geography
      ) / 1000 as distance_km
    FROM regional_pest_outbreaks
    WHERE status = 'active'
      AND ST_DWithin(
        affected_area::geography,
        ST_GeomFromGeoJSON($1)::geography,
        50000
      )
    ORDER BY distance_km ASC
    LIMIT 5`,
    [JSON.stringify(parcel.centroid)]
  );

  return result.rows;
}

/**
 * Get pending alerts for a farmer
 */
export async function getPendingAlerts(farmer_id: string): Promise<GeospatialAlert[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT * FROM geospatial_alerts
    WHERE farmer_id = $1 AND status = 'pending'
    ORDER BY severity DESC, created_at DESC`,
    [farmer_id]
  );

  return result.rows;
}

/**
 * Mark alert as sent
 */
export async function markAlertAsSent(alert_id: string): Promise<void> {
  const pool = getPool();

  await pool.query(
    `UPDATE geospatial_alerts
    SET status = 'sent', sent_at = NOW()
    WHERE id = $1`,
    [alert_id]
  );
}
