import { connect as rabbitMQ_connect } from "amqplib";
// import {
//   CreateService,
//   DeleteService,
//   UpdateService,
//   GetService,
//   UpdateByCondition,
// } from "./CRUD.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();
const RABBIT_MQ = process.env.RABBIT_MQ;

var reply;

export const Rcv_Central = async (data, ModelName, Method) => {
  let results = {};
  try {
    if (Method === "add") {
      results = await CreateService(data, ModelName);

      //  console.log("results",results.toString())
      return results;
    }
    if (Method === "edit") {
      results = await UpdateService(data, ModelName);
      return results;
    }
    if (Method === "edit_condition") {
      results = await UpdateByCondition(data, ModelName);
      return results;
    }
    if (Method === "delete") {
      results = await DeleteService(data, ModelName);
      return results;
    }
    if (Method === "get") {
      results = await GetService(data, ModelName);
      return results;
    }
  } catch (e) {
    return { status: "failed" };
  }
};

export const rq_rply_q = async (
  requestQueue,
  replyQueue = replyQueue,
  body,
  TableName,
  Method
) => {
  return new Promise(async (resolve, reject) => {
    const conn = await rabbitMQ_connect(RABBIT_MQ);
    const channel = await conn.createChannel();

    replyQueue = "chat_queue_" + uuidv4();

    const correlationId = uuidv4();
    console.log("corr id:", correlationId);
    try {
      channel.sendToQueue(requestQueue, Buffer.from(JSON.stringify(body)), {
        correlationId,
        contentType: TableName,
        messageId: Method,
        replyTo: replyQueue,
      });
    } catch (err) {
      console.log(err);
      reject({
        status: -1,
        msg: "Server faced some problems",
      });
    }

    channel.assertQueue(replyQueue, { durable: false, autoDelete: true });
    channel.consume(
      replyQueue,
      (msg) => {
        if (msg.properties.correlationId === correlationId) {
          let reply = JSON.parse(msg.content.toString());
          console.log(`Received reply:`, reply);
          resolve(reply);
          channel.close();
          conn.close();
        }
      },
      { noAck: true }
    );
  });
};

export const Send_Queue = async (
  requestQueue,
  reply_queue,
  data,
  TableName,
  Method
  // callback
) => {
  // let response_data;
  //   return new Promise(async (resolve, reject) => {

  // } )
  return rq_rply_q(requestQueue, reply_queue, data, TableName, Method);
  // return response_data;
};
