require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");

const { graphqlUploadExpress } = require("graphql-upload");

const connectDB = require("./config/db");
const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./resolvers");

async function startServer() {
  const app = express();

  connectDB();

  app.use(cors());
  app.use(express.json());

  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 1 }));

  app.get("/", (req, res) => res.send("Server running 🚀"));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use("/graphql", expressMiddleware(server));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();