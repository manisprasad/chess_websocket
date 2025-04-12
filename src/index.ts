import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

const wss = new WebSocketServer({port: 8080});


const gameManager = new GameManager();

wss.on("connection", (ws) => {
    gameManager.addUser(ws); 
    console.log("New client connected");
    
    ws.on("close", () => {
        gameManager.removeUser(ws);
        console.log("user left the game");
    });
})
