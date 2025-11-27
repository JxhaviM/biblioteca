const Agenda = require('agenda');
const connectDB = require('../config/db');
require('dotenv').config();

// Initialize Agenda with the same Mongo connection
let agenda;

const initAgenda = async () => {
  if (agenda) return agenda;

  const mongoConnectionString = process.env.MONGO_URI;
  agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'agendaJobs' } });

  // Load job definitions
  agenda.define('process-bulk-file', require('./processBulkJob'));

  await agenda.start();
  console.log('Agenda started');
  return agenda;
};

module.exports = { initAgenda };
