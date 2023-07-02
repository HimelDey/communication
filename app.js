import Express, { json, urlencoded } from "express";
import * as mongoose from "mongoose";
import { Rcv_Central } from "./src/helper/common/RMQ.js";
import { connect as rmq_connect } from "amqplib";
import resolvePath from "./paths.js";
import methodOverride  from "method-override";

import chatRouter from "./src/routes/chat_route.js";

import MongoSanitize from "express-mongo-sanitize";
import RateLimit from "express-rate-limit";
import Helmet from "helmet";
import Hpp from "hpp";
import Cors from "cors";
import XssClean from "xss-clean";

const URI = process.env.DB_URI;
const DB_USER_NAME = process.env.DB_USER_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const RABBIT_MQ = process.env.RABBIT_MQ;

const app = new Express();
//Security Middleware Implementation //Always implement before route
app.use(MongoSanitize());
app.use(Helmet());
app.use(Hpp());
app.use(Cors());
app.use(XssClean());
app.use(json({ limit: "50mb" }));
app.use(urlencoded({ limit: "50mb" }));
//Request Rate Limit Implementation

const limiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});

//Apply for all request
//app.use(limiter);
// Error-handling middleware function
// app.use((err, req, res, next) => {
//     console.error(err);
//     res.status(500).send('Something broke!');
// });
function logErrors (err, req, res, next) {
    console.error(err.stack)
    next(err)
}
function errorHandler (err, req, res, next) {
    res.status(500)
    res.render('error', { error: err })
}

function clientErrorHandler (err, req, res, next) {
    if (err) {
        res.status(500).send({ error: 'Something failed!' })
    }
}
app.use(methodOverride())
app.use(logErrors)
app.use(errorHandler)
app.use(clientErrorHandler)
// CSP
app.use(function (req, res, next) {
    res.setHeader("Content-Security-Policy", "script-src 'unsafe-inline';");
    next();
});
//Route
app.use("/api/v1/communication", chatRouter);

app.get('/', (req, res) => {
    res.send('hello world');
});

async function connect() {
    try {
        const conn = await rmq_connect(RABBIT_MQ);
        conn.on("error", (err) => {
            console.error("Error connecting to RMQ: ", err);
            // Add any additional error handling code here
        });

        const channel = await conn.createChannel();
        const requestQueue = "restaurent_request";
        channel.assertQueue(requestQueue, { durable: false });
        const interRequestQueue = "main_restaurant_request";
        channel.assertQueue(interRequestQueue, { durable: false });
        // channel.prefetch(1);

        channel.consume(requestQueue, async (msg) => {
            const body = JSON.parse(msg.content.toString());
            const path = msg.properties.headers.path;

            console.log("path", path);
            const response = await resolvePath(path, body);
            console.log("Received Reply", response);
            channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(JSON.stringify(response)),
                { correlationId: msg.properties.correlationId }
            );
            channel.ack(msg);
        });

        // channel.prefetch(1);

        channel.consume(interRequestQueue, async (msg) => {
            console.log(msg);
            const body = JSON.parse(msg.content.toString());
            const method = msg.properties.messageId;
            const modelName = msg.properties.contentType;

            console.log("modelName", modelName);
            console.log("body", body);
            const response = await Rcv_Central(body, modelName, method);
            console.log("response", response);
            // console.log("cahnnel", channel.sendToQueue(
            //   msg.properties.replyTo,
            //   Buffer.from(JSON.stringify(response)),
            //   { correlationId: msg.properties.correlationId }
            // ))

            setTimeout(() => {
                try {
                    channel.sendToQueue(
                        msg.properties.replyTo,
                        Buffer.from(JSON.stringify(response)),
                        { correlationId: msg.properties.correlationId }
                    );
                    channel.ack(msg);
                } catch (err) {
                    console.error(err);
                    channel.sendToQueue(
                        msg.properties.replyTo,
                        Buffer.from(
                            JSON.stringify({
                                status: -1,
                                msg: "Service failed to respond.",
                            })
                        ),
                        { correlationId: msg.properties.correlationId }
                    );
                    channel.ack(msg);
                }
            }, 500);
        });
    } catch (err) {
        console.error("Error connecting to RMQ: ", err);
    }
}

connect()

let OPTIONS = {
  user: DB_USER_NAME,
  pass: DB_PASSWORD,
  autoIndex: true,
};
// let OPTIONS={user:'',pass:''};
mongoose.connect(URI, OPTIONS, (error) => {
  console.log("Connection Success");
  console.log(error);
});

mongoose.set("debug", (collectionName, method, query, doc) => {
  console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
});

//Undefined Route
app.use("*", (req, res) => {
  res.status(404).json({ status: "Fail", data: "Not Found" });
});

export default app;
