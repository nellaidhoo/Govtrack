# Installation Guide

## Prerequisites
*   **Node.js:** Version 18.x or higher.
*   **npm:** Version 9.x or higher.

## Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd govtrack-system
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory (refer to `.env.example` if available).
    ```env
    VITE_APP_NAME=GovTrack
    # Add other configuration variables as needed
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

5.  **Build for Production:**
    ```bash
    npm run build
    ```
    The production-ready files will be generated in the `dist/` folder.

## Default Credentials (Mock Data)
| Role | Email |
| :--- | :--- |
| **Admin** | `admin@gov.entity` |
| **User** | `john.doe@gov.entity` |
| **Stock Keeper** | `jane.smith@gov.entity` |
| **Finance** | `frank.fin@gov.entity` |
| **Vendor** | `vendor@techsolutions.com` |

*Note: In the current mock implementation, any password will work.*
