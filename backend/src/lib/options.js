// Keep these values and labels in step with frontend/src/lib/contact.ts.

const PROJECT_TYPE_LABELS = Object.freeze({
  "web-mobile": "Web or mobile app",
  "business-system": "Business system",
  "hardware-iot": "Hardware or IoT",
  infrastructure: "Infrastructure or IT",
  "not-sure": "Not sure yet",
});

const TIMELINE_LABELS = Object.freeze({
  asap: "As soon as possible",
  "within-3-months": "Within 3 months",
  later: "Later",
  exploring: "Just exploring",
});

module.exports = { PROJECT_TYPE_LABELS, TIMELINE_LABELS };
