const axios = require('axios');

const updates = [
  { id: 2471, linkedinUrl: 'https://www.linkedin.com/in/anuradha-sarangi-5a52a64', mobileNumber: '+91 99100 61830' },
  { id: 2605, linkedinUrl: 'https://www.linkedin.com/in/neer123', mobileNumber: '+91-77680 60756, +91-98211 09324' },
  { id: 4366, linkedinUrl: 'https://www.linkedin.com/in/susheelkuma', mobileNumber: '+91 99989 85087' },
  { id: 4367, linkedinUrl: 'https://www.linkedin.com/in/nilakshi-bhattacharya-125121242' },
  { id: 4368, linkedinUrl: 'https://www.linkedin.com/in/priyanka-panjwani-940882b1', mobileNumber: '+91 86548 58459' },
  { id: 4369, linkedinUrl: 'https://www.linkedin.com/in/saurabh-mehta-ab3018114' },
  { id: 4370, linkedinUrl: 'https://www.linkedin.com/in/mohini-malik-99068215' },
  { id: 4371, linkedinUrl: 'https://www.linkedin.com/in/shilpi-kumar-35335214', mobileNumber: '+91-98925 68805' },
  { id: 4372, linkedinUrl: 'https://www.linkedin.com/in/soumenchatterjee/', mobileNumber: '+91 90004 11196, +91-90004 11192' },
  { id: 4373, linkedinUrl: 'https://www.linkedin.com/in/nikhil-kumar-kukkamalla-3231a5138' }
];

async function run() {
  for (const lead of updates) {
    try {
      await axios.put(`https://bb-erp-be.onrender.com/api/leads/${lead.id}`, lead);
      console.log(`Updated ${lead.id}`);
    } catch (e) {
      console.log(`Failed to update ${lead.id}: ${e.message}`);
    }
  }
}
run();
