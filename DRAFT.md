In this project, we're developing a SaaS service for generating children's books in PDF format. The target audience is parents who want to create custom books with helpful stories for their children.

We're using Nest.js as the backend, and Next.js, Prisma, and possibly Redis and BoolMQ as the frontend, along with architectural solutions. Please suggest solutions you think are necessary.

Authorization must be through Google, and then there are several business entities in the database and in the project in general, linked through RM, for example, users, templates, books, so we have more. Children—one parent can have multiple children. Illustrations, book pages, subscriptions, aka subscriptions. This is when the user will pay for a video subscription, ratings, possibly a referral program, and perhaps a Task Table for recording queues that will be used to generate books and illustrations.

The database is used based on progress. All history is in a local Docker environment. Reddis can also be used, S3 storage is compatible. Minio can be used for verification, and any production storage will be accepted upon sale.