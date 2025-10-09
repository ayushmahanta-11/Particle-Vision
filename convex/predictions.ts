import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Particle classification model - simulates a CNN model for particle track classification
 * In a real implementation, this would use TensorFlow.js or ONNX.js to run inference
 * on uploaded particle detector images.
 */
function classifyParticleTrack(fileName: string): { class: string; confidence: number } {
  // Simulate CNN inference based on filename patterns for demo purposes
  // In production, this would analyze the actual image data using a trained model
  const particleTypes = [
    { name: 'proton', keywords: ['proton', 'p+', 'hadron'] },
    { name: 'neutron', keywords: ['neutron', 'n0', 'neutral'] },
    { name: 'electron', keywords: ['electron', 'e-', 'lepton', 'beta'] },
    { name: 'muon', keywords: ['muon', 'mu', 'cosmic'] },
    { name: 'pion', keywords: ['pion', 'pi', 'meson'] },
    { name: 'kaon', keywords: ['kaon', 'k+', 'k-', 'strange'] },
    { name: 'photon', keywords: ['photon', 'gamma', 'electromagnetic'] },
  ];

  const lowerFileName = fileName.toLowerCase();
  
  // Check for keyword matches in filename
  for (const particle of particleTypes) {
    for (const keyword of particle.keywords) {
      if (lowerFileName.includes(keyword)) {
        return {
          class: particle.name,
          confidence: 0.85 + Math.random() * 0.14, // 85-99% confidence
        };
      }
    }
  }
  
  // Default random classification for demo
  const randomParticle = particleTypes[Math.floor(Math.random() * particleTypes.length)];
  return {
    class: randomParticle.name,
    confidence: 0.60 + Math.random() * 0.25, // 60-85% confidence for unknown patterns
  };
}

/**
 * Generate a signed upload URL for image storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Classify an uploaded particle track image and store the prediction
 * This function simulates running a CNN model on the uploaded image
 */
export const classifyImage = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the image URL for display purposes
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    
    // Run particle classification inference
    const prediction = classifyParticleTrack(args.fileName);
    
    // Store the prediction result in the database
    const predictionId = await ctx.db.insert("predictions", {
      fileName: args.fileName,
      fileSize: args.fileSize,
      storageId: args.storageId,
      predictedClass: prediction.class,
      confidence: prediction.confidence,
      imageUrl: imageUrl || undefined,
    });
    
    return predictionId;
  },
});

/**
 * List all predictions ordered by creation time (newest first)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const predictions = await ctx.db
      .query("predictions")
      .order("desc")
      .collect();
    
    // Ensure image URLs are up to date (they expire after some time)
    return await Promise.all(
      predictions.map(async (prediction) => ({
        ...prediction,
        imageUrl: await ctx.storage.getUrl(prediction.storageId),
      }))
    );
  },
});

/**
 * Generate CSV data for downloading prediction results
 * Includes all prediction data with proper formatting for scientific analysis
 */
export const downloadResults = mutation({
  args: {},
  handler: async (ctx) => {
    const predictions = await ctx.db
      .query("predictions")
      .order("desc")
      .collect();
    
    // CSV header with scientific metadata
    const headers = [
      "Timestamp",
      "Filename", 
      "File_Size_MB",
      "Predicted_Particle",
      "Confidence_Score",
      "Confidence_Percentage",
      "Storage_ID"
    ];
    
    // Convert predictions to CSV rows
    const rows = predictions.map(prediction => [
      new Date(prediction._creationTime).toISOString(),
      prediction.fileName,
      (prediction.fileSize / 1024 / 1024).toFixed(3),
      prediction.predictedClass,
      prediction.confidence.toFixed(4),
      (prediction.confidence * 100).toFixed(2) + "%",
      prediction.storageId
    ]);
    
    // Combine headers and data into CSV format
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");
    
    return csvContent;
  },
});

/**
 * Clear all prediction results from the database
 * Useful for starting fresh experiments or cleaning up test data
 */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const predictions = await ctx.db.query("predictions").collect();
    
    // Delete all prediction records
    for (const prediction of predictions) {
      await ctx.db.delete(prediction._id);
    }
    
    return { deleted: predictions.length };
  },
});
