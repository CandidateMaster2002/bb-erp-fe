import fs from 'fs';
import csv from 'csv-parser';
import axios from 'axios';

// Change this to your local backend URL if you want it to run faster without internet latency!
const API_URL = 'http://localhost:8080/api/leads'; 

// Category ID mapper based on your explorer_categories table
const categoryMap = {
    '17': 'Founder/Owner',
    '18': 'Senior Leadership',
    '19': 'Senior IC',
    '20': 'Mid-Level Manager',
    '21': 'Early Career',
    '22': 'Academia/Research',
    '23': 'Government',
    '24': 'Investor/Advisor',
    '25': 'Student',
    '26': 'Freelancer/Consultant',
    '27': 'Unclear',
    '28': 'founder-beta'
};

const leadsToImport = [];

let dummyPhoneCounter = 9999000000;

fs.createReadStream('data.csv')
  .pipe(csv())
  .on('data', (row) => {
    // 1. Map Categories from IDs to readable Tags
    const tags = [];
    if (row.category_1 && categoryMap[row.category_1]) tags.push(categoryMap[row.category_1]);
    if (row.category_2 && categoryMap[row.category_2]) tags.push(categoryMap[row.category_2]);
    if (row.city) tags.push(row.city);

    // 2. Build the Payload matching our Frontend/Backend Model
    const leadPayload = {
      fullName: row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      company: row.company || 'Unknown',
      jobTitle: row.job_title || '',
      linkedinUrl: row.linkedin_url || '',
      profilePictureUrl: row.profile_picture_url || '',
      email: row.personal_email || row.work_email || '',
      phone: row.mobile_number || row.assumed_mobile_no || null,
      stage: 'New',          // Default stage
      priority: 'Medium',    // Default priority
      tags: tags,
      // You can also pass these to a "note" or "description" field if your backend supports it:
      // note: `LinkedIn: ${row.linkedin_url} | Batch: ${row.ism_batch_start}-${row.ism_batch_end}`
    };

    leadsToImport.push(leadPayload);
  })
  .on('end', async () => {
    console.log(`Successfully parsed ${leadsToImport.length} leads. Starting import...`);
    
    let successCount = 0;
    let errorCount = 0;

    // Send them to the API sequentially to avoid overloading the Render server
    for (let i = 0; i < leadsToImport.length; i++) {
        try {
            await axios.post(API_URL, leadsToImport[i]);
            successCount++;
            
            if (i % 100 === 0) {
                console.log(`Progress: Imported ${i} / ${leadsToImport.length}...`);
            }
        } catch (error) {
            errorCount++;
            if (error.response) {
                console.error(`Failed: ${leadsToImport[i].fullName} - Status: ${error.response.status} -`, error.response.data);
                
                // Stop early if it's a 401 Security error to save time
                if (error.response.status === 401) {
                    console.log("\n❌ STOPPING SCRIPT: Your backend returned a 401 Unauthorized.");
                    console.log("You MUST disable Spring Security on your backend (bb-erp-be) as discussed earlier before you can import data!");
                    break;
                }
            } else {
                console.error(`Failed: ${leadsToImport[i].fullName} - Error: ${error.message}`);
            }
        }
    }

    console.log(`\nImport Complete!`);
    console.log(`Successfully Imported: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
  });