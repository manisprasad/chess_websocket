import { WebSocket } from "ws"
import { GAME_OVER, PLACE_MARK } from "./Messages"

export class Game {
    public player1: WebSocket
    public player2: WebSocket
    private board: (null | "X" | "O")[]
    private currentPlayerTurn: WebSocket
    private isGameWon: boolean;
    

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1
        this.player2 = player2
        this.board = new Array(9).fill(null)
        this.isGameWon = false;
        this.currentPlayerTurn = player1
        this.player1.send(JSON.stringify({
            type: "init_game",
            message: "Game started",
            symbol: "X"
        }))

        this.player2.send(JSON.stringify({
            type: "init_game",
            message: "Game started",
            symbol: "O"
        }))
    }

    checkWin(symbol: "X" | "O"): boolean {
        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ]
        return wins.some(combo => combo.every(index => this.board[index] === symbol))
    }

    makeMark(player: WebSocket, index: number) {
        if(this.isGameWon) return;
        if (player !== this.currentPlayerTurn) {
            player.send(JSON.stringify({
                type: "error",
                message: "Not Your Turn!!! BRO"
            }))
            return
        }
       
        if (index < 0 || index >= 9 || this.board[index] !== null) {
            player.send(JSON.stringify({
                type: "error",
                message: "Invalid Move"
            }))
            return
        }

        const symbol = player === this.player1 ? "X" : "O"
        this.board[index] = symbol

        const payload = JSON.stringify({
            type: PLACE_MARK,
            index,
            symbol
        })

        this.player1.send(payload)
        this.player2.send(payload)

        if (this.checkWin(symbol)) {
            const gameOverMsg = JSON.stringify({
                type: GAME_OVER,
                winner: symbol
            })
            this.player1.send(gameOverMsg)
            this.player2.send(gameOverMsg)
            this.isGameWon = true;
            return
        }

        if (this.board.every(cell => cell !== null)) {
            const gameOverMsg = JSON.stringify({
                type: GAME_OVER,
                winner: "DRAW"
            })
            this.player1.send(gameOverMsg)
            this.player2.send(gameOverMsg)
            return
        }

        this.currentPlayerTurn = player === this.player1 ? this.player2 : this.player1
        console.log(this.board)
    }
}
