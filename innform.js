import fs from 'fs'
import axios from 'axios';
import dotenv from 'dotenv';
import logger from "./logger.js";
import OpenAI from 'openai';
import readlineSync from 'readline-sync'
import chalk from 'chalk'
dotenv.config();

const args = process.argv.slice(2);
let baseInstruction = args[1]
const courseName = args[0]
const switchFilterInstruction = args[2]
const userListInstruction = args[3]
const apiUrl = 'https://api.innform.io/v1/'

logger.info(`courseName - ${courseName}, arg 0 ${args[0]}`)
logger.info(`baseInstruction - ${baseInstruction}, arg 1 ${args[1]}`)
logger.info(`switchFilterInstruction - ${switchFilterInstruction}, arg 2 ${args[2]}`)
logger.info(`userListInstruction - ${userListInstruction}, args 3 ${args[3]}`)

if (courseName === '-l') {
    baseInstruction = courseName
}

if (courseName === '-q') {
  baseInstruction = courseName
}

if (courseName === '-users') {
  baseInstruction = courseName
}

const apiKey = process.env.INNFORM_API_KEY;

const courseData = await fetchApi('courses')
const courseList = await logCourseTitles(courseData)
const userData = await fetchApi('users')
// Test Data
const assignmentsDataFile = 'assignments.json'
const userDataFile = 'users.json'

const openAIClient = new OpenAI({
  openAiApiKey: process.env['OPENAI_API_KEY']
});

const prompt = `
You are a helpful assistant designed to interpret user requests into specific script instructions. Based on the statement provided by the user, translate it into an object format containing the course name, base instruction, filter, and user list that the script should use. The script instructions can include:

•	-s: Get the statuses of a course.
•	-r: Get the results of a course.
•	-l: List all course titles.
•	-x: A placeholder for future functionality (not currently active).
•	Filters: Options like /completed, /in_progress, /pending, /overdue, /failed, /expired, /in_review to filter results for statuses. Options like /full, /below to filter results for course results.

•	User List: A boolean indicating whether to include the /users option to list users who match the filter criteria.

The output should be in the following format:
{
"courseName": "<courseName>",
"baseInstruction": "<baseInstruction>",
"filter": "<filter>",
"userList": <true|false>
}
Examples of User Statements and Expected Responses:

1.	User Statement: “I want to see all the course titles.”
•	AI Response:
{
"courseName": null,
"baseInstruction": "-l",
"filter": null,
"userList": false
}
2.	User Statement: “Show me the results for a course.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-r",
"filter": null,
"userList": false
}
3.	User Statement: “List the assignment statuses for a course.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-s",
"filter": null,
"userList": false
}
4.	User Statement: “I need details on all courses.”
•	AI Response:
{
"courseName": null,
"baseInstruction": "-l",
"filter": null,
"userList": false
}
5.	User Statement: “Check the statuses for a course-name with a filter for completed assignments.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-s",
"filter": "/completed",
"userList": false
}
6.	User Statement: “Show me the list of users from course-name with completed assignments for a course.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-s",
"filter": "/completed",
"userList": true
}
7.	User Statement: “Get the results of course-name filtered by assignments in progress.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-r",
"filter": "/in_progress",
"userList": false
}
8.	User Statement: “Show users with failed assignments for course name.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-s",
"filter": "/failed",
"userList": true
}
9.	User Statement: “List all overdue assignments for course-name.”
•	AI Response:
{
"courseName": "<courseName>",
"baseInstruction": "-s",
"filter": "/overdue",
"userList": false
}
Now, based on the following statement and the course list ${courseList}, provide only the correct instruction in the object format:`



// This function connects to the end point and returns the response
async function fetchApi(endpoint) {
    const url = `${apiUrl}${endpoint}`
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}` }
    })
    return response.data
}

// This function reads the data from a JSON file
async function readJsonFile(filePath) {
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


// Lists course titles
async function logCourseTitles(courseData) {
    return courseData.map(course => {
        // Initialize counters for each status
        let completedCount = 0;
        let inProgressCount = 0;
        let pendingCount = 0;

        // Iterate over each assignment in the course
        course.assignments.forEach(assignment => {
            if (assignment.status === 'completed') {
                completedCount++;
            } else if (assignment.status === 'in_progress') {
                inProgressCount++;
            } else if (assignment.status === 'pending') {
                pendingCount++;
            }
        });

        // Return a string in the desired format
        return `${course.title}, ${completedCount}, ${inProgressCount}, ${pendingCount}`;
    }).sort((a, b) => a.localeCompare(b)); // Sort the array by title A-Z
}


// lists the total assignments of the course taken in on the first argument
async function totalAssignments(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        return course.assignments.length
        // console.log(`Total number of assignments for ${courseName}: ${course.assignments.length}`)
    } else {
        console.log('Course not found')
        process.exit(1)
    }
}

// Lists the status numbers from the course taken in
async function listAssignmentStatus(courseName) {
    const statusCounts = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0,
        failed: 0,
        expired: 0,
        in_review: 0
    };

    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Iterate over the assignments and count the statuses
        course.assignments.forEach(assignment => {
            if (statusCounts.hasOwnProperty(assignment.status)) {
                statusCounts[assignment.status]++;
            }
        });
        return statusCounts
        // console.log(`Assignment Status Counts for "${courseName}":`);
        // for (const status in statusCounts) {
        //     console.log(`${status}: ${statusCounts[status]}`);
        // }
    } else {
        console.log(`Course "${courseName}" not found.`);
    }
}

// Lists how assignments have had a perfect score
async function perfectScores(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Count the number of assignments with a perfect score (100%)
        const perfectScoreCount = course.assignments.filter(assignment => assignment.result === 100).length;
        return perfectScoreCount
    } else {
        return (`Course "${courseName}" not found.`);
    }
}

// Lists how many assignments are in a range
async function assignmentsInRange(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Count the number of assignments with scores ranging
        const countInRange = course.assignments.filter(
            assignment => assignment.result >= 80 && assignment.result <= 99
        ).length;
        return countInRange
    } else {
        return (`Course "${courseName}" not found.`);
    }
}

// Lists how many assignments are in a below 66.66%
async function assignmentsBelow66(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Count the number of assignments with scores ranging from 66.66% to 80%
        const countInRange = course.assignments.filter(
            assignment => assignment.result < 66
        ).length;
        return countInRange
    } else {
        return (`Course "${courseName}" not found.`);
    }
}

// Lists the highest score observed
async function logHighestScoreForCourse(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        let highestScore = -Infinity;

        // Iterate over the assignments and find the highest score
        course.assignments.forEach(assignment => {
            if (assignment.score > highestScore) {
                highestScore = assignment.score;
            }
        });

        console.log(`The highest score observed in "${courseName}" is: ${highestScore}`);
    } else {
        console.log(`Course "${courseName}" not found.`);
    }
}

// Lists the lowest non-zero score
async function listLowestNonZeroScoreForCourse(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        let lowestScore = Infinity;

        // Iterate over the assignments and find the lowest non-zero score
        course.assignments.forEach(assignment => {
            if (assignment.score > 0 && assignment.score < lowestScore) {
                lowestScore = assignment.score;
            }
        });

        if (lowestScore === Infinity) {
            console.log(`No non-zero scores found in "${courseName}".`);
        } else {
            console.log(`The lowest non-zero score observed in "${courseName}" is: ${lowestScore}`);
        }
    } else {
        console.log(`Course "${courseName}" not found.`);
    }
}


// List course due date
async function logCourseDueDate(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        let dueDate = null;

        // Iterate over the assignments to find the first non-null due date
        course.assignments.forEach(assignment => {
            if (assignment.due_date && !dueDate) {
                dueDate = assignment.due_date;
            }
        });

        if (dueDate) {
            // Convert the due date to a Date object and format it
            const dateObj = new Date(dueDate);
            const formattedDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            }).format(dateObj);

            // Calculate the difference in days between the due date and today
            const today = new Date();
            const timeDifference = dateObj - today;
            const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

            console.log(`The due date for the course "${courseName}" is: ${formattedDate}`);

            if (daysDifference > 0) {
                return (`${daysDifference} days remaining until the due date.`);
            } else if (daysDifference < 0) {
                return (`${Math.abs(daysDifference)} days overdue.`);
            } else {
                return (`The due date is today.`);
            }
        } else {
            return (`No due date found for the course "${courseName}".`);
        }
    } else {
        console.log(`Course "${courseName}" not found.`);
    }
}

// Lists completion times
async function assignmentsCompletionTimes(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        let completedBeforeDueDate = 0;
        let completedWithinTwoDaysOfDueDate = 0;
        let completedWithinThreeDaysOfAssignment = 0;

        // Iterate over the assignments to evaluate their completion times
        course.assignments.forEach(assignment => {
            if (assignment.completed_at && assignment.due_date && assignment.assigned_at) {
                const completedDate = new Date(assignment.completed_at);
                const dueDate = new Date(assignment.due_date);
                const assignedDate = new Date(assignment.assigned_at);

                const dueDateDifference = dueDate - completedDate;
                const daysUntilDueDate = Math.ceil(dueDateDifference / (1000 * 60 * 60 * 24));

                const assignedDateDifference = completedDate - assignedDate;
                const daysSinceAssignment = Math.ceil(assignedDateDifference / (1000 * 60 * 60 * 24));

                if (daysUntilDueDate > 0) {
                    completedBeforeDueDate++;
                } else if (daysUntilDueDate >= -2 && daysUntilDueDate <= 0) {
                    completedWithinTwoDaysOfDueDate++;
                }

                if (daysSinceAssignment <= 3) {
                    completedWithinThreeDaysOfAssignment++;
                }
            }
        });

        console.log(`In the course "${courseName}":`);
        console.log(`${completedBeforeDueDate} assignments were completed before the due date.`);
        console.log(`${completedWithinTwoDaysOfDueDate} assignments were completed within 2 days of the due date.`);
        console.log(`${completedWithinThreeDaysOfAssignment} assignments were completed within 3 days of being assigned.`);
    } else {
        console.log(`Course "${courseName}" not found.`);
    }
}

// Returns number of assignments as a status
async function countStatusAssignments(courseName, status) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Filter assignments that have a status like the argument and count them
        const statusAssignments = course.assignments.filter(assignment => assignment.status === status);
        return statusAssignments.length;
    } else {
        console.log(`Course "${courseName}" not found.`);
        return 0;
    }
}

// Gets the date course was assigned
async function getCourseAssignedDate(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        if (course.assignments.length > 0) {
            const assignedDate = new Date(course.assignments[0].assigned_at);
            const dueDate = new Date(course.assignments[0].due_date);

            // Format the dates as DD-MMM-YY
            const formattedAssignedDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            }).format(assignedDate);

            const formattedDueDate = new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
            }).format(dueDate);

            return {
                assignedDate: formattedAssignedDate,
                dueDate: formattedDueDate
            };
        } else {
            console.log(`No assignments found for the course "${courseName}".`);
            return null;
        }
    } else {
        console.log(`Course "${courseName}" not found.`);
        return null;
    }
}

// Lists UUIDs of users by status
async function getUsers(courseName, status) {
    const userUUIDs = new Set();

    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Iterate over each assignment in the course
        for (const assignment of course.assignments) {
            if (assignment.status === status) {
                let userName = await getUserNameByUUID(assignment.user_id);
                userUUIDs.add(userName);
            }
        }

        // Convert the Set to an array and return it
        return Array.from(userUUIDs);
    } else {
        console.log(`Course "${courseName}" not found.`);
        return [];
    }
}


// This get the user name from the UUID
async function getUserNameByUUID(userUUID) {
    // Find the user with the matching UUID
    const user = userData.find(user => user.id === userUUID);

    if (user) {
        return user.name
        // console.log(`The name of the user with UUID ${userUUID} is: ${user.name}`);
    } else {
        console.log(`User with UUID ${userUUID} not found.`);
    }
}

// Function to get the average score
async function getAverageScore(courseName) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);


    if (course) {
        // Filter out assignments with a percentage of 0
        const validAssignments = course.assignments.filter(assignment => assignment.result > 0);

        const totalPercentage = validAssignments.reduce((total, assignment) => {
            return total + assignment.result;
        }, 0);

        const numberOfAssignments = validAssignments.length;

        if (numberOfAssignments === 0) {
            console.log(`No valid assignments found for the course "${courseName}".`);
            return 0;
        }

        // Calculate the average percentage and round up to the nearest whole number
        const averagePercentage = Math.ceil(totalPercentage / numberOfAssignments);
        return averagePercentage;
    } else {
        console.log(`Course "${courseName}" not found.`);
        return 0;
    }
}

// Gets the user list for perfect scores
async function getUsersWithPerfectScore(courseName) {
    const userUUIDs = [];

    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Iterate over each assignment in the course
        for (const assignment of course.assignments) {
            if (assignment.result === 100) { // Assuming result is the percentage score
                let userName = await getUserNameByUUID(assignment.user_id);
                userUUIDs.push(userName);
            }
        }

        return userUUIDs;
    } else {
        console.log(`Course "${courseName}" not found.`);
        return [];
    }
}

// Gets the user list for below scores
async function getUsersWithBelowScore(courseName) {
    const userUUIDs = [];

    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Iterate over each assignment in the course
        for (const assignment of course.assignments) {
            if (assignment.result >= 80 && assignment.result < 100) { // Assuming result is the percentage score
                let userName = await getUserNameByUUID(assignment.user_id);
                userUUIDs.push(userName);
            }
        }

        return userUUIDs;
    } else {
        console.log(`Course "${courseName}" not found.`);
        return [];
    }
}



// List everything
async function listCourseData(courseName) {
    totalAssignments(courseName)
    listAssignmentStatus(courseName)
    perfectScores(courseName)
    assignmentsInRange(courseName)
    logHighestScoreForCourse(courseName)
    listLowestNonZeroScoreForCourse(courseName)
    logCourseDueDate(courseName)
    assignmentsCompletionTimes(courseName)

}

// gets the user info from the UUID
async function userInformation(userUUID) {
  const userAssignments = [];

  // Iterate over each course
  courseData.forEach(course => {
    // Iterate over each assignment in the course
    course.assignments.forEach(assignment => {
      if (assignment.user_id === userUUID) {
        // Format dates
        const assignedDate = assignment.assigned_at
          ? new Date(assignment.assigned_at).toLocaleDateString('en-GB')
          : 'Not Assigned';
        const completedDate = assignment.completed_at
          ? new Date(assignment.completed_at).toLocaleDateString('en-GB')
          : 'Not Completed';

        // Calculate the difference in days between assigned and completed dates
        let daysBetween = 'N/A';
        if (assignment.assigned_at && assignment.completed_at) {
          const assignedDateObj = new Date(assignment.assigned_at);
          const completedDateObj = new Date(assignment.completed_at);
          const timeDifference = completedDateObj - assignedDateObj;
          daysBetween = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
        }

        userAssignments.push({
          Course: course.title,
          Status: assignment.status,
          Result: assignment.result,
          'Assigned At': assignedDate,
          'Completed At': completedDate,
          'Days Between': daysBetween,
        });
      }
    });
  });

  if (userAssignments.length > 0) {
    console.log(`User: ${courseName}`);
    console.table(userAssignments); // Use console.table to display results in a table format
  } else {
    console.log(`No assignments found for user UUID: ${userUUID}`);
  }
}


async function queryOpenAI() {

  while (true) {
    const userInput = readlineSync.question(chalk.bold.yellow('Query: '))
    logger.user_message(`${userInput}`)
    try {
      // Call the API


      const chatCompletion = await openAIClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: `${prompt} ${userInput}` }
        ]
      })
      const completionText = chatCompletion.choices[0].message.content
      const parsedObject = JSON.parse(completionText);
      if (userInput === 'exit') {
        return
      }

      console.log(chalk.bold.blue('Innform: '))
      const baseInstruction = parsedObject.baseInstruction
      const courseName = parsedObject.courseName
      const switchFilterInstruction = parsedObject.filter
      const userListInstruction = parsedObject.userList
      logger.info(`Base Instruction: "${baseInstruction}"`)
      logger.info(`Course Name: ${courseName}`)
      logger.info(`Switch Filter: ${switchFilterInstruction}`)
      logger.info(`User List requested: ${userListInstruction}`)

      switch (baseInstruction) {
        case '-s': // Statuses of course
          logger.info(`- q -s activated`)
          if (!courseName) {
            console.log('Course name missing')
            process.exit(1)
        } else {
            const totalNumberOfAssignments = await totalAssignments(courseName)
            const statusesOfAssignments = await listAssignmentStatus(courseName)
            const assignedDate = await getCourseAssignedDate(courseName)
            console.log(courseName)
            console.log(assignedDate)
            if (!switchFilterInstruction) {
      
                console.log(`Assignments: ${totalNumberOfAssignments}`)
                console.log(statusesOfAssignments)
            }
            else if (!userListInstruction) {
                const filterInstruction = switchFilterInstruction.replace(/^\//, "");
                const statusNumberOfCourse = await countStatusAssignments(courseName, filterInstruction)
                console.log(`${filterInstruction}: ${statusNumberOfCourse}`)
            } else {
                const filterInstruction = switchFilterInstruction.replace(/^\//, "");
                const userList = await getUsers(courseName, filterInstruction)
                const daysToDeadline = await logCourseDueDate(courseName)
                console.log(`Users with ${filterInstruction} status:`)
                console.log(userList)
                console.log(daysToDeadline)
            }
        }
          break;
        case '-r': // Results of course
          logger.info(`-q -r activated`)
          if (!courseName) {
            console.log('Course name missing')
            process.exit(1)
        } else {
            const totalNumberOfAssignments = await totalAssignments(courseName)
            const statusesOfAssignments = await listAssignmentStatus(courseName)
            const assignedDate = await getCourseAssignedDate(courseName)
            console.log(courseName)
            console.log(assignedDate)
            if (!switchFilterInstruction) {
                const totalNumberOfAssignments = await countStatusAssignments(courseName, "completed")
                const numberOfPerfectScores = await perfectScores(courseName)
                const numberOfRangedScored = await assignmentsInRange(courseName)
                const averageScore = await getAverageScore(courseName)
                console.log(`Complete: ${totalNumberOfAssignments}`)
                console.log(`Full Marks: ${numberOfPerfectScores}`)
                console.log(`80%-99%: ${numberOfRangedScored}`)
                console.log(`Average Score: ${averageScore}%`)
            }
            else if (!userListInstruction) {
                const filterInstruction = switchFilterInstruction.replace(/^\//, "");
                if (filterInstruction === "full") {
                    const numberOfPerfectScores = await perfectScores(courseName)
                    console.log(`Full Marks: ${numberOfPerfectScores}`)
                } else {
                    const numberOfRangedScored = await assignmentsInRange(courseName)
                    console.log(`80%-99%: ${numberOfRangedScored}`)
                }
      
            } else {
                if (switchFilterInstruction === "/full") {
                    const numberOfPerfectScores = await perfectScores(courseName)
                    const userList = await getUsersWithPerfectScore(courseName)
                    console.log(`Full Marks: ${numberOfPerfectScores}`)
                    console.log(userList)
                } else {
                    const userList = await getUsersWithBelowScore(courseName)
                    const numberOfRangedScored = await assignmentsInRange(courseName)
                    console.log(`80%-99%: ${numberOfRangedScored}`)
                    console.log(userList)
                }
      
                
            }
          }
          break;
        case '-l':
          logger.info(`-q -l activated`)
          const courseTitles = await logCourseTitles(courseData)
          console.log(courseTitles)
          break;
        default:
          console.log('default break')
          break;
      }



    } catch (error) {
      console.error(chalk.red.bold(`ERROR: 723 ${error}`))
    }
  }
}

// List Users
async function listUsers(){
  const userList = await fetchApi('users')
  console.log(userList)
}

async function getUserUUIDByName(userName) {
  // Find the user with the matching name
  const user = userData.find(user => user.name === userName);

  if (user) {
      return user.id; // Return the UUID if the user is found
  } else {
      console.log(`User "${userName}" not found.`);
      return null; // Return null if the user is not found
  }
}

// listCourseData("Sentiment and Summarisation", "completed")

console.clear()

switch (baseInstruction) {
  case `-s`: // Statuses of Course
    logger.info(`-s activated`)
    if (!courseName) {
      console.log('Course name missing')
      process.exit(1)
  } else {
      const totalNumberOfAssignments = await totalAssignments(courseName)
      const statusesOfAssignments = await listAssignmentStatus(courseName)
      const assignedDate = await getCourseAssignedDate(courseName)
      console.log(courseName)
      console.log(assignedDate)
      if (!switchFilterInstruction) {

          console.log(`Assignments: ${totalNumberOfAssignments}`)
          console.log(statusesOfAssignments)
      }
      else if (!userListInstruction) {
          const filterInstruction = switchFilterInstruction.replace(/^\//, "");
          const statusNumberOfCourse = await countStatusAssignments(courseName, filterInstruction)
          console.log(`${filterInstruction}: ${statusNumberOfCourse}`)
      } else {
          const filterInstruction = switchFilterInstruction.replace(/^\//, "");
          const userList = await getUsers(courseName, filterInstruction)
          const daysToDeadline = await logCourseDueDate(courseName)
          console.log(`Users with ${filterInstruction} status:`)
          console.log(userList)
          console.log(daysToDeadline)
      }
  }
    break;
  case `-r`: // Get results
    logger.info(`-r activated`)
    if (!courseName) {
      console.log('Course name missing')
      process.exit(1)
  } else {
      const totalNumberOfAssignments = await totalAssignments(courseName)
      const statusesOfAssignments = await listAssignmentStatus(courseName)
      const assignedDate = await getCourseAssignedDate(courseName)
      console.log(courseName)
      console.log(assignedDate)
      if (!switchFilterInstruction) {
          const totalNumberOfAssignments = await countStatusAssignments(courseName, "completed")
          const numberOfPerfectScores = await perfectScores(courseName)
          const numberOfRangedScored = await assignmentsInRange(courseName)
          const averageScore = await getAverageScore(courseName)
          console.log(`Complete: ${totalNumberOfAssignments}`)
          console.log(`Full Marks: ${numberOfPerfectScores}`)
          console.log(`80%-99%: ${numberOfRangedScored}`)
          console.log(`Average Score: ${averageScore}%`)
      }
      else if (!userListInstruction) {
          const filterInstruction = switchFilterInstruction.replace(/^\//, "");
          if (filterInstruction === "full") {
              const numberOfPerfectScores = await perfectScores(courseName)
              console.log(`Full Marks: ${numberOfPerfectScores}`)
          } else {
              const numberOfRangedScored = await assignmentsInRange(courseName)
              console.log(`80%-99%: ${numberOfRangedScored}`)
          }

      } else {
          if (switchFilterInstruction === "/full") {
              const numberOfPerfectScores = await perfectScores(courseName)
              const userList = await getUsersWithPerfectScore(courseName)
              console.log(`Full Marks: ${numberOfPerfectScores}`)
              console.log(userList)
          } else {
              const userList = await getUsersWithBelowScore(courseName)
              const numberOfRangedScored = await assignmentsInRange(courseName)
              console.log(`80%-99%: ${numberOfRangedScored}`)
              console.log(userList)
          }

          
      }
  }
    break;
  case '-l':
    logger.info(`-l activated`)
    const courseTitles = await logCourseTitles(courseData)
    console.log(courseTitles)
  break;
  case '-q': // openAI code 
    logger.info(`-q activated`)
    queryOpenAI()


break;
case '-info': // openAI code 
logger.info(`-info activated`)
const userUUID = await getUserUUIDByName(courseName)
userInformation(userUUID)


break;
  default:
    logger.warn(`Default code triggered`)
    break;
}