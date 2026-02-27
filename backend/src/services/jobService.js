const Job = require('../db/models/Job');
const { getRedisClient } = require('../db/redis');

const getAllJobs = async () => {
  return await Job.find().sort({ createdAt: -1 });
};

const getJobById = async (id) => {
  return await Job.findById(id);
};

const createJob = async (jobData) => {
  const job = new Job(jobData);
  await job.save();
  
  // Publish job to Redis queue for worker processing
  const redis = getRedisClient();
  await redis.lPush('job_queue', JSON.stringify({
    id: job._id,
    type: job.type,
    payload: job.payload
  }));
  
  return job;
};

const updateJob = async (id, jobData) => {
  return await Job.findByIdAndUpdate(id, jobData, { new: true });
};

const deleteJob = async (id) => {
  return await Job.findByIdAndDelete(id);
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
