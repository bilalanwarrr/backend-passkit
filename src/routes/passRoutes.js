const express = require("express");
const multer = require("multer");
const jobQueue = require("../longRunningTasks/jobs");
const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post(
  "/create",
  upload.fields([
    { name: "offers", maxCount: 1 },
    { name: "users", maxCount: 1 },
  ]),
  async (req, res) => {
    const campaignId = req.body.campaignId;
    const beforeRedeemPassTemplateId = req.body.templateId;
    const userEmail = req.body.email;

    if (!req.files) {
      return res.status(400).send("No files were uploaded.");
    }

    const job = await jobQueue.add({
      campaignId,
      beforeRedeemPassTemplateId,
      files: req.files,
      userEmail,
    });

    res.json({ jobId: job.id, status: "Job queued" });
  }
);

// Add an endpoint to check the status of the job
router.post("/jobStatus", async (req, res) => {
  const jobId = req.body.jobId;

  if (!jobId) {
    return res.status(400).send("Job ID is required");
  }

  try {
    const job = await jobQueue.getJob(jobId);
    console.log("Job:", job);

    if (!job) {
      return res.status(404).send("Job not found");
    }

    const state = await job.getState();
    const progress = job.progress();
    const reason = job.failedReason || null;

    res.json({ jobId, state, progress, reason });
  } catch (error) {
    console.error("Error fetching job status:", error);
    res.status(500).send("Error fetching job status");
  }
});

module.exports = router;
