# Customer Services Licences and Payments manager

<!-- # MAPOS Customer Services Manager -->

This is a **customer services management application** designed for MAPOS company, built using Next.js, Prisma, Shadcn, Cron Jobs. It provides a comprehensive suite of features for managing customers, services, reminders, and user access.

## Key Features

*   **Customer Management**:
    *   Add, edit, and delete customer records.
    *   View customer details, including associated services.
    *   Password management with the option to hide/show passwords based on user permissions.
    *   Search and filter customers by name, status, and date.
*   **Service Management**:
    *   Create, update, and delete services for customers.
    *   Associate services with specific customers.
    *   Set service details such as name, description, payment type, price, and duration
    *   View service history.
    *   Filter and sort services.
*  **Reminder System**:
    *   Schedule reminders for service renewals.
     *   View and manage reminders associated with services.
*   **Admin/User Management**:
    *   Secure login system with bcrypt password hashing.
    *   Role-based access control using JWT (JSON Web Tokens).
    *   Admin users can be created, updated, and deleted with specific permissions.
    *   Manage admin permissions such as viewing and editing customers, services, reminders and other admins.
*   **Notifications**:
    *   In-app notifications for various events .
    *   Mark notifications as read and delete notifications.
*   **API Endpoints**:
    *   Comprehensive RESTful API for all features.
    *   External API endpoints for new customer creation, service renewal, and service validation .
    *   API rate limiting for login attempts.
    *   Password validation for new users via external API.
*   **User Interface**:
    *   Modern and responsive UI built with React and Next.js.
    *   Reusable UI components built with Shadcn.
    *   Customizable theme using `next-themes`.
    *   Uses `sonner` for toast notifications.

## Technologies Used

*   **Frontend**:
    *   Next.js.
    *   React .
    *   Shadcn for accessible components.
    *   `date-fns` for date manipulation.
    *   `axios` for HTTP requests.
    *   `clsx` and `tailwind-merge` for conditional styling with Tailwind CSS.
    *   `lucide-react` for icons.
    *   `react-spinners` for loading animations.
    *    `cmdk` for command palette.
*   **Backend**:
    *   Node.js with Express.
    *   Prisma as the ORM for database interactions.
    *   bcrypt for password hashing.
    *   jsonwebtoken (JWT) for authentication and authorization.
    *   `node-cron` for scheduling tasks.
*   **Database**:
    *   Relational database managed by Prisma.

## File Structure

The project is organized as follows:

*   `app/`: Contains the main application logic, including pages, API routes, and layouts.
    *   `admins/`: Pages and API routes for managing admin users.
    *   `api/`: API endpoints for various functionalities.
        *   `admins/`: API routes for admin management.
        *   `auth/`: API route for authentication.
        *   `customers/`: API routes for customer management.
        *   `external/`: API routes for external requests.
        *   `login/`: API route for login.
        *   `logout/`: API route for logout.
        *   `mailer/`: API route for sending emails.
        *   `notifications/`: API routes for notifications.
         *    `reminders/`: API routes for reminders.
        *   `renew-histories/`: API routes for renew histories.
        *   `services/`: API routes for services.
     *   `login/`: Login page.
    *   `services/`: Service pages.
*   `components/`: Reusable UI components.
    *   `mainPage/`: Components related to the main customer page.
     *    `servicesPage/`: Components related to the services page.
    *   `ui/`: Base UI components.
*   `lib/`: Utility functions and configurations.
    *   `jwt.js`: JWT verification.
    *   `prisma.js`: Prisma client setup.
    *    `utils.js`: Utility functions.
*   `hooks/`: Custom React hooks.
    *  `use-toast.js`: Custom hook for toast notifications.
*   `middleware.js`: Middleware for authentication.
*   `prisma/`: Prisma schema.
*   `public/`: Public assets.
*   `server.js`: Express server for cron jobs and Next.js handling.

## Getting Started

*  Clone the repository.  
*  Install dependencies using `npm install`.  
*  Set up your `.env` file with required environment variables (read `.env.example`).  
*  Run database synchronization using `npx prisma db push`.  
*  Start the development server with `npm run dev`.  

## Screenshots
![2](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/2.png)
![3](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/3.png)

| ![1](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/1.png) | ![4](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/4.png) |
|:---------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------------------:|
| ![5:](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/5.png) | ![6](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/6.png) |
| ![7](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/7.png) | ![8](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/8.png) |
| ![9](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/9.png) | ![10](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/10.png) |
| ![11](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/11.png) | ![12](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/12.png) |
| ![13](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/13.png) | ![14](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/14.png) |
| ![15](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/15.png) | ![16](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/16.png) |
| ![17](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/17.png) | ![18](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/18.png) |
| ![19](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/19.png) | ![20](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/20.png) |
| ![21](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/21.png) | ![22](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/22.png) |
| ![23](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/23.png) | ![24](https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/24.png) |
| <td colspan="2" align="center"><img src="https://github.com/Ahmadalhomsi/customers-payment-manager-shadcn/raw/master/Pic/25-prisma-uml.png" width="600"></td> |

