import { WebSocket } from "ws"
import { Game } from "./Game"
import { INIT_GAME, PLACE_MARK } from "./Messages"

export class GameManager {
    private games: Game[]
    private pendingUser: WebSocket | null
    private activeUsers: WebSocket[]

    constructor() {
        console.log("GameManager initialized")
        this.games = []
        this.pendingUser = null
        this.activeUsers = []
    }

    addUser(user: WebSocket) {
        this.activeUsers.push(user)
        this.addHandler(user)
        console.log("User added. Total active users:", this.activeUsers.length)
    }

    removeUser(user: WebSocket) {
        const gameIndex = this.games.findIndex(g => g.player1 === user || g.player2 === user);
    
        if (gameIndex !== -1) {
            const game = this.games[gameIndex];
    
            const opponent = user === game.player1 ? game.player2 : game.player1;
            const disconnectMsg = JSON.stringify({
                type: "disconnect",
                message: "Opponent left the game"
            });
    
            opponent.send(disconnectMsg);
    
            // Remove game from active list
            this.games.splice(gameIndex, 1);
        }
    
        this.activeUsers = this.activeUsers.filter(u => u !== user);
    
        console.log("User removed");
    }
    

    addHandler(socket: WebSocket) {
        socket.on("message", (data) => {
            let message
            try {
                message = JSON.parse(data.toString())
            } catch (err) {
                console.error("Invalid JSON:", err)
                return
            }

            if (message.type === INIT_GAME) {
                if (this.pendingUser) {
                    const newGame = new Game(this.pendingUser, socket)
                    this.games.push(newGame)

                    const startMsg = 
                    this.pendingUser.send(JSON.stringify({ type: INIT_GAME, isMatch: true, symbol: "X", message: "Game started" }))
                    socket.send(JSON.stringify({ type: INIT_GAME, isMatch: true, symbol: "O", message: "Game started" }))

                    this.pendingUser = null
                    console.log("Game started between two users")
                } else {
                    this.pendingUser = socket
                    socket.send(JSON.stringify({ type: INIT_GAME, isMatch: false, message: "Waiting for another player" }))
                    console.log("User is waiting for another player")
                }
            }

            if (message.type === PLACE_MARK) {
                if (typeof message.move !== "number") {
                    socket.send(JSON.stringify({ type: "error", message: "Invalid move payload" }))
                    return
                }

                const game = this.games.find(g => g.player1 === socket || g.player2 === socket)
                if (game) {
                    game.makeMark(socket, message.move)
                    console.log("Move made by user", message.move)
                }
            }
        })
    }
}
