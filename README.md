# gsb-project

A React application built with TypeScript for GSB.

## Tech Stack

*   **Frontend:** React, TypeScript
*   **UI Library:** Material UI (@mui/material)
*   **Styling:** Emotion (@emotion/react, @emotion/styled)
*   **Routing:** React Router DOM
*   **HTTP Client:** Axios
*   **Charting:** Chart.js, Recharts
*   **Build Tool:** Create React App (react-scripts)

## Prerequisites

*   Node.js (>= 16.x recommended)
*   npm or yarn

## Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    cd gsb-project
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    ```

## Environment Variables

This project might require environment variables. Create a `.env` file in the root directory based on the `.env.example` file (if one exists) or add the necessary variables:

```env
# Example:
# REACT_APP_API_URL=http://localhost:8000/api
```

Make sure your backend server (if any) is running and accessible.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes. Your app is ready to be deployed!

## Deployment

After running `npm run build`, the `build/` directory will contain the static assets ready for deployment to any static hosting provider.
