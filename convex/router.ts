import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * HTTP endpoint for uploading particle track images
 * Accepts multipart/form-data with image files
 */
http.route({
  path: "/uploadImage",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // In a full implementation, this would handle multipart form data
      // and process multiple image files for batch upload
      const body = await request.json();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Use the web interface for image upload and classification" 
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Upload failed" 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for retrieving prediction results
 * Returns JSON array of all classification results
 */
http.route({
  path: "/getPredictions",
  method: "GET", 
  handler: httpAction(async (ctx, request) => {
    try {
      const predictions = await ctx.runQuery(api.predictions.list);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: predictions,
          count: predictions.length
        }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to fetch predictions" 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

/**
 * HTTP endpoint for downloading results as CSV
 * Returns CSV file with all prediction data for analysis
 */
http.route({
  path: "/downloadResults",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const csvData = await ctx.runMutation(api.predictions.downloadResults);
      
      return new Response(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="particle-predictions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to generate CSV" 
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

export default http;
