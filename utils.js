import fs from 'fs'
import { innform } from './innform_module.js';

// Function to read data from a JSON file
async function readJsonFile(filePath) {
    logger.info(`Reading from ${filePath}`)
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseErr) {
                    reject(parseErr);
                }
            }
        });
    });
}

// Function to write data to data.json file
function writeToJson(data, filename) {
    // Convert the data to a JSON string format
    const jsonData = JSON.stringify(data, null, 2);
    logger.info(`Writing to ${filename}`)
    // Write the JSON data to a file named data.json
    fs.writeFile(filename, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log(`Data written to ${filename}`);
      }
    });
  }

  // Function to return the user name in the user data that matches the UUID passed in 
  async function getUserName(userUUID) {
    // Find the user with the matching UUID
    const user = innform.userData.find(user => user.id === userUUID);

    if (user) {
        return user.name
        // console.log(`The name of the user with UUID ${userUUID} is: ${user.name}`);
    } else {
        console.log(`User with UUID ${userUUID} not found.`);
    }
}

// Function to log only non-zero values
function logNonZeroValues(obj) {
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== 0) {
        console.log(`${key}: ${value}`);
      }
    });
  }

// Get UUID by user name
async function getUUID(userName) {
    const userData = innform.userData
    // Find the user with the matching name
    const user = userData.find(user => user.name === userName);
  
    if (user) {
        return user.id; // Return the UUID if the user is found
    } else {
        console.log(`User "${userName}" not found.`);
        return null; // Return null if the user is not found
    }
  }

// Check if course name provided matches a title in the course list
function isCourseTitleInList(courseTitle) {
    // Check if the courseTitle exists in the courseTitlesArray
    return innform.courseList.includes(courseTitle);
  }


export const utils = {
    readJsonFile,
    writeToJson,
    getUserName,
    logNonZeroValues,
    getUUID,
    isCourseTitleInList
}