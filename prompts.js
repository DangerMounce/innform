import { innform } from "./innform_module.js"

const whatIsTheCourseName = `Given a user-provided course title, identify the closest matching course title from the following list: ${innform.courseList}.Your task is to provide only the closest matching course title based on the user’s input. No additional information or explanation is needed, just the course title.`






export const prompt = {
    whatIsTheCourseName
}