global.users = [];

class WebSockets {
  connection(client) {
    global.client = client;
    console.log("connected: " + client.id);
    client.on("disconnect", () => {
      global.users = global.users
        ? global.users.filter((user) => user.socketId !== client.id)
        : [];
    });
    client.on("identity", (userId) => {
      global.users.push({
        socketId: client.id,
        userId: userId,
      });
      console.log(global.users)
      console.log("identified " + userId + " as " + client.id);
    });
    client.on("subscribe", (room, otherUserId = "") => {
      console.log(global.users);
      subscribeOtherUser(room, otherUserId, global.users);
      client.join(room);
      console.log("joined ", otherUserId);
    });
    client.on("unsubscribe", (room) => {
      client.leave(room);
    });
  }
}

const subscribeOtherUser = (room, otherUserId, users) => {
  if (users) {
    const userSockets = users.filter((user) => user.userId === otherUserId);
    console.log(userSockets)
    userSockets.map((userInfo) => {
      const socketConn = global.io.sockets.sockets[userInfo.socketId];
      if (socketConn) {
        socketConn.join(room);
        console.log("joined other");
        
      }
    });
  }
};

export default new WebSockets();