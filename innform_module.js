import axios from 'axios';
import dotenv from 'dotenv';
import logger from "./logger.js";
import readlineSync from 'readline-sync'
import chalk from 'chalk'
import { utils } from './utils.js';

dotenv.config();

const apiKey = process.env.INNFORM_API_KEY;

const courseData = await fetchApi('courses')
const userData = await fetchApi('users')
const courseList = await getCourseTitles(courseData)

// Function to connect to the endpoint and returns the response
async function fetchApi(endpoint) {
    const apiUrl = 'https://api.innform.io/v1/'
    const url = `${apiUrl}${endpoint}`
    logger.innform(`Making api call to ${url}`)
    const response = await axios.get(url, {
        headers: { Authorization: `Basic ${Buffer.from(apiKey).toString('base64')}` }
    })
    return response.data
}

// Function to get a list of course from the course data
async function getCourseTitles(courseData) {
    logger.innform(`Fetched course titles`)
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
        return `${course.title}`;
    }).sort((a, b) => a.localeCompare(b)); // Sort the array by title A-Z
}

// Function to get the total number of assignents of a passed in course
async function getTotalAssignments(courseName) {
    logger.innform(`Getting total assignments for ${courseName}`)
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

// Function to get the total for each course statuses of a passed in course
async function getCourseStatus(courseName) {
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
    } else {
        console.log(`Course "${courseName}" not found.`);
    }
}

// Function to return number of 100% scores on a passed in course
async function getNumberOfFullMarks(courseName) {
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

// Function to return the number of scores within a passed through range and course
async function scoresInRange(courseName, min, max) {
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);

    if (course) {
        // Count the number of assignments with scores ranging
        const countInRange = course.assignments.filter(
            assignment => assignment.result >= min && assignment.result <= max
        ).length;
        return countInRange
    } else {
        return (`Course "${courseName}" not found.`);
    }
}

// Function to return the highest score observed for a passed in course
async function getHighestScore(courseName) {
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

// Function to return the lowest score observed for a passed in course
async function getLowestScore(courseName) {
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

// Function to return the course due date
async function getCourseDueDate(courseName) {
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

// Function to log the course completion time scales
async function completionTimeScales(courseName) {
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

// Function to get the date the course was assigned
async function dateCourseAssigned(courseName) {
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

// Function to get the average score of a passed through course
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

// Function to get user information (courses assigned, statuses, scores) from the a UUID passed in
async function getUserList(courseName, status) {
    const userDetails = []; // Array to store user details
  
    // Find the course with the given name
    const course = courseData.find(course => course.title === courseName);
  
    if (course) {
      // Iterate over each assignment in the course
      for (const assignment of course.assignments) {
        if (assignment.status === status) {
          let userName = await utils.getUserName(assignment.user_id);
  
          // Format the completed date to DD-MMM-YY if status is 'completed'
          const formattedDate = status === 'completed' && assignment.completed_at
            ? new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
              }).format(new Date(assignment.completed_at))
            : null;
  
          // Create an object with the learner's name, score, and formatted completed date
          const userDetail = {
            name: userName,
            score: status === 'completed' ? assignment.result : null, // Add score only if status is 'completed'
            completedDate: formattedDate // Add formatted date only if status is 'completed'
          };
  
          // Add the object to the userDetails array
          userDetails.push(userDetail);
        }
      }
  
      // Sort the userDetails array alphabetically by name
      userDetails.sort((a, b) => a.name.localeCompare(b.name));
  
      // Return the sorted array of user details
      return userDetails;
    } else {
      console.log(`Course "${courseName}" not found.`);
      return [];
    }
  }

// Gets the user infomration
async function getUserCourseDetails(userUUID) {
    const userCourseDetails = []; // Array to store user course details
    let totalScore = 0; // To calculate the total score for completed courses
    let completedCount = 0; // To count the number of completed courses
  
    // Iterate over each course
    courseData.forEach(course => {
      // Iterate over each assignment in the course
      course.assignments.forEach(assignment => {
        if (assignment.user_id === userUUID) {
          // Format the assigned date
          const assignedDate = assignment.assigned_at
            ? new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
              }).format(new Date(assignment.assigned_at))
            : 'Not Assigned';
  
          // Format the completed date
          const completedDate = assignment.completed_at
            ? new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: '2-digit'
              }).format(new Date(assignment.completed_at))
            : 'Not Completed';
  
          // If the course is completed, add the result to the total score
          if (assignment.status === 'completed') {
            totalScore += assignment.result;
            completedCount++;
          }
  
          // Push the assignment details to the userCourseDetails array
          userCourseDetails.push({
            courseTitle: course.title,
            status: assignment.status,
            result: assignment.status === 'completed' ? assignment.result : null,
            assignedDate: assignedDate,
            completedDate: completedDate
          });
        }
      });
    });
  
    // Calculate the average score for the user if there are completed courses
    const averageScore = completedCount > 0 ? (totalScore / completedCount).toFixed(2) : 'N/A';
  
    return {
      averageScore,
      userCourseDetails
    };
  }
  
async function getUserNamesAndGroups(userList) {
    // Array to store the result
    const result = [];
  
    // Iterate over each user in the userList array
    userList.forEach(user => {
      // Get the user's name
      const userName = user.name;
      
      // Check if the user has groups and extract group names
      const groupNames = user.groups.map(group => group.name);
  
      // Push the name and group names to the result array
      result.push({
        name: userName,
        groups: groupNames
      });
    });
  
    return result;
  }

export const innform = {
    courseData,
    courseList,
    userData,
    fetchApi,
    getTotalAssignments,
    getCourseStatus,
    getNumberOfFullMarks,
    scoresInRange,
    getHighestScore,
    getLowestScore,
    getCourseDueDate,
    completionTimeScales,
    dateCourseAssigned,
    getAverageScore,
    getUserList,
    getUserCourseDetails,
    getUserNamesAndGroups
}