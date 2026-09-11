# Poder Judicial RP

## Overview
Poder Judicial RP is a web application designed to provide users with access to judicial information and services. The application includes features for managing user sessions, role-based access control, and a dashboard interface for different user roles.

## Project Structure
```
poder-judicial-rp
├── app
│   ├── dashboard
│   │   └── funcionario
│   │       └── page.tsx
│       └── page.tsx
├── components
│   └── DashboardShell.tsx
├── lib
│   └── auth.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Features
- **User Authentication**: Utilizes `next-auth` for session management.
- **Role-Based Access Control**: Supports different user roles such as ADMIN and FUNCIONARIO.
- **Dashboard Interface**: Provides a consistent UI for users to access various functionalities.

## Installation
To get started with the project, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd poder-judicial-rp
npm install
```

## Usage
To run the application in development mode, use the following command:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to access the application.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.