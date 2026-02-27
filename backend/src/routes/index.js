const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Job routes
router.get('/jobs', jobController.getAllJobs);
router.get('/jobs/:id', jobController.getJobById);
router.post('/jobs', jobController.createJob);
router.put('/jobs/:id', jobController.updateJob);
router.delete('/jobs/:id', jobController.deleteJob);

// Status route
router.get('/status', (req, res) => {
  res.json({ status: 'API is running' });
});

module.exports = router;
