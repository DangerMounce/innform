# Innform Query Script

This script uses the Innform API to query coure activity.

## Prerequisites

- Node.js installed (visit [Node.js official site](https://nodejs.org) for installation instructions).
- npm (Node Package Manager), installed along with Node.js.

## Installation

Clone the repository and install the dependencies:

```bash
npm install fs axios dotenv
```

## Usage

Navigate to the script directory and run the script using `node innform` with the following commands:

`-l` - Lists all courses in the following format `['Course Title, completion number, in progress number, pending number']`

Specific Course Information
Use `node innform "COURSE NAME"` along with the following commands:
`-s` - lists the statuses of the course along with deadline information.
`-r` - lists the number of the learners who have achieved 100% and those between 80-99%.

Specific User Information in relation to a Course

`-s /filter` - lists the statuses of the course filtered by `completed`, `in_progress`, `overdue`, `failed`, `expired`, `in_review`
`-r /filter` - lists the number of results of the course filtered by `full` (full marks), `below` (between 80-99%)

Adding `/users` to a filter will return a list of the users in addition to the number.

## Contributing

If you want to contribute to this project, please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.