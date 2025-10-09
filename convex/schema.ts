import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  predictions: defineTable({
    fileName: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    predictedClass: v.string(),
    confidence: v.number(),
    imageUrl: v.optional(v.string()),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
