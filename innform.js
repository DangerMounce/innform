// Primary script
import logger from "./logger.js";
import { innform } from "./innform_module.js";
import chalk from 'chalk'
import { utils } from "./utils.js";
import { ai } from "./openai.js";

const args = process.argv.slice(2);
let baseInstruction = args[1]
let courseName = args[0]
const filterInstruction = args[2]
const userListRequested = args[3]

logger.info(`courseName - ${courseName} = args 0 - ${args[0]}`)
logger.info(`baseInstruction - ${baseInstruction} = args 1 - ${args[1]}`)
logger.info(`filterInstruction - ${filterInstruction} = args 2 - ${args[2]}`)
logger.info(`userListRequested - ${userListRequested} = args 3 - ${args[3]}`)

// If course name is not included, the value at courseName needs to become the base instruction
if (courseName === '-l') {
    logger.info(`Applying courseName to baseInstruction`)
    baseInstruction = courseName
    logger.info(`baseInstruction - ${baseInstruction} = args 1 - ${args[1]}`)
}
if (courseName === '-users') {
    logger.info(`Applying courseName to baseInstruction`)
    baseInstruction = courseName
    logger.info(`baseInstruction - ${baseInstruction} = args 1 - ${args[1]}`)
}

if (courseName === '-write') {
    logger.info(`Applying courseName to baseInstruction`)
    baseInstruction = courseName
    logger.info(`baseInstruction - ${baseInstruction} = args 1 - ${args[1]}`)
}

if (courseName === '-daily') {
    logger.info(`Applying courseName to baseInstruction`)
    baseInstruction = courseName
    logger.info(`baseInstruction - ${baseInstruction} = args 1 - ${args[1]}`)
}

if (courseName === '-help') {
    logger.info(`Applying courseName to baseInstruction`)
    baseInstruction = courseName
    logger.info(`baseInstruction - ${baseInstruction} = args 1 - ${args[1]}`)
}

console.clear()
switch (baseInstruction) {
    case `-l`:
        logger.info(`List of courses requested`)
        console.log(innform.courseList)
        break;
    case `-s`:
        if (!utils.isCourseTitleInList(courseName)) {
            const weirdcourseName = courseName
            courseName = await ai.getTheCourseTitle(weirdcourseName)
        } 
        logger.info(`summary of courses requested`)
        console.log(chalk.bold.yellow(courseName))
        const courseAssignedDate = await innform.dateCourseAssigned(courseName)
        const courseStatuses = await innform.getCourseStatus(courseName)
        const averageScore = await innform.getAverageScore(courseName)
        console.log('')
        console.log(chalk.bold.green(`Date Assigned:`, chalk.bold.white(courseAssignedDate.assignedDate)))
        console.log(chalk.bold.green(`Average Score:`, chalk.bold.white(`${averageScore}%`)))
        utils.logNonZeroValues(courseStatuses)
        // Pending LIst
        console.log('')
        const pendingList = await innform.getUserList(courseName, "pending")
        console.log(chalk.bold.red(`Not Started (${pendingList.length})`))
        pendingList.forEach(user => {
            // Check if score is available and log accordingly
            if (user.score !== null) {
                console.log(chalk.bold.green(`${user.name} - (${user.score}%)`));
            } else {
                console.log(chalk.bold.green(user.name));
            }
        });
        // In Progress List
        console.log('')
        const inProgressList = await innform.getUserList(courseName, "in_progress")
        console.log(chalk.bold.yellow(`In Progress (${inProgressList.length})`))
        inProgressList.forEach(user => {
            // Check if score is available and log accordingly
            if (user.score !== null) {
                console.log(chalk.bold.green(`${user.name} - (${user.score}%)`));
            } else {
                console.log(chalk.bold.green(user.name));
            }
        });
         // Completed List
         console.log('')
         const completedList = await innform.getUserList(courseName, "completed")
         console.log(chalk.bold.blue(`Completed (${completedList.length})`))
         completedList.forEach(user => {
             // Check if score is available and log accordingly
             if (user.score !== null) {
                 console.log(chalk.bold.green(`${user.name} ${chalk.bold.dim(user.completedDate)} - (${user.score}%)`));
             } else {
                 console.log(chalk.bold.green(user.name));
             }
         });
        break;
    case '-i':
        const userUUID = await utils.getUUID(courseName);
        const userInformation = await innform.getUserCourseDetails(userUUID);
      
        // Log the average score with course name in bold yellow
        console.log(`${chalk.bold.yellow(courseName)} - Average Score: ${userInformation.averageScore}%`);
      
        // Sort the userCourseDetails array by assignedDate in descending order
        userInformation.userCourseDetails.sort((a, b) => {
          const dateA = new Date(a.assignedDate);
          const dateB = new Date(b.assignedDate);
          return dateB - dateA; // Sort by descending order
        });
      
        // Prepare data for table output
        const tableData = userInformation.userCourseDetails.map(course => ({
          'Course Title': course.courseTitle,
          'Status': course.status,
          'Assigned Date': course.assignedDate,
          'Completed Date': course.completedDate,
          'Result': course.status === 'completed' ? (course.result !== null ? course.result : 'Not Available') : 'N/A'
        }));
      
        // Log the table to the console
        console.table(tableData);
        break;  
    case '-users':
        const fullUserList = await innform.fetchApi('users')
        const userList = await innform.getUserNamesAndGroups(fullUserList)
        console.log(userList)
        break;
    case '-write':
        utils.writeToJson(innform.courseData, "courseData.json")
        break;
    case '-daily':
        innform.displayDailyActivityByUser()
        break;
    case '-help':
        console.log(`-l list course`)
        console.log(`-s status of course`)
        console.log(`-i display course info`)
        console.log(`-users list users`)
        console.log(`-write write courseData.json`)
        console.log(`-daily daily user activity`)
        break;
    default:
        logger.warn(`Default code block of switch reached`)
        console.log('Zip.')
        break;
}